export const MILESTONE_STATUSES = ['todo', 'in_progress', 'blocked', 'done'];

export const STATUS_LABELS = {
  todo: 'à faire',
  in_progress: 'en cours',
  blocked: 'bloqué',
  done: 'fait',
};

export const STATUS_COLORS = {
  todo: 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  blocked: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

export const ACTIVITY_SOURCES = ['claude_code', 'github', 'vercel', 'supabase', 'expo'];

export const SOURCE_LABELS = {
  claude_code: 'Claude Code',
  github: 'GitHub',
  vercel: 'Vercel',
  supabase: 'Supabase',
  expo: 'Expo Go',
};
