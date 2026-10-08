import AgendaPanel from '@/components/AgendaPanel';
import AutoRefresh from '@/components/AutoRefresh';
import CommandPalette from '@/components/CommandPalette';
import ConstellationFond from '@/components/ConstellationFond';
import MailsPanel from '@/components/MailsPanel';
import NowBar from '@/components/cockpit/NowBar';
import RangerColumn from '@/components/cockpit/RangerColumn';
import RangerForced from '@/components/cockpit/RangerForced';
import { getAllProjects, projectStatus } from '@/lib/data';
import { loadHomePanels } from '@/lib/home-data';
import { buildWeek, resolveCategories, todayParis } from '@/lib/home';
import { buildRangerItems } from '@/lib/ranger';
import { supabaseConfigured } from '@/lib/supabase';

// Les données personnelles sont lues à chaque requête (jamais figées au build).
export const dynamic = 'force-dynamic';

// Le Cockpit « tout sur un écran » : sur grand écran (>= 1280 px) la page tient dans la fenêtre, chaque
// zone défile à l'intérieur. Bandeau « Maintenant » en verre en haut, puis l'agenda sur 5 jours pleine
// hauteur à gauche et, à droite (24 rem), « À ranger » en haut et les mails en bas (une seule liste).
// Quatre zones de premier niveau : Maintenant, Agenda, À ranger, Mails. La Zone Commande n'est plus à
// l'écran : fenêtre ouverte par Cmd+K ou Ctrl+K (components/CommandPalette.js). Les Apps sont dans le rail.
// Sur téléphone et tablette, les zones s'empilent et la page défile. #cadran-fond est le fond animé
// (Constellation s'y branche), derrière tout, avec des cartes à 75 % qui le laissent voir.
export default async function HomePage() {
  const [projects, { tasks, ideas, events, mails, settings, notifications, done, ranger }] = await Promise.all([
    getAllProjects(),
    loadHomePanels(),
  ]);
  const now = new Date();
  const today = todayParis(now);
  const setting = (key) => settings.data?.find((row) => row.key === key)?.value;
  const categories = resolveCategories(setting('agenda_categories'));
  const week = events.data ? buildWeek(events.data, now, categories) : null;
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

  const lateCount = list.items.filter((i) => i.isDue).length;

  return (
    <div className="flex min-h-full flex-col xl:h-dvh xl:overflow-hidden">
      {/* Sans prop : le fond charge le graphe seul (/api/vault-graph, toutes les 5 min), pour ne pas
          relire 200 Ko en base à chaque rafraîchissement de 60 s de la page. */}
      <div id="cadran-fond" aria-hidden="true" className="fixed inset-0 -z-10">
        <ConstellationFond />
      </div>
      <AutoRefresh />
      <div id="cockpit-content" className="flex min-h-0 flex-1 flex-col gap-3 p-3">
        <NowBar
          events={events.data ?? []}
          categories={categories}
          now={now.getTime()}
          rangerCount={list.items.length}
          lateCount={lateCount}
        />
        <h1 className="sr-only">Accueil</h1>

        {(!supabaseConfigured || problems.length > 0) && (
          <div className="shrink-0 space-y-1" role="status">
            {!supabaseConfigured && (
              <p className="rounded-xl border-l-[3px] border-[var(--pending)] bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--ink)]">
                <span className="font-semibold">Mode démo : </span>Supabase n&apos;est pas configuré (variables{' '}
                <code>NEXT_PUBLIC_SUPABASE_URL</code>/<code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>). Les projets affichés sont des exemples.
              </p>
            )}
            {problems.length > 0 && (
              <p className="rounded-xl border-l-[3px] border-[var(--late)] bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--ink)]">
                <span className="font-semibold">Indisponible : </span>
                {problems.join(' · ')}
              </p>
            )}
          </div>
        )}

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_24rem] xl:grid-rows-[minmax(0,3fr)_minmax(0,2fr)]">
          <div id="agenda" className="min-h-0 min-w-0 xl:col-start-1 xl:row-span-2 xl:row-start-1">
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
          <div className="min-h-0 min-w-0 xl:col-start-2 xl:row-start-1">
            <RangerColumn
              items={list.items}
              todayTasks={list.todayTasks}
              options={list.options}
              ready={ranger.ready}
              today={today}
            />
          </div>
          <div id="mails" className="min-h-0 min-w-0 xl:col-start-2 xl:row-start-2">
            <MailsPanel state={mails} now={now.getTime()} />
          </div>
        </div>
      </div>

      {/* Hors de #cockpit-content : le reste de la page devient inerte pendant le rangement forcé. */}
      <CommandPalette data={{ events: events.data ?? [], tasks: activeTasks }} />
      <RangerForced items={list.dueItems} options={list.options} ready={ranger.ready} today={today} />
    </div>
  );
}
