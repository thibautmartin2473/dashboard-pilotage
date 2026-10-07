'use client';

// Petites pièces du Journal du jour : icônes en ligne, tête de chapitre, case à cocher, ligne de tâche, volet replié.
// Couleurs, rayons et polices : uniquement les jetons var(--...) de la charte.

export const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]';

const svg = { viewBox: '0 0 20 20', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

export const IconChevron = ({ dir = 'down', className = 'size-4' }) => (
  <svg {...svg} className={className}>
    <path d={dir === 'left' ? 'M12.5 4.5 7 10l5.5 5.5' : dir === 'right' ? 'M7.5 4.5 13 10l-5.5 5.5' : 'M4.5 7.5 10 13l5.5-5.5'} />
  </svg>
);

export const IconCheck = ({ className = 'size-3.5' }) => (
  <svg {...svg} strokeWidth={2.4} className={className}>
    <path d="m4.5 10.5 3.5 3.5 7.5-8" />
  </svg>
);

export const IconPin = ({ filled = false, className = 'size-4' }) => (
  <svg {...svg} className={className} fill={filled ? 'currentColor' : 'none'}>
    <path d="M7 3.5h6l-1 5 2.5 2.5v1.2H5.5V11L8 8.5l-1-5Z" />
    <path d="M10 12.2V17" />
  </svg>
);

// Tête de chapitre : numéro mono, titre, filet, complément à droite.
export function Head({ n, title, hint, id }) {
  return (
    <header className="mb-3 flex items-baseline gap-3">
      <span className="text-[11px] tracking-[0.14em] text-[var(--text-muted)] [font-family:var(--font-mono)]">{n}</span>
      <h2 id={id} className="text-[1.05rem] leading-none font-semibold text-[var(--text)] [font-family:var(--font-display)]">
        {title}
      </h2>
      <span className="h-px min-w-4 flex-1 self-center bg-[var(--border)]" aria-hidden="true" />
      {hint && <span className="text-[12px] text-[var(--text-muted)]">{hint}</span>}
    </header>
  );
}

// Case à cocher : 44 px de zone tactile pour 22 px visibles.
export function Check({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`-m-[11px] grid size-11 shrink-0 place-items-center ${FOCUS}`}
    >
      <span
        className={`grid size-[22px] place-items-center rounded-[var(--radius-sm)] border transition-colors ${
          checked
            ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
            : 'border-[var(--border-strong)] bg-[var(--surface)] text-transparent hover:border-[var(--accent)]'
        }`}
      >
        <IconCheck />
      </span>
    </button>
  );
}

export function PinButton({ pinned, disabled, onClick, title }) {
  return (
    <button
      type="button"
      aria-pressed={pinned}
      aria-label={pinned ? `Retirer des priorités : ${title}` : `Épingler comme priorité : ${title}`}
      disabled={disabled && !pinned}
      onClick={onClick}
      title={disabled && !pinned ? '3 priorités au maximum' : pinned ? 'Retirer des priorités' : 'Épingler comme priorité'}
      className={`-m-[11px] grid size-11 shrink-0 place-items-center disabled:cursor-not-allowed disabled:opacity-35 ${FOCUS} ${
        pinned ? 'text-[var(--accent)]' : 'text-[var(--text-faint)] hover:text-[var(--text)]'
      }`}
    >
      <IconPin filled={pinned} />
    </button>
  );
}

// Ligne de tâche : case, titre, mention d'échéance, épingle.
export function TaskRow({ task, done, onToggle, pinned, canPin, onPin, note }) {
  return (
    <li className="flex items-start gap-3 py-1.5">
      <span className="mt-0.5 flex">
        <Check checked={done} onChange={onToggle} label={`${done ? 'Rouvrir' : 'Marquer fait'} : ${task.title}`} />
      </span>
      <div className="min-w-0 flex-1">
        <span className={`block text-[14px] leading-snug [overflow-wrap:anywhere] ${done ? 'text-[var(--text-faint)] line-through' : 'text-[var(--text)]'}`}>
          {task.title}
        </span>
        {note && !done && (
          <span className={`mt-0.5 block text-[12px] ${note.late ? 'text-[var(--warning)]' : 'text-[var(--text-muted)]'}`}>{note.text}</span>
        )}
      </div>
      {onPin && <PinButton pinned={pinned} disabled={!canPin} onClick={onPin} title={task.title} />}
    </li>
  );
}

// Volet replié du chapitre 05.
export function Fold({ id, title, count, tone, open, onToggle, children }) {
  return (
    <div className="border-t border-[var(--border)] first:border-t-0">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`fold-${id}`}
          onClick={onToggle}
          className={`flex min-h-12 w-full items-center gap-3 py-2 text-left ${FOCUS}`}
        >
          <span className="flex-1 text-[15px] font-medium text-[var(--text)]">{title}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[12px] [font-family:var(--font-mono)] ${
              tone === 'warning' ? 'bg-[var(--surface-2)] text-[var(--warning)]' : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
            }`}
          >
            {count}
          </span>
          <IconChevron className={`size-4 text-[var(--text-muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </h3>
      {open && (
        <div id={`fold-${id}`} className="pb-4">
          {children}
        </div>
      )}
    </div>
  );
}

export const LinkButton = ({ onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`mt-2 min-h-9 text-[13px] text-[var(--accent)] underline underline-offset-2 ${FOCUS}`}
  >
    {children}
  </button>
);
