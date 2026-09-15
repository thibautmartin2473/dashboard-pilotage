import OverviewClient from '@/components/OverviewClient';
import { getAllProjects } from '@/lib/data';
import { supabaseConfigured } from '@/lib/supabase';

export default async function OverviewPage() {
  const projects = await getAllProjects();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold">Vue d&apos;ensemble</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Où en est la construction de chacun de mes projets, et par où je reprends.
      </p>

      {!supabaseConfigured && (
        <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Mode démo — Supabase n&apos;est pas encore configuré (variables{' '}
          <code>NEXT_PUBLIC_SUPABASE_URL</code>/<code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>). Les données
          affichées sont des exemples, pas de vraies mises à jour en temps réel.
        </p>
      )}

      <div className="mt-6">
        <OverviewClient initialProjects={projects} />
      </div>
    </div>
  );
}
