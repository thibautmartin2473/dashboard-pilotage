// Logo « anneau horaire » de Cadran, recoloré par les jetons de la charte posée au-dessus (voir
// public/demo/logos/cadran-anneau-symbole.svg pour le dessin d'origine) : la journée de 7 h à 23 h en anneau,
// plages en arcs épais (couleur du texte), tâches en arcs fins accentués, trait de maintenant.
export default function Anneau({ size = 24, plage = 'var(--text)', tache = 'var(--accent)', maintenant = tache, title = 'Cadran' }) {
  const arc = (d, color, width, opacity) => (
    <path d={d} fill="none" style={{ stroke: color }} strokeWidth={width} opacity={opacity} />
  );
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label={title} style={{ flex: 'none', display: 'block' }}>
      <title>{title}</title>
      <g strokeLinecap="butt" strokeLinejoin="miter">
        {arc('M48.33 14.41 A24 24 0 0 1 54.92 24.88', plage, 10, 0.4)}
        {arc('M55.64 27.86 A24 24 0 0 1 53.71 42.24', plage, 10, 0.4)}
        {arc('M40.31 54.52 A24 24 0 0 1 23.69 54.52', plage, 10)}
        {arc('M10.29 42.24 A24 24 0 0 1 8.08 30.06', plage, 10)}
        {arc('M47.9 49.97 A24 24 0 0 1 41.09 54.21', tache, 5)}
        {arc('M22.91 54.21 A24 24 0 0 1 16.1 49.97', tache, 5)}
        {arc('M38.08 38.64 L42.81 43.8', maintenant, 3)}
      </g>
    </svg>
  );
}
