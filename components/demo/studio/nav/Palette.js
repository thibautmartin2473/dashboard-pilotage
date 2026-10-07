'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { FOCUS, Icon, trapTab } from './shared';

const fold = (t) =>
  String(t)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

function isTyping(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

// Navigation « Palette » : aucune barre. Un en-tête minimal (titre de la section et bouton
// « Aller à... »). Ctrl+K ou / ouvre la palette ; sur téléphone, un bouton flottant.
export default function NavPalette({ sections, current, onNavigate, orgName, children }) {
  const [open, setOpen] = useState(false);
  const opener = useRef(null);
  const active = sections.find((s) => s.id === current) ?? sections[0];

  useEffect(() => {
    const onKey = (e) => {
      const ctrlK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k';
      const slash = e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !isTyping(document.activeElement);
      if (ctrlK || slash) {
        e.preventDefault();
        opener.current = document.activeElement;
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const openFrom = (e) => {
    opener.current = e.currentTarget;
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    const el = opener.current;
    if (el && typeof el.focus === 'function') setTimeout(() => el.focus(), 0);
  };

  return (
    <div className="flex min-h-full flex-col">
      <header className="mx-auto flex w-full max-w-[100rem] items-end gap-4 px-4 pt-6 pb-2 sm:px-6 md:px-8 md:pt-8">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[11px] tracking-[0.12em] text-[color:var(--text-faint)] uppercase [font-family:var(--font-mono)]">
            Organisation : {orgName}
          </div>
          <h1 className="mt-1 truncate text-[1.75rem] leading-none font-semibold tracking-tight [font-family:var(--font-display)] md:text-[2.25rem]">
            {active.label}
          </h1>
        </div>
        <button
          type="button"
          onClick={openFrom}
          aria-haspopup="dialog"
          aria-keyshortcuts="Control+K /"
          className={`hidden shrink-0 items-center gap-3 rounded-[var(--radius)] border border-[color:var(--border-strong)] bg-[color:var(--surface)] py-2 pr-2 pl-3 text-[13px] text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text)] sm:flex ${FOCUS}`}
        >
          <Icon id="search" className="size-4" />
          <span>Aller à...</span>
          <kbd className="rounded-[var(--radius-sm)] border border-[color:var(--border)] bg-[color:var(--surface-2)] px-1.5 py-0.5 text-[11px] text-[color:var(--text-faint)] [font-family:var(--font-mono)]">
            Ctrl K
          </kbd>
        </button>
      </header>

      <main id="studio-contenu" className="min-w-0 flex-1 px-4 pt-4 pb-32 sm:px-6 md:px-8 md:pb-16">
        <div className="mx-auto w-full max-w-[100rem]">{children}</div>
      </main>

      {/* Téléphone : bouton flottant à gauche (le Composer est à droite) */}
      <button
        type="button"
        onClick={openFrom}
        aria-haspopup="dialog"
        className={`fixed bottom-3 left-3 z-40 flex items-center gap-2 rounded-full border border-[color:var(--border-strong)] bg-[color:var(--surface)] py-2.5 pr-4 pl-3.5 text-[13px] font-medium text-[color:var(--text)] sm:hidden ${FOCUS}`}
        style={{ boxShadow: 'var(--shadow)' }}
      >
        <Icon id="search" className="size-4 text-[color:var(--accent)]" />
        Aller à...
      </button>

      {open && <PaletteDialog sections={sections} current={current} onNavigate={onNavigate} onClose={close} />}
    </div>
  );
}

function PaletteDialog({ sections, current, onNavigate, onClose }) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const panel = useRef(null);
  const list = useRef(null);
  const input = useRef(null);
  const uid = useId();

  const results = useMemo(() => {
    const q = fold(query).trim();
    if (!q) return sections;
    const scored = [];
    sections.forEach((s, i) => {
      const label = fold(s.label);
      const at = label.indexOf(q);
      const initials = label.split(/[\s']+/).map((w) => w[0]).join('');
      if (at === 0) scored.push([0, i, s]);
      else if (label.split(/[\s']+/).some((w) => w.startsWith(q))) scored.push([1, i, s]);
      else if (at > 0) scored.push([2, i, s]);
      else if (initials.startsWith(q) || fold(s.id).includes(q)) scored.push([3, i, s]);
    });
    return scored.sort((a, b) => a[0] - b[0] || a[1] - b[1]).map((x) => x[2]);
  }, [query, sections]);

  const safeIndex = Math.min(index, Math.max(results.length - 1, 0));

  useEffect(() => {
    input.current?.focus();
  }, []);

  useEffect(() => {
    list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [safeIndex, results]);

  const choose = (s) => {
    if (!s) return;
    onNavigate(s.id);
    onClose();
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (results.length) setIndex((safeIndex + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (results.length) setIndex((safeIndex - 1 + results.length) % results.length);
    } else if (e.key === 'Home' && results.length) {
      e.preventDefault();
      setIndex(0);
    } else if (e.key === 'End' && results.length) {
      e.preventDefault();
      setIndex(results.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(results[safeIndex]);
    } else {
      trapTab(e, panel.current);
    }
  };

  const listId = `${uid}-liste`;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[10vh] sm:pt-[14vh]" onKeyDown={onKeyDown}>
      <button
        type="button"
        tabIndex={-1}
        aria-label="Fermer la palette"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[color:var(--bg)]/75 backdrop-blur-[2px]"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Aller à une section"
        className="relative w-full max-w-lg overflow-hidden rounded-[var(--radius)] border border-[color:var(--border-strong)] bg-[color:var(--surface)]"
        style={{ boxShadow: 'var(--shadow)' }}
      >
        <div className="flex items-center gap-3 border-b border-[color:var(--border)] px-4 focus-within:border-[color:var(--accent)]">
          <Icon id="search" className="size-[18px] text-[color:var(--text-faint)]" />
          <input
            ref={input}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={results.length ? `${uid}-opt-${results[safeIndex].id}` : undefined}
            aria-label="Aller à une section"
            autoComplete="off"
            spellCheck={false}
            placeholder="Aller à une section..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            style={{ outline: 'none' }}
            className="h-12 min-w-0 flex-1 bg-transparent text-[15px] text-[color:var(--text)] placeholder:text-[color:var(--text-faint)] focus:outline-none"
          />
          <kbd className="rounded-[var(--radius-sm)] border border-[color:var(--border)] bg-[color:var(--surface-2)] px-1.5 py-0.5 text-[11px] text-[color:var(--text-faint)] [font-family:var(--font-mono)]">
            Échap
          </kbd>
        </div>
        <ul ref={list} id={listId} role="listbox" aria-label="Sections" className="max-h-[50vh] overflow-y-auto p-1.5">
          {results.map((s, i) => {
            const on = i === safeIndex;
            return (
              <li
                key={s.id}
                id={`${uid}-opt-${s.id}`}
                role="option"
                aria-selected={on}
                onMouseMove={() => setIndex(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(s)}
                className={`flex cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-[14px] ${
                  on ? 'bg-[color:var(--accent-soft)] text-[color:var(--text)]' : 'text-[color:var(--text-muted)]'
                }`}
              >
                <Icon id={s.id} className={`size-[18px] ${on ? 'text-[color:var(--accent)]' : 'text-[color:var(--text-faint)]'}`} />
                <span className="min-w-0 flex-1 truncate">{s.label}</span>
                {s.id === current && (
                  <span className="text-[11px] tracking-wide text-[color:var(--text-faint)] uppercase [font-family:var(--font-mono)]">ici</span>
                )}
              </li>
            );
          })}
          {results.length === 0 && (
            <li role="presentation" className="px-3 py-6 text-center text-[13px] text-[color:var(--text-muted)]">
              Aucune section ne correspond.
            </li>
          )}
        </ul>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[color:var(--border)] bg-[color:var(--surface-2)] px-4 py-2 text-[11px] text-[color:var(--text-faint)] [font-family:var(--font-mono)]">
          <span>Flèches : choisir</span>
          <span>Entrée : ouvrir</span>
          <span>Échap : fermer</span>
        </div>
      </div>
    </div>
  );
}
