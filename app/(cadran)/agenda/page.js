import AgendaPanel from '@/components/AgendaPanel';
import CockpitShell from '@/components/cockpit/CockpitShell';
import { loadCockpitData } from '@/lib/cockpit-data';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Agenda · Cadran' };

// Vue plein écran de l'agenda : même composant que sur le Cockpit, mais il occupe toute la zone sous le bandeau
// « Maintenant » et montre 7 jours d'un coup (au lieu de 5). Mêmes fonctions : glisser, poignées, types, « + »,
// catégories. Sur grand écran seule la grille défile ; sur téléphone la page défile.
export default async function AgendaPage() {
  const data = await loadCockpitData({ projects: false });
  const { events, ideas, done, categories, kindOverrides, week, allTasks, activeTasks, now } = data;
  return (
    <CockpitShell data={data} title="Agenda">
      <div id="agenda" className="min-h-0 min-w-0 flex-1">
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
          visibleDays={7}
        />
      </div>
    </CockpitShell>
  );
}
