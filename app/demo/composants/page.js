import ComposantsLab from '@/components/demo/composants/ComposantsLab';
import { prepareLab } from '@/components/demo/composants/prepare';
import { getAllProjects } from '@/lib/data';
import { loadHomePanels } from '@/lib/home-data';

// Vitrine « Boutons et micro-interactions » : lecture seule des vraies données (tâches, idées, mails,
// agenda) ; tous les gestes restent dans l'état local de l'onglet, rien n'est écrit en base.
export const dynamic = 'force-dynamic';

export const metadata = { title: 'Boutons et micro-interactions' };

export default async function ComposantsPage() {
  const [projects, panels] = await Promise.all([getAllProjects().catch(() => []), loadHomePanels()]);
  const data = prepareLab({ ...panels, projects });
  return <ComposantsLab data={data} />;
}
