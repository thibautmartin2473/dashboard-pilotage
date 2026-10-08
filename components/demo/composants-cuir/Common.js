'use client';

// Pièces communes aux trois systèmes : leur DOM est le même, leur dessin vient de cuir.css (portée
// .cl-sys[data-sys=...]) et de quelques pièces signature propres à chaque système (case à cocher,
// progression, choix du jour, Supprimer), fournies par le « skin ».
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DAYS,
  DEFAULT_DAY,
  DESTS,
  HOUR_END,
  HOUR_START,
  KIND_LABEL,
  PLAGES,
  hhmm,
  suggestionOf,
  useAgendaDrag,
  useLab,
  useLoading,
  useSwipe,
} from './shared';
import Anneau from '@/components/demo/chartes-cadran/Anneau';

const PATHS = {
  check: 'M4 10.5l4 4 8-9',
  arrow: 'M4 10h11M11 5.5l4.5 4.5-4.5 4.5',
  move: 'M10 3v14M3 10h14M10 3l-2.5 2.5M10 3l2.5 2.5M10 17l-2.5-2.5M10 17l2.5-2.5',
  clock: 'M10 3.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM10 6.5V10l2.5 1.5',
  trash: 'M4.5 6h11M8 6V4.5h4V6M6 6l.7 10h6.6L14 6',
  undo: 'M7.5 5L4 8.5 7.5 12M4 8.5h7.5a4 4 0 0 1 0 8H9',
  search: 'M8.5 3.5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12.2 12.2L16.5 16.5',
  chevron: 'M6 8l4 4 4-4',
  more: 'M5 10h.01M10 10h.01M15 10h.01',
};

