import { supabase, supabaseConfigured } from './supabase';

// Lecture des notes claude.brain pour l'affichage sur /brain — même logique
// que getAllProjects dans lib/data.js (client anon, pas de RLS particulière).
export async function getBrainNotes() {
  if (!supabaseConfigured) return [];

  const { data, error } = await supabase
    .from('brain_notes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// Les `limit` dernières idées en attente (status = 'new') pour l'accueil.
export async function getPendingBrainNotes(limit) {
  if (!supabaseConfigured) return [];

  const { data, error } = await supabase
    .from('brain_notes')
    .select('*')
    .eq('status', 'new')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}
