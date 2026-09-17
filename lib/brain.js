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
