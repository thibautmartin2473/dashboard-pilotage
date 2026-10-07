'use client';

// Déclinaisons de l'axe Identité sur des maquettes : rail latéral (calqué sur components/RailClient.js),
// écran de démarrage animé, onglet de navigateur, loupe à pixels (rastérisation réelle à 16 et 32 px),
// états vivants, icônes d'application et monochromes. Tout est en lecture seule, rien n'est enregistré.
import { useEffect, useRef, useState } from 'react';
import { Lockup, SymbolMark, Wordmark, AppTile } from './Logo';
import { symbolPrims, tileSvg, symbolSvg, STATES, describeState, INK } from './logos';
import { STROKE } from './glyphs';

const clamp = (v) => Math.min(1, Math.max(0, v));

// ---------- rail latéral ----------

const NAV_ICONS = {
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
};

const NAV = [
  { id: 'cockpit', label: 'Cockpit', active: true },
  { id: 'ranger', label: 'À ranger', badge: true },
  { id: 'agenda', label: 'Agenda' },
  { id: 'mails', label: 'Mails' },
  { id: 'idees', label: 'Idées et notes' },
];

function NavIcon({ id }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      {NAV_ICONS[id]}
    </svg>
  );
}

export function RailMock({ id, name, v, projects, toRanger, compact = false }) {
  return (
    <aside
      aria-label={`Maquette du rail latéral${compact ? ' replié' : ''}`}
      className="flex shrink-0 flex-col overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]"
      style={{ width: compact ? 68 : 224, minHeight: 420 }}
    >
      <div className={`flex h-14 items-center border-b border-[var(--border)] ${compact ? 'justify-center' : 'px-3'} text-[var(--text)]`}>
        {compact ? <SymbolMark id={id} v={v} small size={32} title={name} /> : <Lockup id={id} name={name.toLowerCase()} v={v} height={30} />}
      </div>
      <ul className="flex flex-col gap-0.5 p-2">
        {NAV.map((it) => (
          <li
            key={it.id}
            className={`relative flex items-center gap-3 rounded-[var(--radius-sm)] py-2 text-[14px] ${compact ? 'justify-center px-0' : 'px-3'} ${
              it.active ? 'bg-[var(--surface-2)] text-[var(--text)]' : 'text-[var(--text-muted)]'
            }`}
          >
            {it.active && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-[var(--accent)]" aria-hidden="true" />}
            <NavIcon id={it.id} />
            {!compact && <span className="min-w-0 flex-1 truncate">{it.label}</span>}
            {!compact && it.badge && (
              <span className="rounded-full bg-[var(--accent-soft)] px-1.5 py-0.5 font-mono text-[11px] leading-none text-[var(--accent)]">{toRanger}</span>
            )}
          </li>
        ))}
      </ul>
      {!compact && (
        <>
          <p className="mt-2 px-5 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-faint)]">Projets</p>
          <ul className="flex flex-col gap-0.5 p-2">
            {projects.slice(0, 5).map((p) => (
              <li key={p.slug} className="flex items-center gap-2 rounded-[var(--radius-sm)] px-3 py-1.5 text-[13px] text-[var(--text-muted)]">
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                <span className="font-mono text-[11px] text-[var(--text-faint)]">
                  {p.done}/{p.total}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  );
}

// ---------- écran de démarrage (ouverture du rituel de rangement) ----------

const TOTAL = 3000;
const ease = (t) => 1 - (1 - t) ** 3;

function BootSymbol({ id, target, e, size }) {
  const vNow = id === 'balise' ? (e > 2100 ? target : 0) : target * ease(clamp((e - 800) / 1300));
  const prims = symbolPrims(id, vNow, false);
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="Symbole en cours d’apparition" className="block">
      <g strokeLinecap="butt" strokeLinejoin="miter">
        {prims.map((p, i) => {
          const prog = clamp((e - i * 150) / 520);
          const color = (p.role ?? INK) === INK ? 'currentColor' : 'var(--accent)';
          const solid = !p.fill && !p.dash;
          const common = p.fill
            ? { fill: color, opacity: prog * (p.op ?? 1) }
            : {
                fill: 'none',
                stroke: color,
                strokeWidth: p.sw ?? STROKE,
                ...(solid
                  ? { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - prog, opacity: p.op }
                  : { strokeDasharray: p.dash, opacity: prog * (p.op ?? 1) }),
              };
          if (p.k === 'path') return <path key={i} d={p.d} {...common} />;
          if (p.k === 'circle') return <circle key={i} cx={p.cx} cy={p.cy} r={p.r} {...common} />;
          return <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} {...common} />;
        })}
      </g>
    </svg>
  );
}

export function BootScreen({ id, name, v, dateLabel, toRanger }) {
  const [run, setRun] = useState(0);
  const [e, setE] = useState(0);
  useEffect(() => {
    let raf;
    let t0;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tick = (ts) => {
      if (t0 === undefined) t0 = ts;
      const el = reduce ? TOTAL : ts - t0;
      setE(el);
      if (el < TOTAL) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, id]);
  const replay = () => {
    setE(0);
    setRun((r) => r + 1);
  };
  const text = clamp((e - 1700) / 500);
  return (
    <div className="relative flex min-h-[340px] flex-col items-center justify-center gap-5 overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-4 py-10 text-[var(--text)]">
      <button
        type="button"
        onClick={replay}
        className="absolute right-3 top-3 rounded-[var(--radius-sm)] border border-[var(--border-strong)] px-2.5 py-1 text-[12px] text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
      >
        Rejouer
      </button>
      <BootSymbol id={id} target={v} e={e} size={112} />
      <div style={{ opacity: clamp((e - 1000) / 500) }}>
        <Wordmark name={name.toLowerCase()} height={30} />
      </div>
      <div className="grid justify-items-center gap-1 text-center" style={{ opacity: text, transform: `translateY(${(1 - text) * 6}px)` }}>
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-faint)]">{dateLabel}</p>
        <p className="text-[14px] text-[var(--text-muted)]">
          {toRanger > 0 ? `${toRanger} élément${toRanger > 1 ? 's' : ''} à ranger avant de commencer` : 'Tout est rangé, la journée est à vous'}
        </p>
        <span className="mt-2 rounded-[var(--radius-sm)] bg-[var(--accent)] px-4 py-2 text-[13px] font-medium text-[var(--accent-contrast)]">
          {toRanger > 0 ? 'Commencer le rangement' : 'Ouvrir le cockpit'}
        </span>
      </div>
    </div>
  );
}

// ---------- onglet de navigateur ----------

const CHROMES = [
  { key: 'sombre', bar: '#202124', tab: '#35363a', text: '#e8eaed', dim: '#9aa0a6', url: '#171717' },
  { key: 'clair', bar: '#dee1e6', tab: '#ffffff', text: '#202124', dim: '#5f6368', url: '#f1f3f4' },
];

function BrowserTab({ id, v, name, c }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-sm)]" style={{ background: c.bar }}>
      <div className="flex items-end gap-1 px-2 pt-2">
        <div className="flex h-9 min-w-0 flex-[1.4] items-center gap-2 rounded-t-lg px-3 text-[12px]" style={{ background: c.tab, color: c.text }}>
          <AppTile id={id} v={v} size={16} bg="var(--bg)" border={false} className="!rounded-[3px]" />
          <span className="min-w-0 flex-1 truncate">{name} : Aujourd’hui</span>
          <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke={c.dim} strokeWidth="1.4" aria-hidden="true">
            <path d="M2 2l8 8M10 2l-8 8" />
          </svg>
        </div>
        <div className="flex h-8 min-w-0 flex-1 items-center px-3 text-[12px]" style={{ color: c.dim }}>
          <span className="truncate">Mails</span>
        </div>
        <div className="hidden h-8 min-w-0 flex-1 items-center px-3 text-[12px] sm:flex" style={{ color: c.dim }}>
          <span className="truncate">Spircle</span>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-2" style={{ background: c.tab }}>
        <span className="min-w-0 flex-1 truncate rounded-full px-3 py-1 text-[12px]" style={{ background: c.url, color: c.dim }}>
          localhost:3000
        </span>
      </div>
    </div>
  );
}

