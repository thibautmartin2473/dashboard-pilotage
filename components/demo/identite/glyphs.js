// Alphabet dessiné à la main pour les logotypes de l'axe Identité (aucune police : pas de licence à
// vérifier, rendu identique partout). Règles de construction, les mêmes que celles des symboles :
//   - grille de 4 unités, trait unique de 4 unités, extrémités plates, angles vifs
//   - hauteur d'ascendante 44, hauteur d'x 28 (de 16 à 44), cercle de rayon 12 (axe du trait)
//   - lettres minuscules seulement, espace de 8 unités entre deux lettres
// Chaque lettre : { w: largeur hors tout, p: [segments de trait], c: [cercles de trait], r: [carrés pleins] }.
// Les coordonnées de p, c et r sont celles de l'axe du trait (sauf r : bord réel du carré plein).

export const STROKE = 4;
export const GAP = 8;
export const WORD_H = 64; // hauteur de la boîte d'un logotype (descendante comprise)

const BOWL = [[14, 30, 12]];
const ARCH = 'M2 30 A12 12 0 0 1 26 30 V44';

export const GLYPHS = {
  a: { w: 28, c: BOWL, p: ['M26 16 V44'] },
  b: { w: 28, c: BOWL, p: ['M2 0 V44'] },
  c: { w: 26, p: ['M23.19 22.29 A12 12 0 1 0 23.19 37.71'] },
  d: { w: 28, c: BOWL, p: ['M26 0 V44'] },
  e: { w: 28, p: ['M2 30 H26 A12 12 0 1 0 23.19 37.71'] },
  h: { w: 28, p: ['M2 0 V44', ARCH] },
  i: { w: 4, p: ['M2 16 V44'], r: [[0, 6, 4, 4]] },
  j: { w: 12, p: ['M10 16 V52 A8 8 0 0 1 2 60'], r: [[8, 6, 4, 4]] },
  l: { w: 4, p: ['M2 0 V44'] },
  m: { w: 44, p: ['M2 16 V44', 'M2 28 A10 10 0 0 1 22 28 V44', 'M22 28 A10 10 0 0 1 42 28 V44'] },
  n: { w: 28, p: ['M2 16 V44', ARCH] },
  o: { w: 28, c: BOWL },
  r: { w: 22, p: ['M2 16 V44', 'M2 30 A12 12 0 0 1 14 18 H22'] },
  s: { w: 16, p: ['M14 24 A6 6 0 1 0 8 30 A6 6 0 1 1 2 36'] },
  t: { w: 18, p: ['M6 4 V34 A8 8 0 0 0 14 42 H18', 'M0 18 H16'] },
  u: { w: 28, p: ['M2 16 V30 A12 12 0 0 0 26 30', 'M26 16 V44'] },
};

// Logotype d'un mot : liste de lettres placées { x, prims } et largeur totale.
// prims : { k: 'path'|'circle'|'rect', ... } (trait par défaut, `fill: true` pour un aplat).
export function wordmark(word) {
  const glyphs = [];
  let x = 0;
  for (const ch of word.toLowerCase()) {
    const g = GLYPHS[ch];
    if (!g) throw new Error(`Lettre non dessinée : ${ch}`);
    const prims = [
      ...(g.p ?? []).map((d) => ({ k: 'path', d })),
      ...(g.c ?? []).map(([cx, cy, r]) => ({ k: 'circle', cx, cy, r })),
      ...(g.r ?? []).map(([rx, ry, w, h]) => ({ k: 'rect', x: rx, y: ry, w, h, fill: true })),
    ];
    glyphs.push({ ch, x, prims });
    x += g.w + GAP;
  }
  return { glyphs, width: x - GAP, height: WORD_H };
}
