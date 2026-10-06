'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { must, nextPosition, rows, touch } from '@/lib/db-ops';
import { eventRow, isMissingColumn, isMissingTable, isoToParisLocal } from '@/lib/home';
import { isRecap, recapGroupKey, recapTaskId } from '@/lib/notifications';

// Server Actions de la zone Commande et des notifications de l'accueil. Elles passent par
// la page `/`, donc derrière le Basic Auth de proxy.js, et écrivent avec la clé service_role.
// Retour : { ok: true } ou { error } (jamais d'échec silencieux).

const MAX_BULK = 2000; // notifications reçues par requête (groupe, « Tout ignorer »)
const BATCH = 100; // ids par requête .in() côté base (longueur d'URL)
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const isoNow = () => new Date().toISOString();

async function run(fn) {
  try {
    await fn(getSupabaseAdmin());
    revalidatePath('/', 'layout');
    return { ok: true };
  } catch (err) {
    const missing = isMissingTable(err) || isMissingColumn(err);
    return { error: missing ? `Table ou colonne manquante : exécuter le SQL de supabase/ (${err.message})` : err.message };
  }
}

function text(value, label, max) {
  value = String(value ?? '').trim();
  must(value.length > 0 && value.length <= max, `${label} requis (${max} caractères max)`);
  return value;
}

const dueDate = (value) => {
  value = value || null;
  must(value === null || DAY.test(value), 'Date invalide');
  return value;
};

// Découpe une liste en lots de BATCH ids.
function chunks(list) {
  const out = [];
  for (let i = 0; i < list.length; i += BATCH) out.push(list.slice(i, i + BATCH));
  return out;
}

// Relit en base les notifications `new` parmi `ids` (jamais les champs envoyés par le client).
// `recapOnly` : ne garde que celles dont dedupe_key commence par « recap: ».
async function readNew(db, ids, recapOnly) {
  const found = [];
  for (const batch of chunks(ids)) {
    let query = db.from('notifications').select('id, title, dedupe_key').in('id', batch).eq('status', 'new');
    if (recapOnly) query = query.like('dedupe_key', 'recap:%');
    found.push(...(await rows(query)));
  }
  return found.filter((r) => !recapOnly || isRecap(r));
}

// Change le statut des notifications `ids` par lots, uniquement celles encore en `from` ;
// `onBatch` reçoit les ids réellement modifiés de chaque lot (pour le retour arrière).
async function setStatus(db, ids, from, to, onBatch) {
  for (const batch of chunks(ids)) {
    const changed = await rows(db.from('notifications').update({ status: to }).in('id', batch).eq('status', from).select('id'));
    onBatch?.(changed.map((r) => r.id));
  }
}

async function insert(db, table, values, label, done) {
  const { error } = await db.from(table).insert(values);
  if (error) {
    if (done.length) error.message += ` (déjà ajouté : ${done.join(', ')})`;
    throw error;
  }
  done.push(label);
}

// ---- Zone Commande : applique les actions confirmées (aperçu de lib/command.js) ----
// Tout est validé avant la première écriture ; les événements sont locaux (origin = 'local').

export async function applyCommand(actions) {
  return run(async (db) => {
    must(Array.isArray(actions) && actions.length > 0 && actions.length <= 50, 'Rien à ajouter');
    const events = [];
    const tasks = [];
    const ideas = [];
    for (const a of actions) {
      if (a?.kind === 'event') {
        events.push({ id: `local-${crypto.randomUUID()}`, ...eventRow({ title: a.title, start: a.start, end: a.end }), origin: 'local', synced_at: isoNow() });
      } else if (a?.kind === 'task') {
        const task = { title: text(a.title, 'Titre', 200), bucket: 'inbox', due_date: dueDate(a.due_date), source: 'command' };
        if (a.event_id) task.event_id = text(String(a.event_id), 'Événement', 300);
        tasks.push(task);
      } else if (a?.kind === 'idea') {
        const idea = { content: text(a.content, 'Idée', 2000) };
        must(!a.task_id || !a.event_id, 'Une idée ne peut avoir qu\'une seule cible');
        if (a.task_id) {
          must(UUID.test(a.task_id), 'Identifiant de tâche invalide');
          idea.task_id = a.task_id;
        } else if (a.event_id) {
          idea.event_id = text(String(a.event_id), 'Événement', 300);
        }
        ideas.push(idea);
      } else {
        throw new Error('Action inconnue');
      }
    }
    const done = [];
    if (events.length) await insert(db, 'calendar_events', events, `${events.length} événement(s)`, done);
    if (tasks.length) {
      const { position } = await nextPosition(db, 'tasks'); // en fin de liste (aucune si la colonne n'existe pas encore)
      const rows = tasks.map((t, i) => (position == null ? t : { ...t, position: position + i }));
      await insert(db, 'tasks', rows, `${tasks.length} tâche(s)`, done);
    }
    if (ideas.length) await insert(db, 'brain_notes', ideas, `${ideas.length} idée(s)`, done);
  });
}

// ---- Notifications issues des mails (supabase/notifications.sql) ----

