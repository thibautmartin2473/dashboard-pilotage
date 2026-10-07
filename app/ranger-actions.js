'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { must, nextPosition, rows, touch } from '@/lib/db-ops';
import { BUCKETS, eventRow, isMissingColumn, isMissingTable, isoToParisLocal, todayParis } from '@/lib/home';
import { dayError, dayParis, dueForBlock, isRecent, nextSundayParis, sameValue } from '@/lib/ranger';

// Server Actions de la liste « À ranger » et du rangement forcé. Elles passent par la page `/`, donc
// derrière le Basic Auth de proxy.js, et écrivent avec la clé service_role. Rien ne vient du client
// que des identifiants : l'élément, le bloc visé et les dates sont relus en base à chaque geste.
//
// Un seul point d'entrée : rangerApply({ gesture, refs }), gesture = place | done | drop | later,
// refs = [{ kind: 'task' | 'idea' | 'notification', id, target? }]. `target` (place seulement) :
//   { type: 'block', eventId } | { type: 'day', day } | { type: 'today' } | { type: 'accept' }.
// Retour : { ok, error?, results: [{ key, token } | { key, error, gone? }] }. Le lot s'arrête à la première
// erreur ; `gone` = l'élément a déjà été traité ailleurs (introuvable, plus ouvert). `token` permet d'annuler
// le geste (rangerUndo), mais le serveur ne lui fait pas confiance : il relit la base et n'annule que si
// l'élément est exactement dans l'état produit par le geste.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
const KINDS = ['task', 'idea', 'notification'];
const GESTURES = ['place', 'done', 'drop', 'later'];
const MAX_REFS = 200;
const SQL_HINT = 'exécuter supabase/ranger.sql';
const isoNow = () => new Date().toISOString();
const endMs = (e) => Date.parse(e.ends_at ?? e.starts_at);

function text(value, label, max) {
  value = String(value ?? '').trim();
  must(value.length > 0 && value.length <= max, `${label} requis (${max} caractères max)`);
  return value;
}

function friendly(err) {
  if (isMissingTable(err) || isMissingColumn(err)) return `Table ou colonne manquante : ${SQL_HINT} (${err.message})`;
  if (err?.code === '23514') return `Valeur refusée par la base : ${SQL_HINT} (${err.message})`;
  return err?.message ?? 'Erreur inconnue';
}

const pick = (row, keys) => Object.fromEntries(keys.filter((k) => k in row).map((k) => [k, row[k] ?? null]));

// ---- Lecture : l'élément doit exister, être encore à ranger ----

async function readOpen(db, kind, id) {
  if (kind === 'task') {
    const [row] = await rows(db.from('tasks').select('*').eq('id', id).is('done_at', null));
    must(row && !row.dropped_at, 'Tâche introuvable ou déjà traitée');
    return row;
  }
  if (kind === 'idea') {
    const [row] = await rows(db.from('brain_notes').select('*').eq('id', id).eq('status', 'new'));
    must(row, 'Idée introuvable ou déjà traitée');
    return row;
  }
  const [row] = await rows(db.from('notifications').select('*').eq('id', id).eq('status', 'new'));
  must(row, 'Proposition introuvable ou déjà traitée');
  return row;
}

// ---- Destination ----

