// Fiches des quatre chartes de Cadran (textes de la page /demo/chartes-cadran). Les couleurs ne sont PAS
// recopiées ici : la page les relit dans le CSS réellement rendu (app/demo/studio/chartes.css).

export const CHARTES_CADRAN = [
  {
    id: 'cadran-papier',
    specimen: { titre: 'Newsreader', texte: 'Hanken Grotesk', chiffres: 'Hanken Grotesk' },
    letter: 'A',
    name: 'Papier et encre',
    mainMode: 'light',
    ancrage: ['Claude', 'Craft', 'Stripe Press'],
    pitch: 'Un carnet bien composé : crème chaud, encre presque noire, titres en sérif éditoriale, terre cuite pour tout ce qui est à toi.',
    polices: [
      { role: 'Titres et chiffres des jours', name: 'Newsreader', note: 'sérif éditoriale à taille optique, 450' },
      { role: 'Texte et interface', name: 'Hanken Grotesk', note: 'sans sobre et chaude, chiffres tabulaires' },
    ],
    signature: {
      title: 'Le journal',
      text: 'Les chiffres des jours en grande sérif, un filet double sous chaque en-tête comme une page de presse, et le maintenant tracé d’un trait de plume terre cuite terminé par un losange. Les plages sont des marges à filet d’encre, les tâches des cases rondes à remplir.',
    },
    failles: [
      'C’est exactement la grille de lecture « crème, sérif, orange » que la recherche de design range dans le look IA, et Claude lui-même la porte : le risque est de ressembler à un clone de Claude plutôt qu’à Cadran. La parade est la signature (filet double, losange, chiffres en sérif), pas la palette.',
      'Terre cuite (tâche, accent) et rouge de retard sont voisins en teinte. Leurs teintes sont à une vingtaine de degrés l’une de l’autre et, en sombre, de luminosité presque égale : le retard ne se distingue vraiment que par le libellé « en retard » et la barre hachurée. Plage et tâche, elles, restent séparées en niveaux de gris.',
      'Fond clair à longueur de journée : fatigue le soir. Le mode sombre existe (brun chaud) mais il y perd la page : c’est un autre objet, plus proche de B.',
      'Une bordure de contrôle à 3:1 sur crème demande un filet nettement brun : plus appuyé que l’élégance de Craft ne le voudrait.',
    ],
  },
  {
    id: 'cadran-cuir',
    specimen: { titre: 'Libre Caslon Text', texte: 'IBM Plex Sans', chiffres: 'IBM Plex Mono' },
    letter: 'B',
    name: 'Cuir et bordeaux',
    mainMode: 'dark',
    ancrage: ['Stripe Press', 'Mercury'],
    pitch: 'Un sombre éditorial chaud : brun très foncé, crème, bordeaux, cuir, olive. Jamais gris, jamais bleu, avec une matière à peine suggérée.',
    polices: [
      { role: 'Titres', name: 'Libre Caslon Text', note: 'sérif de livre, 400 (et 700 en gras)' },
      { role: 'Texte et interface', name: 'IBM Plex Sans', note: 'grotesque posée, neutre' },
      { role: 'Heures et chiffres', name: 'IBM Plex Mono', note: 'chiffres tabulaires, clin d’œil à Mercury' },
    ],
    signature: {
      title: 'Le signet et la couture',
      text: 'Un signet bordeaux pend de l’en-tête du jour en cours, les panneaux principaux ont une surpiqûre pointillée à peine visible, et le maintenant est un trait de laiton. La sérif en petites capitales fait les titres.',
    },
    failles: [
      'Le bordeaux ne tient pas à la fois en fond et en texte sur brun foncé : il faut deux valeurs (un bordeaux plein pour les boutons, un bordeaux clair rosé pour le texte et les focus). Le « bordeaux lisible » tire vers le rose.',
      'Bordeaux, cuir, olive et brun ont tous une chroma basse sur un fond bas : l’agenda se lit moins d’un coup d’œil que sur A ou D. Plage (olive) et tâche (cuir) se séparent surtout par la luminosité, et le retard (vermillon) frôle le cuir en teinte.',
      'Libre Caslon à 14 px et 400 est fin sur écran sombre ; il faut le garder pour les titres et jamais pour du corps de texte.',
      'La surpiqûre et le signet frôlent le skeuomorphisme : à garder très discrets, sinon on bascule dans le rétro décoratif que tu n’as pas retenu (Playdate, Teenage Engineering).',
      'Mise à jour 2026-10-08 : B n’a plus de mode clair ni sombre, c’est un seul brun moyen en trois niveaux (voir /demo/charte-cuir) ; les deux modes de cette page y affichent désormais les mêmes couleurs.',
    ],
  },
  {
    id: 'cadran-voyant',
    specimen: { titre: 'Geist', texte: 'Geist', chiffres: 'Geist Mono' },
    letter: 'C',
    name: 'Noir, blanc et voyant',
    mainMode: 'light',
    ancrage: ['Vercel', 'Things 3', 'Nothing'],
    pitch: 'Le contraste franc : blanc pur en clair, noir pur en sombre, grille nette, une seule couleur de signal (un rouge de voyant) et des chiffres en matrice de points.',
    polices: [
      { role: 'Texte et titres', name: 'Geist', note: 'neutre, 600 pour les titres' },
      { role: 'Heures', name: 'Geist Mono', note: 'chiffres tabulaires' },
      { role: 'Chiffres décoratifs', name: 'Doto', note: 'matrice de points, 800, à partir de 15 px seulement' },
    ],
    signature: {
      title: 'Le voyant',
      text: 'Les numéros de jour, les compteurs et l’heure sont en points (Doto) ; les plages sont des blocs pleins noirs, les tâches un simple contour ; aucun coin arrondi. Un seul rouge existe, et il dit toujours la même chose : regarde ici (maintenant, à ranger, en retard).',
    },
    failles: [
      'Un seul rouge pour « maintenant », « à ranger » et « en retard » : l’information se perd, il faut la relire dans le libellé. Pas de vert non plus : « fait » ne se lit que par le texte barré et la case cochée.',
      'Blanc pur et noir pur éblouissent en longue session, surtout le texte blanc sur noir pour une personne astigmate (halation). C’est la charte la moins confortable à 23 h.',
      'Doto devient illisible sous environ 14 px et fatigue en volume : il ne sert qu’à quelques chiffres, jamais à du texte. Nothing l’emploie en grand, pas en 11 px.',
      'Les catégories d’agenda que tu peux créer sur le site (couleur libre) n’ont pas de place ici : une charte à une seule couleur de signal entre en conflit avec des catégories colorées. À trancher avant de choisir C.',
      'Les plages en blocs noirs pleins pèsent lourd sur 5 jours de cours : l’agenda devient une mosaïque sombre en mode clair.',
    ],
  },
  {
    id: 'cadran-raycast',
    specimen: { titre: 'Inter', texte: 'Inter', chiffres: 'JetBrains Mono' },
    letter: 'D',
    name: 'Raycast chaud',
    mainMode: 'dark',
    ancrage: ['Raycast', 'Mercury'],
    pitch: 'Le sombre premium sans une once de bleu : noir chaud, surfaces nettes à relief léger, un seul accent rouge orangé.',
    polices: [
      { role: 'Texte et titres', name: 'Inter', note: 'la police de Raycast, 600 pour les titres' },
      { role: 'Accent éditorial', name: 'Instrument Serif', note: 'une phrase par écran, pas plus' },
      { role: 'Heures et touches', name: 'JetBrains Mono', note: 'chiffres tabulaires' },
    ],
    signature: {
      title: 'Les touches et la braise',
      text: 'Les raccourcis sont de vraies touches de clavier en relief, la ligne sélectionnée prend une braise (dégradé orangé qui s’éteint vers la droite et trait de 2 px à gauche), et la phrase du jour est en sérif d’accent. La profondeur vient d’un filet de lumière en haut de chaque surface.',
    },
    failles: [
      'C’est la plus générique des quatre : noir, orange, relief léger, c’est le look de tout outil de développeur ou d’IA de 2026. La parade est la sérif d’accent et les touches, pas la couleur.',
      'Le seul Raycast que tu as aimé est cramoisi (#C62A35), pas orange : le rouge orangé choisi ici dérive vers « orange Claude sur noir » et rend la tâche et l’accent identiques, donc « À ranger » est orange partout.',
      'Le relief (filet de lumière, ombres couchées) n’existe qu’en sombre : en clair la charte devient plate et c’est de loin sa version la plus faible.',
      'Les touches en relief ne servent à rien sur téléphone, où il n’y a pas de clavier : un pur ornement de bureau.',
      'Danger (rose rouge) et accent (rouge orangé) sont à une vingtaine de degrés de teinte, de luminosité voisine : le retard se lit surtout par le libellé et la barre.',
    ],
  },
];

