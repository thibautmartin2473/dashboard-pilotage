import 'server-only';
import { getSupabaseAdmin } from './supabase-admin';
import { getPendingBrainNotes } from './brain';
import { WEEK_OFFSET_MIN, isMissingTable } from './home';

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
  const doneSince = new Date(Date.now() + (WEEK_OFFSET_MIN - 1) * 86400000).toISOString();
  const [tasks, ideas, events, mails, apps, settings, notifications, done] = await Promise.all([
    panel(() => rows(getSupabaseAdmin().from('tasks').select('*').is('done_at', null).order('created_at'))),
    panel(() => getPendingBrainNotes(30)),
    // Caches d'un instantané poussé par Claude (scripts/push-agenda.mjs) : de petites tables.
    // Bornés au début de la plage des flèches : push-agenda garde les événements finis (historique).
    panel(() =>
      rows(
        getSupabaseAdmin()
          .from('calendar_events')
          .select('*')
          .or(`ends_at.gte."${doneSince}",and(ends_at.is.null,starts_at.gte."${doneSince}")`)
          .order('starts_at')
      )
    ),
    panel(() => rows(getSupabaseAdmin().from('mail_items').select('*').order('received_at', { ascending: false }))),
    // Tuiles de « Mes apps » et réglages de l'accueil (filtre de mails, disposition) : supabase/dashboard-edit.sql.
    panel(() => rows(getSupabaseAdmin().from('app_links').select('*').order('position').order('created_at'))),
    panel(() => rows(getSupabaseAdmin().from('dashboard_settings').select('*'))),
    // Propositions de Claude tirées des mails (scripts/push-notifications.mjs) : supabase/notifications.sql.
    panel(() => rows(getSupabaseAdmin().from('notifications').select('*').eq('status', 'new').order('created_at', { ascending: false }))),
    // Tâches terminées depuis le début de la plage des flèches de l'agenda : ligne « Fait » (doneByDay).
    panel(() => rows(getSupabaseAdmin().from('tasks').select('id, title, done_at').gte('done_at', doneSince).order('done_at'))),
  ]);
  return { tasks, ideas, events, mails, apps, settings, notifications, done };
}
