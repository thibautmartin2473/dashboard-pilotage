'use client';

// Palette de commandes (Ctrl+K) : filtre sans accents, flèches, Entrée exécute, Échap ferme, raccourci
// affiché à côté de chaque action, destructif en rouge. Montée seulement quand elle est ouverte (état neuf).
// En vrai : cmdk ou le Combobox de Base UI dans un Dialog (piège à focus et retour du focus fournis).
import { useMemo, useRef, useState } from 'react';
import { Icon, Kbd } from './ui';

const norm = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export default function Palette({ commands, onClose }) {
  const [q, setQ] = useState('');
  const [at, setAt] = useState(0);
  const listRef = useRef(null);
  const list = useMemo(() => commands.filter((c) => norm(`${c.label} ${c.hint ?? ''}`).includes(norm(q.trim()))), [commands, q]);
  const cur = Math.min(at, Math.max(0, list.length - 1));

  const run = (c) => {
    if (!c || c.disabled) return;
    onClose();
    c.run();
  };
  const onKey = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const n = list.length || 1;
      const next = e.key === 'ArrowDown' ? (cur + 1) % n : (cur - 1 + n) % n;
      setAt(next);
      listRef.current?.querySelectorAll('[role="option"]')[next]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(list[cur]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    } else if (e.key === 'Tab') {
      e.preventDefault();
    }
  };

  return (
    <div className="pal-veil" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pal" role="dialog" aria-modal="true" aria-label="Palette de commandes" onKeyDown={onKey}>
        <div className="pal-in">
          <Icon name="search" />
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setAt(0);
            }}
            placeholder="Une commande, un geste, un système…"
            aria-label="Chercher une commande"
            role="combobox"
            aria-expanded="true"
            aria-controls="pal-list"
            aria-activedescendant={list[cur] ? `pal-${list[cur].id}` : undefined}
          />
          <Kbd>Échap</Kbd>
        </div>
        <ul id="pal-list" role="listbox" className="pal-list" ref={listRef} aria-label="Commandes">
          {list.length === 0 ? <li className="pal-empty">Aucune commande pour « {q} »</li> : null}
          {list.map((c, i) => (
            <li
              key={c.id}
              id={`pal-${c.id}`}
              role="option"
              aria-selected={i === cur}
              aria-disabled={c.disabled || undefined}
              className={`pal-i${c.danger ? ' is-danger' : ''}`}
              onPointerMove={() => setAt(i)}
              onClick={() => run(c)}
            >
              <span className="pal-dot" aria-hidden="true" />
              <span className="pal-l">
                {c.label}
                {c.hint ? <span className="pal-h">{c.hint}</span> : null}
              </span>
              {c.keys ? <Kbd>{c.keys}</Kbd> : null}
            </li>
          ))}
        </ul>
        <div className="pal-foot lbl">
          <span>
            <Kbd>Flèches</Kbd> choisir
          </span>
          <span>
            <Kbd>Entrée</Kbd> exécuter
          </span>
        </div>
      </div>
    </div>
  );
}
