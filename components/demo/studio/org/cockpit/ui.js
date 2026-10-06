// Petits morceaux visuels partagés par le Cockpit : classes (jetons de charte uniquement) et icônes SVG.

export const CARD =
  'rounded-[var(--radius)] border border-[color:var(--border)] bg-[var(--surface)] [box-shadow:var(--shadow)]';
export const LABEL =
  'text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--text-muted)] [font-family:var(--font-body)]';
export const MONO = '[font-family:var(--font-mono)] tabular-nums';
export const DISPLAY = '[font-family:var(--font-display)]';

export const BTN =
  'inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-[color:var(--border-strong)] bg-[var(--surface)] px-2.5 py-1.5 text-[13px] font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)] disabled:cursor-not-allowed disabled:opacity-50';
export const BTN_SM =
  'inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-[color:var(--border-strong)] bg-[var(--surface)] px-2 py-1 text-[12px] font-medium text-[var(--text)] transition-colors hover:bg-[var(--bg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]';
export const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] border border-[color:var(--accent)] bg-[var(--accent)] px-2.5 py-1.5 text-[13px] font-semibold text-[var(--accent-contrast)] transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)] disabled:cursor-not-allowed disabled:opacity-50';
export const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]';

// Couleur de catégorie : on ne lit que les jetons de la charte (jamais l'hexadécimal de l'agenda).
export function catToken(category) {
  if (category?.kind === 'tache') return '--cat-tache';
  if (category?.key === '11') return '--cat-cours';
  return '--cat-autre';
}
export const catColor = (category) => `var(${catToken(category)})`;
export const tint = (token, pct) => `color-mix(in oklab, var(${token}) ${pct}%, var(--surface))`;

const svg = (children, size = 14) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {children}
  </svg>
);
export const IconGrip = () => (
  <svg width="12" height="14" viewBox="0 0 12 16" fill="currentColor" aria-hidden="true" focusable="false">
    <circle cx="3.5" cy="3" r="1.3" /><circle cx="8.5" cy="3" r="1.3" />
    <circle cx="3.5" cy="8" r="1.3" /><circle cx="8.5" cy="8" r="1.3" />
    <circle cx="3.5" cy="13" r="1.3" /><circle cx="8.5" cy="13" r="1.3" />
  </svg>
);
export const IconChevron = ({ open }) => (
  <span className={`inline-block transition-transform ${open ? 'rotate-180' : ''}`}>{svg(<path d="M3.5 6l4.5 4.5L12.5 6" />)}</span>
);
export const IconLeft = () => svg(<path d="M10 3.5L5.5 8l4.5 4.5" />);
export const IconRight = () => svg(<path d="M6 3.5L10.5 8 6 12.5" />);
export const IconArrow = () => svg(<path d="M3 8h9M8.5 4.5L12 8l-3.5 3.5" />);
export const IconCheck = () => svg(<path d="M3.5 8.5l3 3 6-7" />, 12);
