import CockpitShell from '@/components/cockpit/CockpitShell';
import MailsPanel from '@/components/MailsPanel';
import { loadCockpitData } from '@/lib/cockpit-data';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Mails · Cadran' };

// Vue plein écran des mails : la même liste (une seule, les deux boîtes fusionnées) en colonnes lisibles en large :
// expéditeur, objet, étiquette EDHEC, heure. Lecture seule, la ligne ouvre le mail dans Gmail.
export default async function MailsPage() {
  const data = await loadCockpitData({ projects: false });
  const { mails, now } = data;
  return (
    <CockpitShell data={data} title="Mails">
      <div id="mails" className="min-h-0 min-w-0 flex-1">
        <MailsPanel state={mails} now={now.getTime()} wide />
      </div>
    </CockpitShell>
  );
}
