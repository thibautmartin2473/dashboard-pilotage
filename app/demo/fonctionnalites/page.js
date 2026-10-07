import FonctionnalitesDemo from '@/components/demo/fonctionnalites/FonctionnalitesDemo';
import { loadStudioData } from '@/components/demo/studio/loadStudioData';

// Démo vitrine : lecture seule des vraies données, aucun geste n'est écrit en base.
export const dynamic = 'force-dynamic';

export default async function FonctionnalitesPage() {
  const data = await loadStudioData();
  return <FonctionnalitesDemo data={data} />;
}
