'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { buildAppTiles, initials, tileStyle } from '@/lib/app-logos';

// Anneau de focus du cadre : crème sur cuir (un anneau brun serait invisible sur le rail).
const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--focus-on-frame)]';

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
  projet: (
    <path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h4l2 2.5h8A1.5 1.5 0 0 1 20.5 10v8A1.5 1.5 0 0 1 19 19.5H5A1.5 1.5 0 0 1 3.5 18Z" />
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  chevron: <path d="m14.5 6-6 6 6 6" />,
};

function Icon({ id, className = 'size-[18px]' }) {
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
  { href: '/brain', label: 'Idées et notes', icon: 'idees', match: (p) => p.startsWith('/brain') },
  { href: '/apps', label: 'Apps et projets', icon: 'projet', match: (p) => p.startsWith('/apps') },
];

// ---- Symbole « anneau horaire », vivant : dessiné d'après les événements du jour ----
// Journée de 7 h à 23 h sur 340 degrés (la nuit en haut) ; plages en arcs épais, tâches en arcs fins,
// aiguille = maintenant ; ce qui est passé est atténué. Un fil discret garde l'anneau lisible les jours vides.
const DAY0 = 420;
const DAY1 = 1380;
const HAND = 'var(--brand-laiton)';
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
  const seg = (s, e, key, color, sw) => {
    const a0 = angleOf(Math.max(s, DAY0)) + 1.5;
    const a1 = angleOf(Math.min(e, DAY1)) - 1.5;
    if (a1 <= a0 + 3) return null;
    return <path key={key} d={arcPath(r, a0, a1)} fill="none" stroke={color} strokeWidth={sw} opacity={now != null && e <= now ? 0.45 : 1} />;
  };
  const [hx0, hy0] = pol(8, angleOf(now ?? 720));
  const [hx1, hy1] = pol(16, angleOf(now ?? 720));
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={`shrink-0 ${className}`}>
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--frame-text)" strokeWidth="1.5" opacity="0.5" />
      {(day?.plages ?? []).map((pl, i) => seg(pl[0], pl[1], `p${i}`, 'var(--frame-text)', 11))}
      {(day?.taches ?? []).map((t, i) => seg(t[0], t[1], `t${i}`, HAND, 6))}
      {now != null && <path d={`M${hx0} ${hy0}L${hx1} ${hy1}`} stroke={HAND} strokeWidth="4" fill="none" />}
    </svg>
  );
}

function Brand({ day, markClass, textClass }) {
  return (
    <>
      <Mark day={day} className={markClass} />
      <span className={`font-display leading-none tracking-[0.005em] text-[var(--frame-text)] ${textClass}`}>Cadran</span>
    </>
  );
}

// ---- Apps en icônes (lecture seule : app_links et projets, comme la grille « Mes apps ») ----
const STATUS_WORD = { blocked: 'Bloqué', in_progress: 'En cours' };

