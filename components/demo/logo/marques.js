// Cadran, étape 2 : le logo. Cinq symboles dessinés à la main (primitives SVG sur une boîte de 64),
// leur logotype tracé lettre à lettre, et les sérialisations en texte SVG. Ce module est pur (aucun
// React) : la page /demo/logo l'utilise, et components/demo/logo/export.mjs écrit les fichiers
// public/demo/logos/cadran-*.svg avec les mêmes fonctions, donc fichier exporté et page montrent le
// même dessin.
//
// Chaque symbole porte un état réel, passé en second argument :
//   aiguille    minutes depuis minuit (cadran de 24 h, midi en haut)
//   solaire     minutes depuis minuit (soleil de 7 h à 21 h, ombre à l'opposé)
//   secteurs    jour ouvré 0 (lundi) à 4 (vendredi), -1 le week-end
//   monogramme  nombre d'éléments à ranger (12 graduations)
//   anneau      { now, plages: [[début, fin]], tasks: nombre de blocs tâche }
// Chaque builder rend une liste de primitives ; `small` = variante épaissie, lisible à 16 et 32 px.
import { GLYPHS } from '../identite/glyphs.js';

export const INK = 'ink';
export const ACCENT = 'accent';

const f = (n) => Math.round(n * 100) / 100;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const rad = (d) => (d * Math.PI) / 180;
const pol = (r, a) => [f(32 + r * Math.cos(rad(a))), f(32 + r * Math.sin(rad(a)))];
const circle = (cx, cy, r, o = {}) => ({ k: 'circle', cx, cy, r, ...o });
const path = (d, o = {}) => ({ k: 'path', d, ...o });
const arc = (r, a0, a1) => {
  const [x0, y0] = pol(r, a0);
  const [x1, y1] = pol(r, a1);
  return `M${x0} ${y0} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
};
const line = (r0, r1, a) => {
  const [x0, y0] = pol(r0, a);
  const [x1, y1] = pol(r1, a);
  return `M${x0} ${y0} L${x1} ${y1}`;
};
const sector = (r0, r1, a0, a1) => {
  const [ox0, oy0] = pol(r1, a0);
  const [ox1, oy1] = pol(r1, a1);
  const [ix1, iy1] = pol(r0, a1);
  const [ix0, iy0] = pol(r0, a0);
  return `M${ox0} ${oy0} A${r1} ${r1} 0 0 1 ${ox1} ${oy1} L${ix1} ${iy1} A${r0} ${r0} 0 0 0 ${ix0} ${iy0} Z`;
};

// ---------- (a) l'aiguille : cadran de 24 heures, aiguille dauphine, midi en haut ----------
function aiguille(min, { small }) {
  const ang = ((clamp(min, 0, 1440) - 720) / 1440) * 360;
  const rot = [f(ang), 32, 32];
  const prims = [circle(32, 32, small ? 26 : 27, { role: INK, sw: small ? 6 : 2.5 })];
  if (small) {
    prims.push(path('M32 9 V19', { role: INK, sw: 6 }));
    prims.push(path('M32 34 V45', { role: INK, sw: 4, rot }));
    prims.push(path('M32 6 L39 30 L32 40 L25 30 Z', { role: ACCENT, fill: true, rot }));
    prims.push(circle(32, 32, 4.5, { role: INK, fill: true }));
    return prims;
  }
  for (let k = 0; k < 12; k += 1) {
    const a = -90 + 30 * k;
    const cardinal = k % 3 === 0;
    const len = k === 0 ? 9 : cardinal ? 7 : 3.5;
    prims.push(path(line(25.75, 25.75 - len, a), { role: INK, sw: k === 0 ? 4 : cardinal ? 3 : 1.5, ...(cardinal ? {} : { op: 0.7 }) }));
  }
  prims.push(path('M32 38 V45', { role: INK, sw: 2.5, rot }));
  prims.push(path('M32 8 L35.6 30 L32 38 L28.4 30 Z', { role: ACCENT, fill: true, rot }));
  prims.push(circle(32, 32, 3.2, { role: INK, fill: true }));
  return prims;
}

// ---------- (b) le cadran solaire : un gnomon, son ombre, le soleil ----------
function solaire(min, { small }) {
  const t = (min - 420) / 840;
  const day = t >= 0 && t <= 1;
  const gy = small ? 52 : 52;
  const prims = [];
  if (!small) prims.push(path('M6 46 A26 32 0 0 1 58 46', { role: INK, sw: 1.5, dash: '2 4', op: 0.4 }));
  prims.push(path(`M${small ? 6 : 4} ${gy} H${small ? 58 : 60}`, { role: INK, sw: small ? 4 : 2.5 }));
  if (day) {
    const c = Math.cos(Math.PI * t);
    let off = (small ? 20 : 24) * c;
    const mini = small ? 14 : 6;
    if (Math.abs(off) < mini) off = off >= 0 ? mini : -mini;
    prims.push(path(`M32 ${gy} H${f(32 + off)}`, { role: ACCENT, sw: small ? 8 : 6 }));
    if (!small) prims.push(circle(f(32 - 26 * c), f(46 - 32 * Math.sin(Math.PI * t)), 5, { role: INK, sw: 2.5 }));
  }
  prims.push(path(small ? 'M32 52 V14 L44 52 Z' : 'M32 52 V24 L41 52 Z', { role: INK, fill: true }));
  return prims;
}

// ---------- (c) cinq secteurs, un par jour ouvré ----------
function secteurs(day, { small }) {
  const r1 = small ? 30 : 29;
  const r0 = small ? 10 : 13;
  const gap = small ? 12 : 7;
  const prims = [];
  for (let i = 0; i < 5; i += 1) {
    const d = sector(r0, r1, -90 + 72 * i + gap / 2, -90 + 72 * (i + 1) - gap / 2);
    if (day < 0) prims.push(path(d, { role: INK, fill: true, op: 0.5 }));
    else if (i === day) prims.push(path(d, { role: ACCENT, fill: true }));
    else prims.push(path(d, { role: INK, fill: true, op: i < day ? (small ? 0.3 : 0.22) : small ? 0.62 : 0.5 }));
  }
  if (day < 0) prims.push(circle(32, 32, small ? 5 : 4, { role: ACCENT, fill: true }));
  return prims;
}

// ---------- (d) le monogramme C : un arc gradué ----------
const C0 = 40;
const C1 = 320;
function monogramme(count, { small, mono }) {
  const n = clamp(Math.round(count), 0, 12);
  const R = small ? 21 : 20;
  const prims = [path(arc(R, C0, C1), { role: INK, sw: small ? 11 : 7 })];
  if (small) {
    if (n > 0 && !mono) prims.push(path(arc(R, C0, C0 + ((C1 - C0) * n) / 12), { role: ACCENT, sw: 11 }));
    return prims;
  }
  for (let i = 0; i < 12; i += 1) {
    const a = C0 + ((C1 - C0) * i) / 11;
    const lit = i < n;
    prims.push(path(line(26, lit ? 31.5 : 29.5, a), { role: lit ? ACCENT : INK, sw: lit ? 2.8 : 2.5, ...(lit ? {} : { op: 0.4 }) }));
  }
  return prims;
}

// ---------- (e) l'anneau horaire : plages (épais) et tâches (fins) ----------
// Journée de 7 h à 23 h sur 340 degrés, la nuit en haut.
const DAY0 = 420;
const DAY1 = 1380;
const angleOf = (m) => -80 + 340 * clamp((m - DAY0) / (DAY1 - DAY0));

// Blocs de tâche posés dans les creux d'après maintenant : un bloc d'au plus 60 minutes par creux de 25 minutes ou plus.
export function placeTasks(plages, now, n) {
  const sorted = [...plages].sort((a, b) => a[0] - b[0]);
  const end = 1320;
  const free = [];
  let cur = Math.max(now, 480);
  for (const [s, e] of sorted) {
    if (e <= cur) continue;
    if (s > cur) free.push([cur, Math.min(s, end)]);
    cur = Math.max(cur, e);
    if (cur >= end) break;
  }
  if (cur < end) free.push([cur, end]);
  const out = [];
  for (const [a, b] of free) {
    if (out.length >= n) break;
    if (b - a >= 25) out.push([a, Math.min(b, a + 60)]);
  }
  return out;
}

function anneau(state, { small }) {
  const now = state.now ?? 780;
  const tasks = placeTasks(state.plages ?? [], now, state.tasks ?? 0);
  const r = small ? 23 : 24;
  const gap = small ? 5 : 2;
  const minLen = small ? 40 : 15;
  const prims = [];
  const seg = (s, e, role, sw) => {
    const a0 = angleOf(s) + gap / 2;
    const a1 = angleOf(e) - gap / 2;
    if (e - s < minLen || a1 <= a0) return;
    prims.push(path(arc(r, a0, a1), { role, sw, ...(e <= now ? { op: small ? 0.55 : 0.4 } : {}) }));
  };
  for (const [s, e] of state.plages ?? []) seg(Math.max(s, DAY0), Math.min(e, DAY1), INK, small ? 14 : 10);
  for (const [s, e] of tasks) seg(s, e, ACCENT, small ? 14 : 5);
  const a = angleOf(now);
  prims.push(path(line(small ? 5 : 9, small ? 13 : 16, a), { role: ACCENT, sw: small ? 5 : 3 }));
  return prims;
}

// ---------- registre ----------

export const MARKS = {
  aiguille: {
    id: 'aiguille',
    letter: 'a',
    slug: 'aiguille',
    name: "L'aiguille",
    build: aiguille,
    sample: 650,
    font: { label: 'Fraunces, graisse 500', css: 'var(--f-fraunces)', weight: 500, stretch: '100%', tracking: '-0.01em', upper: false },
  },
  solaire: {
    id: 'solaire',
    letter: 'b',
    slug: 'solaire',
    name: 'Le cadran solaire',
    build: solaire,
    sample: 540,
    font: { label: 'Instrument Sans, graisse 600', css: 'var(--f-instrument)', weight: 600, stretch: '100%', tracking: '-0.02em', upper: false },
  },
  secteurs: {
    id: 'secteurs',
    letter: 'c',
    slug: 'secteurs',
    name: 'Les cinq secteurs',
    build: secteurs,
    sample: 2,
    font: { label: 'Geist Mono, majuscules espacées', css: 'var(--f-geist-mono)', weight: 500, stretch: '100%', tracking: '0.16em', upper: true },
  },
  monogramme: {
    id: 'monogramme',
    letter: 'd',
    slug: 'monogramme',
    name: 'Le monogramme gradué',
    build: monogramme,
    sample: 5,
    font: { label: 'Mona Sans large (largeur 125 %), graisse 600', css: 'var(--f-mona)', weight: 600, stretch: '125%', tracking: '-0.01em', upper: false },
  },
  anneau: {
    id: 'anneau',
    letter: 'e',
    slug: 'anneau',
    name: "L'anneau horaire",
    build: anneau,
    sample: { now: 780, plages: [[510, 600], [615, 720], [840, 960], [1080, 1170]], tasks: 2 },
    font: { label: 'Inter Tight, graisse 600', css: 'var(--f-inter-tight)', weight: 600, stretch: '100%', tracking: '-0.02em', upper: false },
  },
};
export const MARK_IDS = Object.keys(MARKS);

export function symbolPrims(id, state, { small = false, mono = false } = {}) {
  return MARKS[id].build(state, { small, mono });
}

// ---------- logotype tracé : grille de 4, extrémités plates, une épaisseur par logotype ----------

const CAPS = {
  c: { w: 28, p: ['M24 2 H12 A10 10 0 0 0 2 12 V32 A10 10 0 0 0 12 42 H24'] },
  a: { w: 28, p: ['M2 42 L14 7 L26 42', 'M6.1 30 H21.9'] },
  d: { w: 28, p: ['M2 2 H10 A16 20 0 0 1 10 42 H2 Z'] },
  r: { w: 28, p: ['M2 42 V2 H16 A10 10 0 0 1 16 22 H2', 'M14 22 L26 42'] },
  n: { w: 28, p: ['M2 42 V2 L26 42 V2'] },
};

// Un style par proposition : minuscules ou majuscules, épaisseur du trait, espace entre lettres, échelle dans le lockup.
export const TYPO = {
  aiguille: { upper: false, sw: 2.5, gap: 14, scale: 1.2 },
  solaire: { upper: false, sw: 5, gap: 7, scale: 1.2 },
  secteurs: { upper: true, sw: 3, gap: 12, scale: 1.1 },
  monogramme: { upper: false, sw: 6, gap: 6, scale: 1.15 },
  anneau: { upper: false, sw: 4, gap: 8, scale: 1.2 },
};

const WORD = 'cadran';

export function wordmark(id, swOverride) {
  const st = TYPO[id];
  const sw = swOverride ?? st.sw;
  const src = st.upper ? CAPS : GLYPHS;
  const dx = (sw - 4) / 2;
  const prims = [];
  let x = 0;
  for (const ch of WORD) {
    const g = src[ch];
    for (const d of g.p ?? []) prims.push({ k: 'path', d, role: INK, sw, tx: f(x + dx) });
    for (const [cx, cy, r] of g.c ?? []) prims.push({ k: 'circle', cx, cy, r, role: INK, sw, tx: f(x + dx) });
    x += g.w + (sw - 4) + st.gap;
  }
  return { prims, width: f(x - st.gap), height: 44 };
}

// ---------- sérialisation texte (exports) ----------

function primToSvg(p, c, i = 0, anim = false) {
  const color = p.role === ACCENT && !c.mono ? c.accent : c.ink;
  const op = p.op != null ? ` opacity="${p.op}"` : '';
  const tr = p.rot ? ` transform="rotate(${p.rot[0]} ${p.rot[1]} ${p.rot[2]})"` : p.tx ? ` transform="translate(${p.tx} 0)"` : '';
  let paint;
  let extra = '';
  if (p.fill) {
    paint = `fill="${color}"${op}`;
    if (anim) extra = ` style="animation:cadran-fade 600ms ease-out ${i * 110}ms backwards"`;
  } else {
    paint = `fill="none" stroke="${color}" stroke-width="${p.sw}"${p.dash ? ` stroke-dasharray="${p.dash}"` : ''}${op}`;
    if (anim && !p.dash) extra = ` pathLength="1" style="stroke-dasharray:1;animation:cadran-draw 900ms cubic-bezier(.3,.7,.2,1) ${i * 110}ms backwards"`;
    else if (anim) extra = ` style="animation:cadran-fade 600ms ease-out ${i * 110}ms backwards"`;
  }
  if (p.k === 'circle') return `<circle cx="${p.cx}" cy="${p.cy}" r="${p.r}" ${paint}${tr}${extra}/>`;
  return `<path d="${p.d}" ${paint}${tr}${extra}/>`;
}

const grp = (inner) => `<g stroke-linecap="butt" stroke-linejoin="miter">${inner}</g>`;

// c : { ink, accent, bg?, mono? } (valeurs CSS : hexadécimal pour un export, var(--accent) dans la page)
export function symbolInner(id, state, c, { small = false, anim = false } = {}) {
  return grp(symbolPrims(id, state, { small, mono: Boolean(c.mono) }).map((p, i) => primToSvg(p, c, i, anim)).join(''));
}

export function wordInner(id, c, { sw } = {}) {
  const { prims } = wordmark(id, sw);
  return grp(prims.map((p) => primToSvg(p, c)).join(''));
}

const GAP = 22;
export function lockupBox(id, sw) {
  const { width } = wordmark(id, sw);
  const s = TYPO[id].scale;
  return { w: f(64 + GAP + width * s), h: 64, scale: s };
}

export function lockupInner(id, state, c, { sw, anim = false } = {}) {
  const { scale } = lockupBox(id, sw);
  const oy = f(32 - 22 * scale);
  return `${symbolInner(id, state, c, { anim })}<g transform="translate(${64 + GAP} ${oy}) scale(${scale})">${wordInner(id, c, { sw })}</g>`;
}

const doc = (w, h, title, body, px = 2) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${f(w * px)}" height="${f(h * px)}" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`;

export function symbolSvg(id, state, c, { small = false, title = 'Cadran' } = {}) {
  return doc(64, 64, title, symbolInner(id, state, c, { small }), 4);
}

export function lockupSvg(id, state, c, { title = 'Cadran' } = {}) {
  const { w, h } = lockupBox(id);
  return doc(w, h, title, lockupInner(id, state, c), 3);
}

// Icône d'app / favicon : carré arrondi plein (couleur bg) + symbole petit.
export function tileSvg(id, state, c, { small = true, pad = 0.12, title = 'Cadran' } = {}) {
  const k = f(1 - 2 * pad);
  const body = `<rect width="64" height="64" rx="14" fill="${c.bg}"/><g transform="translate(${f(64 * pad)} ${f(64 * pad)}) scale(${k})">${symbolInner(id, state, c, { small })}</g>`;
  return doc(64, 64, title, body, 4);
}

// Palettes des exports : la charte Graphite en place (fond #202429, accent #7aa2ff) en sombre, et son clair.
export const PAL = {
  sombre: { ink: '#e8ebf0', accent: '#7aa2ff', bg: '#202429' },
  clair: { ink: '#14171c', accent: '#2f54e0', bg: '#f3f4f6' },
  noir: { ink: '#000000', accent: '#000000', bg: '#ffffff', mono: true },
  blanc: { ink: '#ffffff', accent: '#ffffff', bg: '#000000', mono: true },
};

// Fichiers exportés pour une proposition : [nom, description, générateur]
export function exportFiles(id) {
  const m = MARKS[id];
  const s = m.sample;
  const p = `cadran-${m.slug}`;
  return [
    [`${p}-symbole.svg`, 'Symbole, couleurs sombres', () => symbolSvg(id, s, PAL.sombre)],
    [`${p}-symbole-clair.svg`, 'Symbole, couleurs claires', () => symbolSvg(id, s, PAL.clair)],
    [`${p}-symbole-noir.svg`, 'Symbole monochrome noir', () => symbolSvg(id, s, PAL.noir)],
    [`${p}-symbole-blanc.svg`, 'Symbole monochrome blanc', () => symbolSvg(id, s, PAL.blanc)],
    [`${p}-complet.svg`, 'Symbole et logotype, couleurs sombres', () => lockupSvg(id, s, PAL.sombre)],
    [`${p}-complet-clair.svg`, 'Symbole et logotype, couleurs claires', () => lockupSvg(id, s, PAL.clair)],
    [`${p}-complet-noir.svg`, 'Symbole et logotype monochrome noir', () => lockupSvg(id, s, PAL.noir)],
    [`${p}-icone.svg`, 'Icône d’application (variante petite taille)', () => tileSvg(id, s, PAL.sombre, { small: true, pad: 0.12 })],
    [`${p}-favicon.svg`, 'Favicon d’onglet (marge réduite)', () => tileSvg(id, s, PAL.sombre, { small: true, pad: 0.06 })],
  ].map(([name, label, make]) => ({ name, label, make }));
}