export function BrowserTabs({ id, v, name }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {CHROMES.map((c) => (
        <div key={c.key}>
          <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-faint)]">Navigateur {c.key}</p>
          <BrowserTab id={id} v={v} name={name} c={c} />
        </div>
      ))}
    </div>
  );
}

// ---------- loupe : vraie rastérisation à 16 ou 32 px, agrandie sans lissage ----------

export function PixelLoupe({ id, v, px = 16, scale = 8, tile = true, themeKey }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return undefined;
    const cs = getComputedStyle(cv);
    const colors = { ink: cs.getPropertyValue('--text').trim(), accent: cs.getPropertyValue('--accent').trim(), bg: cs.getPropertyValue('--bg').trim() };
    const svg = tile ? tileSvg(id, v, colors, { small: true, pad: px <= 20 ? 0.06 : 0.12 }) : symbolSvg(id, v, colors, { small: true });
    const img = new Image();
    let dead = false;
    img.onload = () => {
      if (dead) return;
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, px, px);
      ctx.drawImage(img, 0, 0, px, px);
    };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    return () => {
      dead = true;
    };
  }, [id, v, px, tile, themeKey]);
  return (
    <canvas
      ref={ref}
      width={px}
      height={px}
      role="img"
      aria-label={`Rendu réel à ${px} pixels`}
      className="block rounded-[var(--radius-sm)] border border-[var(--border)]"
      style={{ width: px * scale, height: px * scale, imageRendering: 'pixelated' }}
    />
  );
}

