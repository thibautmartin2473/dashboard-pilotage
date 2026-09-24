'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { nextPosition, rows } from '@/lib/db-ops';
import { BUCKETS, isMissingTable } from '@/lib/home';
import { extractIdeaLink, matchIdeaTarget } from '@/lib/command';

// Server Actions de l'accueil. Elles passent par la page `/`, donc derrière le
// Basic Auth de proxy.js. Retour : { ok: true } ou { error } (jamais d'échec silencieux).

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function must(condition, message) {
  if (!condition) throw new Error(message);
}

// Requête d'écriture qui doit toucher au moins une ligne.
async function touch(query, message = 'Introuvable ou déjà traité', columns = 'id') {
  const { data, error } = await query.select(columns);
  if (error) throw error;
  must(data.length > 0, message);
  return data;
}

async function run(fn) {
  try {
    await fn(getSupabaseAdmin());
    revalidatePath('/');
    return { ok: true };
  } catch (err) {
    return { error: isMissingTable(err) ? 'Table manquante : exécuter le fichier SQL de supabase/' : err.message };
  }
}

// « ajouter une tâche : ... pendant la prochaine session fit » : place la tâche toute seule dans la
// plage correspondante (lib/command.js, même logique que la Zone Commande pour les idées).
export async function addTask({ title, bucket, due_date, project_slug }) {
  return run(async (db) => {
    const { content, keyword } = extractIdeaLink(title);
    title = content.trim();
    must(title.length > 0 && title.length <= 200, 'Titre requis (200 caractères max)');
    must(BUCKETS.includes(bucket), 'Liste invalide');
    due_date = due_date || null;
    must(due_date === null || /^\d{4}-\d{2}-\d{2}$/.test(due_date), 'Date invalide');
    const row = { title, bucket, due_date, project_slug: project_slug || null, source: 'manual', ...(await nextPosition(db, 'tasks')) };
    if (keyword) {
      const [events, existing] = await Promise.all([
        rows(db.from('calendar_events').select('id, title, starts_at, ends_at')),
        rows(db.from('tasks').select('id, title, due_date, done_at').is('done_at', null)),
      ]);
      const target = matchIdeaTarget(keyword, { events, tasks: existing, now: new Date() });
      if (target?.event_id) row.event_id = target.event_id;
    }
    const { error } = await db.from('tasks').insert(row);
    if (error) throw error;
  });
}

export async function completeTask(id) {
  return run(async (db) => {
    must(UUID.test(id), 'Identifiant invalide');
    await touch(db.from('tasks').update({ done_at: new Date().toISOString() }).eq('id', id).is('done_at', null));
  });
}
