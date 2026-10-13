import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// Table absente (supabase/avancement.sql pas encore exécuté) : PostgREST répond PGRST205, Postgres 42P01. Ce n'est
// pas une erreur pour nous, c'est « en attente de la première synchronisation ».
const TABLE_ABSENTE = new Set(['PGRST205', '42P01']);

// Lecture serveur des lignes d'avancement (scripts/push-avancement.mjs les écrit). Jamais exposée par
// /api/public/overview. Renvoie null tant que la table n'existe pas, est vide, ou illisible (jamais d'exception).
export async function loadAvancement() {
  try {
    const { data, error } = await getSupabaseAdmin().from('avancement').select('*');
    if (error) {
      if (!TABLE_ABSENTE.has(error.code)) console.warn('avancement :', error.message);
      return null;
    }
    return data?.length ? data : null;
  } catch {
    return null;
  }
}
