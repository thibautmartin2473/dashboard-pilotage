'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { applyPositions, deleteProject, moveRow, must, nextPosition, rows, touch } from '@/lib/db-ops';
import { MILESTONE_STATUSES } from '@/lib/constants';
import {
  BUCKETS, MAIL_SOURCES, eventRow, isMissingColumn, isMissingTable, reorderUpdates, resolveLayout,
  slugify, splitTasks, todayParis,
} from '@/lib/home';

// Server Actions d'édition de l'accueil et des pages projet : tout ce que Thibaut
// ajoute, modifie ou supprime depuis le site. Elles passent par les pages, donc
// derrière le Basic Auth de proxy.js, et écrivent avec la clé service_role.
// Retour : { ok: true } ou { error } (jamais d'échec silencieux).

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const DIRS = ['up', 'down'];
const isoNow = () => new Date().toISOString();

async function run(fn) {
  try {
    await fn(getSupabaseAdmin());
    revalidatePath('/', 'layout'); // accueil et pages projet
    return { ok: true };
  } catch (err) {
    const missing = isMissingTable(err) || isMissingColumn(err);
    return { error: missing ? `Table ou colonne manquante : exécuter le SQL de supabase/ (${err.message})` : err.message };
  }
}

const uuid = (id) => must(UUID.test(id), 'Identifiant invalide');
const dir = (d) => must(DIRS.includes(d), 'Sens invalide');

function text(value, label, max) {
  value = String(value ?? '').trim();
  must(value.length > 0 && value.length <= max, `${label} requis (${max} caractères max)`);
  return value;
}

// http(s) ou chemin du site (« /projects/x »), rien d'autre (pas de javascript:).
function url(value) {
  value = text(value, 'Adresse', 500);
  must(/^(https?:\/\/\S+|\/(?!\/)\S*)$/i.test(value), 'Adresse invalide (http://, https:// ou /chemin)');
  return value;
}

// ---- Tâches (addTask et completeTask : app/actions.js) ----

export async function updateTask({ id, title, bucket, due_date, project_slug }) {
  return run(async (db) => {
    uuid(id);
    title = text(title, 'Titre', 200);
    must(BUCKETS.includes(bucket), 'Section invalide');
    due_date = due_date || null;
    must(due_date === null || DAY.test(due_date), 'Date invalide');
    await touch(db.from('tasks').update({ title, bucket, due_date, project_slug: project_slug || null }).eq('id', id));
  });
}

export async function deleteTask(id) {
  return run(async (db) => {
    uuid(id);
    await touch(db.from('tasks').delete().eq('id', id));
  });
}

// Priorité : échange avec la voisine de la même section (ordre affiché = splitTasks).
export async function moveTaskPriority(id, direction) {
  return run(async (db) => {
    uuid(id);
    dir(direction);
    const open = await rows(db.from('tasks').select('*').is('done_at', null));
    const list = Object.values(splitTasks(open, todayParis())).find((section) => section.some((t) => t.id === id));
    must(list, 'Tâche introuvable ou déjà faite');
    await applyPositions(db, 'tasks', reorderUpdates(list, id, direction));
  });
}

// ---- Idées (brain_notes, idées et ex-suggestions) : lues et écrites côté serveur, clé admin ----

export async function addIdea(content) {
  return run(async (db) => {
    const { error } = await db.from('brain_notes').insert({ content: text(content, 'Idée', 2000) });
    if (error) throw error;
  });
}

export async function updateIdea(id, content) {
  return run(async (db) => {
    uuid(id);
    await touch(db.from('brain_notes').update({ content: text(content, 'Idée', 2000) }).eq('id', id));
  });
}

export async function doneIdea(id) {
  return run(async (db) => {
    uuid(id);
    await touch(db.from('brain_notes').update({ status: 'done', triaged_at: isoNow() }).eq('id', id));
  });
}

// Affecter une idée : target = '' (aucune), 'task:<uuid>' ou 'event:<id>'. Une seule cible à la fois.
export async function linkIdea(id, target) {
  return run(async (db) => {
    uuid(id);
    const [kind, ...rest] = String(target ?? '').split(':');
    const ref = rest.join(':'); // un id d'événement peut contenir « : »
    const row = { task_id: null, event_id: null };
    if (kind === 'task') {
      uuid(ref);
      row.task_id = ref;
    } else if (kind === 'event') row.event_id = text(ref, 'Événement', 300);
    else must(kind === '', 'Cible invalide');
    await touch(db.from('brain_notes').update(row).eq('id', id));
  });
}

// Ex-« Ajouter à la prochaine session » des suggestions : crée une tâche
// « prochaine session » à partir de l'idée, puis y affecte l'idée.
export async function ideaToTask(id) {
  return run(async (db) => {
    uuid(id);
    // task_id lu ici : colonne absente (SQL pas exécuté) = erreur avant de créer la tâche.
    const [note] = await rows(db.from('brain_notes').select('content, project_slug, task_id').eq('id', id).eq('status', 'new'));
    must(note, 'Idée introuvable ou déjà traitée');
    const title = note.content.trim().slice(0, 200);
    const task = { title, bucket: 'next_session', project_slug: note.project_slug, source: 'idea', ...(await nextPosition(db, 'tasks')) };
    const [created] = await rows(db.from('tasks').insert(task).select('id'));
    await touch(db.from('brain_notes').update({ task_id: created.id, event_id: null }).eq('id', id));
  });
}

