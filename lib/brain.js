import { supabaseConfigured } from './supabase';
import { getSupabaseAdmin } from './supabase-admin';

// Lecture des idées (brain_notes) côté serveur uniquement, clé service_role :
// elles contiennent des données personnelles (supabase/ideas.sql retire la lecture anon).
export async function getBrainNotes() {
  if (!supabaseConfigured) return [];

  const { data, error } = await getSupabaseAdmin()
    .from('brain_notes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// Les `limit` dernières idées en attente (status = 'new') pour l'accueil.
export async function getPendingBrainNotes(limit) {
  if (!supabaseConfigured) return [];

  const { data, error } = await getSupabaseAdmin()
    .from('brain_notes')
    .select('*')
    .eq('status', 'new')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}
