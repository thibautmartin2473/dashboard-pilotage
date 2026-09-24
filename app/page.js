import ActionsPanel from '@/components/ActionsPanel';
import AgendaPanel from '@/components/AgendaPanel';
import AppsPanel from '@/components/AppsPanel';
import AutoRefresh from '@/components/AutoRefresh';
import CommandBox from '@/components/CommandBox';
import IdeasPanel from '@/components/IdeasPanel';
import LayoutEditor from '@/components/LayoutEditor';
import MailsPanel from '@/components/MailsPanel';
import { getAllProjects, lastActivityAt, projectStatus } from '@/lib/data';
import { loadHomePanels } from '@/lib/home-data';
import {
  HOME_PANELS, MAIL_SOURCES, STALE_DAYS, buildWeek, describeWhen, resolveLayout, splitTasks, summarize, todayEvents, todayLine, todayParis,
} from '@/lib/home';
import { supabaseConfigured } from '@/lib/supabase';

// Les données personnelles sont lues à chaque requête (jamais figées au build).
export const dynamic = 'force-dynamic';

// Une tuile du bandeau : une étiquette, un nombre lisible de loin, une ligne de
// contexte. `alert` la passe en rouge quand le chiffre demande une action.
function Kpi({ label, value, sub, accent = false, alert = false, testId }) {
  return (
    <div
      data-testid={testId}
      className={`rounded-xl border bg-zinc-900 px-3.5 py-3 ${alert ? 'border-red-800' : 'border-zinc-800'}`}
    >
      <div
        className={`font-mono text-[10px] font-semibold tracking-[0.1em] uppercase ${alert ? 'text-red-400' : 'text-zinc-400'}`}
      >
        {label}
      </div>
      <div
        className={`tabular mt-1 font-mono text-2xl font-bold ${alert ? 'text-red-400' : accent ? 'text-[var(--color-accent)]' : 'text-zinc-100'}`}
      >
        {value}
      </div>
      <div className="mt-0.5 truncate text-xs text-zinc-400" title={typeof sub === 'string' ? sub : undefined}>
        {sub}
      </div>
    </div>
  );
}

export default async function HomePage() {
  const [projects, { tasks, ideas, events, mails, apps, settings, notifications }] = await Promise.all([
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

  // Cibles possibles d'une idée : tâches non faites et événements pas encore finis.
  const targets = [
    ...(tasks.data ?? []).map((t) => ({ value: `task:${t.id}`, label: `Tâche : ${t.title}` })),
    ...(events.data ?? [])
      .filter((e) => new Date(e.ends_at ?? e.starts_at) >= now)
      .map((e) => ({ value: `event:${e.id}`, label: `Agenda : ${e.title} (${describeWhen(e)})` })),
  ];
  const linkedIdeas = ideas.data ?? [];
  const activeTasks = tasks.data ?? [];
  const eventTargets = targets.filter((t) => t.value.startsWith('event:'));

  const panels = {
    agenda: <AgendaPanel week={week} state={events} now={now.getTime()} ideas={linkedIdeas} tasks={activeTasks} />,
    ideas: <IdeasPanel notes={ideas.data} state={ideas} now={now.getTime()} targets={targets} />,
    actions: (
      <ActionsPanel
        sections={sections}
        todayEvents={todayList}
        projects={slim}
        state={tasks}
        today={today}
        notifications={notifications}
        ideas={linkedIdeas}
        eventTargets={eventTargets}
      />
    ),
    mails: <MailsPanel state={mails} savedFilter={mailFilter} settings={settings} now={now.getTime()} />,
    apps: <AppsPanel apps={apps.data} state={apps} projects={slim} />,
  };

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      <AutoRefresh />
      {!supabaseConfigured && (
        <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Mode démo : Supabase n&apos;est pas configuré (variables <code>NEXT_PUBLIC_SUPABASE_URL</code>/
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>). Les projets affichés sont des exemples.
        </p>
      )}

      <h1 className="text-xl font-bold tracking-tight">Accueil</h1>

      {/* Bandeau du cockpit : les quatre chiffres qui disent s'il faut agir
          maintenant. Le détail reste dans les panneaux, jamais ici. */}
      <div className="mt-3 grid grid-cols-2 gap-2.5 md:grid-cols-4" data-testid="summary">
        <Kpi
          label="Aujourd'hui"
          value={todayList ? todayList.length : '—'}
          sub={todayLine(todayList ? todayList.length : null, sections ? sections.today.length : null)}
        />
        <Kpi
          label="Prochain"
          value={week?.next ? week.next.time : '—'}
          sub={week?.next ? week.next.title : 'rien de prévu'}
          accent={Boolean(week?.next)}
        />
        <Kpi
          label="À trancher"
          value={notifications.data ? notifications.data.length + (week?.conflicts ?? 0) : '—'}
          sub={
            week?.conflicts > 0
              ? `dont ${week.conflicts} conflit(s) d'agenda`
              : notifications.data
                ? 'notifications en attente'
                : 'notifications indisponibles'
          }
          alert={week?.conflicts > 0}
          testId="notification-count"
        />
        <Kpi
          label="En retard"
          value={summary.overdueCount ?? '—'}
          sub={`Dernier projet actif : ${summary.latestProject ?? 'aucun'}`}
          alert={Boolean(summary.overdueCount)}
        />
      </div>

      <p className="mt-2 tabular font-mono text-[11px] text-zinc-400">
        Sans activité depuis plus de {STALE_DAYS} j : {summary.staleProjects.join(', ') || 'aucun'}
      </p>

      <div className="mt-4">
        <CommandBox data={{ events: events.data ?? [], tasks: activeTasks }} />
      </div>

      <div className="mt-3">
        <LayoutEditor layout={layout} settings={settings} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {layout.order
          .filter((id) => !layout.hidden.includes(id))
          .map((id) => (
            <div key={id} className={`min-w-0 ${HOME_PANELS[id].wide ? 'md:col-span-full' : ''}`}>
              {panels[id]}
            </div>
          ))}
      </div>
    </div>
  );
}
