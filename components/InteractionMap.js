import { ACTIVITY_SOURCES, SOURCE_LABELS } from '@/lib/constants';
import { timeAgo, isRecent } from '@/lib/format';

function nodeState(signal) {
  if (!signal) return 'none';
  if (isRecent(signal.last_seen_at, 15)) return 'live';
  if (isRecent(signal.last_seen_at, 60 * 24)) return 'recent';
  return 'stale';
}

const NODE_STYLES = {
  none: 'border-zinc-200 bg-transparent text-zinc-300 dark:border-zinc-800 dark:text-zinc-700',
  stale: 'border-zinc-300 bg-zinc-100 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500',
  recent: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300',
  live: 'border-emerald-400 bg-emerald-50 text-emerald-700 shadow-[0_0_0_3px_rgba(16,185,129,0.15)] dark:border-emerald-600 dark:bg-emerald-950 dark:text-emerald-300',
};

export default function InteractionMap({ projects }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-separate border-spacing-2">
        <thead>
          <tr>
            <th className="text-left text-xs font-medium text-zinc-400">Projet</th>
            {ACTIVITY_SOURCES.map((source) => (
              <th key={source} className="text-xs font-medium text-zinc-400">
                {SOURCE_LABELS[source]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id}>
              <td className="whitespace-nowrap text-sm font-medium">{project.name}</td>
              {ACTIVITY_SOURCES.map((source) => {
                const signal = project.activity_signals.find((s) => s.source === source);
                const state = nodeState(signal);
                return (
                  <td key={source} className="text-center">
                    <div
                      title={signal ? `${SOURCE_LABELS[source]} — ${timeAgo(signal.last_seen_at)}${signal.detail ? ` — ${signal.detail}` : ''}` : `${SOURCE_LABELS[source]} — pas de signal`}
                      className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full border-2 text-[10px] font-semibold ${NODE_STYLES[state]}`}
                    >
                      {state === 'live' ? '●' : state === 'recent' ? '○' : '·'}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-xs text-zinc-400">
        ● actif (&lt; 15 min) · ○ récent (&lt; 24 h) · · inactif ou pas de signal
      </p>
    </div>
  );
}
