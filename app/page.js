import Link from 'next/link';
import OverviewClient from '@/components/OverviewClient';
import Panel from '@/components/Panel';
import { AddTask, SuggestionsPanel, TaskPanel } from '@/components/HomeTasks';
import { getAllProjects, lastActivityAt } from '@/lib/data';
import { loadHomePanels } from '@/lib/home-data';
import { STALE_DAYS, splitTasks, summarize, todayParis } from '@/lib/home';
import { supabaseConfigured } from '@/lib/supabase';
import { timeAgo } from '@/lib/format';

// Les tâches sont lues à chaque requête (données personnelles, jamais figées au build).
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [projects, { tasks, suggestions, ideas }] = await Promise.all([getAllProjects(), loadHomePanels()]);
  const today = todayParis();
  const panels = tasks.data && splitTasks(tasks.data, today);
  const summary = summarize({
    tasks: tasks.data ?? null,
    projects: projects.map((p) => ({ name: p.name, lastActivity: lastActivityAt(p) })),
    today,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {!supabaseConfigured && (
        <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Mode démo : Supabase n&apos;est pas configuré (variables <code>NEXT_PUBLIC_SUPABASE_URL</code>/
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>). Les projets affichés sont des exemples.
        </p>
      )}

      <h1 className="text-2xl font-semibold">Accueil</h1>
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400" data-testid="summary">
        <span>
          {summary.todayCount === null ? 'Tâches indisponibles' : `${summary.todayCount} tâche(s) aujourd'hui`}
        </span>
        {summary.overdueCount !== null && (
          <span className={summary.overdueCount ? 'font-medium text-red-600 dark:text-red-400' : ''}>
            {summary.overdueCount} en retard
          </span>
        )}
        <span>Dernier projet actif : {summary.latestProject ?? 'aucun'}</span>
        <span>
          Sans activité depuis plus de {STALE_DAYS} j : {summary.staleProjects.join(', ') || 'aucun'}
        </span>
      </p>

      <div className="mt-4">
        <AddTask projects={projects.map(({ slug, name }) => ({ slug, name }))} disabled={Boolean(tasks.error)} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <TaskPanel title="Actions à faire" panel="inbox" tasks={panels?.inbox} state={tasks} today={today} />
        <TaskPanel title="Aujourd'hui" panel="today" tasks={panels?.today} state={tasks} today={today} />

        <Panel title="Idées" count={ideas.data?.length} state={ideas} file="brain_notes.sql">
          {ideas.data?.length ? (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {ideas.data.map((n) => (
                <li key={n.id} className="py-2">
                  <p className="line-clamp-2 break-words text-sm">{n.content}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {n.project_slug && `${n.project_slug} · `}
                    {timeAgo(n.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Aucune idée en attente.</p>
          )}
          <Link href="/brain" className="mt-2 inline-block text-sm underline">
            Toutes les idées
          </Link>
        </Panel>

        <TaskPanel
          title="Prochaine session"
          panel="next_session"
          tasks={panels?.next_session}
          state={tasks}
          today={today}
        />

        <SuggestionsPanel suggestions={suggestions.data} state={suggestions} />
      </div>

      <h2 className="mt-8 text-sm font-semibold">Mes apps</h2>
      <div className="mt-3">
        <OverviewClient initialProjects={projects} compact />
      </div>
    </div>
  );
}
