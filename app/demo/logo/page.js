import LogoDemo from '@/components/demo/logo/LogoDemo';
import { getAllProjects } from '@/lib/data';
import { loadHomePanels } from '@/lib/home-data';
import { buildRangerItems } from '@/lib/ranger';
import { resolveCategories, todayParis } from '@/lib/home';

// Démo vitrine : lecture seule des vraies données (projets, éléments à ranger, agenda du jour) ; rien n'est écrit.
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Le logo de Cadran' };

const parisFormat = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

// Date (AAAA-MM-JJ) et minutes depuis minuit, à l'heure de Paris, d'un horodatage.
function parisParts(iso) {
  const parts = parisFormat.formatToParts(new Date(iso));
  const get = (t) => parts.find((p) => p.type === t)?.value ?? '00';
  return { day: `${get('year')}-${get('month')}-${get('day')}`, min: Number(get('hour')) * 60 + Number(get('minute')) };
}

export default async function LogoPage() {
  const [projects, panels] = await Promise.all([getAllProjects().catch(() => []), loadHomePanels()]);
  const { tasks, ideas, events, notifications, settings } = panels;
  const now = new Date();
  const today = todayParis(now);
  const setting = (key) => settings.data?.find((row) => row.key === key)?.value;
  const slim = projects.map((p) => ({
    slug: p.slug,
    name: p.name,
    done: p.milestones.filter((m) => m.status === 'done').length,
    total: p.milestones.length,
  }));
  const list = buildRangerItems({
    tasks: tasks.data ?? [],
    ideas: ideas.data ?? [],
    notifications: notifications.data ?? [],
    events: events.data ?? [],
    categories: resolveCategories(setting('agenda_categories')),
    now,
    projectNames: Object.fromEntries(projects.map((p) => [p.slug, p.name])),
  });

  // Plages du jour : événements horaires qui commencent aujourd'hui (heure de Paris), en minutes depuis minuit.
  const plages = [];
  for (const e of events.data ?? []) {
    if (e.all_day || !e.starts_at) continue;
    const s = parisParts(e.starts_at);
    if (s.day !== today) continue;
    const end = e.ends_at ? parisParts(e.ends_at) : null;
    const endMin = end && end.day === today ? end.min : Math.min(s.min + 60, 1439);
    if (endMin > s.min) plages.push([s.min, endMin]);
  }

  return <LogoDemo live={{ toRanger: list.items.length, projects: slim, today, plages }} />;
}
