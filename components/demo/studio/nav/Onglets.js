'use client';

import { useEffect, useRef, useState } from 'react';
import { FOCUS_IN, Icon, Mark, arrowNav } from './shared';

const DOCK_MAX = 5; // entrées visibles dans la barre du bas, « Plus » compris

// Navigation « Onglets » : en-tête à onglets sur grand écran ; sur téléphone, une barre
// flottante en bas (4 entrées + « Plus »), posée au-dessus du bouton « Composer ».
export default function NavOnglets({ sections, current, onNavigate, orgName, children }) {
  const active = sections.find((s) => s.id === current) ?? sections[0];
  const overflow = sections.length > DOCK_MAX;
  const shown = overflow ? sections.slice(0, DOCK_MAX - 1) : sections;
  const hidden = overflow ? sections.slice(DOCK_MAX - 1) : [];
  const [more, setMore] = useState(false);
  const moreBtn = useRef(null);
  const moreList = useRef(null);
  const hiddenActive = hidden.some((s) => s.id === current);

  useEffect(() => {
    if (!more) return undefined;
    (moreList.current?.querySelector('[data-nav-item][aria-current]') ?? moreList.current?.querySelector('button'))?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMore(false);
        moreBtn.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [more]);

  const dockItem = (on) =>
    `flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[calc(var(--radius)-2px)] px-1 text-[11px] leading-none transition-colors ${
      on ? 'bg-[color:var(--accent-soft)] font-semibold text-[color:var(--text)]' : 'text-[color:var(--text-muted)] hover:text-[color:var(--text)]'
    } ${FOCUS_IN}`;

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-[color:var(--border)] bg-[color:var(--surface)]">
        {/* Rangée du haut : marque et organisation */}
        <div className="mx-auto flex h-14 w-full max-w-[100rem] items-center gap-3 px-4 sm:px-6 md:px-8">
          <Mark className="size-8" />
          <div className="min-w-0">
            <div className="text-[15px] leading-tight font-semibold [font-family:var(--font-display)]">Pilotage</div>
            <div className="truncate text-[11px] leading-tight text-[color:var(--text-faint)]">Organisation : {orgName}</div>
          </div>
          <span className="ml-auto max-w-[50%] truncate text-[14px] font-semibold [font-family:var(--font-display)] md:hidden">
            {active.label}
          </span>
        </div>
        {/* Rangée des onglets : grand écran seulement */}
        <nav aria-label="Sections" className="hidden md:block">
          <ul
            className="mx-auto flex w-full max-w-[100rem] gap-1 overflow-x-auto px-8 [scrollbar-width:none]"
            onKeyDown={(e) => arrowNav(e, 'h')}
          >
            {sections.map((s) => {
              const on = s.id === current;
              return (
                <li key={s.id} className="shrink-0">
                  <button
                    type="button"
                    data-nav-item
                    aria-current={on ? 'page' : undefined}
                    onClick={() => onNavigate(s.id)}
                    className={`relative block px-3.5 pt-2 pb-3 text-[13.5px] whitespace-nowrap transition-colors ${
                      on ? 'font-semibold text-[color:var(--text)]' : 'text-[color:var(--text-muted)] hover:text-[color:var(--text)]'
                    } ${FOCUS_IN}`}
                  >
                    {s.label}
                    <span
                      aria-hidden="true"
                      className={`absolute right-3 bottom-0 left-3 h-[3px] rounded-t-full transition-opacity ${on ? 'bg-[color:var(--accent)] opacity-100' : 'bg-[color:var(--border-strong)] opacity-0'}`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <main id="studio-contenu" className="min-w-0 flex-1 px-4 pt-5 pb-40 sm:px-6 md:px-8 md:pt-8 md:pb-16">
        <div className="mx-auto w-full max-w-[100rem]">{children}</div>
      </main>

      {/* Téléphone : barre flottante du bas, remontée pour laisser la place au bouton « Composer » */}
      <nav
        aria-label="Sections"
        className="fixed inset-x-3 bottom-[3.75rem] z-40 md:hidden"
      >
        {more && (
          <>
            <button
              type="button"
              tabIndex={-1}
              aria-label="Fermer"
              onClick={() => setMore(false)}
              className="fixed inset-0 -z-10 cursor-default"
            />
            <ul
              ref={moreList}
              id="onglets-plus"
              onKeyDown={(e) => arrowNav(e, 'v')}
              className="absolute right-0 bottom-full mb-2 w-60 max-w-full rounded-[var(--radius)] border border-[color:var(--border-strong)] bg-[color:var(--surface)] p-1.5"
              style={{ boxShadow: 'var(--shadow)' }}
            >
              {hidden.map((s) => {
                const on = s.id === current;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      data-nav-item
                      aria-current={on ? 'page' : undefined}
                      onClick={() => {
                        onNavigate(s.id);
                        setMore(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-left text-[14px] ${
                        on ? 'bg-[color:var(--accent-soft)] font-semibold text-[color:var(--text)]' : 'text-[color:var(--text-muted)] hover:bg-[color:var(--surface-2)]'
                      } ${FOCUS_IN}`}
                    >
                      <Icon id={s.id} className={`size-[18px] ${on ? 'text-[color:var(--accent)]' : ''}`} />
                      {s.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        <ul
          className="flex gap-1 rounded-[var(--radius)] border border-[color:var(--border-strong)] bg-[color:var(--surface)] p-1"
          style={{ boxShadow: 'var(--shadow)' }}
          onKeyDown={(e) => arrowNav(e, 'h')}
        >
          {shown.map((s) => {
            const on = s.id === current;
            return (
              <li key={s.id} className="flex min-w-0 flex-1">
                <button
                  type="button"
                  data-nav-item
                  aria-current={on ? 'page' : undefined}
                  onClick={() => {
                    onNavigate(s.id);
                    setMore(false);
                  }}
                  className={`${dockItem(on)} w-full`}
                >
                  <Icon id={s.id} className={`size-5 ${on ? 'text-[color:var(--accent)]' : ''}`} />
                  <span className="max-w-full truncate">{s.label}</span>
                </button>
              </li>
            );
          })}
          {overflow && (
            <li className="flex min-w-0 flex-1">
              <button
                ref={moreBtn}
                type="button"
                data-nav-item
                aria-expanded={more}
                aria-controls="onglets-plus"
                aria-haspopup="true"
                onClick={() => setMore((m) => !m)}
                className={`${dockItem(hiddenActive || more)} w-full`}
              >
                <Icon id="plus" className={`size-5 ${hiddenActive ? 'text-[color:var(--accent)]' : ''}`} />
                <span className="max-w-full truncate">{hiddenActive ? active.label : 'Plus'}</span>
              </button>
            </li>
          )}
        </ul>
      </nav>
    </div>
  );
}
