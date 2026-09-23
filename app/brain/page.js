import { getBrainNotes } from '@/lib/brain';
import BrainNotesClient from '@/components/BrainNotesClient';
import CommandBox from '@/components/CommandBox';

// Idées lues à chaque requête avec la clé service_role : jamais figées dans le HTML du build.
export const dynamic = 'force-dynamic';

export default async function BrainPage() {
  const notes = await getBrainNotes();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-lg font-semibold tracking-tight">Claude Brain</h1>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        Une phrase avec un jour et une heure (« ajoute un tennis samedi entre 14
        et 17h », « rappelle-moi jeudi d&apos;acheter du lait ») part directement
        dans le tableau de bord. Le reste devient une note, qu&apos;une session
        Claude Code viendra ranger.
      </p>
      <div className="mb-8">
        <CommandBox />
      </div>
      <BrainNotesClient initialNotes={notes} />
    </main>
  );
}
