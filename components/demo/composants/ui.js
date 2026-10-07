'use client';

// Briques de la vitrine /demo/composants (Cadran) : icônes dessinées, touche clavier, bouton à course,
// groupe segmenté, compteur à rouleaux, afficheur 7 segments, couronne de compas, case Cocher, puces,
// voyants, interrupteur à capot, molette crantée et règle graduée. Une seule structure HTML par pièce ;
// chaque système (planche, objet, carte) l'habille dans composants.css. Aucune dépendance.
import { useState } from 'react';

export const fmtHM = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
export const fmtDur = (d) => (d < 60 ? `${d} min` : `${Math.floor(d / 60)} h${d % 60 ? ` ${String(d % 60).padStart(2, '0')}` : ''}`);

const dots = [5, 10, 15].flatMap((y) => [7, 13].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" fill="currentColor" stroke="none" />));
const PATHS = {
  check: <path d="M4.5 10.5l3.5 3.5 7.5-8" />,
  send: (
    <>
      <path d="M3.5 10h11" />
      <path d="M10.5 5.5 15 10l-4.5 4.5" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 6h11" />
      <path d="M8 6V4.5h4V6" />
      <path d="M6 6l.7 9.5h6.6L14 6" />
    </>
  ),
  clock: (
    <>
      <circle cx="10" cy="10" r="6.2" />
      <path d="M10 6.8V10l2.3 1.6" />
    </>
  ),
  undo: (
    <>
      <path d="M7.5 6 4.5 9l3 3" />
      <path d="M4.8 9H12a3.5 3.5 0 0 1 0 7H9" />
    </>
  ),
  search: (
    <>
      <circle cx="9" cy="9" r="4.6" />
      <path d="m12.4 12.4 3.6 3.6" />
    </>
  ),
  close: <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" />,
  grip: <>{dots}</>,
  cal: (
    <>
      <rect x="3.5" y="4.5" width="13" height="12" rx="1.5" />
      <path d="M3.5 8.5h13M7 3v3M13 3v3" />
    </>
  ),
  inbox: (
    <>
      <path d="M3.5 11 5.5 4.5h9l2 6.5v4.5h-13z" />
      <path d="M3.5 11h4l1 2h3l1-2h4" />
    </>
  ),
  home: (
    <>
      <circle cx="10" cy="10" r="6.5" />
      <path d="M10 10l3-4" />
      <path d="M10 3.5v1.5M16.5 10H15M3.5 10H5" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="14" height="10" rx="1.5" />
      <path d="m3.5 6 6.5 5 6.5-5" />
    </>
  ),
  folder: <path d="M3 6.5V15h14V7.5H9.5L8 5.5H3z" />,
};

export function Icon({ name, size = 18 }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {PATHS[name]}
    </svg>
  );
}

export function Kbd({ children }) {
  const keys = String(children).split(' ');
  return (
    <span className="kbds">
      {keys.map((k) => (
        <kbd key={k} className="kbd">
          {k}
        </kbd>
      ))}
    </span>
  );
}

// Bouton à course : un socle (button) et un capuchon (.k-cap) qui s'enfonce. `force` fige un état pour la
// planche des états ; `fn` donne la couleur de fonction (système Objet) ; `silk` est l'étiquette sérigraphiée.
export function Btn({ variant = 'secondary', icon, children, kbd, silk, fn, force, loading, className = '', ...rest }) {
  return (
    <button
      type="button"
      className={`k k-${variant}${force ? ` is-${force}` : ''}${className ? ` ${className}` : ''}`}
      data-silk={silk}
      data-fn={fn}
      aria-busy={loading || undefined}
      {...rest}
    >
      <span className="k-cap">
        <span className="k-lamp" aria-hidden="true" />
        {loading ? (
          <span className="k-load" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        ) : icon ? (
          <Icon name={icon} size={16} />
        ) : null}
        {children != null ? <span className="k-label">{children}</span> : null}
        {kbd ? <Kbd>{kbd}</Kbd> : null}
      </span>
    </button>
  );
}

function moveFocus(e, next) {
  const radios = e.currentTarget.parentElement.querySelectorAll('[role="radio"]');
  radios[next]?.focus();
}