// Destination relue en base -> champs d'une tâche. Bloc : il doit exister, ne pas être terminé ni « toute
// la journée » ; l'échéance existante de la tâche est gardée, sinon le jour du bloc devient l'échéance.
// « Aujourd'hui » : échéance du jour, aucun bloc. Jour choisi : date réelle, pas dans le passé ; jour futur :
// échéance et report à ce jour (la tâche revient ce jour-là dans le rangement).
async function resolveSpot(db, target, now, row) {
  must(target && typeof target === 'object', 'Destination manquante');
  const today = todayParis(now);
  const unsnooze = row && 'snoozed_until' in row ? { snoozed_until: null } : {};
  if (target.type === 'block') {
    const id = text(target.eventId, 'Bloc', 300);
    const [event] = await rows(db.from('calendar_events').select('id, title, starts_at, ends_at, all_day').eq('id', id));
    must(event, "Bloc introuvable dans l'agenda");
    must(!event.all_day, 'Un événement « toute la journée » ne reçoit pas de tâche');
    must(endMs(event) > now.getTime(), 'Ce bloc est déjà terminé');
    const day = dayParis(event.starts_at);
    return { fields: { event_id: event.id, due_date: dueForBlock(row?.due_date, day), bucket: day === today ? 'today' : 'inbox', ...unsnooze }, day, event };
  }
  if (target.type === 'today') {
    return { fields: { event_id: null, due_date: today, bucket: 'today', ...unsnooze }, day: today };
  }
  if (target.type === 'day') {
    const bad = dayError(target.day, today);
    must(!bad, bad);
    if (target.day === today) return { fields: { event_id: null, due_date: today, bucket: 'today', ...unsnooze }, day: today };
    must(!row || 'snoozed_until' in row, `Affecter à un jour futur demande ${SQL_HINT}`);
    return { fields: { event_id: null, due_date: target.day, bucket: 'inbox', snoozed_until: target.day }, day: target.day };
  }
  throw new Error('Destination invalide');
}

const taskTitle = (content) => String(content ?? '').replace(/\s+/g, ' ').trim().slice(0, 200);

// Crée une tâche ; renvoie son id et l'instantané des champs posés (le serveur le recompare à l'annulation).
async function createTask(db, fields) {
  const [created] = await rows(db.from('tasks').insert({ ...fields, ...(await nextPosition(db, 'tasks')) }).select('id'));
  const snapshot = Object.fromEntries(['bucket', 'due_date', 'event_id', 'snoozed_until'].map((k) => [k, fields[k] ?? null]));
  return { id: created.id, snapshot };
}

const deleteTaskQuietly = (db, id) => db.from('tasks').delete().eq('id', id);

// ---- Les gestes, par type d'élément ----
// Chaque geste renvoie { restore, applied, created... } : `restore` = valeurs d'avant, `applied` = valeurs
// posées par le geste (rangerUndo exige que la base les porte encore, à l'identique).

async function place(db, kind, row, target, now) {
  if (kind === 'task') {
    const spot = await resolveSpot(db, target, now, row);
    await touch(db.from('tasks').update(spot.fields).eq('id', row.id).is('done_at', null));
    return { restore: pick(row, Object.keys(spot.fields)), applied: spot.fields };
  }

  if (kind === 'idea') {
    const spot = await resolveSpot(db, target, now, null);
    const title = text(taskTitle(row.content), 'Idée', 200);
    const created = await createTask(db, {
      title,
      project_slug: row.project_slug ?? null,
      source: 'idea',
      ...spot.fields,
    });
    const triaged = isoNow();
    try {
      await touch(
        db.from('brain_notes').update({ status: 'done', task_id: created.id, event_id: null, triaged_at: triaged }).eq('id', row.id).eq('status', 'new')
      );
    } catch (err) {
      await deleteTaskQuietly(db, created.id); // retour arrière : pas de tâche orpheline
      throw err;
    }
    return {
      restore: { status: 'new', ...pick(row, ['task_id', 'event_id', 'triaged_at']) },
      applied: { status: 'done', task_id: created.id, triaged_at: triaged },
      createdTaskId: created.id,
      createdTask: created.snapshot,
    };
  }

  // Proposition issue d'un mail : réservée (new -> accepted) avant la création, rendue si elle échoue.
  const t = target?.type;
  must(t, 'Destination manquante');
  if (row.kind === 'event' || row.kind === 'info') must(t === 'accept', "Cette proposition s'accepte telle quelle");
  if (row.kind === 'event') {
    must(row.starts_at, 'Date de début manquante');
    must(Date.parse(row.starts_at) > now.getTime(), "Cet événement est déjà passé : rien à ajouter à l'agenda");
  }
  await touch(db.from('notifications').update({ status: 'accepted' }).eq('id', row.id).eq('status', 'new'), 'Proposition déjà traitée');
  let createdTaskId;
  let createdTask;
  let createdEventId;
  try {
    if (row.kind === 'event') {
      const ev = eventRow({
        title: text(row.title, 'Titre', 200),
        start: isoToParisLocal(row.starts_at),
        end: row.ends_at ? isoToParisLocal(row.ends_at) : '',
      });
      createdEventId = `local-${crypto.randomUUID()}`;
      const { error } = await db.from('calendar_events').insert({ id: createdEventId, ...ev, origin: 'local', synced_at: isoNow() });
      if (error) throw error;
    } else if (row.kind === 'deadline' || row.kind === 'todo') {
      const title = text(row.title, 'Titre', 200);
      const base = { title, project_slug: null, source: 'notification' };
      let created;
      if (t === 'accept') {
        created = await createTask(db, { ...base, bucket: 'inbox', due_date: row.due_date ?? null });
      } else {
        const spot = await resolveSpot(db, target, now, null);
        // L'échéance du mail reste l'échéance de la tâche (le bloc dit quand on la fait, pas quand elle est due).
        const fields = row.due_date ? { ...spot.fields, due_date: row.due_date } : spot.fields;
        created = await createTask(db, { ...base, ...fields });
      }
      createdTaskId = created.id;
      createdTask = created.snapshot;
    } // info : acceptée, rien à créer
  } catch (err) {
    await db.from('notifications').update({ status: 'new' }).eq('id', row.id).eq('status', 'accepted');
    throw err;
  }
  return { restore: { status: 'new' }, applied: { status: 'accepted' }, createdTaskId, createdTask, createdEventId };
}

