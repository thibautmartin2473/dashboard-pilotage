import AvancementDetail from '@/components/cockpit/AvancementDetail';
import CockpitShell from '@/components/cockpit/CockpitShell';
import { loadAvancement } from '@/lib/avancement-data';
import { loadCockpitData } from '@/lib/cockpit-data';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Avancement · Cadran' };

// Vue plein écran de l'avancement : TOUT le détail (méthode de cas, tests en ligne, lettres, réseau, fit, partiels,
// Master Project, projets), du plus en retard au plus en avance, retards en avant. Le Cockpit (/) n'en montre qu'un
// résumé compact. Lecture seule ; les lignes sont calculées par scripts/push-avancement.mjs (table `avancement`).
export default async function AvancementPage() {
  const [data, { rows, showHidden }] = await Promise.all([loadCockpitData({ projects: false }), loadAvancement()]);
  return (
    <CockpitShell data={data} title="Avancement">
      <AvancementDetail rows={rows} showHidden={showHidden} now={data.now.getTime()} />
    </CockpitShell>
  );
}
