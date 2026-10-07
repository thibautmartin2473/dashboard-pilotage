// Les six noms proposés pour le cockpit (aujourd'hui : « Pilotage », un P dans un carré), le classement
// et les résultats de recherche de collisions (GitHub API et WebSearch, relevés le 2026-10-07).
// Texte visible en français, sans emoji ni tiret long.

export const NAMES = [
  {
    id: 'estime',
    name: 'Estime',
    rank: 1,
    drawn: true,
    syllables: 2,
    pitch: 'Savoir où en est la journée sans repère fixe, juste avec le cap, la vitesse et l’heure.',
    meaning:
      'La navigation à l’estime situe le navire à partir du cap, de la vitesse et du temps écoulé. C’est exactement le travail du cockpit : à partir de l’agenda, des tâches ouvertes et de l’heure, estimer où en sera la journée. En français, « estime » veut aussi dire considération, et l’anglais « esteem » sonne presque pareil.',
    tone: 'Précis, calme, un peu savant : un instrument de bord plutôt qu’un produit grand public.',
    risks: [
      'Le verbe « j’estime » : en dictée, « ouvre Estime » peut devenir « ouvre l’estime ».',
      'Proche d’« estimate » : peut faire penser à un outil de chiffrage de durées.',
      'Le dépôt IAIAE/estime (moteur ECMAScript, 89 étoiles) est le plus proche des 100 étoiles du seuil.',
    ],
    collisions: [
      'GitHub : IAIAE/estime 89 étoiles (moteur ECMAScript), oTeun/Estime 5 (Minecraft), DaniyalAhmadSE/estime 1 (estimateur de durée).',
      'WebSearch « Estime app planner productivity » : aucune application de productivité de ce nom.',
    ],
    maxStars: 89,
    productivityHit: false,
    dictation: { level: 'moyen', why: 'homophone du verbe « estime »' },
    symbol:
      'Un point plein (le départ), une trace, un anneau (maintenant) et un pointillé (ce qui reste à estimer). L’anneau avance avec l’heure entre 7 h et 23 h : le logo est une horloge qui ne dit pas l’heure.',
    liveSource: 'l’heure de l’appareil',
  },
  {
    id: 'cadran',
    name: 'Cadran',
    rank: 2,
    drawn: true,
    syllables: 2,
    pitch: 'La face d’un instrument : on lit d’un coup d’œil où l’on en est.',
    meaning:
      'Le cadran est la face d’une horloge, d’une jauge ou d’un compas ; un cockpit est une planche de cadrans, et « tableau de bord » se dit dashboard. Le nom colle à l’objet que Thibaut a sous les yeux : un tableau où chaque chose se lit sur une échelle.',
    tone: 'Instrument, horloger, sobre. Sérieux sans être froid.',
    risks: [
      'Prononciation anglaise hésitante (« ka-DRAN » ou « KAD-ran ») : sans importance pour un outil perso, gênant s’il était partagé.',
      'Promet un widget d’horloge ou de jauge : le logo ne doit pas devenir un compteur de vitesse banal.',
      'Trois petits dépôts de « temps » portent déjà le nom (horloge de bureau macOS, fuseaux horaires, finances perso).',
    ],
    collisions: [
      'GitHub : Ilyomix/Cadran-releases 8 étoiles (horloge en fond d’écran macOS), tblt-gr/cadran 1 (finances perso), pior/cadran 1 (fuseaux horaires dans la barre de menu).',
      'WebSearch « Cadran app productivity planner » : aucune application de productivité de ce nom.',
    ],
    maxStars: 8,
    productivityHit: false,
    dictation: { level: 'faible', why: 'mot rare, aucun homophone courant' },
    symbol:
      'Un arc de 270 degrés, une aiguille accentuée, un moyeu. L’aiguille indique le nombre d’éléments à ranger (plein à 10) : on lit l’état de la boîte de réception d’un coup d’œil, même en onglet.',
    liveSource: 'le nombre d’éléments à ranger',
  },
  {
    id: 'balise',
    name: 'Balise',
    rank: 3,
    drawn: true,
    syllables: 2,
    pitch: 'Un repère posé sur la route, allumé quand il faut regarder.',
    meaning:
      'Une balise marque un chenal, une position, un point à ne pas manquer (balise de navigation, balise de détresse). Le cockpit balise la journée et les projets : un repère fixe pour se situer.',
    tone: 'Signalétique, factuel, direct. Un outil de bord qui signale sans bavarder.',
    risks: [
      'Mot très courant en français (balise HTML) : se cherche mal, et « ouvre Balise » prête à confusion dans une session de code.',
      'Un catalogue francophone de skills pour Claude Code s’appelle déjà balise-skills : même écosystème que le sien.',
      'Aucune charge poétique : le nom ne dit pas le temps.',
    ],
    collisions: [
      'GitHub : kz26/balise 41 étoiles (API de géolocalisation IP), mrstev3n/balise-skills 12 (skills Claude Code en français), thallop/BALISE 1.',
      'WebSearch « Balise app productivity planner dashboard » : aucune application de productivité de ce nom.',
    ],
    maxStars: 41,
    productivityHit: false,
    dictation: { level: 'faible', why: 'mot courant, orthographe sans piège' },
    symbol:
      'Un losange sur un mât, au-dessus d’une ligne de flottaison. Losange plein : il reste des choses à ranger. Losange creux : journée rangée. C’est la pastille de notification des applications, version instrument.',
    liveSource: 'l’état de la boîte « À ranger »',
  },
  {
    id: 'jalon',
    name: 'Jalon',
    rank: 4,
    drawn: true,
    syllables: 2,
    pitch: 'Le piquet planté pour tenir une ligne droite, et l’étape d’un projet.',
    meaning:
      'Un jalon est une perche plantée pour aligner un tracé, et par extension une étape clé d’un projet. Le cockpit pilote des projets (Spircle, Stage, EDHEC AI) dont les étapes sont déjà des jalons.',
    tone: 'Chantier, projet, concret. Un peu sec, très clair.',
    risks: [
      'Ses projets ont déjà des « milestones » (jalons) : le mot serait à la fois le nom de l’outil et d’un objet de l’outil (« ajoute un jalon dans Jalon »).',
      'Orientation projet : dit moins la journée que le pilotage de fond.',
      'Un gestionnaire de tâches pour humains et agents (AltSoyuz/jalon) porte le nom, minuscule mais dans le même domaine.',
      'Prononciation anglaise proche de « gallon ».',
    ],
    collisions: [
      'GitHub : AltSoyuz/jalon 3 étoiles (gestionnaire de tâches pour humains et agents), les autres à 0.',
      'WebSearch « Jalon app task manager planner » : aucune application de productivité diffusée de ce nom.',
    ],
    maxStars: 3,
    productivityHit: true,
    dictation: { level: 'faible', why: 'mot net, mais « jalon/gallon » à l’oral anglais' },
    symbol:
      'Une perche de géomètre à cinq bandes plantée sur une ligne. Les bandes atteintes sont pleines et accentuées : la perche se remplit avec les jalons du projet en cours.',
    liveSource: 'les jalons du projet le plus avancé',
  },
  {
    id: 'timon',
    name: 'Timon',
    rank: 5,
    drawn: false,
    syllables: 2,
    pitch: 'La barre du navire : celui qui tient le timon décide du cap.',
    meaning: 'Le timon est la barre ou le gouvernail ; « tenir le timon » veut dire diriger. Piloter, littéralement.',
    tone: 'Ferme, un peu archaïque.',
    risks: [
      'Timon est le suricate du Roi Lion et un prénom : l’association écrase le sens nautique.',
      'Écarté du dessin : aucun symbole simple (une barre, une roue) qui ne soit un pictogramme de gouvernail déjà vu.',
    ],
    collisions: ['GitHub : tripitakit/timon 9 étoiles, rzzli/TIMON 7, mongrov/timon 6 (séries temporelles). Recherche d’application de productivité non faite pour ce nom.'],
    maxStars: 9,
    productivityHit: false,
    dictation: { level: 'moyen', why: '« Timon » ou « Thimon » selon la transcription' },
  },
  {
    id: 'hune',
    name: 'Hune',
    rank: 6,
    drawn: false,
    syllables: 1,
    pitch: 'La plate-forme en haut du mât d’où l’on guette devant soi.',
    meaning: 'La hune est la plate-forme d’observation d’un mât : voir loin, avant les autres. Le contraire d’un nom de promesse.',
    tone: 'Discret, guetteur.',
    risks: [
      'Disqualifiant en dictée : « hune » se prononce comme « une » (« ouvre une », « range ça dans une »).',
      'En anglais, « hoon » est un argot australien (conducteur imprudent).',
    ],
    collisions: ['GitHub : cloneforyou/hune 0 étoile. Recherche d’application de productivité non faite pour ce nom.'],
    maxStars: 0,
    productivityHit: false,
    dictation: { level: 'élevé', why: 'homophone de « une »' },
  },
];

