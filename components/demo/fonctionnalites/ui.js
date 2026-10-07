'use client';

// Petits composants de la démo : uniquement des jetons de charte (var(--...)), jamais de couleur Tailwind.

export const cx = (...a) => a.filter(Boolean).join(' ');

const TONE = {
  default:
    'border-[var(--border-strong)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--accent)]',
  primary: 'border-transparent bg-[var(--accent)] text-[var(--accent-contrast)] hover:brightness-110',
  quiet: 'border-transparent bg-transparent text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]',
  danger:
    'border-[color-mix(in_srgb,var(--danger)_45%,transparent)] bg-transparent text-[var(--danger)] hover:bg-[color-mix(in_srgb,var(--danger)_12%,transparent)]',
};

export function Btn({ children, tone = 'default', pressed, className = '', type = 'button', ...rest }) {
  const on = pressed ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text)]' : TONE[tone];
  return (
    <button
      type={type}
      aria-pressed={pressed === undefined ? undefined : pressed}
      className={cx(
        'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border px-3 text-[13px] leading-tight font-medium select-none sm:min-h-8',
        'transition-colors duration-100 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-40',
        on,
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Kbd({ children }) {
  return (
    <kbd className="rounded-[4px] border border-[var(--border-strong)] bg-[var(--surface)] px-1 py-px font-mono text-[10px] leading-none text-[var(--text-muted)]">
      {children}
    </kbd>
  );
}

const TAGS = {
  muted: 'text-[var(--text-muted)] border-[var(--border-strong)]',
  accent: 'text-[var(--accent)] border-[color-mix(in_srgb,var(--accent)_45%,transparent)]',
  danger: 'text-[var(--danger)] border-[color-mix(in_srgb,var(--danger)_45%,transparent)]',
  warning: 'text-[var(--warning)] border-[color-mix(in_srgb,var(--warning)_45%,transparent)]',
  success: 'text-[var(--success)] border-[color-mix(in_srgb,var(--success)_45%,transparent)]',
};
export function Tag({ children, tone = 'muted', dashed = false, className = '' }) {
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center rounded-[var(--radius-sm)] border px-1.5 py-0.5 font-mono text-[10.5px] leading-none whitespace-nowrap',
        dashed ? 'border-dashed' : '',
        TAGS[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Label({ children, className = '' }) {
  return (
    <span className={cx('font-mono text-[10.5px] leading-none tracking-[0.08em] text-[var(--text-muted)] uppercase', className)}>
      {children}
    </span>
  );
}

export function Stat({ label, value, sub, tone }) {
  const color = tone === 'danger' ? 'text-[var(--danger)]' : tone === 'warning' ? 'text-[var(--warning)]' : tone === 'accent' ? 'text-[var(--accent)]' : 'text-[var(--text)]';
  return (
    <div className="min-w-0">
      <Label>{label}</Label>
      <div className={cx('mt-1.5 font-mono text-xl leading-none tabular-nums sm:text-2xl', color)}>{value}</div>
      {sub && <div className="mt-1 text-[11.5px] leading-snug text-[var(--text-muted)]">{sub}</div>}
    </div>
  );
}

// Cadre sobre : un seul niveau, jamais de carte dans une carte.
export function Frame({ children, className = '' }) {
  return (
    <div className={cx('rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]', className)}>{children}</div>
  );
}

// En-tête commun des 4 panneaux : la règle, le problème réglé, la référence, la preuve, l'effort.
export function PanelHead({ n, title, rule, problem, reference, proof, effort, criteria, lib }) {
  return (
    <header className="border-b border-[var(--border)] px-4 py-4 sm:px-5">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-sm text-[var(--accent)] tabular-nums">{String(n).padStart(2, '0')}</span>
        <h2 className="min-w-0 text-lg leading-tight font-semibold tracking-[-0.01em] [font-family:var(--font-display)]">{title}</h2>
      </div>
      <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-[var(--text-muted)]">{rule}</p>
      <dl className="mt-3 grid gap-x-6 gap-y-2 text-[12px] leading-snug sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Problème réglé', problem],
          ['Référence', reference],
          ['Preuve', proof],
          ['Effort', effort],
        ].map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="font-mono text-[10px] tracking-[0.08em] text-[var(--text-faint)] uppercase">{k}</dt>
            <dd className="mt-0.5 text-[var(--text-muted)]">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[11.5px] leading-snug text-[var(--text-faint)]">
        Critères de la grille : {criteria}. En vrai : {lib}
      </p>
    </header>
  );
}

// Phrase équivalente : chaque geste est aussi une phrase dite à Claude (il pilote par la conversation).
export function Phrase({ children }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-[13px] sm:px-5">
      <Label>Ou dis-le à Claude</Label>
      <span className="min-w-0 text-[var(--text)] [font-family:var(--font-mono)] text-[12.5px] leading-relaxed">{children}</span>
    </div>
  );
}

// Bande de cellules de 15 min : fait (plein), posé (pointillé), reste (vide).
export function Cells({ total, done, planned, size = 'md', label }) {
  const n = Math.max(1, total);
  const dim = size === 'sm' ? 'h-2.5 w-2.5' : n > 16 ? 'h-5 w-4' : 'h-6 w-6';
  return (
    <div role="img" aria-label={label} className="flex flex-wrap gap-[3px]">
      {Array.from({ length: n }, (_, i) => {
        const state = i < done ? 'done' : i < done + planned ? 'planned' : 'todo';
        return (
          <span
            key={i}
            className={cx(
              dim,
              'rounded-[3px] border transition-colors duration-100 motion-reduce:transition-none',
              state === 'done' && 'border-[var(--accent)] bg-[var(--accent)]',
              state === 'planned' && 'border-dashed border-[var(--cat-tache)] bg-[color-mix(in_srgb,var(--cat-tache)_22%,transparent)]',
              state === 'todo' && 'border-[var(--border-strong)] bg-transparent'
            )}
          />
        );
      })}
    </div>
  );
}
