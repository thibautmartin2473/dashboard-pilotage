// Calculs de couleur et de contraste de /demo/chartes (fonctions pures + lecture des jetons rendus).
// Les couleurs ne sont pas recopiées ici : on lit le CSS réellement appliqué (jetons de chartes.css),
// converti en sRGB 8 bits par un canvas, puis on calcule WCAG 2 et APCA (SAPC 0.0.98G-4g).

const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

// Luminance relative WCAG 2.
export const luminance = ([r, g, b]) => 0.2126 * lin(r / 255) + 0.7152 * lin(g / 255) + 0.0722 * lin(b / 255);

export function wcag(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const apcaY = ([r, g, b]) => {
  const y = 0.2126729 * (r / 255) ** 2.4 + 0.7151522 * (g / 255) ** 2.4 + 0.072175 * (b / 255) ** 2.4;
  return y < 0.022 ? y + (0.022 - y) ** 1.414 : y;
};

// Lc (valeur absolue) du texte `txt` sur le fond `bg`.
export function apca(txt, bg) {
  const yt = apcaY(txt);
  const yb = apcaY(bg);
  const s = yb > yt ? (yb ** 0.56 - yt ** 0.57) * 1.14 : (yb ** 0.65 - yt ** 0.62) * 1.14;
  if (Math.abs(s) < 0.1) return 0;
  return Math.abs(s > 0 ? s - 0.027 : s + 0.027) * 100;
}

// Luminosité perceptuelle OKLab (L de 0 à 1) d'une couleur sRGB 8 bits.
export function oklabL([r, g, b]) {
  const [R, G, B] = [r, g, b].map((v) => lin(v / 255));
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
}

export const toHex = (rgb) => `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`;

let ctx;
// Couleur CSS (oklch, color-mix, rgb...) -> [r, g, b] 8 bits, ou null si elle n'est pas opaque et lisible.
export function parseCssColor(value) {
  if (!ctx) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    ctx = canvas.getContext('2d', { willReadFrequently: true });
  }
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = '#000';
  ctx.fillStyle = value;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  return a === 255 ? [r, g, b] : null;
}

// Lit les jetons d'une charte dans un nœud « sonde » déjà posé dans le document : on lui fait porter la
// couleur `var(--jeton)` et on relit la valeur calculée par le navigateur.
export function readTokens(probe, names) {
  const out = {};
  for (const name of names) {
    probe.style.color = '';
    probe.style.color = `var(${name})`;
    out[name] = parseCssColor(getComputedStyle(probe).color);
  }
  probe.style.color = '';
  return out;
}

export const numberVar = (el, name) => Number.parseFloat(getComputedStyle(el).getPropertyValue(name));

// Niveau de gris perçu (0 à 255), pour vérifier que plage, tâche et autre se distinguent sans la teinte.
export function grayOf(rgb) {
  const y = luminance(rgb);
  return Math.round(255 * (y <= 0.0031308 ? 12.92 * y : 1.055 * y ** (1 / 2.4) - 0.055));
}
