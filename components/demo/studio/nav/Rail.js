'use client';

import { useEffect, useRef, useState } from 'react';
import { FOCUS, FOCUS_IN, Icon, Mark, arrowNav, trapTab } from './shared';

// Navigation « Rail » : une barre latérale gauche, repliable en icônes.
// Sur téléphone : en-tête fin et tiroir. Pas de compteurs : cette navigation ne reçoit pas les
// données, on n'invente donc aucun chiffre.
export default function NavRail({ sections, current, onNavigate, orgName, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const burger = useRef(null);
  const drawerEl = useRef(null);
  const active = sections.find((s) => s.id === current) ?? sections[0];

  useEffect(() => {
    if (!drawer) return undefined;
    const el = drawerEl.current;
    (el?.querySelector('[data-nav-item][aria-current]') ?? el?.querySelector('button'))?.focus();
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

  const pickFromDrawer = (id) => {
    onNavigate(id);
    setDrawer(false);
    burger.current?.focus();
  };

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      {/* Grand écran : le rail */}
      <aside
        aria-label="Navigation principale"
        className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-[color:var(--border)] bg-[color:var(--surface)] transition-[width] duration-200 motion-reduce:transition-none md:flex ${collapsed ? 'w-[4.25rem]' : 'w-60'}`}
      >
        <div className={`flex items-center gap-3 px-3.5 pt-5 pb-4 ${collapsed ? 'justify-center' : ''}`}>
          <Mark className="size-9" />
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-[15px] leading-tight font-semibold [font-family:var(--font-display)]">Pilotage</div>
              <div className="mt-0.5 truncate text-[11px] text-[color:var(--text-faint)]">Organisation : {orgName}</div>
            </div>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto px-2.5 py-2" aria-label="Sections">
          <RailItems sections={sections} current={current} compact={collapsed} onPick={onNavigate} />
        </nav>
        <div className="border-t border-[color:var(--border)] p-2.5">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Déplier le menu' : 'Replier le menu'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Déplier le menu' : 'Replier le menu'}
            className={`flex w-full items-center gap-3 rounded-[var(--radius-sm)] py-2 text-[13px] text-[color:var(--text-faint)] transition-colors hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text)] ${collapsed ? 'justify-center' : 'px-3'} ${FOCUS_IN}`}
          >
            <Icon id="chevron" className={`size-[18px] transition-transform motion-reduce:transition-none ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && <span>Replier</span>}
          </button>
        </div>
      </aside>

      {/* Téléphone : en-tête fin */}
      <header className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-[color:var(--border)] bg-[color:var(--surface)] px-2 md:hidden">
        <button
          ref={burger}
          type="button"
          onClick={() => setDrawer(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={drawer}
          aria-controls="rail-tiroir"
          className={`grid size-10 place-items-center rounded-[var(--radius-sm)] text-[color:var(--text)] hover:bg-[color:var(--surface-2)] ${FOCUS_IN}`}
        >
          <Icon id="menu" className="size-5" />
        </button>
        <div className="min-w-0 flex-1 truncate text-[15px] font-semibold [font-family:var(--font-display)]">{active.label}</div>
        <div className="max-w-[45%] truncate pr-2 text-[11px] text-[color:var(--text-faint)]">Organisation : {orgName}</div>
      </header>

      {drawer && (
        <div className="fixed inset-0 z-[70] md:hidden">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Fermer le menu"
            onClick={() => {
              setDrawer(false);
              burger.current?.focus();
            }}
            className="absolute inset-0 bg-[color:var(--bg)]/75 backdrop-blur-[2px]"
          />
          <div
            ref={drawerEl}
            id="rail-tiroir"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-y-0 left-0 flex w-[17rem] max-w-[85vw] flex-col border-r border-[color:var(--border-strong)] bg-[color:var(--surface)]"
            style={{ boxShadow: 'var(--shadow)' }}
          >
            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
              <Mark className="size-9" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] leading-tight font-semibold [font-family:var(--font-display)]">Pilotage</div>
                <div className="mt-0.5 truncate text-[11px] text-[color:var(--text-faint)]">Organisation : {orgName}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDrawer(false);
                  burger.current?.focus();
                }}
                aria-label="Fermer le menu"
                className={`grid size-9 place-items-center rounded-[var(--radius-sm)] text-[color:var(--text-muted)] hover:bg-[color:var(--surface-2)] ${FOCUS_IN}`}
              >
                <Icon id="close" className="size-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Sections">
              <RailItems sections={sections} current={current} onPick={pickFromDrawer} />
            </nav>
          </div>
        </div>
      )}

      <main id="studio-contenu" className="min-w-0 flex-1 px-4 pt-5 pb-32 sm:px-6 md:px-8 md:pt-8 md:pb-16">
        <div className="mx-auto w-full max-w-[100rem]">{children}</div>
      </main>
    </div>
  );
}

function RailItems({ sections, current, compact = false, onPick }) {
  return (
    <ul className="flex flex-col gap-0.5" onKeyDown={(e) => arrowNav(e, 'v')}>
      {sections.map((s) => {
        const on = s.id === current;
        return (
          <li key={s.id}>
            <button
              type="button"
              data-nav-item
              aria-current={on ? 'page' : undefined}
              title={compact ? s.label : undefined}
              onClick={() => onPick(s.id)}
              className={`relative flex w-full items-center gap-3 rounded-[var(--radius-sm)] py-2 text-left text-[13.5px] transition-colors ${compact ? 'justify-center px-0' : 'px-3'} ${
                on
                  ? 'bg-[color:var(--accent-soft)] font-medium text-[color:var(--text)]'
                  : 'text-[color:var(--text-muted)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text)]'
              } ${FOCUS}`}
            >
              {on && <span aria-hidden="true" className="absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-full bg-[color:var(--accent)]" />}
              <Icon id={s.id} className={`size-[18px] ${on ? 'text-[color:var(--accent)]' : ''}`} />
              <span className={compact ? 'sr-only' : 'truncate'}>{s.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
