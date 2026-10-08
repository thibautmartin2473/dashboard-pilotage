import CharteCuir from '@/components/demo/charte-cuir/CharteCuir';
import { loadStudioData } from '@/components/demo/studio/loadStudioData';

export const metadata = { title: 'Charte Cuir équilibrée' };

// Cuir et bordeaux en un seul mode, trois niveaux d'équilibre, sur la maquette fidèle du Cockpit : lecture
// seule des vraies données, aucun geste n'est écrit en base.
export const dynamic = 'force-dynamic';

export default async function CharteCuirRoute({ searchParams }) {
  const [data, params] = await Promise.all([loadStudioData(), searchParams]);
  return <CharteCuir data={data} initial={params ?? {}} />;
}
