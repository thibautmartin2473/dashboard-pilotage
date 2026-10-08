import CockpitShell from '@/components/cockpit/CockpitShell';
import RangerColumn from '@/components/cockpit/RangerColumn';
import { loadCockpitData } from '@/lib/cockpit-data';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'À ranger · Cadran' };

// Vue plein écran de « À ranger » : la même liste et les mêmes gestes (V A C S P, flèches) dans une colonne
// centrée de 56 rem au plus. Le rangement forcé ne s'ouvre pas ici : il reste sur le Cockpit (`/`).
export default async function ARangerPage() {
  const data = await loadCockpitData();
  const { ranger, list, today } = data;
  return (
    <CockpitShell data={data} title="À ranger">
      <div className="min-h-0 min-w-0 flex-1">
        <RangerColumn items={list.items} todayTasks={list.todayTasks} options={list.options} ready={ranger.ready} today={today} />
      </div>
    </CockpitShell>
  );
}
