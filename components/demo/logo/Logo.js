'use client';

// Rendu React des logos de Cadran. Les dessins viennent de marques.js (texte SVG injecté : le contenu
// est produit par ce dépôt, jamais par un utilisateur). Encre = currentColor, accent = var(--accent) :
// le logo suit la charte et le mode choisis en haut de la page.
import { useEffect, useRef } from 'react';
import { symbolInner, lockupInner, lockupBox, wordInner, wordmark, TYPO } from './marques.js';

const LIVE = { ink: 'currentColor', accent: 'var(--accent)' };
const MONO = { ink: 'currentColor', accent: 'currentColor', mono: true };
const palette = (mono) => (mono ? MONO : LIVE);

// Trait minimal du logotype dans un rail : sous 20 px de haut, un trait de 2,5 unités disparaît.
export const railSw = (id, min = 5) => Math.max(TYPO[id].sw, min);

export function Sym({ id, state, size = 64, small = false, mono = false, anim = false, title, className = '', style }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      role="img"
      aria-label={title ?? 'Symbole de Cadran'}
      className={`block h-auto max-w-full shrink-0 ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: symbolInner(id, state, palette(mono), { small, anim }) }}
    />
  );
}

// Symbole et logotype : height = hauteur du symbole en px, la largeur suit.
export function Lock({ id, state, height = 48, mono = false, sw, anim = false, className = '', style }) {
  const { w } = lockupBox(id, sw);
  return (
    <svg
      viewBox={`0 0 ${w} 64`}
      width={Math.round((height * w) / 64)}
      height={height}
      role="img"
      aria-label="Cadran"
      className={`block h-auto max-w-full shrink-0 ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: lockupInner(id, state, palette(mono), { sw, anim }) }}
    />
  );
}

// Logotype seul : height = hauteur des ascendantes en px.
export function Word({ id, height = 24, sw, mono = true, className = '', style }) {
  const { width } = wordmark(id, sw);
  return (
    <svg
      viewBox={`-1 -2 ${width + 2} 48`}
      width={Math.round((height * (width + 2)) / 44)}
      height={Math.round((height * 48) / 44)}
      role="img"
      aria-label="Cadran"
      className={`block h-auto max-w-full shrink-0 ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: wordInner(id, palette(mono), { sw }) }}
    />
  );
}

// Icône d'application : carré arrondi plein + symbole (variante petite taille), comme le fichier -icone.svg.
export function Tile({ id, state, size = 64, bg = 'var(--surface-2)', mono = false, border = true, className = '' }) {
  const pad = size <= 20 ? 0.06 : 0.12;
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
      <Sym id={id} state={state} small size={Math.round(size * (1 - 2 * pad))} mono={mono} />
    </span>
  );
}

// Loupe à pixels : le SVG est réellement rastérisé par le navigateur à px x px (canvas), puis agrandi sans lissage.
export function PixelLoupe({ svg, px, zoom, label }) {
  const ref = useRef(null);
  useEffect(() => {
    let dead = false;
    const img = new Image();
    img.onload = () => {
      const cv = ref.current;
      if (dead || !cv) return;
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, px, px);
      ctx.drawImage(img, 0, 0, px, px);
    };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    return () => {
      dead = true;
    };
  }, [svg, px]);
  return (
    <canvas
      ref={ref}
      width={px}
      height={px}
      role="img"
      aria-label={label}
      className="block max-w-full rounded-[3px] border border-[var(--border)]"
      style={{ width: px * zoom, height: px * zoom, imageRendering: 'pixelated' }}
    />
  );
}
