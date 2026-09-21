import 'server-only';
import { getSupabaseAdmin } from './supabase-admin';
import { getPendingBrainNotes } from './brain';
import { isMissingTable } from './home';

// Un panneau = un résultat indépendant : { data } ou { error: 'missing' | 'error', message }.
// Table absente ou panne d'un panneau ne fait pas tomber les autres, et n'est
// jamais rendue en « liste vide ».
async function panel(fn) {
  try {
    return { data: await fn() };
  } catch (err) {
    return { error: isMissingTable(err) ? 'missing' : 'error', message: err.message };
  }
}

async function rows(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Données personnelles : lues avec la clé service_role uniquement (aucune policy anon).
export async function loadHomePanels() {
  const [tasks, suggestions, ideas, events, mails, apps, settings] = await Promise.all([
    panel(() => rows(getSupabaseAdmin().from('tasks').select('*').is('done_at', null).order('created_at'))),
    panel(() =>
      rows(
        getSupabaseAdmin()
          .from('suggestions')
          .select('*, instagram_saves(url, author)')
          .eq('status', 'new')
          .order('created_at')
      )
    ),
    panel(() => getPendingBrainNotes(30)),
    // Caches d'un instantané poussé par Claude (scripts/push-agenda.mjs) : de petites tables.
    panel(() => rows(getSupabaseAdmin().from('calendar_events').select('*').order('starts_at'))),
    panel(() => rows(getSupabaseAdmin().from('mail_items').select('*').order('received_at', { ascending: false }))),
    // Tuiles de « Mes apps » et réglages de l'accueil (filtre de mails, disposition) : supabase/dashboard-edit.sql.
    panel(() => rows(getSupabaseAdmin().from('app_links').select('*').order('position').order('created_at'))),
    panel(() => rows(getSupabaseAdmin().from('dashboard_settings').select('*'))),
  ]);
  return { tasks, suggestions, ideas, events, mails, apps, settings };
}