// Jetons montrés en pastilles (nom CSS, libellé).
export const PALETTE_TOKENS = [
  ['--bg', 'Fond'],
  ['--surface', 'Surface'],
  ['--surface-2', 'Surface haute'],
  ['--border', 'Filet'],
  ['--border-strong', 'Bordure de contrôle'],
  ['--text', 'Texte'],
  ['--text-muted', 'Texte atténué'],
  ['--text-faint', 'Texte discret'],
  ['--accent', 'Accent'],
  ['--accent-solid', 'Accent plein'],
  ['--accent-soft', 'Accent doux'],
  ['--cat-cours', 'Plage (cours, sport)'],
  ['--cat-tache', 'Tâche'],
  ['--cat-autre', 'Autre événement'],
  ['--danger', 'Retard'],
  ['--warning', 'Alerte'],
  ['--success', 'Fait'],
];

// Paires de contraste : [libellé, premier plan, arrière-plan, seuil WCAG, type]
//  type : 'texte' (APCA indiquée avec le seuil de texte courant), 'secondaire' (APCA seuil secondaire), 'trait' (3:1).
export const CONTRAST_PAIRS = [
  ['Texte sur fond', '--text', '--bg', 4.5, 'texte'],
  ['Texte sur surface', '--text', '--surface', 4.5, 'texte'],
  ['Texte atténué sur surface', '--text-muted', '--surface', 4.5, 'secondaire'],
  ['Texte atténué sur fond', '--text-muted', '--bg', 4.5, 'secondaire'],
  ['Texte discret sur surface', '--text-faint', '--surface', 4.5, 'secondaire'],
  ['Texte discret sur surface haute', '--text-faint', '--surface-2', 4.5, 'secondaire'],
  ['Accent en texte sur surface', '--accent', '--surface', 4.5, 'texte'],
  ['Texte sur accent plein', '--on-accent', '--accent-solid', 4.5, 'texte'],
  ['Retard sur surface', '--danger', '--surface', 4.5, 'texte'],
  ['Alerte sur surface', '--warning', '--surface', 4.5, 'texte'],
  ['Fait sur surface', '--success', '--surface', 4.5, 'texte'],
  ['Tâche (trait et texte) sur surface', '--cat-tache', '--surface', 4.5, 'texte'],
  ['Plage (trait) sur surface', '--cat-cours', '--surface', 3, 'trait'],
  ['Autre événement (trait) sur surface', '--cat-autre', '--surface', 3, 'trait'],
  ['Bordure de contrôle sur surface', '--border-strong', '--surface', 3, 'trait'],
];

