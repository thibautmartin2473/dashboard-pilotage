import ActionsPanel from '@/components/ActionsPanel';
import AgendaPanel from '@/components/AgendaPanel';
import AppsPanel from '@/components/AppsPanel';
import AutoRefresh from '@/components/AutoRefresh';
import CommandBox from '@/components/CommandBox';
import IdeasPanel from '@/components/IdeasPanel';
import LayoutEditor from '@/components/LayoutEditor';
import MailsPanel from '@/components/MailsPanel';
import { SuggestionsPanel } from '@/components/HomeTasks';
import { getAllProjects, lastActivityAt, projectStatus } from '@/lib/data';
import { loadHomePanels } from '@/lib/home-data';
import {
  HOME_PANELS, MAIL_SOURCES, STALE_DAYS, buildWeek, resolveLayout, splitTasks, summarize, todayEvents, todayLine, todayParis,
} from '@/lib/home';
import { supabaseConfigured } from '@/lib/supabase';

// Les données personnelles sont lues à chaque requête (jamais figées au build).
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [projects, { tasks, suggestions, ideas, events, mails, apps, settings }] = await Promise.all([
    getAllProjects(),
    loadHomePanels(),
  ]);
  const now = new Date();
  const today = todayParis(now);
  const week = events.data ? buildWeek(events.data, now) : null;
  const todayList = todayEvents(week);
  const sections = tasks.data && splitTasks(tasks.data, today);
  const summary = summarize({
    tasks: tasks.data ?? null,
    projects: projects.map((p) => ({ name: p.name, lastActivity: lastActivityAt(p) })),
    today,
  });

  // Données publiques des projets, allégées pour le client (les sessions n'ont rien à faire dans les props).
  const slim = projects.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    done: p.milestones.filter((m) => m.status === 'done').length,
    total: p.milestones.length,
    status: projectStatus(p),
  }));

  const setting = (key) => settings.data?.find((row) => row.key === key)?.value;
  const layout = resolveLayout(setting('home_layout'));
  const filter = setting('mail_filter');
  const mailFilter = MAIL_SOURCES.includes(filter) ? filter : 'all';

  const panels = {
    agenda: <AgendaPanel week={week} state={events} now={now.getTime()} />,
    ideas: <IdeasPanel notes={ideas.data} state={ideas} now={now.getTime()} />,
    suggestions: <SuggestionsPanel suggestions={suggestions.data} state={suggestions} projects={slim} />,
    actions: <ActionsPanel sections={sections} todayEvents={todayList} projects={slim} state={tasks} today={today} />,
    mails: <MailsPanel state={mails} savedFilter={mailFilter} settings={settings} now={now.getTime()} />,
    apps: <AppsPanel apps={apps.data} state={apps} projects={slim} />,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <AutoRefresh />
      {!supabaseConfigured && (
        <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Mode démo : Supabase n&apos;est pas configuré (variables <code>NEXT_PUBLIC_SUPABASE_URL</code>/
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>). Les projets affichés sont des exemples.
        </p>
      )}

      <h1 className="text-2xl font-semibold">Accueil</h1>
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400" data-testid="summary">
        <span>{todayLine(todayList ? todayList.length : null, sections ? sections.today.length : null)}</span>
        {summary.overdueCount !== null && (
          <span className={summary.overdueCount ? 'font-medium text-red-600 dark:text-red-400' : ''}>
            {summary.overdueCount} en retard
          </span>
        )}
        {week?.conflicts > 0 && (
          <span className="font-medium text-red-600 dark:text-red-400">{week.conflicts} conflit(s) d&apos;agenda</span>
        )}
        {week?.next && <span>Prochain événement à {week.next.time}</span>}
        <span>Dernier projet actif : {summary.latestProject ?? 'aucun'}</span>
        <span>
          Sans activité depuis plus de {STALE_DAYS} j : {summary.staleProjects.join(', ') || 'aucun'}
        </span>
      </p>

      <div className="mt-4">
        <CommandBox />
      </div>

      <div className="mt-3">
        <LayoutEditor layout={layout} settings={settings} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {layout.order
          .filter((id) => !layout.hidden.includes(id))
          .map((id) => (
            <div key={id} className={`min-w-0 ${HOME_PANELS[id].wide ? 'md:col-span-2' : ''}`}>
              {panels[id]}
            </div>
          ))}
      </div>
    </div>
  );
}
