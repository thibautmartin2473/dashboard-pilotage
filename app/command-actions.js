'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { must, nextPosition, rows } from '@/lib/db-ops';
import { eventRow, isMissingColumn, isMissingTable } from '@/lib/home';

// Server Action de la zone Commande. Elle passe par
// la page `/`, donc derrière le Basic Auth de proxy.js, et écrit avec la clé service_role.
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