// Noms écartés avant le classement, avec la preuve.
export const REJECTED = [
  { name: 'Vigie', why: 'tableau de bord auto-hébergé français avec tâches et agenda (github.com/tristanbasb/vigie), relevé par la recherche profonde.' },
  { name: 'Quart', why: 'pallets/quart, framework web Python, 3 669 étoiles.' },
  { name: 'Cale', why: 'application « To-Do List & Calendar: Cale » sur l’App Store : collision directe avec un outil de productivité, malgré le clin d’œil à « cale-moi ça ».' },
  { name: 'Cairn', why: 'oritera/Cairn, 3 282 étoiles, et cairn-dev/cairn (agent de développement, 220 étoiles).' },
  { name: 'Fanal', why: 'aquasecurity/fanal, 196 étoiles (analyse de conteneurs, archivé).' },
  { name: 'Vire', why: 'vipshop/vire, 207 étoiles (Redis multi-thread), et TrackLab/ViRe, 214.' },
];

// Grille de critères I1 à I9 (docs/refonte-taches/RECHERCHE-PROFONDE.md, axe 1).
export const CRITERIA = [
  { id: 'I1', label: 'Nom court', test: '1 ou 2 syllabes, 8 lettres au plus, sans accent' },
  { id: 'I2', label: 'Dictée', test: '3 phrases transcrites 3 fois sur 3' },
  { id: 'I3', label: 'Collisions', test: 'aucun dépôt de plus de 100 étoiles ni app de productivité du même nom' },
  { id: 'I4', label: 'Lisibilité', test: 'reconnaissable à 16 et 512 px, monochrome' },
  { id: 'I5', label: 'Construction', test: 'grille de 4, un seul trait, 3 formes au plus, SVG livré' },
  { id: 'I6', label: 'Sens', test: 'information vivante dans le logo' },
  { id: 'I7', label: 'Interdits', test: 'ni étincelle, ni dégradé, ni lettre décorative' },
  { id: 'I8', label: 'Licence', test: 'logotype dessiné, aucune police à licencier' },
  { id: 'I9', label: 'Déclinaisons', test: 'favicon, rail, écran d’ouverture sur le vrai fond' },
];