export function Icon({ name, size = 16 }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden="true" focusable="false" className="cl-ico">
      <path d={PATHS[name]} fill="none" stroke="currentColor" strokeWidth={name === 'more' ? 2.6 : 1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Kbd({ children }) {
  return <kbd className="cl-kbd">{children}</kbd>;
}

export function Btn({ variant = 'secondary', children, loading, disabled, state, kbd, icon, label, onClick, className = '', ...rest }) {
  return (
    <button
      type="button"
      className={`cl-btn cl-btn--${variant}${state ? ` is-${state}` : ''} ${className}`}
      disabled={disabled}
      aria-busy={loading || undefined}
      aria-label={label}
      data-loading={loading ? '' : undefined}
      onClick={loading ? undefined : onClick}
      {...rest}
    >
      <span className="cl-btn-deco" aria-hidden="true" />
      <span className="cl-btn-face">
        {icon}
        {children != null && <span className="cl-btn-label">{children}</span>}
        {kbd && <Kbd>{kbd}</Kbd>}
      </span>
      <span className="cl-btn-load" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </button>
  );
}

// Groupe de choix exclusif (groupe segmenté, onglets, mots) : flèches pour se déplacer, focus itinérant.
export function RadioRow({ options, value, onChange, label, className = 'cl-seg' }) {
  const refs = useRef([]);
  const move = (i) => {
    const n = (i + options.length) % options.length;
    onChange(n);
    refs.current[n]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} className={className}>
      {options.map((o, i) => (
        <button
          key={o.id ?? o.label}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={value === i}
          tabIndex={value === i ? 0 : -1}
          className="cl-seg-opt"
          onClick={() => onChange(i)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
              e.preventDefault();
              move(i + 1);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
              e.preventDefault();
              move(i - 1);
            }
          }}
        >
          <span className="cl-seg-deco" aria-hidden="true" />
          <span className="cl-seg-label">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function Chip({ kind, cat, children, time }) {
  return (
    <span className={`cl-chip cl-chip--${kind}`} data-cat={cat}>
      <span className="cl-chip-deco" aria-hidden="true" />
      <span className="cl-chip-text">{children}</span>
      {time && <span className="cl-chip-time">{time}</span>}
      <span className="cl-sr">{kind === 'plage' ? ` (plage, ${KIND_LABEL[cat] ?? cat})` : ' (tâche)'}</span>
    </span>
  );
}

function Toast({ toast, onUndo }) {
  return (
    <div className="cl-toast-wrap" role="status" aria-live="polite">
      {toast && (
        <div key={toast.id} className="cl-toast">
          <span className="cl-toast-deco" aria-hidden="true" />
          <span className="cl-toast-text">{toast.text}</span>
          {toast.undoable && (
            <Btn variant="quiet" kbd="Z" onClick={onUndo}>
              Annuler
            </Btn>
          )}
        </div>
      )}
    </div>
  );
}

function Palette({ onClose, commands }) {
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);
  useEffect(() => {
    const prev = document.activeElement;
    return () => prev?.focus?.();
  }, []);
  const list = commands.filter((c) => c.label.toLowerCase().includes(q.trim().toLowerCase()));
  const sel = Math.min(i, Math.max(0, list.length - 1));
  const run = (c) => {
    if (!c || c.disabled) return;
    onClose();
    c.run();
  };
  return (
    <div className="cl-pal-back" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cl-pal" role="dialog" aria-modal="true" aria-label="Palette de commandes">
        <div className="cl-pal-head">
          <Icon name="search" />
          <input
            autoFocus
            className="cl-pal-input"
            value={q}
            placeholder="Que faire de l’élément en cours ?"
            aria-label="Chercher une commande"
            aria-controls="cl-pal-list"
            aria-activedescendant={list[sel] ? `cl-pal-${list[sel].id}` : undefined}
            onChange={(e) => {
              setQ(e.target.value);
              setI(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setI((sel + 1) % Math.max(1, list.length));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setI((sel - 1 + list.length) % Math.max(1, list.length));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                run(list[sel]);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
              } else if (e.key === 'Tab') e.preventDefault();
            }}
          />
          <Kbd>Échap</Kbd>
        </div>
        <ul id="cl-pal-list" role="listbox" className="cl-pal-list" aria-label="Commandes">
          {list.map((c, n) => (
            <li
              key={c.id}
              id={`cl-pal-${c.id}`}
              role="option"
              aria-selected={n === sel}
              aria-disabled={c.disabled || undefined}
              className={`cl-pal-item${c.danger ? ' is-danger' : ''}`}
              onPointerMove={() => setI(n)}
              onClick={() => run(c)}
            >
              <span className="cl-pal-label">{c.label}</span>
              <span className="cl-pal-lead" aria-hidden="true" />
              <Kbd>{c.kbd}</Kbd>
            </li>
          ))}
          {!list.length && <li className="cl-pal-empty">Aucune commande.</li>}
        </ul>
      </div>
    </div>
  );
}

function AssignMenu({ onPick, onClose }) {
  const refs = useRef([]);
  useEffect(() => {
    refs.current[0]?.focus();
  }, []);
  const focusAt = (n) => refs.current[(n + DESTS.length) % DESTS.length]?.focus();
  return (
    <div
      className="cl-menu"
      role="menu"
      aria-label="Affecter ailleurs"
      onKeyDown={(e) => {
        e.stopPropagation();
        const idx = refs.current.indexOf(document.activeElement);
        const d = DESTS.find((x) => x.key === e.key);
        if (d) {
          e.preventDefault();
          onPick(d);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          focusAt(idx + 1);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          focusAt(idx - 1);
        } else if (e.key === 'Escape' || e.key === 'Tab') {
          e.preventDefault();
          onClose();
        }
      }}
    >
      <p className="cl-menu-title">Affecter à</p>
      {DESTS.map((d, n) => (
        <button
          key={d.key}
          ref={(el) => {
            refs.current[n] = el;
          }}
          type="button"
          role="menuitem"
          className="cl-menu-item"
          onClick={() => onPick(d)}
        >
          <Kbd>{d.key}</Kbd>
          <span className="cl-menu-label">{d.label}</span>
          <span className="cl-menu-lead" aria-hidden="true" />
          <span className="cl-menu-when">{d.when}</span>
        </button>
      ))}
    </div>
  );
}

function LaterPop({ skin, onPick, onClose }) {
  const [day, setDay] = useState(DEFAULT_DAY);
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.querySelector('[role="slider"], [role="radio"][aria-checked="true"]')?.focus();
  }, []);
  const DayPicker = skin.DayPicker;
  return (
    <div
      ref={ref}
      className="cl-pop"
      role="dialog"
      aria-label="Reporter à un jour"
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Escape') onClose();
        if (e.key === 'Enter' && !e.target.closest('button.cl-btn')) {
          e.preventDefault();
          onPick(day);
        }
      }}
    >
      <p className="cl-menu-title">Plus tard : quel jour ?</p>
      <DayPicker value={day} onChange={setDay} />
      <div className="cl-pop-foot">
        <Btn variant="quiet" onClick={onClose}>
          Fermer
        </Btn>
        <Btn variant="primary" kbd="Entrée" onClick={() => onPick(day)}>
          Reporter au {DAYS[day].short} {DAYS[day].num}
        </Btn>
      </div>
    </div>
  );
}