// Groupe segmenté (radiogroup) : flèches pour changer, la sélection suit le focus.
export function Seg({ label, options, value, onChange, className = '' }) {
  const i = Math.max(0, options.findIndex((o) => o.id === value));
  const n = options.length;
  const onKey = (e) => {
    let next = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % n;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + n) % n;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = n - 1;
    if (next === null) return;
    e.preventDefault();
    onChange(options[next].id);
    moveFocus(e, next);
  };
  return (
    <div role="radiogroup" aria-label={label} className={`seg ${className}`} style={{ '--i': i, '--n': n }}>
      <span className="seg-idx" aria-hidden="true" />
      {options.map((o, j) => (
        <button key={o.id} type="button" role="radio" aria-checked={j === i} tabIndex={j === i ? 0 : -1} className="seg-b" onClick={() => onChange(o.id)} onKeyDown={onKey}>
          <span className="seg-led" aria-hidden="true" />
          <span className="seg-t">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

// Compteur à rouleaux : chaque chiffre est un tambour 0-9 qui tourne (transform seulement).
export function Roll({ value, digits = 2, label }) {
  const s = String(Math.max(0, value)).padStart(digits, '0');
  return (
    <span className="roll" role="img" aria-label={label ?? String(value)}>
      {[...s].map((ch, i) => (
        <span key={i} className="roll-w" aria-hidden="true">
          <span className="roll-s" style={{ '--d': Number(ch) }}>
            {'0123456789'.split('').map((d) => (
              <span key={d}>{d}</span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}

const SEGS = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
const POLY = {
  a: '2.5,1 9.5,1 8.3,2.4 3.7,2.4',
  b: '10.5,2 10.5,10 10,10.4 9.1,9.6 9.1,3.3',
  c: '10.5,12 10.5,20 9.1,18.7 9.1,12.4 10,11.6',
  d: '3.7,19.6 8.3,19.6 9.5,21 2.5,21',
  e: '1.5,12 2,11.6 2.9,12.4 2.9,18.7 1.5,20',
  f: '1.5,2 2.9,3.3 2.9,9.6 2,10.4 1.5,10',
  g: '3,11 4,10.3 8,10.3 9,11 8,11.7 4,11.7',
};

// Afficheur à cristaux liquides 7 segments (les segments éteints restent visibles, comme sur un vrai LCD).
export function SevenSeg({ value, digits = 2 }) {
  const s = String(Math.max(0, value)).padStart(digits, '0');
  return (
    <span className="seven" aria-hidden="true">
      {[...s].map((ch, i) => (
        <svg key={i} viewBox="0 0 12 22" className="seven-d">
          {Object.entries(POLY).map(([k, pts]) => (
            <polygon key={k} points={pts} className={SEGS[ch]?.includes(k) ? 'on' : 'off'} />
          ))}
        </svg>
      ))}
    </span>
  );
}

// Couronne de compas graduée : elle tourne avec la progression, l'arc laiton se remplit.
export function Bezel({ done, total, children }) {
  const p = total ? done / total : 1;
  return (
    <div className="bezel" style={{ '--p': p }}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="bz-track" cx="60" cy="60" r="44" />
        <circle className="bz-arc" cx="60" cy="60" r="44" pathLength="100" strokeDasharray={`${p * 100} 100`} transform="rotate(-90 60 60)" />
        <g className="bz-ring">
          {Array.from({ length: 72 }, (_, i) => (
            <line key={i} x1="60" y1={i % 6 === 0 ? 3 : 6} x2="60" y2="10" transform={`rotate(${i * 5} 60 60)`} className={i % 18 === 0 ? 'maj' : undefined} />
          ))}
          {['N', 'E', 'S', 'O'].map((c, i) => (
            <text key={c} x="60" y="21" transform={`rotate(${i * 90} 60 60)`} className="bz-c">
              {c}
            </text>
          ))}
        </g>
        <path className="bz-lubber" d="M60 13 55.5 2h9z" />
      </svg>
      <div className="bz-center">{children}</div>
    </div>
  );
}

// Case « Cocher » : un role="checkbox" dont l'intérieur change selon le système (voyant, touche, point fixé).
export function Check({ sys, checked, onChange, label, disabled, kbd }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} disabled={disabled} className="chk" onClick={() => onChange(!checked)}>
      <span className="chk-box" aria-hidden="true">
        {sys === 'carte' ? (
          <svg viewBox="0 0 24 24">
            <path className="chk-x" d="M12 .5v5M12 18.5v5M.5 12h5M18.5 12h5" />
            <circle className="chk-ring" cx="12" cy="12" r="7.5" pathLength="1" />
            <circle className="chk-dot" cx="12" cy="12" r="2.4" />
          </svg>
        ) : sys === 'objet' ? (
          <span className="chk-dot" />
        ) : (
          <span className="chk-legend">Fait</span>
        )}
      </span>
      <span className="chk-label">{label}</span>
      {kbd ? <Kbd>{kbd}</Kbd> : null}
    </button>
  );
}

export function Chip({ kind, children, time }) {
  return (
    <span className={`chip chip-${kind}`}>
      <span className="chip-mark" aria-hidden="true" />
      <span className="chip-t">{children}</span>
      {time ? <span className="chip-time">{time}</span> : null}
    </span>
  );
}

// Voyant annonciateur : allumé ou éteint, une teinte par sens (ambre en cours, rouge alerte, vert prêt).
export function Ann({ tone = 'amber', on, children }) {
  return (
    <span className="ann" data-tone={tone} data-on={on ? 'true' : 'false'}>
      {children}
    </span>
  );
}

// Interrupteur à capot rouge (Planche) : le capot se lève au survol ou au focus, un clic bascule le levier.
// Pas de confirmation : la suppression se rattrape par Annuler.
export function GuardSwitch({ onFire, label = 'Supprimer', disabled, force, kbd }) {
  const [thrown, setThrown] = useState(false);
  const fire = () => {
    if (thrown) return;
    setThrown(true);
    setTimeout(() => {
      setThrown(false);
      onFire?.();
    }, 140);
  };
  return (
    <button type="button" className={`guard${thrown ? ' is-thrown' : ''}${force ? ` is-${force}` : ''}`} onClick={fire} disabled={disabled}>
      <span className="guard-unit" aria-hidden="true">
        <span className="guard-base">
          <span className="guard-lever" />
        </span>
        <span className="guard-cover" />
      </span>
      <span className="guard-label">{label}</span>
      {kbd ? <Kbd>{kbd}</Kbd> : null}
    </button>
  );
}

function sliderKeys(e, value, n, onChange, onCommit) {
  let next = null;
  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = Math.min(n - 1, value + 1);
  if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = Math.max(0, value - 1);
  if (e.key === 'Home') next = 0;
  if (e.key === 'End') next = n - 1;
  if (e.key === 'Enter') {
    e.preventDefault();
    onCommit?.();
    return;
  }
  if (next === null) return;
  e.preventDefault();
  onChange(next);
}

// Molette crantée (Planche) : on la tourne à la souris ou au doigt, elle tombe sur le cran le plus proche.
export function Knob({ choices, value, onChange, onCommit, label }) {
  const n = choices.length;
  const SPAN = 240;
  const angleOf = (i) => -SPAN / 2 + (i * SPAN) / (n - 1);
  const pick = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const deg = (Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180) / Math.PI;
    const a = Math.max(-SPAN / 2, Math.min(SPAN / 2, deg));
    onChange(Math.round(((a + SPAN / 2) / SPAN) * (n - 1)));
  };
  return (
    <div className="knob-dial">
      {choices.map((c, i) => (
        <span key={c.short} className="knob-mark" data-on={i === value ? 'true' : 'false'} style={{ '--a': `${angleOf(i)}deg` }} onPointerDown={() => onChange(i)} aria-hidden="true">
          <span>{c.short}</span>
        </span>
      ))}
      <div
        className="knob"
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={n - 1}
        aria-valuenow={value}
        aria-valuetext={choices[value].label}
        style={{ '--a': `${angleOf(value)}deg` }}
        onKeyDown={(e) => sliderKeys(e, value, n, onChange, onCommit)}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          pick(e);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) pick(e);
        }}
      >
        <span className="knob-cap">
          <span className="knob-ptr" />
        </span>
      </div>
    </div>
  );
}

// Règle graduée à index (Carte) : l'index glisse et se cale sur la graduation majeure la plus proche.
export function Ruler({ choices, value, onChange, onCommit, label }) {
  const n = choices.length;
  const m = n - 1;
  const pick = (e) => {
    const track = e.currentTarget.querySelector('.ruler-track').getBoundingClientRect();
    const r = Math.max(0, Math.min(1, (e.clientX - track.left) / track.width));
    onChange(Math.round(r * m));
  };
  return (
    <div
      className="ruler"
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={m}
      aria-valuenow={value}
      aria-valuetext={choices[value].label}
      onKeyDown={(e) => sliderKeys(e, value, n, onChange, onCommit)}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        pick(e);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) pick(e);
      }}
    >
      <div className="ruler-track" style={{ '--i': value, '--m': m }}>
        <div className="ruler-ticks" aria-hidden="true">
          {Array.from({ length: m * 4 + 1 }, (_, t) => (
            <span key={t} className={t % 4 === 0 ? 'maj' : undefined} style={{ left: `${(t / (m * 4)) * 100}%` }} />
          ))}
        </div>
        <div className="ruler-labels" aria-hidden="true">
          {choices.map((c, i) => (
            <span key={c.short} data-on={i === value ? 'true' : 'false'} style={{ left: `${(i / m) * 100}%` }}>
              {c.short}
            </span>
          ))}
        </div>
        <div className="ruler-idx" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}
