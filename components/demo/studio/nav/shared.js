// Propriétaire : agent « navigation ». Petits éléments partagés par les quatre navigations :
// icônes en ligne, repère de marque, anneau de focus, navigation aux flèches.

// Anneau de focus visible, toujours en var(--accent). « _IN » : tracé à l'intérieur (listes serrées).
export const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]';
export const FOCUS_IN =
  'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[color:var(--accent)]';

const PATHS = {
  accueil: (
    <>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9.5h13V10" />
      <path d="M10 19.5v-5h4v5" />
    </>
  ),
  agenda: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  taches: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="m8.5 12.2 2.4 2.4 4.6-5" />
    </>
  ),
  echeances: (
    <>
      <path d="M6 21V4" />
      <path d="M6 5h11l-2 4 2 4H6" />
    </>
  ),
  idees: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z" />
    </>
  ),
  mails: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </>
  ),
  apps: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </>
  ),
  revue: (
    <>
      <path d="M4 12a8 8 0 1 0 2.5-5.8" />
      <path d="M4 4v4h4" />
      <path d="M12 8v4l2.5 1.5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  chevron: <path d="m14.5 6-6 6 6 6" />,
  plus: (
    <>
      <circle cx="5.5" cy="12" r="1.3" />
      <circle cx="12" cy="12" r="1.3" />
      <circle cx="18.5" cy="12" r="1.3" />
    </>
  ),
  dot: <circle cx="12" cy="12" r="3" />,
};

export function Icon({ id, className = 'size-4' }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      className={`shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[id] ?? PATHS.dot}
    </svg>
  );
}

// Repère de marque : un carré d'accent avec trois barres.
export function Mark({ className = 'size-8' }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[color:var(--accent)] text-[color:var(--accent-contrast)] ${className}`}
    >
      <svg viewBox="0 0 24 24" className="size-[58%]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M5 17V10M12 17V5M19 17v-4" />
      </svg>
    </span>
  );
}

// Navigation aux flèches dans une liste de boutons marqués data-nav-item.
export function arrowNav(e, axis = 'v') {
  const next = axis === 'v' ? 'ArrowDown' : 'ArrowRight';
  const prev = axis === 'v' ? 'ArrowUp' : 'ArrowLeft';
  if (![next, prev, 'Home', 'End'].includes(e.key)) return;
  const items = [...e.currentTarget.querySelectorAll('[data-nav-item]')];
  if (items.length === 0) return;
  const i = items.indexOf(document.activeElement);
  let to = i;
  if (e.key === next) to = (i + 1) % items.length;
  else if (e.key === prev) to = (i - 1 + items.length) % items.length;
  else if (e.key === 'Home') to = 0;
  else to = items.length - 1;
  e.preventDefault();
  items[to].focus();
}

// Garde le focus dans un conteneur modal (Tab et Maj+Tab bouclent).
export function trapTab(e, container) {
  if (e.key !== 'Tab' || !container) return;
  const f = [...container.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])')].filter(
    (el) => !el.disabled && el.offsetParent !== null,
  );
  if (f.length === 0) return;
  const first = f[0];
  const last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