async function done(db, kind, row) {
  const now = isoNow();
  if (kind === 'task') {
    await touch(db.from('tasks').update({ done_at: now }).eq('id', row.id).is('done_at', null));
    return { restore: { done_at: null }, applied: { done_at: now } };
  }
  if (kind === 'idea') {
    await touch(db.from('brain_notes').update({ status: 'done', triaged_at: now }).eq('id', row.id).eq('status', 'new'));
    return { restore: { status: 'new', ...pick(row, ['triaged_at']) }, applied: { status: 'done', triaged_at: now } };
  }
  // Information : acceptée (lue). Autre proposition : « Déjà fait » = écartée.
  const status = row.kind === 'info' ? 'accepted' : 'dismissed';
  await touch(db.from('notifications').update({ status }).eq('id', row.id).eq('status', 'new'));
  return { restore: { status: 'new' }, applied: { status } };
}

async function drop(db, kind, row) {
  if (kind === 'task') {
    must('dropped_at' in row, `Supprimer demande ${SQL_HINT}`);
    const at = isoNow();
    await touch(db.from('tasks').update({ dropped_at: at }).eq('id', row.id).is('done_at', null).is('dropped_at', null));
    return { restore: { dropped_at: null }, applied: { dropped_at: at } };
  }
  if (kind === 'idea') {
    // Statut 'dropped' : permis par la contrainte de supabase/ranger.sql ; sinon la base refuse (23514, message explicite).
    const at = isoNow();
    await touch(db.from('brain_notes').update({ status: 'dropped', triaged_at: at }).eq('id', row.id).eq('status', 'new'));
    return { restore: { status: 'new', ...pick(row, ['triaged_at']) }, applied: { status: 'dropped', triaged_at: at } };
  }
  await touch(db.from('notifications').update({ status: 'dismissed' }).eq('id', row.id).eq('status', 'new'));
  return { restore: { status: 'new' }, applied: { status: 'dismissed' } };
}

// « Plus tard » : revient le dimanche suivant (heure de Paris). Une proposition de mail devient une tâche reportée.
async function later(db, kind, row, now) {
  const sunday = nextSundayParis(now);
  if (kind === 'task') {
    must('snoozed_until' in row, `Plus tard demande ${SQL_HINT}`);
    await touch(db.from('tasks').update({ snoozed_until: sunday }).eq('id', row.id).is('done_at', null));
    return { restore: pick(row, ['snoozed_until']), applied: { snoozed_until: sunday } };
  }
  if (kind === 'idea') {
    must('snoozed_until' in row, `Plus tard demande ${SQL_HINT}`);
    await touch(db.from('brain_notes').update({ snoozed_until: sunday }).eq('id', row.id).eq('status', 'new'));
    return { restore: pick(row, ['snoozed_until']), applied: { snoozed_until: sunday } };
  }
  await touch(db.from('notifications').update({ status: 'accepted' }).eq('id', row.id).eq('status', 'new'), 'Proposition déjà traitée');
  try {
    const due = row.kind === 'event' && row.starts_at ? dayParis(row.starts_at) : row.due_date ?? null;
    const created = await createTask(db, {
      title: text(row.title, 'Titre', 200),
      bucket: 'inbox',
      due_date: due,
      source: 'notification',
      snoozed_until: sunday,
    });
    return { restore: { status: 'new' }, applied: { status: 'accepted' }, createdTaskId: created.id, createdTask: created.snapshot };
  } catch (err) {
    await db.from('notifications').update({ status: 'new' }).eq('id', row.id).eq('status', 'accepted');
    throw err;
  }
}

