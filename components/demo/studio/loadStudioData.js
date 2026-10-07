import 'server-only';
import { getAllProjects } from '@/lib/data';
import { loadHomePanels } from '@/lib/home-data';
import { resolveCategories, todayParis } from '@/lib/home';

// Données du Studio : les vraies tables, en LECTURE SEULE, aplaties en objets
// simples pour les composants clients. Un panneau en erreur devient une liste
// vide et son message part dans `errors` (le Studio l'affiche discrètement).
export async function loadStudioData() {
  const [projects, panels] = await Promise.all([getAllProjects().catch(() => []), loadHomePanels()]);
  const errors = Object.entries(panels)
    .filter(([, p]) => p.error)
    .map(([name, p]) => `${name} : ${p.message}`);
  const list = (p) => p.data ?? [];
  const settings = list(panels.settings);
  const setting = (key) => settings.find((row) => row.key === key)?.value;
  const now = new Date();
  return {
    nowIso: now.toISOString(),
    today: todayParis(now),
    tasks: list(panels.tasks), // tâches ouvertes (done_at null)
    done: list(panels.done), // tâches faites depuis J-36 : { id, title, done_at }
    ideas: list(panels.ideas), // brain_notes en attente
    events: list(panels.events), // calendar_events depuis J-36 (passés et à venir)
    mails: list(panels.mails),
    apps: list(panels.apps),
    notifications: list(panels.notifications), // status = 'new'
    categories: resolveCategories(setting('agenda_categories')),
    projects: projects.map((p) => ({ id: p.id, slug: p.slug, name: p.name, status: p.status ?? null })),
    errors,
  };
}
