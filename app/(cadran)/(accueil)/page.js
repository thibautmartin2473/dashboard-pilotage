import AgendaPanel from '@/components/AgendaPanel';
import MailsPanel from '@/components/MailsPanel';
import CockpitShell from '@/components/cockpit/CockpitShell';
import RangerColumn from '@/components/cockpit/RangerColumn';
import RangerForced from '@/components/cockpit/RangerForced';
import { loadCockpitData } from '@/lib/cockpit-data';

// Les données personnelles sont lues à chaque requête (jamais figées au build).
export const dynamic = 'force-dynamic';

// Le Cockpit « tout sur un écran » : sur grand écran (>= 1280 px) la page tient dans la fenêtre, chaque
// zone défile à l'intérieur. Bandeau « Maintenant » en verre en haut, puis l'agenda sur 5 jours pleine
// hauteur à gauche et, à droite (24 rem), « À ranger » en haut et les mails en bas (une seule liste).
// Quatre zones de premier niveau : Maintenant, Agenda, À ranger, Mails. La Zone Commande n'est plus à
// l'écran : fenêtre ouverte par Cmd+K ou Ctrl+K (components/CommandPalette.js). Les Apps sont dans le rail.
// Sur téléphone et tablette, les zones s'empilent et la page défile. #cadran-fond est le fond animé
// (Constellation s'y branche), derrière tout, avec des cartes à 75 % qui le laissent voir.
// Chaque zone a sa vue plein écran (/agenda, /a-ranger, /mails) : le titre de la carte y mène.
// Chargement des données et cadre : lib/cockpit-data.js et components/cockpit/CockpitShell.js.
export default async function HomePage() {
  const data = await loadCockpitData();
  const { events, mails, done, ranger, ideas, categories, kindOverrides, week, allTasks, activeTasks, list, today, now } = data;

  return (
    <CockpitShell
      data={data}
      after={
        // Hors de #cockpit-content : le reste de la page devient inerte pendant le rangement forcé.
        <RangerForced items={list.dueItems} options={list.options} ready={ranger.ready} today={today} />
      }
    >
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_24rem] xl:grid-rows-[minmax(0,3fr)_minmax(0,2fr)]">
        <div id="agenda" className="min-h-0 min-w-0 xl:col-start-1 xl:row-span-2 xl:row-start-1">
          <AgendaPanel
            week={week}
            state={events}
            now={now.getTime()}
            ideas={ideas.data ?? []}
            tasks={activeTasks}
            openTasks={allTasks}
            done={done.data ?? []}
            categories={categories}
            kindOverrides={kindOverrides}
            focusHref="/agenda"
          />
        </div>
        <div className="min-h-0 min-w-0 xl:col-start-2 xl:row-start-1">
          <RangerColumn
            items={list.items}
            todayTasks={list.todayTasks}
            options={list.options}
            ready={ranger.ready}
            today={today}
            focusHref="/a-ranger"
          />
        </div>
        <div id="mails" className="min-h-0 min-w-0 xl:col-start-2 xl:row-start-2">
          <MailsPanel state={mails} now={now.getTime()} focusHref="/mails" />
        </div>
      </div>
    </CockpitShell>
  );
}