async function applyOne(db, gesture, ref, now) {
  must(ref && KINDS.includes(ref.kind), 'Type invalide');
  must(typeof ref.id === 'string' && UUID.test(ref.id), 'Identifiant invalide');
  const row = await readOpen(db, ref.kind, ref.id);
  const out =
    gesture === 'place'
      ? await place(db, ref.kind, row, ref.target, now)
      : gesture === 'done'
        ? await done(db, ref.kind, row)
        : gesture === 'drop'
          ? await drop(db, ref.kind, row)
          : await later(db, ref.kind, row, now);
  return { kind: ref.kind, id: ref.id, gesture, ...out };
}

// L'élément a déjà été traité ailleurs (autre onglet, autre geste) : introuvable, plus ouvert, déjà traité.
const isGone = (err) => /déjà trait/i.test(err?.message ?? '');

export async function rangerApply({ gesture, refs } = {}) {
  try {
    must(GESTURES.includes(gesture), 'Geste invalide');
    must(Array.isArray(refs) && refs.length > 0 && refs.length <= MAX_REFS, 'Éléments invalides');
  } catch (err) {
    return { error: err.message, results: [] };
  }
  const db = getSupabaseAdmin();
  const now = new Date();
  const results = [];
  let error = null;
  for (const ref of refs) {
    const key = `${ref?.kind}:${ref?.id}`;
    try {
      results.push({ key, token: await applyOne(db, gesture, ref, now) });
    } catch (err) {
      error = friendly(err);
      results.push({ key, error, ...(isGone(err) ? { gone: true } : {}) });
      break; // on n'enchaîne pas après une erreur : le reste du lot n'est pas touché
    }
  }
  if (results.some((r) => r.token)) revalidatePath('/');
  return { ok: error === null, ...(error ? { error } : {}), results };
}

// ---- Annuler (Z dans le rangement forcé) ----

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const REF_ID = (v) => v === null || (typeof v === 'string' && v.length > 0 && v.length <= 300);
const VALID = {
  task: {
    event_id: REF_ID,
    due_date: (v) => v === null || DAY.test(String(v)),
    bucket: (v) => BUCKETS.includes(v),
    done_at: (v) => v === null || ISO.test(String(v)),
    dropped_at: (v) => v === null || ISO.test(String(v)),
    snoozed_until: (v) => v === null || DAY.test(String(v)),
  },
  idea: {
    status: (v) => ['new', 'done', 'dropped'].includes(v),
    task_id: (v) => v === null || UUID.test(String(v)),
    event_id: REF_ID,
    triaged_at: (v) => v === null || ISO.test(String(v)),
    snoozed_until: (v) => v === null || DAY.test(String(v)),
  },
  notification: { status: (v) => ['new', 'accepted', 'dismissed'].includes(v) },
};
const TABLES = { task: 'tasks', idea: 'brain_notes', notification: 'notifications' };
const UNDO_WINDOW_MS = 30 * 60 * 1000; // un horodatage de geste plus vieux ne s'annule plus
const CREATED_WINDOW_MS = 10 * 60 * 1000; // une tâche ou un événement créé par un geste s'annule pendant 10 minutes