// On « réserve » la notification (new -> accepted) avant de créer l'élément : un double clic ne crée
// qu'un élément ; si la création échoue, on la rend. `title`, `start`/`end` (événement, heure de Paris,
// AAAA-MM-JJTHH:MM) et `due_date` sont facultatifs : ils remplacent la proposition (bouton Modifier).
// `alsoIds` : les autres notifications du même groupe « Oublié hier ? » (même tâche rappelée plusieurs
// jours) : elles passent en `accepted` avec celle-ci, sans rien créer de plus.
export async function acceptNotification({ id, title, start, end, due_date, alsoIds } = {}) {
  return run(async (db) => {
    must(UUID.test(id), 'Identifiant invalide');
    const others = [...new Set(alsoIds ?? [])].filter((x) => x !== id);
    must(others.length <= MAX_BULK && others.every((x) => UUID.test(x)), 'Identifiant invalide');
    const [n] = await touch(
      db.from('notifications').update({ status: 'accepted' }).eq('id', id).eq('status', 'new'),
      'Notification déjà traitée',
      'kind, title, starts_at, ends_at, due_date, dedupe_key'
    );
    const reserved = [];
    try {
      // Les autres du groupe sont réservées AVANT la création, d'après les lignes relues en base : seules
      // celles encore `new`, « recap: » et de la même tâche (même uuid, ou même titre normalisé) comptent.
      if (others.length && isRecap(n)) {
        const key = recapGroupKey(n.title);
        const taskId = recapTaskId(n);
        const same = (await readNew(db, others, true)).filter((r) => recapGroupKey(r.title) === key || (taskId && recapTaskId(r) === taskId));
        await setStatus(db, same.map((r) => r.id), 'new', 'accepted', (done) => reserved.push(...done));
      }
      const name = text(title ?? n.title, 'Titre', 200);
      if (n.kind === 'event') {
        must(start || n.starts_at, 'Date de début manquante');
        const row = eventRow({
          title: name,
          start: start ?? isoToParisLocal(n.starts_at),
          end: end === undefined ? (n.ends_at ? isoToParisLocal(n.ends_at) : '') : end,
        });
        await insert(db, 'calendar_events', { id: `local-${crypto.randomUUID()}`, ...row, origin: 'local', synced_at: isoNow() }, 'événement', []);
      } else if (n.kind === 'deadline' || n.kind === 'todo') {
        const position = await nextPosition(db, 'tasks');
        const row = { title: name, bucket: 'inbox', due_date: dueDate(due_date === undefined ? n.due_date : due_date), source: 'notification' };
        await insert(db, 'tasks', { ...row, ...position }, 'tâche', []);
      } // info : marquée acceptée, rien à créer
    } catch (err) {
      // Retour arrière : la notification principale et les autres déjà réservées redeviennent à traiter.
      try {
        await setStatus(db, [id, ...reserved], 'accepted', 'new');
      } catch (undoErr) {
        err.message += ` (les notifications n'ont pas pu être remises à traiter : ${undoErr.message})`;
      }
      throw err;
    }
  });
}

// « Ignorer » = « c'était fait » (texte des cartes « Oublié hier ? ») : pour une notification « recap: » dont
// la clé porte l'uuid d'une tâche, cette tâche encore ouverte est cochée faite. Un id Google (bloc) ou tout
// autre format ne touche à aucune tâche. `markDone: false` (bouton « Tout ignorer ») écarte sans cocher.
export async function dismissNotifications(ids, { markDone = true } = {}) {
  return run(async (db) => {
    must(Array.isArray(ids) && ids.length > 0 && ids.length <= MAX_BULK && ids.every((x) => UUID.test(x)), 'Identifiant invalide');
    const list = [...new Set(ids)];
    // Lignes relues en base : une seule notification s'ignore quelle qu'elle soit ; un lot ne vise que des « recap: » `new`.
    const found = await readNew(db, list, list.length > 1);
    must(found.length > 0, 'Notification déjà traitée');
    // D'abord les tâches, puis les notifications : si la seconde étape échoue, l'erreur remonte, les notifications
    // restent à traiter et un nouvel essai est possible (une tâche déjà cochée ne pose pas de problème).
    if (markDone) {
      const taskIds = [...new Set(found.map(recapTaskId).filter(Boolean))];
      for (const batch of chunks(taskIds)) {
        const { error } = await db.from('tasks').update({ done_at: isoNow() }).in('id', batch).is('done_at', null);
        if (error) throw new Error(`Tâche non cochée, notification conservée (réessayer) : ${error.message}`);
      }
    }
    try {
      await setStatus(db, found.map((r) => r.id), 'new', 'dismissed');
    } catch (err) {
      err.message = `Tâches cochées, mais les notifications n'ont pas toutes été écartées (réessayer) : ${err.message}`;
      throw err;
    }
  });
}

export async function dismissNotification(id) {
  return dismissNotifications([id]);
}

// Supprime la ligne, donc aussi la mémoire de son dedupe_key : « Ignorer » empêche le retour, pas « Supprimer ».
export async function deleteNotification(id) {
  return run(async (db) => {
    must(UUID.test(id), 'Identifiant invalide');
    await touch(db.from('notifications').delete().eq('id', id));
  });
}
