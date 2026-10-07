'use client';

// Déclinaisons de Cadran sur des maquettes : rail latéral (calqué sur components/RailClient.js :
// largeur 14 rem, en-tête px-3.5 pt-5 pb-4, repère de 36 px, libellé de 15 px, rail replié de 4,25 rem,
// barre mobile de 48 px), onglet de navigateur, écran de démarrage animé, bande d'états.
// Tout est en lecture seule : rien n'est enregistré.
import { useState } from 'react';
import { Sym, Word, railSw } from './Logo';
import { STATES } from './content';
import { tileSvg } from './marques.js';

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
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
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

export function RailMock({ id, state, toRanger, projects, compact = false }) {
  return (
    <aside
      aria-label={`Maquette du rail latéral${compact ? ' replié' : ''}`}
      className="flex shrink-0 flex-col overflow-hidden border border-[var(--border)] bg-[var(--surface)]"
      style={{ width: compact ? 68 : 224, minHeight: 360, borderRadius: 'var(--radius)' }}
    >
      <div className={`flex items-center gap-3 px-3.5 pt-5 pb-4 text-[var(--text)] ${compact ? 'justify-center' : ''}`}>
        <Sym id={id} state={state} small size={36} title="Cadran" />
        {!compact && <Word id={id} height={16} sw={railSw(id)} />}
      </div>
      <ul className="flex flex-col gap-0.5 px-2.5 py-2">
        {NAV.map((it) => (
          <li
            key={it.id}
            className={`flex items-center gap-3 rounded-md py-2 text-[14px] ${compact ? 'justify-center px-0' : 'px-3'} ${
              it.active ? 'bg-[var(--surface-2)] text-[var(--text)]' : 'text-[var(--text-muted)]'
            }`}
          >
            <NavIcon id={it.id} />
            {!compact && <span className="min-w-0 flex-1 truncate">{it.label}</span>}
            {!compact && it.badge && (
              <span className="rounded-full bg-[var(--accent-soft)] px-1.5 py-0.5 font-mono text-[11px] leading-none text-[var(--accent)]">{toRanger}</span>
            )}
          </li>
        ))}
      </ul>
      {!compact && projects.length > 0 && (
        <>
          <p className="mt-2 px-5 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-faint)]">Projets</p>
          <ul className="flex flex-col gap-0.5 px-2.5 py-2">
            {projects.slice(0, 4).map((p) => (
              <li key={p.slug} className="flex items-center gap-2 rounded-md px-3 py-1.5 text-[13px] text-[var(--text-muted)]">
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

// Barre du haut sur téléphone (RailClient : h-12, bouton menu, titre de 15 px).
export function MobileBarMock({ id, state }) {
  return (
    <div
      className="flex h-12 w-full max-w-[375px] items-center gap-2 border border-[var(--border)] bg-[var(--surface)] px-2 text-[var(--text)]"
      style={{ borderRadius: 'var(--radius)' }}
      role="img"
      aria-label="Maquette de la barre du haut sur téléphone"
    >
      <span className="flex size-9 items-center justify-center text-[var(--text-muted)]">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
          {NAV_ICONS.menu}
        </svg>
      </span>
      <Sym id={id} state={state} small size={26} title="Cadran" />
      <Word id={id} height={14} sw={railSw(id)} />
    </div>
  );
}

// ---------- onglet de navigateur ----------

const CHROMES = [
  { key: 'sombre', bar: '#202124', tab: '#35363a', text: '#e8eaed', dim: '#9aa0a6' },
  { key: 'clair', bar: '#dee1e6', tab: '#ffffff', text: '#202124', dim: '#5f6368' },
];

export function TabsMock({ id, state, colors }) {
  const uri = (pad) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(tileSvg(id, state, colors, { small: true, pad }))}`;
  return (
    <div className="grid gap-3">
      {CHROMES.map((c) => (
        <div key={c.key} className="overflow-hidden rounded-t-lg" style={{ background: c.bar }}>
          <div className="flex items-end gap-1 px-2 pt-2">
            <div className="flex h-8 min-w-0 max-w-[220px] flex-1 items-center gap-2 rounded-t-lg px-3 text-[12px]" style={{ background: c.tab, color: c.text }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={uri(0.06)} width={16} height={16} alt="Favicon de l’onglet" className="shrink-0" />
              <span className="truncate">Cadran</span>
              <span className="ml-auto shrink-0" style={{ color: c.dim }} aria-hidden="true">
                x
              </span>
            </div>
            <div className="flex h-8 items-center px-3 text-[12px]" style={{ color: c.dim }}>
              Autre onglet
            </div>
          </div>
          <div className="h-2" style={{ background: c.tab }} />
        </div>
      ))}
    </div>
  );
}

// ---------- écran de démarrage ----------

export function BootScreen({ id, state, dateLabel, toRanger }) {
  const [run, setRun] = useState(0);
  return (
    <div className="relative flex min-h-[340px] flex-col items-center justify-center gap-5 overflow-hidden border border-[var(--border)] bg-[var(--bg)] px-4 py-10 text-[var(--text)]" style={{ borderRadius: 'var(--radius)' }}>
      <button
        type="button"
        onClick={() => setRun((r) => r + 1)}
        className="absolute right-3 top-3 rounded-[var(--radius-sm)] border border-[var(--border-strong)] px-2.5 py-1 text-[12px] text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
      >
        Rejouer
      </button>
      <div key={run} className="grid justify-items-center gap-5">
        <Sym id={id} state={state} size={112} anim title="Symbole de Cadran en cours d’apparition" />
        <div className="cadran-fade" style={{ animationDelay: '900ms' }}>
          <Word id={id} height={28} />
        </div>
        <div className="cadran-fade grid justify-items-center gap-1 text-center" style={{ animationDelay: '1500ms' }}>
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-faint)]">{dateLabel}</p>
          <p className="text-[14px] text-[var(--text-muted)]">
            {toRanger > 0 ? `${toRanger} élément${toRanger > 1 ? 's' : ''} à ranger avant de commencer` : 'Tout est rangé, la journée est à vous'}
          </p>
          <span className="mt-2 rounded-[var(--radius-sm)] bg-[var(--accent)] px-4 py-2 text-[13px] font-medium text-[var(--accent-contrast)]">
            {toRanger > 0 ? 'Commencer le rangement' : 'Ouvrir le cockpit'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------- bande d'états ----------

export function StatesStrip({ id, base }) {
  const items = STATES[id](base);
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-3">
      {items.map((it) => (
        <li key={it.label} className="grid justify-items-center gap-1.5 text-[var(--text)]">
          <Sym id={id} state={it.state} size={52} title={it.label} />
          <span className="font-mono text-[11px] text-[var(--text-faint)]">{it.label}</span>
        </li>
      ))}
    </ul>
  );
}
