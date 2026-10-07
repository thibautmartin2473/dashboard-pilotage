import ChartesCadran from '@/components/demo/chartes-cadran/ChartesCadran';
import { loadStudioData } from '@/components/demo/studio/loadStudioData';

export const metadata = { title: 'Chartes de Cadran' };

// Quatre chartes d'après le moodboard, comparées sur une maquette fidèle du Cockpit : lecture seule des
// vraies données, aucun geste n'est écrit en base.
export const dynamic = 'force-dynamic';

export default async function ChartesCadranRoute({ searchParams }) {
  const [data, params] = await Promise.all([loadStudioData(), searchParams]);
  return <ChartesCadran data={data} initial={params ?? {}} />;
}
