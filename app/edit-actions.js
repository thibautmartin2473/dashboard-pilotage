'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { applyPositions, deleteProject, moveRow, must, nextPosition, rows, rowsNotDropped, touch } from '@/lib/db-ops';
import { MILESTONE_STATUSES } from '@/lib/constants';
import {
  BLOCK_KINDS, BUCKETS, CATEGORY_KINDS, DEFAULT_CATEGORIES, OTHER_KEY, eventIdsOnDay, eventRow, isMissingColumn,
  isMissingTable, reorderUpdates, capKindEntries, resolveCategories, resolveKindEntries, slugify, splitTasks, todayParis,
} from '@/lib/home';
import { extractIdeaLink, matchIdeaTarget } from '@/lib/command';

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

// Rattache une tâche à l'événement pendant lequel elle se fait (ou la détache, eventId = '').
// Sans clé étrangère (tasks.event_id, supabase/agenda-links.sql) : voir linkIdea ci-dessous.
export async function linkTaskToEvent(id, eventId) {
  return run(async (db) => {
    uuid(id);
    await touch(db.from('tasks').update({ event_id: eventId ? text(eventId, 'Événement', 300) : null }).eq('id', id));
  });
}

// Priorité : échange avec la voisine de la même section (ordre affiché = splitTasks).
export async function moveTaskPriority(id, direction) {
  return run(async (db) => {
    uuid(id);
    dir(direction);
    const today = todayParis();
    const [open, events] = await Promise.all([
      rowsNotDropped(() => db.from('tasks').select('*').is('done_at', null)),
      rows(db.from('calendar_events').select('id, starts_at, ends_at, all_day')),
    ]);
    // Même classement que l'accueil (splitTasks) : une tâche placée dans une plage du jour est
    // « Aujourd'hui » là aussi, sinon Monter/Descendre chercherait dans la mauvaise section.
    const list = Object.values(splitTasks(open, today, eventIdsOnDay(events, today))).find((section) =>
      section.some((t) => t.id === id)
    );
    must(list, 'Tâche introuvable ou déjà faite');
    await applyPositions(db, 'tasks', reorderUpdates(list, id, direction));
  });
}

// ---- Idées (brain_notes, idées et ex-suggestions) : lues et écrites côté serveur, clé admin ----

