import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// Table absente (SQL pas encore exécuté) : PostgREST répond PGRST205, Postgres 42P01. Ce n'est pas une
// erreur pour nous, c'est « rien à afficher ».
const TABLE_ABSENTE = new Set(['PGRST205', '42P01']);

function signaler(error) {
  if (error && !TABLE_ABSENTE.has(error.code)) console.warn('vault_graph :', error.message);
}

// Lecture serveur du graphe du vault pour la Constellation. Jamais exposé par /api/public/overview.
// Renvoie null tant que la table n'existe pas ou qu'aucun envoi n'a eu lieu (jamais d'exception).
export async function loadVaultGraph() {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('vault_graph')
      .select('nodes, links, updated_at')
      .eq('id', 'vault')
      .maybeSingle();
    if (error || !data) {
      signaler(error);
      return null;
    }
    return { nodes: data.nodes ?? [], links: data.links ?? [], updatedAt: data.updated_at };
  } catch {
    return null;
  }
}

// Date du dernier envoi seulement (quelques octets) : sert à savoir si le graphe a changé sans le relire.
export async function loadVaultGraphUpdatedAt() {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('vault_graph')
      .select('updated_at')
      .eq('id', 'vault')
      .maybeSingle();
    if (error || !data) {
      signaler(error);
      return null;
    }
    return data.updated_at;
  } catch {
    return null;
  }
}
