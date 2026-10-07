import ChartesPage from '@/components/demo/chartes/ChartesPage';
import { loadStudioData } from '@/components/demo/studio/loadStudioData';

export const metadata = { title: 'Chartes avancées : Graphite' };

// Chartes Graphite avancées comparées sur une maquette du Cockpit réel : lecture seule des vraies données,
// aucun geste n'est écrit en base.
export const dynamic = 'force-dynamic';

export default async function ChartesRoute({ searchParams }) {
  const [data, params] = await Promise.all([loadStudioData(), searchParams]);
  return <ChartesPage data={data} initial={params ?? {}} />;
}
