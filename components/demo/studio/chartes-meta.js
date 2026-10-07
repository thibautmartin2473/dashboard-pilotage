// Propriétaire : agent « chartes ». Les ids sont fixes (registre, URL) ; nom et description libres.
// `famille` sert à /demo/chartes (regrouper les quatre chartes avancées) ; `signature` dit en une phrase
// ce qu'on retient de la charte ; `police` et `densite` résument la typographie et la densité.
export const CHARTES = [
  {
    id: 'graphite',
    name: 'Graphite',
    description: 'Neutres froids, un seul bleu et des chiffres en mono : un outil précis, dense, qui va droit au but.',
  },
  {
    id: 'papier',
    name: 'Papier',
    description: 'Crème et encre, titres en Fraunces, beaucoup d’air : on lit sa journée comme une page de carnet.',
  },
  {
    id: 'nuit',
    name: 'Nuit',
    description: 'Bleu nuit profond, reflets violets et surfaces de verre : une lumière douce pour travailler tard.',
  },
  {
    id: 'suisse',
    name: 'Suisse',
    description: 'Blanc, noir et un seul rouge, filets fins et angles droits : la rigueur d’une grille typographique.',
  },
  {
    id: 'graphite-lumiere',
    name: 'Graphite Lumière',
    famille: 'avancee',
    description:
      'Le Graphite que tu as choisi, poussé : une seule source de lumière en haut, un filet clair sur chaque surface et un maintenant lumineux dans l’agenda.',
    signature: 'Le trait lumineux du maintenant et le filet de lumière sur le bord haut de chaque surface.',
    police: 'Geist et Geist Mono',
    densite: 'Moyenne (heure de 46 px, texte 13,5 px)',
  },
  {
    id: 'graphite-ardoise',
    name: 'Graphite Ardoise',
    famille: 'avancee',
    description:
      'Compacte, vert-de-gris et sarcelle : une règle graduée pour les heures, des compteurs en traits, des tâches à la craie. La plus dense, avec un grain léger.',
    signature: 'La règle graduée : axe des heures en graduations, compteurs en barres de traits, tâches en contour pointillé.',
    police: 'Inter Tight et JetBrains Mono',
    densite: 'Compacte, préréglage type Rhea (heure de 38 px, texte 12 à 13 px)',
  },
  {
    id: 'graphite-acier',
    name: 'Graphite Acier',
    famille: 'avancee',
    description:
      'Le plus clair des quatre, accent argent et un seul ambre pour l’état à traiter : un instrument de bord, avec aiguille et chiffres resserrés.',
    signature: 'Le cadran : aiguille du maintenant, jauge de charge du jour et lampe ambre quand quelque chose attend.',
    police: 'Mona Sans (resserrée) et Geist Mono',
    densite: 'Moyenne (heure de 44 px, texte 13,5 px)',
  },
  {
    id: 'graphite-encre',
    name: 'Graphite Encre',
    famille: 'avancee',
    description:
      'Bleu-nuit profond et accent azur, coins de 16 et 10 px emboîtés, trait d’encre sous les titres ; en clair, de l’encre sur papier bleuté, le contraste le plus fort.',
    signature: 'Le trait d’encre : filet d’accent de 28 px sous les titres de section et tracé épais pour le maintenant.',
    police: 'Instrument Sans et IBM Plex Mono',
    densite: 'Aérée (heure de 50 px, texte 14 px)',
  },
  // Chartes de Cadran d'après le moodboard (2026-10-08), détail dans /demo/chartes-cadran.
  {
    id: 'cadran-papier',
    name: 'Papier et encre',
    famille: 'cadran',
    description:
      'Crème chaud, encre presque noire, sérif éditoriale pour les titres et terre cuite pour tout ce qui est à toi : un carnet bien composé, d’après Claude, Craft et Stripe Press. Clair d’abord.',
    signature: 'Le journal : chiffres des jours en grande sérif, filet double sous les en-têtes, maintenant tracé d’un trait de plume à pointe en losange.',
    police: 'Newsreader (titres) et Hanken Grotesk (texte et chiffres)',
    densite: 'Aérée (heure de 48 px, texte 14 px)',
  },
  {
    id: 'cadran-cuir',
    name: 'Cuir et bordeaux',
    famille: 'cadran',
    description:
      'Brun très foncé, crème, bordeaux, cuir et olive : un sombre éditorial chaud, jamais gris ni bleu, d’après Stripe Press et Mercury. Sombre d’abord.',
    signature: 'Le signet bordeaux sur le jour en cours, la surpiqûre pointillée des panneaux et le maintenant en laiton.',
    police: 'Libre Caslon Text (titres), IBM Plex Sans (texte) et IBM Plex Mono (heures)',
    densite: 'Moyenne (heure de 46 px, texte 13,5 px)',
  },
  {
    id: 'cadran-voyant',
    name: 'Noir, blanc et voyant',
    famille: 'cadran',
    description:
      'Blanc pur en clair, noir pur en sombre, une seule couleur de signal (un rouge de voyant) et des chiffres en points, d’après Vercel, Things 3 et Nothing. Clair d’abord.',
    signature: 'Les chiffres en matrice de points (Doto), les plages en blocs pleins, les tâches en contour, et un seul voyant rouge qui dit maintenant, à ranger ou en retard.',
    police: 'Geist (texte), Geist Mono (heures) et Doto (chiffres en points)',
    densite: 'Moyenne, grille nette sans arrondis (heure de 44 px)',
  },
  {
    id: 'cadran-raycast',
    name: 'Raycast chaud',
    famille: 'cadran',
    description:
      'Noir chaud, surfaces nettes à relief léger et un rouge orangé, d’après Raycast et Mercury : le sombre premium sans une once de bleu. Sombre d’abord.',
    signature: 'Les touches de clavier en relief, la braise (dégradé orangé et trait à gauche) sur la ligne sélectionnée, et la sérif d’accent pour la phrase du jour.',
    police: 'Inter (texte), Instrument Serif (accent) et JetBrains Mono (heures)',
    densite: 'Moyenne (heure de 44 px, texte 13,5 px)',
  },
];
