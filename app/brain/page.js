import { getBrainNotes } from '@/lib/brain';
import BrainNotesClient from '@/components/BrainNotesClient';

export default async function BrainPage() {
  const notes = await getBrainNotes();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-lg font-semibold tracking-tight">Claude Brain</h1>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        Note une idée ou une tâche ici — une session Claude Code viendra la
        ranger dans le bon projet.
      </p>
      <BrainNotesClient initialNotes={notes} />
    </main>
  );
}