// Forme du jeton (rien n'est cru : les valeurs sont revérifiées en base ensuite).
function checkToken(token) {
  must(token && KINDS.includes(token.kind), 'Jeton invalide');
  must(typeof token.id === 'string' && UUID.test(token.id), 'Jeton invalide');
  must(GESTURES.includes(token.gesture), 'Jeton invalide');
  for (const part of ['restore', 'applied']) {
    const obj = token[part];
    must(obj && typeof obj === 'object' && Object.keys(obj).length > 0, 'Jeton invalide');
    for (const [key, value] of Object.entries(obj)) must(VALID[token.kind][key]?.(value), 'Jeton invalide');
  }
  must(token.createdTaskId === undefined || (typeof token.createdTaskId === 'string' && UUID.test(token.createdTaskId)), 'Jeton invalide');
  must(
    token.createdEventId === undefined || (typeof token.createdEventId === 'string' && /^local-[0-9a-f-]{36}$/i.test(token.createdEventId)),
    'Jeton invalide'
  );
  const snap = token.createdTask;
  if (snap !== undefined) {
    must(snap && typeof snap === 'object', 'Jeton invalide');
    for (const [key, value] of Object.entries(snap)) must(VALID.task[key]?.(value ?? null), 'Jeton invalide');
  }
  return {
    kind: token.kind,
    id: token.id,
    gesture: token.gesture,
    restore: token.restore,
    applied: token.applied,
    createdTaskId: token.createdTaskId,
    createdTask: snap,
    createdEventId: token.createdEventId,
  };
}

const KEYS = (obj) => Object.keys(obj).sort().join(',');
const CANT = "Cet élément a changé depuis le geste : l'annulation est refusée";

// Relit l'élément en base et refuse sauf s'il est exactement dans l'état produit par le geste. Renvoie les
// lignes relues (élément, tâche créée, événement créé) pour que l'annulation soit conditionnelle.
async function verifyUndo(db, t, nowMs) {
  const [row] = await rows(db.from(TABLES[t.kind]).select('*').eq('id', t.id));
  must(row, 'Élément introuvable, rien à annuler');
  for (const [key, value] of Object.entries(t.applied)) must(sameValue(row[key], value), CANT);
  const g = t.gesture;
  const mailTask = t.kind === 'notification' && (row.kind === 'deadline' || row.kind === 'todo');
  const wantsTask = (g === 'place' && (t.kind === 'idea' || mailTask)) || (g === 'later' && t.kind === 'notification');
  const wantsEvent = g === 'place' && t.kind === 'notification' && row.kind === 'event';
  must(Boolean(t.createdTaskId) === wantsTask && Boolean(t.createdEventId) === wantsEvent, 'Jeton invalide');
  must(!t.createdTaskId || t.createdTask, 'Jeton invalide');

  if (t.kind === 'task') {
    // Une tâche cochée ou supprimée depuis n'est jamais ressuscitée ni déplacée.
    if (g === 'done') {
      must(KEYS(t.applied) === 'done_at' && KEYS(t.restore) === 'done_at' && t.restore.done_at === null, 'Jeton invalide');
      must(row.done_at && !row.dropped_at, CANT);
      must(isRecent(row.done_at, nowMs, UNDO_WINDOW_MS), 'Cette tâche a été cochée il y a trop longtemps pour annuler');
    } else {
      must(!row.done_at, 'Cette tâche a été cochée depuis : annulation refusée');
      if (g === 'drop') {
        must(KEYS(t.applied) === 'dropped_at' && KEYS(t.restore) === 'dropped_at' && t.restore.dropped_at === null, 'Jeton invalide');
        must(row.dropped_at && isRecent(row.dropped_at, nowMs, UNDO_WINDOW_MS), 'Cette tâche a été supprimée il y a trop longtemps pour annuler');
      } else {
        must(!row.dropped_at, 'Cette tâche a été supprimée depuis : annulation refusée');
        if (g === 'later') must(KEYS(t.applied) === 'snoozed_until' && KEYS(t.restore) === 'snoozed_until', 'Jeton invalide');
        else {
          must(Object.keys(t.applied).every((k) => ['event_id', 'due_date', 'bucket', 'snoozed_until'].includes(k)), 'Jeton invalide');
          must(Object.keys(t.restore).every((k) => k in t.applied), 'Jeton invalide');
        }
      }
    }
  } else if (t.kind === 'idea') {
    if (g === 'later') {
      must(KEYS(t.applied) === 'snoozed_until' && KEYS(t.restore) === 'snoozed_until' && row.status === 'new', CANT);
    } else {
      const status = g === 'drop' ? 'dropped' : 'done';
      must(row.status === status && t.applied.status === status && t.restore.status === 'new', CANT);
      must(row.triaged_at && isRecent(row.triaged_at, nowMs, UNDO_WINDOW_MS), 'Cette idée a été rangée il y a trop longtemps pour annuler');
      if (g === 'place') must(row.task_id === t.createdTaskId && t.applied.task_id === t.createdTaskId, CANT);
    }
  } else {
    must(KEYS(t.applied) === 'status' && KEYS(t.restore) === 'status' && t.restore.status === 'new', 'Jeton invalide');
    const expected = g === 'drop' ? 'dismissed' : g === 'done' ? (row.kind === 'info' ? 'accepted' : 'dismissed') : 'accepted';
    must(row.status === expected, CANT);
  }

  let task = null;
  if (t.createdTaskId) {
    // Tâche créée par le geste : supprimée seulement si elle est récente, de la bonne source, encore ouverte et intacte.
    [task] = await rows(db.from('tasks').select('*').eq('id', t.createdTaskId));
    if (task) {
      const title = t.kind === 'idea' ? taskTitle(row.content) : String(row.title ?? '').trim();
      must(task.source === (t.kind === 'idea' ? 'idea' : 'notification'), CANT);
      must(isRecent(task.created_at, nowMs, CREATED_WINDOW_MS), 'La tâche créée a plus de 10 minutes : annulation refusée');
      must(!task.done_at && !task.dropped_at, 'La tâche créée a été cochée ou supprimée depuis : annulation refusée');
      must(task.title === title, CANT);
      for (const [key, value] of Object.entries(t.createdTask)) must(sameValue(task[key], value), CANT);
    }
  }
  let event = null;
  if (t.createdEventId) {
    [event] = await rows(db.from('calendar_events').select('*').eq('id', t.createdEventId));
    if (event) {
      must(event.origin === 'local' && isRecent(event.synced_at, nowMs, CREATED_WINDOW_MS), "L'événement créé a plus de 10 minutes : annulation refusée");
      must(event.title === String(row.title ?? '').trim(), CANT);
    }
  }
  return { row, task, event };
}

