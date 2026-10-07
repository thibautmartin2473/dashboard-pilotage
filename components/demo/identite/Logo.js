// Rendu React des logos de l'axe Identité (les dessins viennent de logos.js et glyphs.js).
// Encre = currentColor, accent = var(--accent) de la charte, donc le logo suit la charte et le mode.
import { symbolPrims, lockupLayout, ACCENT, INK } from './logos.js';
import { STROKE } from './glyphs.js';

function Prim({ p, mono }) {
  const color = mono || (p.role ?? INK) === INK ? 'currentColor' : 'var(--accent)';
  const common = p.fill
    ? { fill: color, opacity: p.op }
    : { fill: 'none', stroke: color, strokeWidth: p.sw ?? STROKE, strokeDasharray: p.dash, opacity: p.op };
  if (p.k === 'path') return <path d={p.d} {...common} />;
  if (p.k === 'circle') return <circle cx={p.cx} cy={p.cy} r={p.r} {...common} />;
  return <rect x={p.x} y={p.y} width={p.w} height={p.h} {...common} />;
}

const LINES = Array.from({ length: 17 }, (_, i) => i * 4);

function Grid() {
  return (
    <g aria-hidden="true" stroke="currentColor" strokeWidth="0.35" fill="none">
      {LINES.map((n) => (
        <g key={n} opacity={n % 16 === 0 ? 0.4 : 0.14}>
          <path d={`M${n} 0 V64`} />
          <path d={`M0 ${n} H64`} />
        </g>
      ))}
    </g>
  );
}

// Le symbole seul, sur 64 unités. size en px (largeur = hauteur).
export function SymbolMark({ id, v, small = false, size = 64, mono = false, grid = false, title, className = '', style }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label={title ?? id}
      className={`block h-auto max-w-full shrink-0 ${className}`}
      style={style}
    >
      {grid && <Grid />}
      <g strokeLinecap="butt" strokeLinejoin="miter">
        {symbolPrims(id, v, small).map((p, i) => (
          <Prim key={i} p={p} mono={mono} />
        ))}
      </g>
    </svg>
  );
}

// Symbole et logotype : height = hauteur du symbole en px, la largeur suit.
export function Lockup({ id, name, v, height = 48, mono = false, className = '', style }) {
  const { wm, x0, width, oy } = lockupLayout(name);
  return (
    <svg
      viewBox={`0 0 ${width} 64`}
      width={Math.round((height * width) / 64)}
      height={height}
      role="img"
      aria-label={name}
      className={`block h-auto max-w-full shrink-0 ${className}`}
      style={style}
    >
      <g strokeLinecap="butt" strokeLinejoin="miter">
        {symbolPrims(id, v, false).map((p, i) => (
          <Prim key={i} p={p} mono={mono} />
        ))}
      </g>
      <g transform={`translate(${x0} ${oy})`} strokeLinecap="butt" strokeLinejoin="miter">
        {wm.glyphs.map((g) => (
          <g key={g.x} transform={`translate(${g.x} 0)`}>
            {g.prims.map((p, i) => (
              <Prim key={i} p={{ ...p, role: INK }} mono />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}

// Logotype seul (cartes des noms non dessinés en symbole).
export function Wordmark({ name, height = 40, className = '' }) {
  const { wm } = lockupLayout(name);
  const vh = name.toLowerCase().includes('j') ? 62 : 44; // la descendante du j demande 18 unités de plus
  return (
    <svg
      viewBox={`0 0 ${wm.width} ${vh}`}
      width={Math.round((height * wm.width) / vh)}
      height={height}
      role="img"
      aria-label={name}
      className={`block h-auto max-w-full shrink-0 ${className}`}
    >
      <g strokeLinecap="butt" strokeLinejoin="miter">
        {wm.glyphs.map((g) => (
          <g key={g.x} transform={`translate(${g.x} 0)`}>
            {g.prims.map((p, i) => (
              <Prim key={i} p={{ ...p, role: INK }} mono />
            ))}
          </g>
        ))}
      </g>
    </svg>
  );
}

// Icône d'application : carré arrondi + symbole (variante petite sous 40 px).
export function AppTile({ id, v, size = 64, bg = 'var(--surface-2)', mono = false, border = true, className = '' }) {
  const small = size <= 40;
  const inner = size <= 20 ? 0.88 : 0.76; // un favicon n'a pas de marge à perdre
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        background: bg,
        boxShadow: border ? 'inset 0 0 0 1px var(--border-strong)' : undefined,
      }}
    >
      <SymbolMark id={id} v={v} small={small} size={Math.round(size * inner)} mono={mono} />
    </span>
  );
}

export { ACCENT };
