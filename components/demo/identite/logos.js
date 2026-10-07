// Axe Identité : les six noms, les quatre symboles (dessinés à la main, en primitives SVG) et leurs
// sérialisations. Ce module est pur (aucun React) : la page l'utilise, et le script d'export des
// fichiers public/demo/logos/*.svg aussi, donc le fichier exporté et la page montrent le même dessin.
//
// Construction commune des symboles : boîte de 64, grille de 4, trait unique de 4 (6 pour la variante
// « petite » lisible à 16 et 32 px), trois formes au plus, aucun dégradé, aucune lettre.
// Chaque symbole porte une information vivante, pilotée par une valeur v entre 0 et 1.
import { wordmark, STROKE, WORD_H } from './glyphs.js';

export const INK = 'ink';
export const ACCENT = 'accent';
export const LOCKUP_GAP = 24;

const circle = (cx, cy, r, o = {}) => ({ k: 'circle', cx, cy, r, ...o });
const path = (d, o = {}) => ({ k: 'path', d, ...o });
const rect = (x, y, w, h, o = {}) => ({ k: 'rect', x, y, w, h, ...o });
const f = (n) => Math.round(n * 100) / 100;
const clamp = (v) => Math.min(1, Math.max(0, v));

// Estime : un point de départ, la trace parcourue, l'anneau « maintenant », le pointillé à estimer.
function estime(v, small) {
  // Route à l'estime : deux segments (un changement de cap), pour ne pas lire une loupe.
  const S = [10, 52];
  const A = [30, 52];
  const E = [50, 16];
  const L1 = 20;
  const L2 = Math.hypot(E[0] - A[0], E[1] - A[1]);
  const L = L1 + L2;
  const sw = small ? 6 : 4;
  const rr = small ? 9 : 8;
  const d = clamp(v) * L;
  const pt = (t) => (t <= L1 ? [S[0] + t, S[1]] : [A[0] + ((E[0] - A[0]) * (t - L1)) / L2, A[1] + ((E[1] - A[1]) * (t - L1)) / L2]);
  const sub = (t0, t1) => {
    const pts = [pt(t0)];
    if (t0 < L1 && t1 > L1) pts.push(A);
    pts.push(pt(t1));
    return 'M' + pts.map((p) => f(p[0]) + ' ' + f(p[1])).join(' L');
  };
  const P = pt(d);
  const prims = [circle(S[0], S[1], small ? 5 : 4, { role: INK, fill: true })];
  if (d > rr) prims.push(path(sub(0, d - rr), { role: INK, sw }));
  // Le pointillé estimé disparaît en variante petite : à 16 px il ne fait qu'une poussière.
  if (!small && L - d > rr + 4) prims.push(path(sub(d + rr, L), { role: INK, sw, dash: '4 5' }));
  prims.push(circle(f(P[0]), f(P[1]), rr, { role: ACCENT, sw }));
  return prims;
}

// Cadran : un arc de 270 degrés, une aiguille (le nombre à ranger), un moyeu.
function cadran(v, small) {
  const sw = small ? 6 : 4;
  const a = ((135 + 270 * clamp(v)) * Math.PI) / 180;
  const len = small ? 17 : 16;
  return [
    path('M15.03 48.97 A24 24 0 1 1 48.97 48.97', { role: INK, sw }),
    path(`M32 32 L${f(32 + len * Math.cos(a))} ${f(32 + len * Math.sin(a))}`, { role: ACCENT, sw }),
    circle(32, 32, small ? 7 : 6, { role: INK, fill: true }),
  ];
}

// Balise : un losange (plein = il reste à ranger, creux = journée rangée), un mât, une ligne de flottaison.
function balise(v, small) {
  const sw = small ? 6 : 4;
  const full = v >= 0.5;
  const diamond = full
    ? path('M32 3 L47 18 L32 33 L17 18 Z', { role: ACCENT, fill: true })
    : path(small ? 'M32 7 L43 18 L32 29 L21 18 Z' : 'M32 6 L44 18 L32 30 L20 18 Z', { role: ACCENT, sw });
  return [diamond, path('M32 33 V56', { role: INK, sw }), path(small ? 'M6 56 H58' : 'M8 56 H56', { role: INK, sw })];
}

// Jalon : une perche à bandes (5, ou 3 en petite taille), les bandes atteintes sont pleines, le sol.
function jalon(v, small) {
  const n = small ? 3 : 5;
  const done = Math.round(clamp(v) * n);
  const prims = [];
  for (let i = 0; i < n; i += 1) {
    const reached = i >= n - done;
    const o = { role: reached ? ACCENT : INK, fill: true, ...(reached ? {} : { op: 0.3 }) };
    prims.push(small ? rect(24, 4 + 16 * i, 16, 10, o) : rect(26, 6 + 10 * i, 12, 6, o));
  }
  prims.push(path(small ? 'M8 54 H56' : 'M12 56 H52', { role: INK, sw: small ? 6 : 4 }));
  return prims;
}

const BUILD = { estime, cadran, balise, jalon };

