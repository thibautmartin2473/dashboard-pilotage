'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-accent)]';

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
];

function Mark({ className = 'size-9' }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent)] text-[13px] font-bold text-zinc-950 ${className}`}
    >
      P
    </span>
  );
}

function Items({ projects, pathname, compact, openProjects, setOpenProjects, onPick }) {
  const row = (active) =>
    `flex items-center gap-3 rounded-md py-2 text-[14px] transition-colors ${FOCUS} ${
      compact ? 'justify-center px-0' : 'px-3'
    } ${active ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100'}`;
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
            <div className="mx-2 border-t border-zinc-800" aria-hidden="true" />
          ) : (
            <button
              type="button"
              onClick={() => setOpenProjects((o) => !o)}
              aria-expanded={openProjects}
              className={`flex w-full items-center justify-between rounded-md px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500 hover:text-zinc-200 ${FOCUS}`}
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

export default function RailClient({ projects }) {
  const pathname = usePathname() || '/';
  const [openProjects, setOpenProjects] = useState(true);
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
        className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-zinc-800 bg-zinc-900 transition-[width] duration-200 motion-reduce:transition-none md:flex ${
          collapsed ? 'w-[4.25rem]' : 'w-56'
        }`}
      >
        <Link
          href="/"
          className={`flex items-center gap-3 px-3.5 pt-5 pb-4 ${collapsed ? 'justify-center' : ''} ${FOCUS}`}
          aria-label="Pilotage, retour au Cockpit"
        >
          <Mark />
          {!collapsed && <span className="truncate text-[15px] font-semibold tracking-tight text-zinc-100">Pilotage</span>}
        </Link>
        <nav className="flex-1 overflow-y-auto px-2.5 py-2" aria-label="Sections">
          <Items
            projects={projects}
            pathname={pathname}
            compact={collapsed}
            openProjects={openProjects}
            setOpenProjects={setOpenProjects}
          />
        </nav>
        <div className="border-t border-zinc-800 p-2.5">
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? 'Déplier le menu' : 'Replier le menu'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Déplier le menu' : 'Replier le menu'}
            className={`flex w-full items-center gap-3 rounded-md py-2 text-[13px] text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 ${
              collapsed ? 'justify-center' : 'px-3'
            } ${FOCUS}`}
          >
            <Icon id="chevron" className={`size-[18px] transition-transform motion-reduce:transition-none ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && <span>Replier</span>}
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-2 md:hidden">
        <button
          ref={burger}
          type="button"
          onClick={() => setDrawer(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={drawer}
          aria-controls="rail-tiroir"
          className={`grid size-10 place-items-center rounded-md text-zinc-100 hover:bg-zinc-800 ${FOCUS}`}
        >
          <Icon id="menu" className="size-5" />
        </button>
        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight text-zinc-100">Pilotage</span>
      </header>

      {drawer && (
        <div className="fixed inset-0 z-[70] md:hidden">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Fermer le menu"
            onClick={close}
            className="absolute inset-0 bg-zinc-950/75 backdrop-blur-[2px]"
          />
          <div
            ref={drawerEl}
            id="rail-tiroir"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-y-0 left-0 flex w-[17rem] max-w-[85vw] flex-col border-r border-zinc-700 bg-zinc-900 shadow-2xl"
          >
            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
              <Mark />
              <span className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight text-zinc-100">Pilotage</span>
              <button
                type="button"
                onClick={close}
                aria-label="Fermer le menu"
                className={`grid size-9 place-items-center rounded-md text-zinc-400 hover:bg-zinc-800 ${FOCUS}`}
              >
                <Icon id="close" className="size-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Sections">
              <Items
                projects={projects}
                pathname={pathname}
                compact={false}
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
