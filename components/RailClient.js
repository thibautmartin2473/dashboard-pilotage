'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { buildAppTiles, initials, tileStyle } from '@/lib/app-logos';

// Anneau de focus du rail : bleu encre, il reste visible sur le verre.
const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--focus)]';

// Rail en verre, icônes seules au trait ; il s'élargit avec les libellés au survol de la souris
// (ou au focus clavier). Sur téléphone, un tiroir en verre montre les libellés en permanence.
const ICONS = {
  cockpit: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  ranger: (
    <>
      <path d="M4 13h4l1.5 3h5L16 13h4" />
      <path d="M5.5 6h13L20 13v5.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5V13Z" />
    </>
  ),
  agenda: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  mails: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  idees: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z" />
    </>
  ),
  apps: (
    <path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h4l2 2.5h8A1.5 1.5 0 0 1 20.5 10v8A1.5 1.5 0 0 1 19 19.5H5A1.5 1.5 0 0 1 3.5 18Z" />
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
};

function Icon({ id, className = 'size-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {ICONS[id]}
    </svg>
  );
}

const MAIN = [
  { href: '/', label: 'Cockpit', icon: 'cockpit', match: (p) => p === '/' },
  { href: '/#a-ranger', label: 'À ranger', icon: 'ranger' },
  { href: '/#agenda', label: 'Agenda', icon: 'agenda' },
  { href: '/#mails', label: 'Mails', icon: 'mails' },
  { href: '/brain', label: 'Idées', icon: 'idees', match: (p) => p.startsWith('/brain') },
];
const APPS_LINK = { href: '/apps', label: 'Apps et projets', icon: 'apps', match: (p) => p.startsWith('/apps') || p.startsWith('/projects') };

