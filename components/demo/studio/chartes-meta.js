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
];
