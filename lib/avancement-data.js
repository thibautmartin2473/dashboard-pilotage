import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { REGLAGE_MASQUES } from '@/lib/avancement';

// Table absente (supabase/avancement.sql pas encore exécuté) : PostgREST répond PGRST205, Postgres 42P01. Ce n'est
// pas une erreur pour nous, c'est « en attente de la première synchronisation ».
const TABLE_ABSENTE = new Set(['PGRST205', '42P01']);

// Lecture serveur des lignes d'avancement (scripts/push-avancement.mjs les écrit) et du réglage d'affichage
// (dashboard_settings, clé avancement_afficher_masques : réaffiche le groupe « Autre » et Master Project). Jamais
// exposée par /api/public/overview. Renvoie { rows, showHidden } ; `rows` vaut null tant que la table n'existe pas,
// est vide, ou illisible (jamais d'exception).
export async function loadAvancement() {
  try {
    const db = getSupabaseAdmin();
    const [{ data, error }, reglage] = await Promise.all([
      db.from('avancement').select('*'),
      db.from('dashboard_settings').select('value').eq('key', REGLAGE_MASQUES),
    ]);
    const showHidden = reglage?.data?.[0]?.value === true;
    if (error) {
      if (!TABLE_ABSENTE.has(error.code)) console.warn('avancement :', error.message);
      return { rows: null, showHidden };
    }
    return { rows: data?.length ? data : null, showHidden };
  } catch {
    return { rows: null, showHidden: false };
  }
}
