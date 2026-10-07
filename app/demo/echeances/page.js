import DeadlinesDemo from '@/components/demo/DeadlinesDemo';
import { loadHomePanels } from '@/lib/home-data';
import { todayParis } from '@/lib/home';

// Démo vitrine en lecture seule : aucune écriture, les gestes restent dans l'onglet.
export const dynamic = 'force-dynamic';

// Les titres viennent de la base : pas de tiret cadratin affiché.
const clean = (s) => String(s ?? '').replace(/\s*[—–]\s*/g, ' - ');

export default async function EcheancesPage() {
  const { tasks, events } = await loadHomePanels();
  const error = tasks.error || events.error ? 'Une partie des données est indisponible, la démo est incomplète.' : null;
  const slimTasks = (tasks.data ?? []).map((t) => ({
    id: String(t.id),
    title: clean(t.title),
    due_date: t.due_date ?? null,
    event_id: t.event_id ?? null,
  }));
  const slimEvents = (events.data ?? []).map((e) => ({
    id: String(e.id),
    title: clean(e.title),
    starts_at: e.starts_at,
    ends_at: e.ends_at ?? null,
    color_id: e.color_id ?? null,
  }));
  return <DeadlinesDemo tasks={slimTasks} events={slimEvents} today={todayParis()} error={error} />;
}