export async function deleteIdea(id) {
  return run(async (db) => {
    uuid(id);
    await touch(db.from('brain_notes').delete().eq('id', id));
  });
}

// ---- Agenda : les événements créés ici sont locaux (origin = 'local'), jamais purgés par la synchro ----

export async function saveEvent({ id, ...form }) {
  return run(async (db) => {
    const row = eventRow(form);
    if (id) {
      await touch(db.from('calendar_events').update(row).eq('id', id));
      return;
    }
    const { error } = await db
      .from('calendar_events')
      .insert({ id: `local-${crypto.randomUUID()}`, ...row, origin: 'local', synced_at: isoNow() });
    if (error) throw error;
  });
}

export async function deleteEvent(id) {
  return run(async (db) => {
    must(typeof id === 'string' && id.length > 0, 'Identifiant invalide');
    await touch(db.from('calendar_events').delete().eq('id', id));
  });
}

// ---- Mes apps (app_links) ----

export async function addApp({ name, url: href, project_slug }) {
  return run(async (db) => {
    const row = { name: text(name, 'Nom', 100), url: url(href), project_slug: project_slug || null };
    const { error } = await db.from('app_links').insert({ ...row, ...(await nextPosition(db, 'app_links')) });
    if (error) throw error;
  });
}

export async function updateApp({ id, name, url: href, project_slug }) {
  return run(async (db) => {
    uuid(id);
    await touch(
      db.from('app_links').update({ name: text(name, 'Nom', 100), url: url(href), project_slug: project_slug || null }).eq('id', id)
    );
  });
}

export async function deleteApp(id) {
  return run(async (db) => {
    uuid(id);
    await touch(db.from('app_links').delete().eq('id', id));
  });
}

export async function moveApp(id, direction) {
  return run(async (db) => {
    uuid(id);
    dir(direction);
    await moveRow(db, 'app_links', null, id, direction);
  });
}

// ---- Projets ----

export async function addProject(name) {
  return run(async (db) => {
    name = text(name, 'Nom', 100);
    const slug = slugify(name);
    must(slug.length > 0, 'Nom invalide (lettres ou chiffres requis)');
    const existing = await rows(db.from('projects').select('id').eq('slug', slug));
    must(existing.length === 0, `Un projet « ${slug} » existe déjà`);
    const { error } = await db.from('projects').insert({ slug, name });
    if (error) throw error;
  });
}

export async function renameProject(id, name) {
  return run(async (db) => {
    uuid(id);
    await touch(db.from('projects').update({ name: text(name, 'Nom', 100) }).eq('id', id));
  });
}

export async function removeProject(id) {
  return run(async (db) => {
    uuid(id);
    await deleteProject(db, id);
  });
}

// ---- Jalons ----

export async function addMilestone({ project_id, label }) {
  return run(async (db) => {
    uuid(project_id);
    const row = { project_id, label: text(label, 'Libellé', 200), status: 'todo', updated_by: 'manual' };
    const { error } = await db.from('milestones').insert({ ...row, ...(await nextPosition(db, 'milestones', { project_id })) });
    if (error) throw error;
  });
}

export async function updateMilestone({ id, label, status }) {
  return run(async (db) => {
    uuid(id);
    const patch = { updated_by: 'manual', updated_at: isoNow() };
    if (label !== undefined) patch.label = text(label, 'Libellé', 200);
    if (status !== undefined) {
      must(MILESTONE_STATUSES.includes(status), 'Statut invalide');
      patch.status = status;
    }
    await touch(db.from('milestones').update(patch).eq('id', id));
  });
}

export async function deleteMilestone(id) {
  return run(async (db) => {
    uuid(id);
    await touch(db.from('milestones').delete().eq('id', id));
  });
}

export async function moveMilestone(id, direction) {
  return run(async (db) => {
    uuid(id);
    dir(direction);
    const [m] = await rows(db.from('milestones').select('project_id').eq('id', id));
    must(m, 'Jalon introuvable');
    await moveRow(db, 'milestones', { project_id: m.project_id }, id, direction);
  });
}

// ---- Réglages de l'accueil (dashboard_settings : clé texte, valeur json) ----

async function saveSetting(db, key, value) {
  const { error } = await db.from('dashboard_settings').upsert({ key, value, updated_at: isoNow() }, { onConflict: 'key' });
  if (error) throw error;
}

export async function saveLayout(layout) {
  return run((db) => saveSetting(db, 'home_layout', resolveLayout(layout)));
}

export async function setMailFilter(value) {
  return run((db) => {
    must(value === 'all' || MAIL_SOURCES.includes(value), 'Filtre invalide');
    return saveSetting(db, 'mail_filter', value);
  });
}
