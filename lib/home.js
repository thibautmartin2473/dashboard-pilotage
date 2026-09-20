// Logique pure de la page d'accueil (sans accès base) : testée par
// scripts/check-home.mjs. Les dates « jour » sont des chaînes AAAA-MM-JJ.

export const BUCKETS = ['inbox', 'today', 'next_session'];
export const BUCKET_LABELS = { inbox: 'À faire', today: "Aujourd'hui", next_session: 'Prochaine session' };
export const STALE_DAYS = 7;

// Le serveur Vercel est en UTC : « aujourd'hui » se calcule à l'heure de Paris.
export function todayParis(now = new Date()) {
  return now.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
}

// Table absente : PostgREST (PGRST205) ou Postgres direct (42P01).
export function isMissingTable(error) {
  return error?.code === 'PGRST205' || error?.code === '42P01';
}

export function isOverdue(task, today) {
  return !task.done_at && Boolean(task.due_date) && task.due_date < today;
}

// Un panneau par tâche : « Aujourd'hui » prend le bucket today et toute
// échéance du jour ou dépassée, sinon le bucket de la tâche.
export function splitTasks(tasks, today) {
  const panels = { inbox: [], today: [], next_session: [] };
  for (const t of tasks) {
    if (t.done_at) continue;
    const panel = t.bucket === 'today' || (t.due_date && t.due_date <= today) ? 'today' : t.bucket;
    panels[panel]?.push(t);
  }
  panels.today.sort((a, b) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999'));
  return panels;
}

// projects : [{ name, lastActivity }] (lastActivity = date ISO ou null).
// tasks : null quand la table est indisponible (les compteurs restent null).
export function summarize({ tasks, projects, today, now = Date.now() }) {
  const panels = tasks && splitTasks(tasks, today);
  const active = projects.filter((p) => p.lastActivity);
  const latest = active.reduce((a, p) => (!a || p.lastActivity > a.lastActivity ? p : a), null);
  const limit = now - STALE_DAYS * 86400000;
  return {
    todayCount: panels ? panels.today.length : null,
    overdueCount: tasks ? tasks.filter((t) => isOverdue(t, today)).length : null,
    latestProject: latest?.name ?? null,
    staleProjects: projects.filter((p) => !p.lastActivity || new Date(p.lastActivity).getTime() < limit).map((p) => p.name),
  };
}
