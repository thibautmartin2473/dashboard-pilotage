import TriageDemo from '@/components/demo/TriageDemo';
import { enrichTask, nextOrangeSlots } from '@/components/demo/TriageLogic';
import { getAllProjects } from '@/lib/data';
import { loadHomePanels } from '@/lib/home-data';
import { todayParis } from '@/lib/home';

// Démo vitrine : lecture seule des vraies données, aucun geste n'est écrit en base.
export const dynamic = 'force-dynamic';

export default async function TriPage() {
  const [projects, { tasks, events, notifications }] = await Promise.all([getAllProjects().catch(() => []), loadHomePanels()]);
  if (tasks.error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-red-400">Lecture des tâches impossible : {tasks.message}</p>
      </main>
    );
  }
  const now = new Date();
  const nowMs = now.getTime();
  const today = todayParis(now);
  const projectNames = Object.fromEntries(projects.map((p) => [p.slug, p.name]));
  const eventsById = Object.fromEntries((events.data ?? []).map((e) => [e.id, { title: e.title, starts_at: e.starts_at }]));
  const list = tasks.data.map((t) => enrichTask(t, { today, nowMs, projectNames, eventsById }));
  const slots = nextOrangeSlots(events.data, nowMs);
  const notifs = (notifications.data ?? []).map((n) => ({ id: n.id, title: n.title ?? '', kind: n.kind }));

  return <TriageDemo tasks={list} slots={slots} notifications={notifs} today={today} />;
}