// ---------- états vivants ----------

export function StatesStrip({ id, themeKey }) {
  const list = STATES[id];
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {list.map((val) => (
        <li key={val} className="flex flex-col items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-3 text-center text-[var(--text)]">
          <SymbolMark id={id} v={val} size={64} />
          <span className="flex items-center gap-2">
            <SymbolMark id={id} v={val} small size={16} />
            <PixelLoupe id={id} v={val} px={16} scale={2} tile={false} themeKey={themeKey} />
          </span>
          <span className="text-[11px] leading-snug text-[var(--text-muted)]">{describeState(id, val, { project: 'du jour' })}</span>
        </li>
      ))}
    </ul>
  );
}

// ---------- icônes d'application et monochromes ----------

export function AppIcons({ id, v, themeKey }) {
  return (
    <div className="flex flex-wrap items-end gap-6">
      {[64, 32, 16].map((s) => (
        <figure key={s} className="flex flex-col items-center gap-2">
          <AppTile id={id} v={v} size={s} />
          <figcaption className="font-mono text-[11px] text-[var(--text-faint)]">{s} px</figcaption>
        </figure>
      ))}
      <figure className="flex flex-col items-center gap-2">
        <PixelLoupe id={id} v={v} px={16} scale={8} themeKey={themeKey} />
        <figcaption className="font-mono text-[11px] text-[var(--text-faint)]">16 px, pixels réels x8</figcaption>
      </figure>
      <figure className="flex flex-col items-center gap-2">
        <PixelLoupe id={id} v={v} px={32} scale={4} themeKey={themeKey} />
        <figcaption className="font-mono text-[11px] text-[var(--text-faint)]">32 px, pixels réels x4</figcaption>
      </figure>
    </div>
  );
}

const MONOS = [
  { label: 'Blanc sur le fond de la charte', style: { background: 'var(--bg)', color: 'var(--text)' } },
  { label: 'Noir sur clair', style: { background: '#f3f4f6', color: '#14171c' } },
  { label: 'Sur l’accent', style: { background: 'var(--accent)', color: 'var(--accent-contrast)' } },
];

export function MonoPanels({ id, name, v }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {MONOS.map((m) => (
        <figure key={m.label} className="flex flex-col gap-2">
          <div className="flex min-h-[110px] items-center justify-center gap-4 rounded-[var(--radius-sm)] border border-[var(--border)] px-3" style={m.style}>
            <SymbolMark id={id} v={v} mono size={56} />
            <Lockup id={id} name={name.toLowerCase()} v={v} mono height={32} className="hidden sm:block" />
          </div>
          <figcaption className="text-[12px] text-[var(--text-muted)]">{m.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}
