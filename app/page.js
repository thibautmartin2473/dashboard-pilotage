import AgendaPanel from '@/components/AgendaPanel';
import AppsPanel from '@/components/AppsPanel';
import AutoRefresh from '@/components/AutoRefresh';
import CommandBox from '@/components/CommandBox';
import MailsPanel from '@/components/MailsPanel';
import RangerColumn from '@/components/cockpit/RangerColumn';
import RangerForced from '@/components/cockpit/RangerForced';
import { getAllProjects, projectStatus } from '@/lib/data';
import { loadHomePanels } from '@/lib/home-data';
import { buildWeek, resolveCategories, todayEvents, todayParis } from '@/lib/home';
import { buildRangerItems } from '@/lib/ranger';
import { supabaseConfigured } from '@/lib/supabase';

// Les données personnelles sont lues à chaque requête (jamais figées au build).
export const dynamic = 'force-dynamic';

// Le Cockpit : pleine largeur. La Zone Commande en une ligne, puis l'agenda (5 jours d'un coup, tâches
// dans leurs blocs) à gauche et la colonne « À ranger » à droite, les deux boîtes mail côte à côte,
// puis Apps et projets. Les tâches et les idées n'ont plus de panneau à elles : tout ce qui n'a pas
// encore de place passe par « À ranger ».
export default async function HomePage() {
  const [projects, { tasks, ideas, events, mails, apps, settings, notifications, done, ranger }] = await Promise.all([
    getAllProjects(),
    loadHomePanels(),
  ]);
  const now = new Date();
  const today = todayParis(now);
  const setting = (key) => settings.data?.find((row) => row.key === key)?.value;
  const categories = resolveCategories(setting('agenda_categories'));
  const week = events.data ? buildWeek(events.data, now, categories) : null;
  const todayList = todayEvents(week);
  // Tâches reportées (« Plus tard », jour futur) : ni dans la zone Commande ni dans l'agenda avant leur jour.
  // La liste « À ranger » reçoit tout : elle gère elle-même les reports (lib/ranger.js).
  const allTasks = tasks.data ?? [];
  const activeTasks = allTasks.filter((t) => !(t.snoozed_until && t.snoozed_until > today));

  // Données publiques des projets, allégées pour le client (les sessions n'ont rien à faire dans les props).
  const slim = projects.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    done: p.milestones.filter((m) => m.status === 'done').length,
    total: p.milestones.length,
    status: projectStatus(p),
  }));

  // Liste « À ranger » : tâches sans bloc à venir, idées, propositions des mails (lib/ranger.js).
  const list = buildRangerItems({
    tasks: allTasks,
    ideas: ideas.data ?? [],
    notifications: notifications.data ?? [],
    events: events.data ?? [],
    categories,
    now,
    projectNames: Object.fromEntries(slim.map((p) => [p.slug, p.name])),
  });
  const problems = [
    tasks.error && 'Tâches indisponibles',
    ideas.error && 'Idées indisponibles',
    events.error && 'Agenda indisponible : les suggestions de blocs sont limitées',
    notifications.error === 'error' && 'Propositions des mails indisponibles',
  ].filter(Boolean);

  const statusLine = [
    todayList ? `Aujourd'hui : ${todayList.length} événement${todayList.length > 1 ? 's' : ''}` : 'Agenda indisponible',
    week?.next ? `Prochain : ${week.next.time} ${week.next.title}` : 'Rien de prévu aujourd\'hui',
    week?.conflicts > 0 ? `${week.conflicts} conflit(s) d'agenda` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="px-3 py-4 sm:px-4 lg:px-5">
      <AutoRefresh />
      <div id="cockpit-content">
        {!supabaseConfigured && (
          <p className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
            Mode démo : Supabase n&apos;est pas configuré (variables <code>NEXT_PUBLIC_SUPABASE_URL</code>/
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>). Les projets affichés sont des exemples.
          </p>
        )}

        <h1 className="sr-only">Accueil</h1>

        {/* Zone Commande en une ligne fine : l'en-tête du panneau reste lu par les lecteurs d'écran. */}
        <div className="[&_section>div]:p-2 [&_section>h2]:sr-only" data-testid="command-line">
          <CommandBox data={{ events: events.data ?? [], tasks: activeTasks }} />
        </div>
        <p className="mt-1.5 px-1 tabular font-mono text-[11px] text-zinc-400" data-testid="summary">
          {statusLine}
        </p>

        <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div id="agenda" className="min-w-0">
            <AgendaPanel
              week={week}
              state={events}
              now={now.getTime()}
              ideas={ideas.data ?? []}
              tasks={activeTasks}
              done={done.data ?? []}
              categories={categories}
            />
          </div>
          <div className="min-w-0">
            {problems.length > 0 && (
              <p className="mb-2 rounded-lg border border-amber-800 bg-amber-950 px-3 py-1.5 text-xs text-amber-400" role="status">
                {problems.join(' · ')}
              </p>
            )}
            <RangerColumn
              items={list.items}
              todayTasks={list.todayTasks}
              options={list.options}
              ready={ranger.ready}
              today={today}
            />
          </div>
        </div>

        <div id="mails" className="mt-3 min-w-0">
          <MailsPanel state={mails} now={now.getTime()} />
        </div>

        <div id="apps" className="mt-3 min-w-0">
          <AppsPanel apps={apps.data} state={apps} projects={slim} />
        </div>
      </div>

      {/* Hors de #cockpit-content : le reste de la page devient inerte pendant le rangement forcé. */}
      <RangerForced items={list.dueItems} options={list.options} ready={ranger.ready} today={today} />
    </div>
  );
}
