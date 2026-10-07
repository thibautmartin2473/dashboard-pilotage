import ReviewDemo from '@/components/demo/ReviewDemo';
import { loadHomePanels } from '@/lib/home-data';
import { fmtDay, laterCandidates, nextMonday, shiftDay, weekStats, weekdayShort } from '@/components/demo/ReviewLogic';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { isOverdue, resolveCategories, timeParis, todayParis } from '@/lib/home';

// Démo en LECTURE SEULE : aucune écriture, aucune Server Action. Les gestes restent dans l'onglet.
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Démo : bilan de la veille et revue de la semaine' };

const clean = (x) => String(x ?? '').replace(new RegExp(`[${String.fromCharCode(0x2013)}${String.fromCharCode(0x2014)}]`, 'g'), '-');
const timeRange = (e) => (e.ends_at ? `${timeParis(e.starts_at)}-${timeParis(e.ends_at)}` : timeParis(e.starts_at));

export default async function BilanDemoPage() {
  const { tasks, ideas, events, settings, done } = await loadHomePanels();
  const now = new Date();
  const today = todayParis(now);
  const saved = settings.data?.find((r) => r.key === 'agenda_categories')?.value;
  const taskKeys = new Set(resolveCategories(saved).filter((c) => c.kind === 'tache').map((c) => c.key));
  const evs = events.data ?? [];
  const orange = evs.filter((e) => !e.all_day && taskKeys.has(e.color_id ?? '9'));
  const past = orange.filter((e) => todayParis(new Date(e.starts_at)) < today);
  const byDay = {};
  for (const e of past) (byDay[todayParis(new Date(e.starts_at))] ??= []).push(e);
  const days = Object.keys(byDay).sort();
  const yesterday = shiftDay(today, -1);

  // Tâches rattachées aux blocs orange passés (faites ou non), lecture seule.
  let linked = [];
  let linkedError = null;
  if (orange.length) {
    try {
      const { data, error } = await getSupabaseAdmin()
        .from('tasks')
        .select('id, title, event_id, done_at, due_date')
        .in('event_id', orange.map((e) => e.id));
      if (error) throw error;
      linked = data ?? [];
    } catch (err) {
      linkedError = err.message;
    }
  }
  const linkedIds = new Set(linked.map((t) => t.event_id));
  // Hier si des blocs orange y étaient ; sinon le dernier jour avec des blocs orange et des tâches liées
  // (à défaut, le dernier jour avec des blocs orange).
  const withTasks = [...days].reverse().find((d) => byDay[d].some((e) => linkedIds.has(e.id)));
  const reviewDay = days.includes(yesterday) ? yesterday : withTasks ?? days.at(-1) ?? null;
  const usedFallback = reviewDay !== null && reviewDay !== yesterday;
  const dayEvents = reviewDay ? byDay[reviewDay] : [];
  const mkBlocks = (list, day) =>
    list.map((e) => ({
      id: e.id,
      title: clean(e.title),
      time: timeRange(e),
      dayLabel: fmtDay(day),
      tasks: linked.filter((t) => t.event_id === e.id).map((t) => ({ id: t.id, title: clean(t.title), done: Boolean(t.done_at) })),
    }));
  const blocks = mkBlocks(dayEvents, reviewDay ?? today);

  // Simulation : le prochain jour dont les blocs orange ont des tâches liées, traité comme « hier ».
  const futureDays = {};
  for (const e of orange) {
    const d = todayParis(new Date(e.starts_at));
    if (d >= today) (futureDays[d] ??= []).push(e);
  }
  const simDay = Object.keys(futureDays).sort().find((d) => futureDays[d].some((e) => linkedIds.has(e.id))) ?? null;
  const sim = simDay ? { day: simDay, label: `${weekdayShort(simDay)} ${fmtDay(simDay)}`, blocks: mkBlocks(futureDays[simDay], simDay) } : null;

  const future = orange
    .filter((e) => new Date(e.starts_at).getTime() > now.getTime())
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .slice(0, 40)
    .map((e) => {
      const d = todayParis(new Date(e.starts_at));
      return { id: e.id, day: d, title: clean(e.title), time: timeRange(e), dayLabel: `${weekdayShort(d)} ${fmtDay(d)}` };
    });

  const open = tasks.data ?? [];
  const candidates = [...open]
    .sort((a, b) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999'))
    .slice(0, 30)
    .map((t) => ({ id: t.id, title: clean(t.title), due: t.due_date ? fmtDay(t.due_date) : null, late: isOverdue(t, today) }));

  const data = {
    today,
    todayLabel: `${weekdayShort(today)} ${fmtDay(today)}`,
    reviewDayLabel: reviewDay ? `${weekdayShort(reviewDay)} ${fmtDay(reviewDay)}` : null,
    usedFallback,
    blocks,
    sim,
    linkedError,
    future,
    eventsError: events.error ? events.message : null,
    stats: weekStats(done.data ?? [], today),
    openCount: open.length,
    overdueCount: open.filter((t) => isOverdue(t, today)).length,
    later: laterCandidates(open, evs, today).slice(0, 40).map((t) => ({ ...t, title: clean(t.title) })),
    ideas: (ideas.data ?? []).slice(0, 6).map((n) => ({ id: n.id, content: clean(n.content).slice(0, 220) })),
    candidates,
    weekLabel: fmtDay(nextMonday(today)),
  };
  return <ReviewDemo data={data} />;
}
