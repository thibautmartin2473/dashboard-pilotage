// Icônes au trait des blocs de l'agenda (SVG maison, 14 px, couleur du texte du bloc, aucune bibliothèque).
// Une par type : cours, examen, rendez-vous, prépa, sport, travail, courte ; plus « urgent » et la flèche
// du renvoi vers Google. Toutes décoratives (aria-hidden) : le sens passe par le titre et par des mots.

const PATHS = {
  // Livre ouvert.
  cours: (
    <>
      <path d="M2 3.5h4.2A1.8 1.8 0 0 1 8 5.3V13a1.5 1.5 0 0 0-1.5-1.5H2z" />
      <path d="M14 3.5H9.8A1.8 1.8 0 0 0 8 5.3V13a1.5 1.5 0 0 1 1.5-1.5H14z" />
    </>
  ),
  // Feuille avec lignes.
  examen: (
    <>
      <path d="M4 2h5.5L13 5.5V14H4z" />
      <path d="M9.5 2v3.5H13" />
      <path d="M6 8.5h5M6 11h3" />
    </>
  ),
  // Deux silhouettes.
  rdv: (
    <>
      <circle cx="6" cy="5.5" r="2.2" />
      <path d="M2.2 13.5c0-2.2 1.7-3.8 3.8-3.8s3.8 1.6 3.8 3.8" />
      <path d="M10.6 3.6a2 2 0 0 1 0 3.8" />
      <path d="M11.6 9.9c1.4.4 2.3 1.6 2.3 3.6" />
    </>
  ),
  // Cible.
  prepa: (
    <>
      <circle cx="8" cy="8" r="5.8" />
      <circle cx="8" cy="8" r="2.8" />
      <circle cx="8" cy="8" r="0.4" />
    </>
  ),
  // Haltère.
  sport: (
    <>
      <path d="M2.2 6v4M4.4 4.6v6.8M11.6 4.6v6.8M13.8 6v4" />
      <path d="M4.4 8h7.2" />
    </>
  ),
  // Mallette.
  travail: (
    <>
      <rect x="2" y="5" width="12" height="8.5" rx="1.6" />
      <path d="M5.5 5V3.4h5V5" />
      <path d="M2 8.8h12" />
    </>
  ),
  // Horloge : une tâche rapide.
  courte: (
    <>
      <circle cx="8" cy="8" r="5.8" />
      <path d="M8 4.8v3.4l2.2 1.4" />
    </>
  ),
  // Triangle d'alerte.
  urgent: (
    <>
      <path d="M8 2.2l6 10.6H2z" />
      <path d="M8 6.6v3" />
      <path d="M8 11.3v.1" />
    </>
  ),
  // Flèche vers le haut et la droite : à renvoyer vers Google.
  renvoi: (
    <>
      <path d="M4.5 11.5l7-7" />
      <path d="M5.5 4.5h6v6" />
    </>
  ),
};

export function BlockIcon({ kind, size = 14, className = '' }) {
  const paths = PATHS[kind];
  if (!paths) return null;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths}
    </svg>
  );
}
