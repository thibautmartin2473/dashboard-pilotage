import { getBrainNotes } from '@/lib/brain';
import BrainNotesClient from '@/components/BrainNotesClient';
import CommandBox from '@/components/CommandBox';
import CockpitShell from '@/components/cockpit/CockpitShell';
import { CARD } from '@/components/card';
import { loadCockpitData } from '@/lib/cockpit-data';

// Idées lues à chaque requête avec la clé service_role : jamais figées dans le HTML du build.
export const dynamic = 'force-dynamic';

// Vue plein écran des idées, dans la même logique que /agenda, /a-ranger et /mails : bandeau « Maintenant » en
// haut, puis une carte pleine largeur qui occupe le reste (seule la carte défile sur grand écran).
export default async function BrainPage() {
  const [notes, data] = await Promise.all([getBrainNotes(), loadCockpitData({ projects: false })]);

  return (
    <CockpitShell data={data} title="Idées">
      <section className={`${CARD} min-h-0 min-w-0 flex-1 overflow-y-auto p-4 sm:p-6`}>
        <h2 className="mb-2 text-lg font-semibold tracking-tight">Claude Brain</h2>
        <p className="mb-6 max-w-3xl text-sm text-[var(--ink-muted)]">
          Une phrase avec un jour et une heure (« ajoute un tennis samedi entre 14
          et 17h », « rappelle-moi jeudi d&apos;acheter du lait ») part directement
          dans le tableau de bord. Le reste devient une note, qu&apos;une session
          Claude Code viendra ranger.
        </p>
        <div className="mb-8 max-w-3xl">
          <CommandBox />
        </div>
        <BrainNotesClient initialNotes={notes} />
      </section>
    </CockpitShell>
  );
}
