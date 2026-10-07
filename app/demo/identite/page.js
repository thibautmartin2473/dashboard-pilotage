import IdentiteDemo from '@/components/demo/identite/IdentiteDemo';
import { getAllProjects, projectStatus } from '@/lib/data';
import { loadHomePanels } from '@/lib/home-data';
import { buildRangerItems } from '@/lib/ranger';
import { resolveCategories, todayParis } from '@/lib/home';

// Démo vitrine : lecture seule des vraies données (projets, éléments à ranger) ; rien n'est écrit.
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Identité : nom et logo' };

export default async function IdentitePage() {
  const [projects, panels] = await Promise.all([getAllProjects().catch(() => []), loadHomePanels()]);
  const { tasks, ideas, events, notifications, settings } = panels;
  const now = new Date();
  const setting = (key) => settings.data?.find((row) => row.key === key)?.value;
  const slim = projects.map((p) => ({
    slug: p.slug,
    name: p.name,
    done: p.milestones.filter((m) => m.status === 'done').length,
    total: p.milestones.length,
    status: projectStatus(p),
  }));
  const list = buildRangerItems({
    tasks: tasks.data ?? [],
    ideas: ideas.data ?? [],
    notifications: notifications.data ?? [],
    events: events.data ?? [],
    categories: resolveCategories(setting('agenda_categories')),
    now,
    projectNames: Object.fromEntries(slim.map((p) => [p.slug, p.name])),
  });

  return <IdentiteDemo live={{ toRanger: list.items.length, projects: slim, today: todayParis(now) }} />;
}