// Primitives d'un symbole pour une valeur v (0 à 1) ; small = variante lisible à 16 et 32 px.
export function symbolPrims(id, v, small = false) {
  return BUILD[id](v, small);
}

// Valeurs types de chaque symbole (pour les exports et la bande d'états).
export const STATES = {
  estime: [0, 0.25, 0.5, 0.75, 1],
  cadran: [0, 0.3, 0.6, 1],
  balise: [1, 0],
  jalon: [0, 0.4, 0.6, 0.8, 1],
};
export const EXPORT_VALUE = { estime: 0.55, cadran: 0.6, balise: 1, jalon: 0.6 };

// Libellé de l'état vivant (texte visible).
export function describeState(id, v, extra = {}) {
  if (id === 'estime') {
    const m = Math.round(7 * 60 + clamp(v) * 16 * 60);
    return `Anneau à ${String(Math.floor(m / 60)).padStart(2, '0')} h ${String(m % 60).padStart(2, '0')} sur une journée de 7 h à 23 h`;
  }
  if (id === 'cadran') {
    const n = Math.round(clamp(v) * 10);
    return `${n} élément${n > 1 ? 's' : ''} à ranger (le cadran est plein à 10)`;
  }
  if (id === 'balise') return v >= 0.5 ? 'Il reste des éléments à ranger : losange plein' : 'Tout est rangé : losange creux';
  const n = Math.round(clamp(v) * 5);
  return `${n} jalon${n > 1 ? 's' : ''} atteint${n > 1 ? 's' : ''} sur 5${extra.project ? ` (projet ${extra.project})` : ''}`;
}

// Ce que l'utilisateur règle avec le curseur, par symbole.
export const SLIDER = {
  estime: { label: 'Heure de la journée', step: 0.01 },
  cadran: { label: 'Éléments à ranger', step: 0.1 },
  balise: { label: 'Il reste à ranger', step: 1 },
  jalon: { label: 'Jalons atteints', step: 0.2 },
};

// Logotype posé à côté du symbole : même trait, même grille, centré sur la hauteur d'x.
export function lockupLayout(name) {
  const wm = wordmark(name);
  const x0 = 64 + LOCKUP_GAP;
  return { wm, x0, width: x0 + wm.width, height: 64, oy: 2 };
}

// ---------- sérialisation texte (exports et favicon dynamique) ----------

const col = (role, c) => (c.mono || role === INK ? c.ink : c.accent);

function primToSvg(p, c, sw0 = STROKE) {
  const color = col(p.role ?? INK, c);
  const op = p.op ? ` opacity="${p.op}"` : '';
  const paint = p.fill
    ? `fill="${color}"${op}`
    : `fill="none" stroke="${color}" stroke-width="${p.sw ?? sw0}"${p.dash ? ` stroke-dasharray="${p.dash}"` : ''}${op}`;
  if (p.k === 'path') return `<path d="${p.d}" ${paint}/>`;
  if (p.k === 'circle') return `<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}" ${paint}/>`;
  return `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" ${paint}/>`;
}

function wordToSvg(name, c, x0, oy) {
  const { wm } = lockupLayout(name);
  const glyphs = wm.glyphs
    .map((g) => `<g transform="translate(${g.x} 0)">${g.prims.map((p) => primToSvg({ ...p, role: INK }, c)).join('')}</g>`)
    .join('');
  return `<g transform="translate(${x0} ${oy})" stroke-linecap="butt" stroke-linejoin="miter">${glyphs}</g>`;
}

const head = (w, h, title, c) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * 2}" height="${h * 2}" role="img" aria-label="${title}" style="color:${c.ink}"><title>${title}</title>`;

// colors : { ink, accent, bg?, mono? } (valeurs CSS ; accent peut être var(--accent, #...)).
export function symbolSvg(id, v, colors, { small = false, title } = {}) {
  const prims = symbolPrims(id, v, small).map((p) => primToSvg(p, colors)).join('');
  return `${head(64, 64, title ?? id, colors)}<g stroke-linecap="butt" stroke-linejoin="miter">${prims}</g></svg>\n`;
}

export function lockupSvg(id, name, v, colors) {
  const { width, height, x0, oy } = lockupLayout(name);
  const prims = symbolPrims(id, v, false).map((p) => primToSvg(p, colors)).join('');
  return `${head(width, height, name, colors)}<g stroke-linecap="butt" stroke-linejoin="miter">${prims}</g>${wordToSvg(name, colors, x0, oy)}</svg>\n`;
}

// Icône d'app / favicon : carré arrondi plein + symbole (petit) à 76 %.
export function tileSvg(id, v, colors, { small = true, title, pad = 0.12 } = {}) {
  const prims = symbolPrims(id, v, small).map((p) => primToSvg(p, colors)).join('');
  const bg = colors.bg ?? '#0e1013';
  return `${head(64, 64, title ?? id, colors)}<rect width="64" height="64" rx="14" fill="${bg}"/><g transform="translate(${f(64 * pad)} ${f(64 * pad)}) scale(${f(1 - 2 * pad)})" stroke-linecap="butt" stroke-linejoin="miter">${prims}</g></svg>\n`;
}

export { WORD_H };
