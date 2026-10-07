import 'server-only';
import { getSupabaseAdmin } from './supabase-admin';
import { WEEK_OFFSET_MIN, isMissingColumn, isMissingTable } from './home';

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

// Idées en attente pour « À ranger » : toutes (pas seulement les 30 dernières), `new` seulement.
const IDEAS_LIMIT = 300;

// Données personnelles : lues avec la clé service_role uniquement (aucune policy anon).
// `ranger.ready` : supabase/ranger.sql exécuté (colonnes dropped_at / snoozed_until, statut 'dropped').
// Faux = les tâches sont lues sans le filtre dropped_at (la colonne n'existe pas encore) et le site
// désactive « Supprimer » et « Plus tard ».
export async function loadHomePanels() {
  const doneSince = new Date(Date.now() + (WEEK_OFFSET_MIN - 1) * 86400000).toISOString();
  let rangerReady = true;
  // Tâches ouvertes : done_at nul ET dropped_at nul. Colonne dropped_at absente : repli sans ce filtre.
  const openTasks = async () => {
    const query = () => getSupabaseAdmin().from('tasks').select('*').is('done_at', null).order('created_at');
    try {
      return await rows(query().is('dropped_at', null));
    } catch (err) {
      if (!isMissingColumn(err)) throw err;
      rangerReady = false;
      return rows(query());
    }
  };
  const [tasks, ideas, events, mails, apps, settings, notifications, done] = await Promise.all([
    panel(openTasks),
    panel(() =>
      rows(getSupabaseAdmin().from('brain_notes').select('*').eq('status', 'new').order('created_at', { ascending: false }).limit(IDEAS_LIMIT))
    ),
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
    // Tuiles de « Mes apps » et réglages de l'accueil (disposition, catégories) : supabase/dashboard-edit.sql.
    panel(() => rows(getSupabaseAdmin().from('app_links').select('*').order('position').order('created_at'))),
    panel(() => rows(getSupabaseAdmin().from('dashboard_settings').select('*'))),
    // Propositions de Claude tirées des mails (scripts/push-notifications.mjs) : supabase/notifications.sql.
    panel(() => rows(getSupabaseAdmin().from('notifications').select('*').eq('status', 'new').order('created_at', { ascending: false }))),
    // Tâches terminées depuis le début de la plage des flèches de l'agenda : ligne « Fait » (doneByDay).
    panel(() => rows(getSupabaseAdmin().from('tasks').select('id, title, done_at').gte('done_at', doneSince).order('done_at'))),
  ]);
  // La colonne snoozed_until des idées fait partie du même SQL : une ligne lue sans elle = SQL pas exécuté.
  const ideasReady = !ideas.data?.length || 'snoozed_until' in ideas.data[0];
  return { tasks, ideas, events, mails, apps, settings, notifications, done, ranger: { ready: rangerReady && ideasReady } };
}
