import Studio from '@/components/demo/studio/Studio';
import { loadStudioData } from '@/components/demo/studio/loadStudioData';

// Studio des vitrines : charte x navigation x organisation, combinables à volonté.
// Lecture seule des vraies données ; aucun geste n'est écrit en base.
export const dynamic = 'force-dynamic';

export default async function StudioPage({ searchParams }) {
  const [data, params] = await Promise.all([loadStudioData(), searchParams]);
  return <Studio data={data} initial={params ?? {}} />;
}
