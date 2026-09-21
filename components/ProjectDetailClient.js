'use client';

import { useCallback, useState } from 'react';
import StatusBadge from './StatusBadge';
import MilestoneChecklist from './MilestoneChecklist';
import CopyCommand from './CopyCommand';
import { getProjectBySlug, projectStatus } from '@/lib/data';
import { useRealtimeRefresh } from '@/lib/useRealtimeRefresh';
import { timeAgo, formatDuration } from '@/lib/format';

export default function ProjectDetailClient({ initialProject }) {
  const [project, setProject] = useState(initialProject);
  // Nouvelles données du serveur (après une écriture ou router.refresh) : on les adopte.
  const [seen, setSeen] = useState(initialProject);
  if (seen !== initialProject) {
    setSeen(initialProject);
    setProject(initialProject);
  }

  const refresh = useCallback(async () => {
    try {
      const fresh = await getProjectBySlug(initialProject.slug);
      if (fresh) setProject(fresh);
    } catch (err) {
      // on garde l'état précédent si le refetch échoue
      console.error('project refresh failed', err);
    }
  }, [initialProject.slug]);

  useRealtimeRefresh(refresh);

  const status = projectStatus(project);
  const resumeCommand = `cd "${project.repo_path_local}" && claude --continue`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="flex items-start justify-between gap-2">
        <h1 className="text-2xl font-semibold">{project.name}</h1>
        <StatusBadge status={status} />
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Reprendre</h2>
        <div className="mt-2">
          <CopyCommand command={resumeCommand} />
        </div>
        {project.sessions[0]?.summary && (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Dernière session ({timeAgo(project.sessions[0].started_at)}) : {project.sessions[0].summary}
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Jalons</h2>
        <div className="mt-2 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <MilestoneChecklist projectId={project.id} milestones={project.milestones} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Historique des sessions</h2>
        <ol className="mt-2 space-y-3">
          {project.sessions.length === 0 && (
            <li className="text-sm text-zinc-400">Aucune session enregistrée pour l&apos;instant.</li>
          )}
          {project.sessions.map((session) => (
            <li key={session.id} className="rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>{timeAgo(session.started_at)}</span>
                {session.duration_seconds != null && <span>{formatDuration(session.duration_seconds)}</span>}
              </div>
              {session.summary && <p className="mt-1">{session.summary}</p>}
              {session.files_touched?.length > 0 && (
                <p className="mt-1 truncate text-xs text-zinc-400">
                  {session.files_touched.join(', ')}
                </p>
              )}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
