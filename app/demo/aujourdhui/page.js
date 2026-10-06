import TodayApp from '@/components/demo/TodayApp';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { loadHomePanels } from '@/lib/home-data';
import { WEEK_OFFSET_MIN, resolveCategories, todayParis } from '@/lib/home';

// Démo vitrine : lecture seule des vraies données, aucun geste n'est enregistré.
export const dynamic = 'force-dynamic';

// Tâches faites récemment et rattachées à un bloc : elles alimentent « 2 sur 3 faites ».
async function recentDoneInBlocks() {
  try {
    const since = new Date(Date.now() + WEEK_OFFSET_MIN * 86400000).toISOString();
    const { data } = await getSupabaseAdmin()
      .from('tasks')
      .select('id, title, event_id, due_date, bucket')
      .gte('done_at', since)
      .not('event_id', 'is', null);
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function Page() {
  const [{ tasks, events, settings }, doneRows] = await Promise.all([loadHomePanels(), recentDoneInBlocks()]);
  const now = new Date();
  const setting = (key) => settings.data?.find((row) => row.key === key)?.value;
  const categories = resolveCategories(setting('agenda_categories'));

  const slimTask = (t, done) => ({
    id: t.id, title: t.title, due_date: t.due_date ?? null, bucket: t.bucket ?? null, event_id: t.event_id ?? null, done,
  });
  const allTasks = [...(tasks.data ?? []).map((t) => slimTask(t, false)), ...doneRows.map((t) => slimTask(t, true))];
  const slimEvents = (events.data ?? []).map((e) => ({
    id: e.id, title: e.title, starts_at: e.starts_at, ends_at: e.ends_at ?? null,
    all_day: Boolean(e.all_day), color_id: e.color_id ?? null, location: e.location ?? null,
  }));

  if (tasks.error || events.error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 text-sm text-amber-300">
        Données indisponibles : {tasks.message ?? events.message}
      </main>
    );
  }

  return (
    <TodayApp
      tasks={allTasks}
      events={slimEvents}
      categories={categories}
      today={todayParis(now)}
      nowMs={now.getTime()}
    />
  );
}
