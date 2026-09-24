'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { must, nextPosition, touch } from '@/lib/db-ops';
import { eventRow, isMissingColumn, isMissingTable, isoToParisLocal } from '@/lib/home';

// Server Actions de la zone Commande et des notifications de l'accueil. Elles passent par
// la page `/`, donc derrière le Basic Auth de proxy.js, et écrivent avec la clé service_role.
// Retour : { ok: true } ou { error } (jamais d'échec silencieux).

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
export async function acceptNotification({ id, title, start, end, due_date } = {}) {
  return run(async (db) => {
    must(UUID.test(id), 'Identifiant invalide');
    const [n] = await touch(
      db.from('notifications').update({ status: 'accepted' }).eq('id', id).eq('status', 'new'),
      'Notification déjà traitée',
      'kind, title, starts_at, ends_at, due_date'
    );
    try {
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
      const { error } = await db.from('notifications').update({ status: 'new' }).eq('id', id);
      if (error) err.message += ` (la notification n'a pas pu être remise à traiter : ${error.message})`;
      throw err;
    }
  });
}

export async function dismissNotification(id) {
  return run(async (db) => {
    must(UUID.test(id), 'Identifiant invalide');
    await touch(db.from('notifications').update({ status: 'dismissed' }).eq('id', id).eq('status', 'new'), 'Notification déjà traitée');
  });
}

// Supprime la ligne, donc aussi la mémoire de son dedupe_key : « Ignorer » empêche le retour, pas « Supprimer ».
export async function deleteNotification(id) {
  return run(async (db) => {
    must(UUID.test(id), 'Identifiant invalide');
    await touch(db.from('notifications').delete().eq('id', id));
  });
}