// ---- Symbole « anneau horaire », vivant : dessiné d'après les événements du jour ----
// Anneau blanc sur bleu acier. Journée de 7 h à 23 h sur 340 degrés (la nuit en haut) ; plages en arcs
// épais, tâches en arcs fins, aiguille = maintenant ; ce qui est passé est atténué. Un fil discret garde
// l'anneau lisible les jours vides.
const DAY0 = 420;
const DAY1 = 1380;
const WHITE = 'var(--action-text)';
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const angleOf = (m) => -80 + 340 * clamp01((m - DAY0) / (DAY1 - DAY0));
const rnd = (n) => Math.round(n * 100) / 100;
const pol = (r, a) => [rnd(32 + r * Math.cos((a * Math.PI) / 180)), rnd(32 + r * Math.sin((a * Math.PI) / 180))];
const arcPath = (r, a0, a1) => {
  const [x0, y0] = pol(r, a0);
  const [x1, y1] = pol(r, a1);
  return `M${x0} ${y0}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
};

// « Maintenant » en minutes depuis minuit (Paris), rafraîchi chaque minute ; null au rendu serveur.
const clockListeners = new Set();
let clockTimer = null;
function subscribeClock(cb) {
  clockListeners.add(cb);
  if (!clockTimer) clockTimer = setInterval(() => clockListeners.forEach((l) => l()), 30000);
  return () => {
    clockListeners.delete(cb);
    if (clockListeners.size === 0 && clockTimer) {
      clearInterval(clockTimer);
      clockTimer = null;
    }
  };
}
function readClock() {
  const parts = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return get('hour') * 60 + get('minute');
}

function Mark({ day, className = 'size-10' }) {
  const now = useSyncExternalStore(subscribeClock, readClock, () => null);
  const r = 24;
  const seg = (s, e, key, opacity, sw) => {
    const a0 = angleOf(Math.max(s, DAY0)) + 1.5;
    const a1 = angleOf(Math.min(e, DAY1)) - 1.5;
    if (a1 <= a0 + 3) return null;
    return <path key={key} d={arcPath(r, a0, a1)} fill="none" stroke={WHITE} strokeWidth={sw} opacity={now != null && e <= now ? opacity * 0.5 : opacity} />;
  };
  const [hx0, hy0] = pol(8, angleOf(now ?? 720));
  const [hx1, hy1] = pol(16, angleOf(now ?? 720));
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={`shrink-0 ${className}`}>
      <rect width="64" height="64" rx="14" fill="var(--action)" />
      <circle cx="32" cy="32" r={r} fill="none" stroke={WHITE} strokeWidth="1.5" opacity="0.5" />
      {(day?.plages ?? []).map((pl, i) => seg(pl[0], pl[1], `p${i}`, 1, 11))}
      {(day?.taches ?? []).map((t, i) => seg(t[0], t[1], `t${i}`, 0.7, 6))}
      {now != null && <path d={`M${hx0} ${hy0}L${hx1} ${hy1}`} stroke={WHITE} strokeWidth="4" fill="none" />}
    </svg>
  );
}

// Libellé qui apparaît quand le rail s'élargit (survol ou focus) ; toujours visible dans le tiroir.
const LABEL_RAIL =
  'whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover/rail:opacity-100 group-focus-within/rail:opacity-100 motion-reduce:transition-none';

function Brand({ day, markClass, textClass, label = '' }) {
  return (
    <>
      <Mark day={day} className={markClass} />
      <span className={`font-semibold leading-none tracking-tight text-[var(--glass-text)] ${textClass} ${label}`}>Cadran</span>
    </>
  );
}

// ---- Apps en petites icônes (lecture seule : app_links et projets, comme la grille « Mes apps ») ----
const STATUS_WORD = { blocked: 'Bloqué', in_progress: 'En cours' };

function AppRow({ tile, onPick, touch, rail }) {
  const word = STATUS_WORD[tile.status];
  const label = word ? `${tile.name} (${word})` : tile.name;
  const dot = tile.status === 'blocked' ? 'var(--late)' : tile.status === 'in_progress' ? 'var(--pending)' : null;
  const icon = (
    <span
      className="relative flex size-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold"
      style={tile.logo ? { background: 'var(--glass-strong)' } : tileStyle(tile.name)}
    >
      {tile.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={tile.logo} alt="" width={28} height={28} className="size-7 rounded-lg object-cover" />
      ) : (
        initials(tile.name)
      )}
      {dot && <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-[var(--glass-strong)]" style={{ background: dot }} />}
    </span>
  );
  const inner = (
    <>
      {icon}
      <span className={`min-w-0 truncate text-[13px] ${rail ? LABEL_RAIL : ''}`}>{word ? `${tile.name} (${word.toLowerCase()})` : tile.name}</span>
    </>
  );
  const className = `flex items-center gap-3 rounded-xl px-[14px] text-[var(--glass-muted)] hover:bg-[var(--glass-hover)] hover:text-[var(--glass-text)] ${touch ? 'min-h-11' : 'min-h-9'} ${FOCUS}`;
  return tile.external ? (
    <a href={tile.href} target="_blank" rel="noopener noreferrer" title={label} aria-label={label} onClick={onPick} className={className}>
      {inner}
    </a>
  ) : (
    <Link href={tile.href} title={label} aria-label={label} onClick={onPick} className={className}>
      {inner}
    </Link>
  );
}

function Items({ tiles, pathname, onPick, touch = false, rail = false }) {
  const row = (active) =>
    `flex items-center gap-3 rounded-xl px-[14px] text-[14px] transition-colors ${touch ? 'min-h-11' : 'min-h-10'} ${FOCUS} ${
      active ? 'bg-[var(--glass-active)] font-semibold text-[var(--glass-text)]' : 'text-[var(--glass-muted)] hover:bg-[var(--glass-hover)] hover:text-[var(--glass-text)]'
    }`;
  const labelClass = rail ? LABEL_RAIL : '';
  const link = (it) => {
    const active = it.match ? it.match(pathname) : false;
    return (
      <li key={it.label}>
        <Link href={it.href} onClick={onPick} aria-current={active ? 'page' : undefined} aria-label={it.label} title={rail ? it.label : undefined} className={row(active)}>
          <Icon id={it.icon} />
          <span className={`truncate ${labelClass}`}>{it.label}</span>
        </Link>
      </li>
    );
  };
  return (
    <div className="flex min-h-full flex-col">
      <ul className="flex flex-col gap-0.5">{MAIN.map(link)}</ul>
      <ul className="mt-auto flex flex-col gap-0.5 pt-4">
        <li className="mx-3 mb-1 border-t border-[var(--glass-border)]" aria-hidden="true" />
        {tiles.map((t) => (
          <li key={t.key}>
            <AppRow tile={t} onPick={onPick} touch={touch} rail={rail} />
          </li>
        ))}
        {link(APPS_LINK)}
      </ul>
    </div>
  );
}

function trapTab(e, container) {
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

export default function RailClient({ projects, apps = [], day }) {
  const pathname = usePathname() || '/';
  const tiles = buildAppTiles(apps, projects);
  const [drawer, setDrawer] = useState(false);
  const burger = useRef(null);
  const drawerEl = useRef(null);

  useEffect(() => {
    if (!drawer) return undefined;
    const el = drawerEl.current;
    (el?.querySelector('[aria-current]') ?? el?.querySelector('a, button'))?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setDrawer(false);
        burger.current?.focus();
      } else {
        trapTab(e, el);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer]);

  const close = () => {
    setDrawer(false);
    burger.current?.focus();
  };

  return (
    <>
      {/* Réserve 4 rem dans la mise en page ; le rail lui-même s'élargit par-dessus le contenu au survol. */}
      <div className="sticky top-0 z-40 hidden h-dvh w-16 shrink-0 md:block">
        <aside
          aria-label="Navigation principale"
          className="glass group/rail absolute inset-y-0 left-0 flex w-16 flex-col overflow-hidden border-y-0 border-l-0 transition-[width] duration-150 hover:w-56 focus-within:w-56 motion-reduce:transition-none"
        >
          <Link href="/" className={`flex items-center gap-3 px-[14px] pt-5 pb-4 ${FOCUS}`} aria-label="Cadran, retour au Cockpit">
            <Brand day={day} markClass="size-9" textClass="text-[20px]" label={LABEL_RAIL} />
          </Link>
          <nav className="flex-1 overflow-x-hidden overflow-y-auto px-2 pb-3" aria-label="Sections">
            <Items tiles={tiles} pathname={pathname} rail />
          </nav>
        </aside>
      </div>

      <header className="glass sticky top-0 z-30 flex h-12 items-center gap-2 border-x-0 border-t-0 px-2 md:hidden">
        <button
          ref={burger}
          type="button"
          onClick={() => setDrawer(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={drawer}
          aria-controls="rail-tiroir"
          className={`grid size-11 place-items-center rounded-xl text-[var(--glass-text)] hover:bg-[var(--glass-hover)] ${FOCUS}`}
        >
          <Icon id="menu" className="size-5" />
        </button>
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <Brand day={day} markClass="size-7" textClass="text-[18px]" />
        </span>
      </header>

      {drawer && (
        <div className="fixed inset-0 z-[70] md:hidden">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Fermer le menu"
            onClick={close}
            className="absolute inset-0 bg-[var(--ink)]/30 backdrop-blur-[2px]"
          />
          <div
            ref={drawerEl}
            id="rail-tiroir"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="glass-strong absolute inset-y-0 left-0 flex w-[17rem] max-w-[85vw] flex-col border-y-0 border-l-0 shadow-2xl"
          >
            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
              <span className="flex min-w-0 flex-1 items-center gap-3">
                <Brand day={day} markClass="size-9" textClass="text-[20px]" />
              </span>
              <button
                type="button"
                onClick={close}
                aria-label="Fermer le menu"
                className={`grid size-11 place-items-center rounded-xl text-[var(--glass-muted)] hover:bg-[var(--glass-hover)] ${FOCUS}`}
              >
                <Icon id="close" className="size-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Sections">
              <Items tiles={tiles} pathname={pathname} touch onPick={() => setDrawer(false)} />
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
