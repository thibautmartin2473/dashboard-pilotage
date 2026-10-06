'use client';

// Petites pièces communes du QG. Couleurs, rayons, ombres et polices : jetons var(--...) uniquement.
import { whenLabel, whenTone } from './classify';

export const KIND_TONE = {
  exam: 'var(--danger)',
  test: 'var(--warning)',
  candidature: 'var(--accent)',
  rdv: 'var(--success)',
  admin: 'var(--text-faint)',
};
export const KIND_LABEL = {
  exam: 'Examen',
  test: 'Test',
  candidature: 'Candidature',
  rdv: 'Rendez-vous',
  admin: 'Paiement',
};
export const STAGE_TONE = {
  prep: 'var(--cat-autre)',
  candidature: 'var(--accent)',
  tests: 'var(--warning)',
  entretiens: 'var(--success)',
  clos: 'var(--text-faint)',
};

export const DISPLAY = '[font-family:var(--font-display)]';
export const MONO = '[font-family:var(--font-mono)]';

// Petit libellé en capitales, la signature visuelle du QG.
export function Eyebrow({ children, className = '' }) {
  return (
    <p className={`${MONO} text-[11px] font-medium tracking-[0.14em] text-[var(--text-muted)] uppercase ${className}`}>
      {children}
    </p>
  );
}

export function SectionHead({ index, title, aside }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-[var(--border-strong)] pb-2">
      <h2 className={`${DISPLAY} flex items-baseline gap-3 text-xl leading-tight text-[var(--text)]`}>
        <span className={`${MONO} text-[12px] text-[var(--text-faint)]`}>{index}</span>
        {title}
      </h2>
      {aside ? <div className="text-[12px] text-[var(--text-muted)]">{aside}</div> : null}
    </div>
  );
}

// Compte à rebours : J-3, demain, retard 5 j. Seul le retard et l'urgence prennent une couleur.
export function When({ days, className = '' }) {
  const label = whenLabel(days);
  if (!label) return null;
  const tone = whenTone(days);
  const color = tone === 'late' ? 'var(--danger)' : tone === 'soon' ? 'var(--warning)' : 'var(--text-muted)';
  return (
    <span className={`${MONO} shrink-0 text-[11px] whitespace-nowrap ${className}`} style={{ color }}>
      {label}
    </span>
  );
}

export function Dot({ color, className = '' }) {
  return <span aria-hidden="true" className={`inline-block size-2 shrink-0 rounded-full ${className}`} style={{ background: color }} />;
}

// Bouton discret : un geste simulé, jamais d'écriture réelle.
export function Ghost({ children, onClick, label, pressed, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      className={`inline-flex min-h-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 text-[12px] text-[var(--text)] transition-colors hover:bg-[var(--surface-2)] ${className}`}
    >
      {children}
    </button>
  );
}

export function Block({ title, count, children, className = '' }) {
  return (
    <section className={`min-w-0 ${className}`}>
      <div className="mb-1.5 flex items-center gap-2">
        <Eyebrow>{title}</Eyebrow>
        {count !== undefined ? (
          <span className={`${MONO} rounded-full bg-[var(--surface-2)] px-1.5 text-[11px] text-[var(--text-muted)]`}>{count}</span>
        ) : null}
        <span aria-hidden="true" className="h-px flex-1 bg-[var(--border)]" />
      </div>
      {children}
    </section>
  );
}

export function PersonMark({ person }) {
  if (person) {
    return (
      <span
        aria-hidden="true"
        className={`${MONO} grid size-7 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[10px] font-medium text-[var(--text)]`}
      >
        {person
          .split(/\s+/)
          .slice(0, 2)
          .map((w) => w[0])
          .join('')
          .toUpperCase()}
      </span>
    );
  }
  return (
    <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--surface-2)] text-[var(--text-muted)]">
      <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="8" cy="5.5" r="2.5" />
        <path d="M3 13.5c.6-2.4 2.5-3.5 5-3.5s4.4 1.1 5 3.5" />
      </svg>
    </span>
  );
}

export function Empty({ children }) {
  return <p className="rounded-[var(--radius-sm)] border border-dashed border-[var(--border-strong)] px-3 py-2 text-[12px] text-[var(--text-muted)]">{children}</p>;
}

// Le texte d'une relance, avec le nom de la personne en gras s'il y figure.
export function WithPerson({ text, person }) {
  const i = person ? text.indexOf(person) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <strong className="font-semibold">{person}</strong>
      {text.slice(i + person.length)}
    </>
  );
}