export const DICTATION = (n) => [`Ouvre ${n}`, `Range ça dans ${n}`, `${n} de demain`];

// Verdict par nom et par critère : 'ok', 'warn' (réserve) ou 'ko', avec la raison.
export function verdict(n) {
  const letters = n.name.length;
  const i1 = n.syllables <= 2 && letters <= 8;
  const i3 = n.maxStars <= 100 && !n.productivityHit;
  const dict = n.dictation.level;
  return {
    I1: [i1 ? 'ok' : 'ko', `${n.syllables} syllabe${n.syllables > 1 ? 's' : ''}, ${letters} lettres`],
    I2: ['warn', `Non testé à la voix. Risque ${dict} (${n.dictation.why}).`],
    I3: [
      n.maxStars > 100 ? 'ko' : n.productivityHit ? 'warn' : 'ok',
      `Plus gros dépôt : ${n.maxStars} étoiles${n.productivityHit ? ', un outil de tâches minuscule porte le nom' : ''}`,
    ],
    I4: [n.drawn ? 'ok' : 'warn', n.drawn ? 'Dessiné, variante petite à 16 et 32 px' : 'Pas de logo dessiné'],
    I5: [n.drawn ? 'ok' : 'warn', n.drawn ? 'Grille de 4, trait de 4, trois formes, SVG exporté' : 'Non dessiné'],
    I6: [n.drawn ? 'ok' : 'warn', n.drawn ? `Vivant : ${n.liveSource}` : 'Non dessiné'],
    I7: [n.drawn ? 'ok' : 'warn', n.drawn ? 'Aucune étincelle, aucun dégradé, aucune lettre' : 'Non dessiné'],
    I8: ['ok', 'Lettres tracées à la main, pas de police'],
    I9: [n.drawn ? 'ok' : 'warn', n.drawn ? 'Rail, démarrage, onglet, icône : montrés ci-dessous' : 'Non dessiné'],
    pass: i1 && i3,
  };
}
