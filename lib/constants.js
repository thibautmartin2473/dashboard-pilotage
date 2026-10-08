export const MILESTONE_STATUSES = ['todo', 'in_progress', 'blocked', 'done'];

export const STATUS_LABELS = {
  todo: 'à faire',
  in_progress: 'en cours',
  blocked: 'bloqué',
  done: 'fait',
};

export const STATUS_COLORS = {
  // Fonds teintés des jetons de app/globals.css, texte --ink (11:1 sur carte, 5,3:1 même sur le fond de page nu) :
  // le mot du statut porte le sens, la teinte l'accompagne.
  todo: 'bg-[var(--btn-fill)] text-[var(--ink)]',
  in_progress: 'bg-[var(--action-soft)] text-[var(--ink)]',
  blocked: 'bg-[var(--late-soft)] text-[var(--ink)]',
  done: 'bg-[var(--done-soft)] text-[var(--ink)]',
};

export const ACTIVITY_SOURCES = ['claude_code', 'github', 'vercel', 'supabase', 'expo'];

export const SOURCE_LABELS = {
  claude_code: 'Claude Code',
  github: 'GitHub',
  vercel: 'Vercel',
  supabase: 'Supabase',
  expo: 'Expo Go',
};