function AppIcon({ tile, onPick, touch }) {
  const word = STATUS_WORD[tile.status];
  const label = word ? `${tile.name} (${word})` : tile.name;
  const dot = tile.status === 'blocked' ? 'var(--late-on-frame)' : tile.status === 'in_progress' ? 'var(--pending-on-frame)' : null;
  const inner = (
    <span
      className="relative flex size-9 items-center justify-center rounded-lg text-[12px] font-semibold ring-1 ring-[var(--frame-border)]"
      style={tile.logo ? { background: 'var(--frame-surface)' } : tileStyle(tile.name)}
    >
      {tile.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={tile.logo} alt="" width={36} height={36} className="size-9 rounded-lg object-cover" />
      ) : (
        initials(tile.name)
      )}
      {dot && <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-[var(--frame-bg)]" style={{ background: dot }} />}
    </span>
  );
  const className = `flex items-center justify-center rounded-lg ${touch ? 'p-1' : 'p-0.5'} hover:bg-[var(--frame-hover)] ${FOCUS}`;
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

function AppsSection({ tiles, compact, onPick, touch }) {
  if (tiles.length === 0) return null;
  return (
    <section aria-label="Apps" className="mt-3">
      {compact ? (
        <div className="mx-2 mb-2 border-t border-[var(--frame-border)]" aria-hidden="true" />
      ) : (
        <h2 className="px-3 py-1.5 text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--frame-muted)]">Apps</h2>
      )}
      <ul className={compact ? 'flex flex-col items-center gap-1' : 'grid grid-cols-4 gap-1 px-1.5'}>
        {tiles.map((t) => (
          <li key={t.key} className={compact ? '' : 'flex justify-center'}>
            <AppIcon tile={t} onPick={onPick} touch={touch} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Items({ projects, tiles, pathname, compact, openProjects, setOpenProjects, onPick, touch = false }) {
  const row = (active) =>
    `flex items-center gap-3 rounded-md text-[14px] transition-colors ${touch ? 'min-h-11' : 'min-h-9'} ${FOCUS} ${
      compact ? 'justify-center px-0' : 'px-3'
    } ${active ? 'bg-[var(--frame-surface)] font-medium text-[var(--frame-text)]' : 'text-[var(--frame-muted)] hover:bg-[var(--frame-hover)] hover:text-[var(--frame-text)]'}`;
  return (
    <ul className="flex flex-col gap-0.5">
      {MAIN.map((it) => {
        const active = it.match ? it.match(pathname) : false;
        return (
          <li key={it.label}>
            <Link
              href={it.href}
              onClick={onPick}
              aria-current={active ? 'page' : undefined}
              aria-label={compact ? it.label : undefined}
              title={compact ? it.label : undefined}
              className={row(active)}
            >
              <Icon id={it.icon} />
              {!compact && <span className="truncate">{it.label}</span>}
            </Link>
          </li>
        );
      })}
      {projects.length > 0 && (
        <li className="mt-3">
          {compact ? (
            <div className="mx-2 border-t border-[var(--frame-border)]" aria-hidden="true" />
          ) : (
            <button
              type="button"
              onClick={() => setOpenProjects((o) => !o)}
              aria-expanded={openProjects}
              className={`flex w-full items-center justify-between rounded-md px-3 py-1.5 text-[12px] font-medium uppercase tracking-[0.08em] text-[var(--frame-muted)] hover:text-[var(--frame-text)] ${FOCUS}`}
            >
              <span>Projets</span>
              <Icon id="chevron" className={`size-3.5 transition-transform ${openProjects ? '-rotate-90' : 'rotate-180'}`} />
            </button>
          )}
        </li>
      )}
      {(compact || openProjects) &&
        projects.map((p) => {
          const href = `/projects/${p.slug}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={p.slug}>
              <Link
                href={href}
                onClick={onPick}
                aria-current={active ? 'page' : undefined}
                aria-label={compact ? p.name : undefined}
                title={compact ? p.name : undefined}
                className={row(active)}
              >
                {compact ? (
                  <span className="flex size-[18px] items-center justify-center text-[11px] font-semibold">
                    {(p.name || '?').slice(0, 1).toUpperCase()}
                  </span>
                ) : (
                  <Icon id="projet" />
                )}
                {!compact && <span className="truncate">{p.name}</span>}
              </Link>
            </li>
          );
        })}
      <li>
        <AppsSection tiles={tiles} compact={compact} onPick={onPick} touch={touch} />
      </li>
    </ul>
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

const prefListeners = new Set();
function subscribePref(cb) {
  prefListeners.add(cb);
  return () => prefListeners.delete(cb);
}
function readPref() {
  try {
    return localStorage.getItem('rail-replie') === '1';
  } catch {
    return false;
  }
}

export default function RailClient({ projects, apps = [], day }) {
  const pathname = usePathname() || '/';
  const [openProjects, setOpenProjects] = useState(true);
  const tiles = buildAppTiles(apps, projects);
  const [drawer, setDrawer] = useState(false);
  const burger = useRef(null);
  const drawerEl = useRef(null);

  // Préférence mémorisée (localStorage, avec try/catch) ; le rendu serveur est déplié.
  const collapsed = useSyncExternalStore(subscribePref, readPref, () => false);
  const toggle = () => {
    try {
      localStorage.setItem('rail-replie', collapsed ? '0' : '1');
    } catch {}
    prefListeners.forEach((l) => l());
  };

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
      <aside
        aria-label="Navigation principale"
        data-frame
        className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-[var(--frame-border)] bg-[var(--frame-bg)] text-[var(--frame-text)] transition-[width] duration-200 motion-reduce:transition-none md:flex ${
          collapsed ? 'w-[4.25rem]' : 'w-56'
        }`}
      >
        <Link
          href="/"
          className={`flex items-center gap-3 px-3.5 pt-5 pb-4 ${collapsed ? 'justify-center' : ''} ${FOCUS}`}
          aria-label="Cadran, retour au Cockpit"
        >
          {collapsed ? <Mark day={day} className="size-10" /> : <Brand day={day} markClass="size-10" textClass="text-[22px]" />}
        </Link>
        <nav className="flex-1 overflow-y-auto px-2.5 py-2" aria-label="Sections">
          <Items
            projects={projects}
            tiles={tiles}
            pathname={pathname}
            compact={collapsed}
            openProjects={openProjects}
            setOpenProjects={setOpenProjects}
          />
        </nav>
        <div className="border-t border-[var(--frame-border)] p-2.5">
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? 'Déplier le menu' : 'Replier le menu'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Déplier le menu' : 'Replier le menu'}
            className={`flex min-h-9 w-full items-center gap-3 rounded-md text-[13px] text-[var(--frame-muted)] hover:bg-[var(--frame-hover)] hover:text-[var(--frame-text)] ${
              collapsed ? 'justify-center' : 'px-3'
            } ${FOCUS}`}
          >
            <Icon id="chevron" className={`size-[18px] transition-transform motion-reduce:transition-none ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && <span>Replier</span>}
          </button>
        </div>
      </aside>

      <header data-frame className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-[var(--frame-border)] bg-[var(--frame-bg)] px-2 text-[var(--frame-text)] md:hidden">
        <button
          ref={burger}
          type="button"
          onClick={() => setDrawer(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={drawer}
          aria-controls="rail-tiroir"
          className={`grid size-11 place-items-center rounded-md text-[var(--frame-text)] hover:bg-[var(--frame-hover)] ${FOCUS}`}
        >
          <Icon id="menu" className="size-5" />
        </button>
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <Brand day={day} markClass="size-7" textClass="text-[20px]" />
        </span>
      </header>

      {drawer && (
        <div className="fixed inset-0 z-[70] md:hidden">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Fermer le menu"
            onClick={close}
            className="absolute inset-0 bg-[var(--frame-deep)]/70 backdrop-blur-[2px]"
          />
          <div
            ref={drawerEl}
            id="rail-tiroir"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            data-frame
            className="absolute inset-y-0 left-0 flex w-[17rem] max-w-[85vw] flex-col border-r border-[var(--frame-border)] bg-[var(--frame-bg)] text-[var(--frame-text)] shadow-2xl"
          >
            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
              <span className="flex min-w-0 flex-1 items-center gap-3">
                <Brand day={day} markClass="size-10" textClass="text-[22px]" />
              </span>
              <button
                type="button"
                onClick={close}
                aria-label="Fermer le menu"
                className={`grid size-11 place-items-center rounded-md text-[var(--frame-muted)] hover:bg-[var(--frame-hover)] ${FOCUS}`}
              >
                <Icon id="close" className="size-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Sections">
              <Items
                projects={projects}
                tiles={tiles}
                pathname={pathname}
                compact={false}
                touch
                openProjects={openProjects}
                setOpenProjects={setOpenProjects}
                onPick={() => setDrawer(false)}
              />
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