// « pendant la prochaine session fit » (etc., lib/command.js) : lie l'idée toute seule au prochain
// événement ou à la tâche correspondante, comme la zone Commande. Pas de mot-clé : idée simple.
export async function addIdea(content) {
  return run(async (db) => {
    const { content: cut, keyword } = extractIdeaLink(content);
    const row = { content: text(cut, 'Idée', 2000) };
    if (keyword) {
      const [events, tasks] = await Promise.all([
        rows(db.from('calendar_events').select('id, title, starts_at, ends_at')),
        rowsNotDropped(() => db.from('tasks').select('id, title, due_date, done_at').is('done_at', null)),
      ]);
      const target = matchIdeaTarget(keyword, { events, tasks, now: new Date() });
      if (target) {
        row.task_id = target.task_id;
        row.event_id = target.event_id;
      }
    }
    const { error } = await db.from('brain_notes').insert(row);
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

async function loadCategories(db) {
  const [settingRow] = await rows(db.from('dashboard_settings').select('value').eq('key', 'agenda_categories'));
  return resolveCategories(settingRow?.value);
}

export async function saveEvent({ id, ...form }) {
  return run(async (db) => {
    const row = eventRow(form, await loadCategories(db));
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

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

// Glisser-déposer / poignées / flèches de l'agenda. Un événement Google déplacé est marqué
// pending_move (supabase/agenda-moves.sql) : scripts/push-agenda.mjs ne l'écrase plus, Claude le
// renvoie vers Google puis l'acquitte. Une seule écriture : colonne absente = rien n'est déplacé.
export async function moveEvent({ id, starts_at, ends_at }) {
  return run(async (db) => {
    must(typeof id === 'string' && id.length > 0 && id.length <= 300, 'Identifiant invalide');
    must(ISO.test(starts_at ?? '') && ISO.test(ends_at ?? ''), 'Dates invalides (ISO 8601 avec fuseau)');
    starts_at = new Date(starts_at).toISOString();
    ends_at = new Date(ends_at).toISOString();
    must(ends_at > starts_at, 'La fin doit être après le début');
    const [event] = await rows(db.from('calendar_events').select('origin, all_day').eq('id', id));
    must(event, 'Événement introuvable');
    must(!event.all_day, 'Un événement « toute la journée » ne se déplace pas');
    const patch = { starts_at, ends_at };
    if ((event.origin ?? 'google') === 'google') patch.pending_move = true;
    try {
      await touch(db.from('calendar_events').update(patch).eq('id', id));
    } catch (err) {
      if (isMissingColumn(err)) {
        throw new Error('Colonne calendar_events.pending_move absente : exécuter supabase/agenda-moves.sql dans Supabase.');
      }
      throw err;
    }
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

// ---- Catégories d'agenda (dashboard_settings, clé « agenda_categories ») ----
// Les 3 catégories par défaut (color_id Google '11'/'9'/'6') se renomment et se recolorent mais ne
// se suppriment pas ; leur clé reste la source de vérité pour scripts/push-agenda.mjs.
const DEFAULT_KEYS = DEFAULT_CATEGORIES.map((c) => c.key);

export async function saveCategory({ key, name, color, kind }) {
  return run(async (db) => {
    name = text(name, 'Nom', 60);
    must(/^#[0-9a-f]{6}$/i.test(color ?? ''), 'Couleur invalide');
    must(CATEGORY_KINDS.includes(kind), 'Type invalide');
    const categories = await loadCategories(db);
    const idx = key ? categories.findIndex((c) => c.key === key) : -1;
    const next = { key: idx >= 0 ? key : `c-${crypto.randomUUID().slice(0, 8)}`, name, color: color.toLowerCase(), kind };
    const list = idx >= 0 ? categories.map((c, i) => (i === idx ? next : c)) : [...categories, next];
    await saveSetting(db, 'agenda_categories', list);
  });
}

export async function deleteCategory(key) {
  return run(async (db) => {
    key = text(key, 'Catégorie', 100);
    must(!DEFAULT_KEYS.includes(key), 'Catégorie par défaut : non supprimable');
    const categories = await loadCategories(db);
    await saveSetting(db, 'agenda_categories', categories.filter((c) => c.key !== key));
    const { error } = await db.from('calendar_events').update({ color_id: OTHER_KEY }).eq('color_id', key);
    if (error) throw error;
  });
}

export async function moveCategory(key, direction) {
  return run(async (db) => {
    dir(direction);
    const categories = await loadCategories(db);
    const i = categories.findIndex((c) => c.key === key);
    const j = i + (direction === 'up' ? -1 : 1);
    must(i >= 0 && j >= 0 && j < categories.length, 'Position invalide');
    const next = [...categories];
    [next[i], next[j]] = [next[j], next[i]];
    await saveSetting(db, 'agenda_categories', next);
  });
}

// ---- Type d'un bloc de l'agenda (dashboard_settings, clé « agenda_kind_overrides ») ----
// Le type d'un bloc (cours, sport, examen, rendez-vous, prépa, travail, courte) se déduit de sa catégorie
// et de son titre (blockKind, lib/home.js). Le menu « Type » du détail enregistre ici une surcharge
// { [id de l'événement]: { kind, at } } qui l'emporte (at = date d'écriture en ms ; l'ancien format
// { [id]: type } reste lu) ; aucune table ni colonne en plus. kind vide = retour à l'automatique.
// Lecture-modification-écriture comme saveCategory ; au plus KIND_OVERRIDES_MAX entrées : les plus
// anciennes par `at` partent d'abord (un bloc passé n'a plus besoin de sa surcharge), jamais celle qu'on écrit.
// (L'ordre des clés d'un jsonb ne reflète pas celui des écritures : d'où `at`.)
const KIND_OVERRIDES_MAX = 500;

export async function saveKindOverride({ eventId, kind }) {
  return run(async (db) => {
    eventId = text(eventId, 'Événement', 300);
    must(!kind || BLOCK_KINDS.includes(kind), 'Type invalide');
    const [row] = await rows(db.from('dashboard_settings').select('value').eq('key', 'agenda_kind_overrides'));
    const entries = resolveKindEntries(row?.value);
    delete entries[eventId];
    if (kind) entries[eventId] = { kind, at: Date.now() };
    await saveSetting(db, 'agenda_kind_overrides', capKindEntries(entries, eventId, KIND_OVERRIDES_MAX));
  });
}