export async function rangerUndo(tokens) {
  let list;
  try {
    must(Array.isArray(tokens) && tokens.length > 0 && tokens.length <= MAX_REFS, 'Rien à annuler');
    list = tokens.map(checkToken);
  } catch (err) {
    return { error: err.message };
  }
  const db = getSupabaseAdmin();
  const nowMs = Date.now();
  // Tout est vérifié avant la moindre écriture : un seul refus et rien n'est annulé.
  const checked = [];
  try {
    for (const t of list) checked.push(await verifyUndo(db, t, nowMs));
  } catch (err) {
    return { error: friendly(err) };
  }
  let undone = 0;
  try {
    for (const [i, t] of list.entries()) {
      const { row, task, event } = checked[i];
      if (task) {
        const { error } = await db.from('tasks').delete().eq('id', task.id).in('source', ['idea', 'notification']).is('done_at', null);
        if (error) throw error;
      }
      if (event) {
        const { error } = await db.from('calendar_events').delete().eq('id', event.id).eq('origin', 'local');
        if (error) throw error;
      }
      // Restauration conditionnelle : seulement si la ligne porte encore exactement les valeurs posées (relues à l'instant).
      let query = db.from(TABLES[t.kind]).update(t.restore).eq('id', t.id);
      for (const key of Object.keys(t.applied)) query = row[key] === null || row[key] === undefined ? query.is(key, null) : query.eq(key, row[key]);
      if (t.kind === 'task' && t.gesture !== 'done') query = query.is('done_at', null);
      await touch(query, "L'élément a changé depuis le geste : rien à annuler");
      undone += 1;
    }
  } catch (err) {
    if (undone) revalidatePath('/');
    return { error: `${friendly(err)} (${undone} geste(s) annulé(s) sur ${list.length})` };
  }
  revalidatePath('/');
  return { ok: true, undone };
}