export const RECOMMANDATION = {
  verdict: 'Papier et encre (A) en clair d’abord, avec le sombre brun de A ; Cuir et bordeaux (B) en réserve si tu veux un sombre principal.',
  points: [
    'Elle couvre le plus gros paquet de tes J’aime : Claude (ton numéro 1), Craft et Stripe Press sont trois des huit, et tous tiennent par la typographie plutôt que par un effet. C’est aussi la seule charte où le titre du jour ressemble à un titre.',
    'Elle n’a aucun de tes rejets : pas de pastel, pas de dégradé vif, pas de bleu nuit ni de violet, rien de ludique. L’accent est un seul orange terreux.',
    'Elle est la plus lisible pour un agenda de cinq jours chargé : plage en bleu d’encre, tâche en terre cuite, deux teintes complémentaires séparées par la luminosité, contrastes tous au-dessus de 4,5:1 dans les deux modes.',
    'Son sombre n’est pas du gris-bleu mais un brun chaud : tu gardes un mode du soir sans retomber dans Graphite, que tu as rejeté.',
  ],
  conditions: [
    'À condition de lui donner sa signature (filet double, chiffres en sérif, losange du maintenant) : sans elle, A est le look « crème, sérif, orange » que tout le monde copie à Claude.',
    'Si tu travailles surtout le soir et veux le sombre en principal, prends B plutôt que D : D est la plus générique et sa version claire est la plus faible. B demande de décider si le bordeaux pâle (texte) te va.',
    'C est la plus audacieuse et la plus mémorable, mais elle est incompatible avec tes catégories d’agenda colorées et fatigue en soirée : à réserver à un mode « focus » plus tard, pas à la charte du quotidien.',
  ],
};
