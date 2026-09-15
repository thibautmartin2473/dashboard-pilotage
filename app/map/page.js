import InteractionMapClient from '@/components/InteractionMapClient';
import { getAllProjects } from '@/lib/data';

export default async function MapPage() {
  const projects = await getAllProjects();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold">Carte d&apos;interactions</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Qui a parlé à quoi récemment, par projet.
      </p>

      <div className="mt-6 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <InteractionMapClient initialProjects={projects} />
      </div>
    </div>
  );
}
