import Link from 'next/link';
import StatusBadge from './StatusBadge';
import MilestoneChecklist from './MilestoneChecklist';
import { timeAgo } from '@/lib/format';
import { lastActivityAt, projectStatus } from '@/lib/data';
import { APPS } from '@/lib/apps';

// `compact` = tuile de la grille d'apps de l'accueil : barre de progression au
// lieu de la liste des jalons. Si lib/apps.js définit une app externe pour le
// projet, la tuile l'ouvre et un lien secondaire mène au détail du projet.
export default function ProjectCard({ project, compact = false }) {
  const status = projectStatus(project);
  const lastActivity = lastActivityAt(project);
  const done = project.milestones.filter((m) => m.status === 'done').length;
  const total = project.milestones.length;
  const externalUrl = APPS[project.slug]?.externalUrl ?? null;
  const detailHref = `/projects/${project.slug}`;

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-semibold">
          {project.name}
          {externalUrl && <span aria-hidden> ↗</span>}
        </h2>
        <StatusBadge status={status} />
      </div>

      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {done}/{total} jalons — dernière activité {timeAgo(lastActivity)}
      </p>

      {compact ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div className="h-full bg-emerald-500" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
        </div>
      ) : (
        <div className="mt-4">
          <MilestoneChecklist milestones={project.milestones} compact />
        </div>
      )}
    </>
  );

  const box =
    'block rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700';

  if (!externalUrl) {
    return (
      <Link href={detailHref} className={box}>
        {body}
      </Link>
    );
  }

  return (
    <div className={box}>
      <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="block">
        {body}
      </a>
      <Link href={detailHref} className="mt-3 inline-block text-xs text-zinc-500 underline dark:text-zinc-400">
        Détail du projet
      </Link>
    </div>
  );
}
