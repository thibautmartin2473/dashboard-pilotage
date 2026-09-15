import { PROJECTS } from './seed-data';

// Jeu de données de démo, utilisé quand NEXT_PUBLIC_SUPABASE_URL n'est pas
// configuré — permet de lancer `npm run dev` et voir l'interface avant d'avoir
// créé le projet Supabase. Les horodatages sont recalculés à chaque appel pour
// rester "récents" dans l'UI (relatif à Date.now()).

const minutesAgo = (m) => new Date(Date.now() - m * 60 * 1000).toISOString();

function buildMockProject(project, index) {
  const id = `mock-${project.slug}`;
  const lastActivityMinutes = [8, 190, 42][index] ?? 60;

  const milestones = project.milestones.map((m, i) => ({
    id: `${id}-milestone-${i}`,
    project_id: id,
    label: m.label,
    status: m.status,
    position: i,
    updated_by: 'manual',
    updated_at: minutesAgo(lastActivityMinutes + i * 37),
  }));

  const sessions = [
    {
      id: `${id}-session-0`,
      project_id: id,
      started_at: minutesAgo(lastActivityMinutes + 25),
      ended_at: minutesAgo(lastActivityMinutes),
      summary: `Session de démo — dernière activité simulée sur ${project.name}.`,
      files_touched: ['app/page.js', 'lib/data.js'],
      duration_seconds: 25 * 60,
    },
    {
      id: `${id}-session-1`,
      project_id: id,
      started_at: minutesAgo(lastActivityMinutes + 24 * 60),
      ended_at: minutesAgo(lastActivityMinutes + 23 * 60 + 40),
      summary: 'Session de démo précédente.',
      files_touched: ['README.md'],
      duration_seconds: 20 * 60,
    },
  ];

  const activitySignals = [
    {
      id: `${id}-signal-claude`,
      project_id: id,
      source: 'claude_code',
      last_seen_at: minutesAgo(lastActivityMinutes),
      detail: sessions[0].summary,
    },
    ...(project.repos.some((r) => r.kind === 'github')
      ? [
          {
            id: `${id}-signal-github`,
            project_id: id,
            source: 'github',
            last_seen_at: minutesAgo(lastActivityMinutes + 90),
            detail: 'Dernier commit (démo)',
          },
        ]
      : []),
    ...(project.repos.some((r) => r.kind === 'vercel')
      ? [
          {
            id: `${id}-signal-vercel`,
            project_id: id,
            source: 'vercel',
            last_seen_at: minutesAgo(lastActivityMinutes + 120),
            detail: 'ready — dernier déploiement (démo)',
          },
        ]
      : []),
  ];

  return {
    id,
    slug: project.slug,
    name: project.name,
    repo_path_local: project.repo_path_local,
    repos: project.repos.map((r, i) => ({ id: `${id}-repo-${i}`, ...r })),
    milestones,
    sessions,
    activity_signals: activitySignals,
  };
}

export const MOCK_PROJECTS = PROJECTS.map(buildMockProject);

export function getMockProject(slug) {
  return MOCK_PROJECTS.find((p) => p.slug === slug) ?? null;
}
