'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { nextPosition } from '@/lib/db-ops';
import { BUCKETS, isMissingTable } from '@/lib/home';

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

export async function addTask({ title, bucket, due_date, project_slug }) {
  return run(async (db) => {
    title = String(title ?? '').trim();
    must(title.length > 0 && title.length <= 200, 'Titre requis (200 caractères max)');
    must(BUCKETS.includes(bucket), 'Liste invalide');
    due_date = due_date || null;
    must(due_date === null || /^\d{4}-\d{2}-\d{2}$/.test(due_date), 'Date invalide');
    const { error } = await db
      .from('tasks')
      .insert({ title, bucket, due_date, project_slug: project_slug || null, source: 'manual', ...(await nextPosition(db, 'tasks')) });
    if (error) throw error;
  });
}

export async function completeTask(id) {
  return run(async (db) => {
    must(UUID.test(id), 'Identifiant invalide');
    await touch(db.from('tasks').update({ done_at: new Date().toISOString() }).eq('id', id).is('done_at', null));
  });
}
