import Link from 'next/link';
import StatusBadge from './StatusBadge';
import MilestoneChecklist from './MilestoneChecklist';
import { timeAgo } from '@/lib/format';
import { lastActivityAt, projectStatus } from '@/lib/data';

export default function ProjectCard({ project }) {
  const status = projectStatus(project);
  const lastActivity = lastActivityAt(project);
  const done = project.milestones.filter((m) => m.status === 'done').length;

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="block rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-semibold">{project.name}</h2>
        <StatusBadge status={status} />
      </div>

      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {done}/{project.milestones.length} jalons — dernière activité {timeAgo(lastActivity)}
      </p>

      <div className="mt-4">
        <MilestoneChecklist milestones={project.milestones} compact />
      </div>
    </Link>
  );
}
