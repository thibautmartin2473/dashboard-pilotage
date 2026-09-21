// Opérations d'écriture qui reçoivent le client Supabase en paramètre (aucune
// dépendance Next : imports avec extension, pour pouvoir les essayer en Node).
// Utilisées par les Server Actions (app/actions.js, app/edit-actions.js).
import { isMissingColumn, isMissingTable, reorderUpdates } from './home.js';

export function must(condition, message) {
  if (!condition) throw new Error(message);
}

export async function rows(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Écriture qui doit toucher au moins une ligne.
export async function touch(query, message = 'Introuvable ou déjà traité', columns = 'id') {
  const data = await rows(query.select(columns));
  must(data.length > 0, message);
  return data;
}

// Position « en fin de liste » : max + 1 (dans `scope`, ex. { project_id }). Colonne pas encore
// créée (SQL non exécuté) : on n'envoie pas de position plutôt que d'échouer.
export async function nextPosition(db, table, scope) {
  let query = db.from(table).select('position').order('position', { ascending: false }).limit(1);
  if (scope) query = query.match(scope);
  const { data, error } = await query;
  if (error) {
    if (isMissingColumn(error)) return {};
    throw error;
  }
  return { position: (data[0]?.position ?? 0) + 1 };
}

// Applique des mises à jour { id, position } (résultat de reorderUpdates).
export async function applyPositions(db, table, updates) {
  for (const { id, position } of updates) {
    const { error } = await db.from(table).update({ position }).eq('id', id);
    if (error) throw error;
  }
}

// Monte ou descend une ligne dans sa liste (ordre = position, puis id).
export async function moveRow(db, table, scope, id, dir) {
  let query = db.from(table).select('id, position').order('position').order('id');
  if (scope) query = query.match(scope);
  const list = await rows(query);
  must(list.some((r) => r.id === id), 'Introuvable');
  await applyPositions(db, table, reorderUpdates(list, id, dir));
}

// Supprime un projet : ses clés étrangères ne sont pas connues (schéma hors dépôt), donc les
// lignes enfants partent d'abord. Les idées (brain_notes.project_slug est une clé étrangère) et
// les tuiles d'apps sont détachées, pas supprimées.
export async function deleteProject(db, id) {
  const { data: project, error } = await db.from('projects').select('id, slug').eq('id', id).maybeSingle();
  if (error) throw error;
  must(project, 'Projet introuvable');
  for (const table of ['milestones', 'project_repos', 'sessions', 'activity_signals']) {
    const { error: err } = await db.from(table).delete().eq('project_id', id);
    if (err) throw err;
  }
  const { error: notesError } = await db.from('brain_notes').update({ project_slug: null }).eq('project_slug', project.slug);
  if (notesError) throw notesError;
  const { error: appsError } = await db.from('app_links').update({ project_slug: null }).eq('project_slug', project.slug);
  if (appsError && !isMissingTable(appsError)) throw appsError; // table créée par supabase/dashboard-edit.sql
  const { error: delError } = await db.from('projects').delete().eq('id', id);
  if (delError) throw delError;
}