const pct = (m) => ((m - HOUR_START * 60) / ((HOUR_END - HOUR_START) * 60)) * 100;
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);
const NOW = 13 * 60 + 40;

function AgendaColumn({ blocks, colRef, drag }) {
  return (
    <div className="cl-day">
      <div className="cl-day-head">
        <span className="cl-day-name">Jeudi</span>
        <span className="cl-day-num">9</span>
        <span className="cl-day-sig" aria-hidden="true" />
      </div>
      <div className="cl-day-body">
        <div className="cl-hours" aria-hidden="true">
          {HOURS.map((h) => (
            <span key={h} style={{ top: `${pct(h * 60)}%` }}>
              {h}:00
            </span>
          ))}
        </div>
        <div className="cl-col" ref={colRef} role="list" aria-label="Agenda du jeudi 9 octobre">
          {HOURS.slice(1, -1).map((h) => (
            <span key={h} className="cl-hline" style={{ top: `${pct(h * 60)}%` }} aria-hidden="true" />
          ))}
          {PLAGES.map((p) => (
            <div key={p.id} role="listitem" className="cl-plage" data-cat={p.kind} data-busy={blocks.some((b) => b.plage === p.id) ? '' : undefined} style={{ top: `${pct(p.start)}%`, height: `${pct(p.end) - pct(p.start)}%` }}>
              <span className="cl-plage-deco" aria-hidden="true" />
              <span className="cl-plage-title">{p.title}</span>
              <span className="cl-plage-time">
                {KIND_LABEL[p.kind]}, {hhmm(p.start)} à {hhmm(p.end)}
              </span>
            </div>
          ))}
          {blocks.map((b) => (
            <div
              key={b.id}
              role="listitem"
              className={`cl-block${b.fresh ? ' is-fresh' : ''}${b.plage ? '' : ' is-free'}${b.end - b.start < 30 ? ' is-short' : ''}`}
              style={{ top: `${pct(b.start)}%`, height: `${pct(b.end) - pct(b.start)}%` }}
            >
              <span className="cl-block-deco" aria-hidden="true" />
              <span className="cl-block-title">{b.title}</span>
              <span className="cl-block-time">
                {hhmm(b.start)} à {hhmm(b.end)}
              </span>
            </div>
          ))}
          <div className="cl-now" style={{ top: `${pct(NOW)}%` }} role="presentation">
            <span className="cl-sr">Maintenant, 13:40</span>
          </div>
          {drag?.over && drag.moved && (
            <div className="cl-ghost" style={{ top: `${pct(drag.start)}%`, height: `${pct(drag.start + drag.item.dur) - pct(drag.start)}%` }} aria-hidden="true">
              <i className="cl-ghost-c tl" />
              <i className="cl-ghost-c tr" />
              <i className="cl-ghost-c bl" />
              <i className="cl-ghost-c br" />
              <span className="cl-ghost-label">
                {hhmm(drag.start)} à {hhmm(drag.start + drag.item.dur)}
                {drag.magnet && <em> aimanté : {drag.magnet}</em>}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RangerCard({ skin, lab, menu, setMenu, picker, setPicker }) {
  const item = lab.current;
  const sug = suggestionOf(item, lab.blocks);
  const swipe = useSwipe({ onRight: () => lab.act('place'), onLeft: () => lab.act('later') });
  const { Check, DeleteCtl } = skin;
  if (!item) {
    return (
      <div className="cl-card cl-card--empty">
        <p className="cl-card-title">Tout est rangé.</p>
        <p className="cl-card-meta">La file du rangement forcé est vide. Z ou Annuler pour revenir en arrière.</p>
        <div className="cl-gestures">
          <Btn variant="secondary" kbd="Z" disabled={!lab.canUndo} onClick={lab.undo} icon={<Icon name="undo" />}>
            Annuler
          </Btn>
          <Btn variant="quiet" onClick={lab.reset}>
            Recommencer la démo
          </Btn>
        </div>
      </div>
    );
  }
  const dir = swipe.dx > 0 ? 'right' : swipe.dx < 0 ? 'left' : '';
  const strong = Math.abs(swipe.dx) > 96;
  return (
    <div className="cl-swipe" data-dir={dir} data-strong={strong ? '' : undefined}>
      <div className="cl-swipe-under" aria-hidden="true">
        <span className="cl-swipe-r">
          <Icon name="arrow" /> Valider
        </span>
        <span className="cl-swipe-l">
          Plus tard <Icon name="clock" />
        </span>
      </div>
      <article
        className={`cl-card${lab.checking === item.id ? ' is-checking' : ''}${swipe.dx ? ' is-dragging' : ''}`}
        tabIndex={0}
        aria-label={`À ranger : ${item.title}. Suggestion : ${sug.label}.`}
        style={swipe.dx ? { transform: `translateX(${swipe.dx}px) rotate(${swipe.dx / 60}deg)` } : undefined}
        {...swipe.handlers}
      >
        <header className="cl-card-head">
          <span className="cl-card-type">{item.type}</span>
          <span className="cl-card-meta">{item.meta}</span>
        </header>
        <div className="cl-card-main">
          <Check checked={lab.checking === item.id} onChange={() => lab.act('done')} label={<span className="cl-sr">Cocher (C)</span>} />
          <h4 className="cl-card-title">{item.title}</h4>
        </div>
        <div className="cl-sug">
          <span className="cl-sug-label">Suggestion</span>
          <span className="cl-sug-target">
            {sug.label}
            {sug.over ? ' (déborde du bloc)' : ''}
          </span>
          <p className="cl-sug-why">{item.reason}</p>
        </div>
        <div className="cl-gestures">
          <Btn variant="primary" kbd="V" icon={<Icon name="arrow" />} onClick={() => lab.act('place')}>
            Valider
          </Btn>
          <span className="cl-anchor">
            <Btn variant="secondary" kbd="A" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu(!menu)}>
              Affecter
            </Btn>
            {menu && (
              <AssignMenu
                onClose={() => setMenu(false)}
                onPick={(d) => {
                  setMenu(false);
                  if (d.pick) setPicker(true);
                  else lab.act('assign', { dest: d });
                }}
              />
            )}
          </span>
          <span className="cl-anchor cl-later">
            <Btn variant="quiet" kbd="P" onClick={() => lab.act('later')}>
              Plus tard
            </Btn>
            <Btn variant="icon" label="Choisir le jour du report (Maj P)" aria-expanded={picker} icon={<Icon name="chevron" />} onClick={() => setPicker(!picker)} />
            {picker && (
              <LaterPop
                skin={skin}
                onClose={() => setPicker(false)}
                onPick={(d) => {
                  setPicker(false);
                  lab.act('later', { day: d });
                }}
              />
            )}
          </span>
          <DeleteCtl onDelete={() => lab.act('drop')} />
        </div>
        <p className="cl-card-hint">
          Clavier : <Kbd>V</Kbd> <Kbd>A</Kbd> <Kbd>C</Kbd> <Kbd>S</Kbd> <Kbd>P</Kbd>, <Kbd>Z</Kbd> annule. Téléphone : balaie à droite pour valider, à gauche pour plus tard.
        </p>
      </article>
    </div>
  );
}

function Situation({ skin, lab, menu, setMenu, picker, setPicker }) {
  const colRef = useRef(null);
  const act = lab.act;
  const onDrop = useCallback((item, start) => act('drop-at', { item, start }), [act]);
  const { drag, start } = useAgendaDrag({ colRef, blocks: lab.blocks, onDrop });
  const { Progress } = skin;
  const onKey = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.target.closest('input, [role="menu"], .cl-pop')) return;
    const k = e.key.toLowerCase();
    const map = { v: () => act('place'), c: () => act('done'), s: () => act('drop'), z: () => lab.undo() };
    if (k === 'a' && lab.current) {
      e.preventDefault();
      setMenu(true);
    } else if (k === 'p' && lab.current) {
      e.preventDefault();
      if (e.shiftKey) setPicker(true);
      else act('later');
    } else if (map[k]) {
      e.preventDefault();
      map[k]();
    }
  };
  const others = lab.queue.slice(1);
  return (
    <div className="cl-sit" onKeyDown={onKey}>
      <nav className="cl-rail" aria-label="Rail (maquette)">
        <Anneau size={26} plage="var(--text)" tache="var(--accent)" />
        {['Accueil', 'Agenda', 'Mails', 'Apps'].map((n, i) => (
          <span key={n} className={`cl-rail-i${i === 0 ? ' is-on' : ''}`} title={n}>
            {n.slice(0, 2)}
          </span>
        ))}
      </nav>
      <AgendaColumn blocks={lab.blocks} colRef={colRef} drag={drag} />
      <aside className="cl-ranger" aria-label="À ranger">
        <div className="cl-ranger-head">
          <h3 className="cl-h3">À ranger</h3>
          <Progress done={lab.done} total={lab.total} />
        </div>
        <RangerCard skin={skin} lab={lab} menu={menu} setMenu={setMenu} picker={picker} setPicker={setPicker} />
        {others.length > 0 && (
          <div className="cl-tray">
            <p className="cl-tray-title">Ensuite, à glisser dans l’agenda</p>
            <ul className="cl-tray-list">
              {others.map((it) => (
                <li key={it.id}>
                  <button
                    type="button"
                    className={`cl-drag-chip${drag?.item.id === it.id && drag.moved ? ' is-lifted' : ''}`}
                    onPointerDown={(e) => start(e, it)}
                    aria-label={`${it.title}, ${it.dur} min. Glisser vers l’agenda (au clavier : passe par Affecter).`}
                  >
                    <span className="cl-grip" aria-hidden="true" />
                    <span className="cl-drag-title">{it.title}</span>
                    <span className="cl-drag-dur">{it.dur} min</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
      {drag?.moved && (
        <div className="cl-float" style={{ transform: `translate(${drag.x + 12}px, ${drag.y + 10}px)` }} aria-hidden="true">
          {drag.item.title}
          <span>{drag.over ? hhmm(drag.start) : 'hors agenda'}</span>
        </div>
      )}
    </div>
  );
}

const STATES = [
  { id: '', label: 'Naturel' },
  { id: 'hover', label: 'Survol' },
  { id: 'active', label: 'Pression' },
  { id: 'focus', label: 'Focus' },
  { id: 'disabled', label: 'Désactivé' },
  { id: 'loading', label: 'Chargement' },
];

function Panel({ n, title, children, wide }) {
  return (
    <section className={`cl-panel${wide ? ' cl-panel--wide' : ''}`} aria-labelledby={`cl-p-${n}`}>
      <h3 className="cl-h3" id={`cl-p-${n}`}>
        <span className="cl-h3-n" aria-hidden="true">
          {n}
        </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

export function SystemDemo({ skin }) {
  const lab = useLab();
  const [forced, setForced] = useState(0);
  const [seg, setSeg] = useState(2);
  const [checks, setChecks] = useState([false, true, false]);
  const [day, setDay] = useState(DEFAULT_DAY);
  const [prog, setProg] = useState(12);
  const [palette, setPalette] = useState(false);
  const [menu, setMenu] = useState(false);
  const [picker, setPicker] = useState(false);
  const [loading, runLoading] = useLoading();
  const { Check, Progress, DayPicker, DeleteCtl } = skin;

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const has = !!lab.current;
  const commands = [
    { id: 'v', label: 'Valider la suggestion', kbd: 'V', disabled: !has, run: () => lab.act('place') },
    { id: 'a', label: 'Affecter ailleurs', kbd: 'A', disabled: !has, run: () => setMenu(true) },
    { id: 'c', label: 'Cocher : déjà fait', kbd: 'C', disabled: !has, run: () => lab.act('done') },
    { id: 'p', label: 'Plus tard : dimanche', kbd: 'P', disabled: !has, run: () => lab.act('later') },
    { id: 'pp', label: 'Plus tard : choisir le jour', kbd: 'Maj P', disabled: !has, run: () => setPicker(true) },
    { id: 's', label: 'Supprimer', kbd: 'S', danger: true, disabled: !has, run: () => lab.act('drop') },
    { id: 'z', label: 'Annuler le dernier geste', kbd: 'Z', disabled: !lab.canUndo, run: lab.undo },
    { id: 'r', label: 'Recommencer la démo', kbd: 'R', run: lab.reset },
  ];

  const st = STATES[forced].id;
  const bp = (extra = {}) => ({
    state: ['hover', 'active', 'focus'].includes(st) ? st : undefined,
    disabled: st === 'disabled',
    loading: st === 'loading' || extra.loading,
  });

  return (
    <div className="cl-sys" data-sys={skin.id}>
      <header className="cl-intro">
        <p className="cl-kicker">{skin.kicker}</p>
        <h2 className="cl-h2">{skin.name}</h2>
        <p className="cl-lede">{skin.concept}</p>
        <p className="cl-sign">
          <span className="cl-sign-label">Signature</span> {skin.signature}
        </p>
      </header>

      <div className="cl-grid">
        <Panel n="1" title="Boutons et leurs états" wide>
          <div className="cl-row cl-row--force">
            <span className="cl-small">Forcer l’état</span>
            <RadioRow options={STATES} value={forced} onChange={setForced} label="Forcer l’état des boutons" />
          </div>
          <div className="cl-row">
            <Btn variant="primary" kbd="V" icon={<Icon name="arrow" />} {...bp({ loading })} onClick={runLoading}>
              Valider
            </Btn>
            <Btn variant="secondary" kbd="A" {...bp()}>
              Affecter ailleurs
            </Btn>
            <Btn variant="quiet" kbd="P" {...bp()}>
              Plus tard
            </Btn>
            <Btn variant="danger" kbd="S" icon={skin.glyph?.trash ?? <Icon name="trash" />} {...bp()}>
              Supprimer
            </Btn>
          </div>
          <div className="cl-row">
            <Btn variant="icon" label="Annuler" icon={skin.glyph?.undo ?? <Icon name="undo" />} {...bp()} />
            <Btn variant="icon" label="Chercher" icon={skin.glyph?.search ?? <Icon name="search" />} {...bp()} />
            <Btn variant="icon" label="Plus d’actions" icon={skin.glyph?.more ?? <Icon name="more" />} {...bp()} />
            <RadioRow
              options={[{ label: 'Jour' }, { label: '3 jours' }, { label: '5 jours' }, { label: 'Semaine' }]}
              value={seg}
              onChange={setSeg}
              label="Vue de l’agenda"
            />
          </div>
          <p className="cl-note">Naturel : survole, appuie (la course se voit), tabule. Clique Valider pour le chargement (indicateur après 150 ms, tenu 1,2 s).</p>
          <div className="cl-row cl-keys">
            {[['V', 'Valider'], ['A', 'Affecter'], ['C', 'Cocher'], ['S', 'Supprimer'], ['P', 'Plus tard'], ['Z', 'Annuler'], ['Ctrl K', 'Palette']].map(([k, l]) => (
              <span key={k} className="cl-key">
                <Kbd>{k}</Kbd>
                {l}
              </span>
            ))}
          </div>
        </Panel>

        <Panel n="2" title="Cocher, plage et tâche">
          <div className="cl-stack">
            {['Relire la lettre Bain', 'Cas Case Coach n°3', 'Relancer Kearney'].map((t, i) => (
              <Check key={t} checked={checks[i]} label={t} onChange={(v) => setChecks((c) => c.map((x, j) => (j === i ? v : x)))} />
            ))}
          </div>
          <div className="cl-chips">
            <Chip kind="plage" cat="cours" time="10:00">
              Corporate Finance
            </Chip>
            <Chip kind="plage" cat="sport" time="18:00">
              Tennis
            </Chip>
            <Chip kind="plage" cat="travail" time="14:00">
              Bloc Candidatures
            </Chip>
            <Chip kind="tache" time="14:00">
              Relire la lettre Bain
            </Chip>
            <Chip kind="tache" time="15:30">
              Relancer Kearney
            </Chip>
          </div>
          <p className="cl-note">{skin.chipNote}</p>
        </Panel>

        <Panel n="3" title="Plus tard, Supprimer, progression">
          <p className="cl-small">Jour du report : {DAYS[day].long}</p>
          <DayPicker value={day} onChange={setDay} />
          <div className="cl-row">
            <DeleteCtl onDelete={() => lab.say('Supprimé (démonstration du contrôle).', false)} />
          </div>
          <Progress done={prog} total={47} />
          <div className="cl-row">
            <Btn variant="secondary" kbd="+" onClick={() => setProg((p) => Math.min(47, p + 1))}>
              Ranger un élément
            </Btn>
            <Btn variant="quiet" onClick={() => setProg((p) => Math.max(0, p - 1))}>
              Revenir
            </Btn>
          </div>
        </Panel>

        <Panel n="4" title="Palette et annulation">
          <div className="cl-row">
            <Btn variant="secondary" kbd="Ctrl K" icon={<Icon name="search" />} onClick={() => setPalette(true)}>
              Palette
            </Btn>
            <Btn variant="quiet" onClick={() => lab.say('Rangé dans Bloc Candidatures, 15:30.')}>
              Montrer le toast
            </Btn>
          </div>
          <p className="cl-note">La palette agit sur l’élément en cours de la mise en situation ci-dessous. Le toast reste 5 s ; Z annule tant qu’il est là, et même après.</p>
        </Panel>

        <Panel n="5" title="Mise en situation : un morceau du Cockpit" wide>
          <p className="cl-note">Range au clavier (clique d’abord dans la carte), à la souris ou en balayant. Glisse une tâche de « Ensuite » dans la colonne : pas de 15 min, aimantée au début d’une plage ou à la suite de la dernière tâche.</p>
          <Situation skin={skin} lab={lab} menu={menu} setMenu={setMenu} picker={picker} setPicker={setPicker} />
        </Panel>
      </div>

      <section className="cl-verdict" aria-labelledby={`cl-f-${skin.id}`}>
        <h3 className="cl-h3" id={`cl-f-${skin.id}`}>
          Failles de {skin.name}
        </h3>
        <ol className="cl-failles">
          {skin.failles.map((f) => (
            <li key={f.slice(0, 24)}>{f}</li>
          ))}
        </ol>
        <p className="cl-note">
          <strong>En vrai :</strong> {skin.enVrai}
        </p>
      </section>

      <Toast toast={lab.toast} onUndo={lab.undo} />
      {palette && <Palette onClose={() => setPalette(false)} commands={commands} />}
    </div>
  );
}
