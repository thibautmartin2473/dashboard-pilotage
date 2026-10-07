'use client';

// Propriétaire : agent « chartes ». Petit kit de composants des vues communes :
// uniquement des jetons var(--...) du contrat (STUDIO.md) et les jetons de kit --k-*.
// Chaque charte en tire un rendu différent sans que les vues changent.

export const TONES = {
  danger: 'var(--danger)',
  warning: 'var(--warning)',
  success: 'var(--success)',
  accent: 'var(--accent)',
  muted: 'var(--text-muted)',
};

const toneStyle = (tone) => ({
  color: TONES[tone] ?? TONES.muted,
  background: `color-mix(in srgb, ${TONES[tone] ?? TONES.muted} 12%, transparent)`,
  borderColor: `color-mix(in srgb, ${TONES[tone] ?? TONES.muted} 35%, transparent)`,
});

// Jeton de catégorie d'agenda : 11 = cours, kind « tache » = travail, le reste = autre.
export const catVar = (cat) => (cat?.key === '11' ? 'var(--cat-cours)' : cat?.kind === 'tache' ? 'var(--cat-tache)' : 'var(--cat-autre)');

const LABEL =
  'text-[11px] leading-none [font-weight:var(--k-label-weight)] [letter-spacing:var(--k-label-tracking)] [text-transform:var(--k-label-case)]';

export function Label({ children, accent = false, className = '' }) {
  return <span className={`${LABEL} ${accent ? 'text-[color:var(--accent)]' : 'text-[color:var(--text-muted)]'} ${className}`}>{children}</span>;
}

// Page : en-tête (petit libellé, grand titre, ligne de contexte) puis contenu.
export function Page({ eyebrow, title, lead, aside, children }) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-8 pb-28 sm:px-8 sm:pt-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-[color:var(--border-strong)] pb-5">
        <div className="min-w-0">
          {eyebrow && <Label>{eyebrow}</Label>}
          <h1 className="mt-2 text-[1.75rem] leading-[1.1] [font-family:var(--font-display)] [font-weight:var(--k-title-weight)] [font-style:var(--k-title-style)] [letter-spacing:var(--k-title-tracking)] text-[color:var(--text)] sm:text-4xl">
            {title}
          </h1>
          {lead && <p className="mt-2 max-w-prose text-sm leading-relaxed text-[color:var(--text-muted)]">{lead}</p>}
        </div>
        {aside}
      </header>
      <div className="flex flex-col [gap:calc(var(--k-gap)*2)]">{children}</div>
    </div>
  );
}

// Groupe : titre, compteur, puis contenu dans un cadre.
export function Group({ title, count, tone, hint, children, flush = false }) {
  return (
    <section>
      <div className="mb-3 flex items-baseline gap-3">
        <h2 className="text-lg leading-tight [font-family:var(--font-display)] [font-weight:var(--k-title-weight)] [letter-spacing:var(--k-title-tracking)] text-[color:var(--text)]">
          {title}
        </h2>
        {count !== undefined && <Pill tone={tone}>{count}</Pill>}
        {hint && <span className="ml-auto text-xs text-[color:var(--text-faint)]">{hint}</span>}
      </div>
      {flush ? children : <Card>{children}</Card>}
    </section>
  );
}

export function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-[var(--radius)] border border-[color:var(--border)] bg-[var(--surface)] shadow-[var(--shadow)] ${className}`}
    >
      {children}
    </div>
  );
}

// Liste à filets : chaque enfant (Row) est séparé du suivant par un filet fin.
export function Rows({ children, className = '' }) {
  return <ul className={`divide-y divide-[color:var(--border)] ${className}`}>{children}</ul>;
}

export function Row({ children, className = '' }) {
  return <li className={`px-4 py-3 sm:px-5 ${className}`}>{children}</li>;
}

export function Pill({ children, tone = 'muted', className = '' }) {
  return (
    <span
      style={toneStyle(tone)}
      className={`inline-flex shrink-0 items-center rounded-[var(--radius-sm)] border px-1.5 py-0.5 text-[11px] leading-none font-medium whitespace-nowrap ${className}`}
    >
      {children}
    </span>
  );
}

export function Dot({ color, className = '' }) {
  return <span aria-hidden="true" style={{ background: color }} className={`inline-block size-2 shrink-0 rounded-full ${className}`} />;
}

export function Empty({ children }) {
  return <p className="px-4 py-6 text-center text-sm text-[color:var(--text-muted)] sm:px-5">{children}</p>;
}

export function Button({ children, onClick, tone = 'neutral', disabled = false, className = '', ...rest }) {
  const style =
    tone === 'accent'
      ? 'border-[color:var(--accent)] bg-[var(--accent)] text-[color:var(--accent-contrast)]'
      : 'border-[color:var(--border-strong)] bg-[var(--surface)] text-[color:var(--text)] hover:bg-[var(--surface-2)]';
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-8 items-center justify-center rounded-[var(--radius-sm)] border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${style} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

// Case à cocher : état local, le parent journalise le geste.
export function Check({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className="mt-0.5 inline-flex size-[18px] shrink-0 items-center justify-center rounded-[calc(var(--radius-sm)*0.6)] border border-[color:var(--border-strong)] bg-[var(--surface)] transition-colors aria-checked:border-[color:var(--accent)] aria-checked:bg-[var(--accent)]"
    >
      {checked && (
        <svg viewBox="0 0 16 16" className="size-3 text-[color:var(--accent-contrast)]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3.5 8.5l3 3 6-7" />
        </svg>
      )}
    </button>
  );
}

// Bouton « Afficher les N autres » : borné pour que les longues listes restent lisibles.
export function More({ open, hidden, onToggle }) {
  if (hidden <= 0 && !open) return null;
  return (
    <div className="border-t border-[color:var(--border)] px-4 py-2 sm:px-5">
      <button type="button" onClick={onToggle} className="text-xs font-medium text-[color:var(--accent)] underline-offset-2 hover:underline">
        {open ? 'Replier la liste' : `Afficher les ${hidden} autres`}
      </button>
    </div>
  );
}

export function ArrowOut({ className = 'size-3.5' }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3.5H3.5v9h9V10M9 3.5h3.5V7M12.5 3.5L7 9" />
    </svg>
  );
}

// ---- Dates (jours AAAA-MM-JJ, calcul en UTC : identique sur le serveur et le navigateur) ----
const dayDate = (day) => new Date(`${day}T12:00:00Z`);
export const weekdayShort = (day) => dayDate(day).toLocaleDateString('fr-FR', { weekday: 'short', timeZone: 'UTC' }).replace('.', '');
export const monthShort = (day) => dayDate(day).toLocaleDateString('fr-FR', { month: 'short', timeZone: 'UTC' }).replace('.', '');
export const dayNumber = (day) => String(Number(day.slice(8, 10)));
export const longDay = (day) => dayDate(day).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
export const ageLabel = (n) => (n <= 0 ? "aujourd'hui" : n === 1 ? 'hier' : `il y a ${n} j`);
export const trunc = (s, n = 60) => (String(s).length > n ? `${String(s).slice(0, n - 1)}…` : String(s));
