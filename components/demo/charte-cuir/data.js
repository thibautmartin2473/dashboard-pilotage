// Textes de /demo/charte-cuir. Les couleurs ne sont PAS recopiées ici (sauf dans les phrases d'explication,
// à titre indicatif) : la page les relit dans le CSS rendu (app/demo/studio/chartes.css).
import { CONTRAST_PAIRS, PALETTE_TOKENS } from '../chartes-cadran/data';

export const NIVEAUX = [
  {
    id: 'cadran-cuir-1',
    n: 1,
    name: 'Niveau 1, brun cacao',
    tagline: 'Le plus profond : on reste nettement dans le brun, pas dans le noir.',
    resume: { fond: '#3B2B25', surface: '#4A372F', texte: '#F8EEDC', accent: 'bordeaux #A3324D (plein), rosé #F2A8BC (texte)' },
    change: [
      'Le fond passe de #1A1210 (presque noir) à #3B2B25 : un brun cacao que l’on reconnaît comme du brun même en plein jour.',
      'Surface à #4A372F, un cran net au-dessus du fond ; surface haute #58443A pour ce qui est survolé ou ouvert.',
      'Le bordeaux plein #A3324D est plus clair que la surface (il ressort par la luminosité et par la chroma) ; le texte crème dessus passe à 6,3:1.',
      'Plage olive, tâche cuir ambré, retard corail, fait vert sauge : quatre teintes à au moins 38 degrés l’une de l’autre, plus la forme (barre pleine, contour pointillé, barre hachurée, titre barré).',
    ],
    failles: [
      'C’est le plus proche de l’ancien sombre : sur un écran lumineux, en plein jour, on le lit « sombre » et non « équilibré ». Si ta remarque était « pas assez clair », il ne la règle qu’à moitié.',
      'Le bordeaux plein ne se distingue de la surface que par sa teinte (rapport de luminance de 1,7:1, sous les 3:1 d’un trait d’interface) : un bouton bordeaux seul, sans son libellé crème, se perdrait. À doubler d’un filet rosé de 1 px sur les boutons.',
      'Il y a bien deux bordeaux (plein et rosé). Un seul est impossible : un fond bordeaux qui porte du texte crème est trop sombre pour se lire en texte sur du brun.',
      'Le rosé du texte d’accent (5,9:1) reste un peu rose bonbon sur les liens et les suggestions ; à employer avec parcimonie.',
    ],
  },
  {
    id: 'cadran-cuir',
    n: 2,
    name: 'Niveau 2, brun cuir (recommandé)',
    tagline: 'Le vrai milieu : ni l’un ni l’autre, un brun de reliure.',
    resume: { fond: '#4A372F', surface: '#584238', texte: '#FBF1E0', accent: 'bordeaux #A63450 (plein), rosé #F7B8C8 (texte)' },
    change: [
      'Fond #4A372F, surface #584238, surface haute #67503F : trois marches régulières, la surface se détache du fond à l’œil sans bordure.',
      'Texte crème #FBF1E0 à 8,3:1 sur la surface ; atténué #E8D9C3 à 6,7:1 et APCA Lc 73 (lisible en texte courant), discret #E0CFB8 à 6,1:1 et Lc 67.',
      'Les quatre états de l’agenda sont poussés pour se lire d’un coup d’œil : olive #CCD67C, cuir #F2B05C, corail #FF9B85, vert #9ADEB0, avec chacun sa forme.',
      'Le laiton #E0BB70 porte la signature : maintenant, couture pointillée, soulignement du jour. Le signet bordeaux pend de l’en-tête du jour.',
    ],
    failles: [
      'Même limite que les autres niveaux : un bordeaux plein et un bordeaux rosé. Le plein ne fait que 1,4:1 de luminance contre la surface ; il tient par sa chroma et par le texte crème dessus.',
      'Corail (retard) et rosé (accent) sont à environ 25 degrés de teinte : sur une liste mélangée, « en retard » se lit grâce au libellé et à la barre hachurée, pas à la couleur seule.',
      'La zone médiane est étroite : au-delà de ce niveau, le texte crème ne tient plus 4,5:1 sur les surfaces. Ce n’est pas un gris moyen de 50 %, c’est le milieu du possible avec du texte clair.',
      'Le corail du retard n’atteint que Lc 51 en texte (4,6:1) : bon pour un libellé gras court, pas pour une phrase. La lecture du retard repose donc sur la barre hachurée.',
      'Libre Caslon fine à 400 sur fond moyen : réservée aux titres, jamais au corps.',
    ],
  },
  {
    id: 'cadran-cuir-3',
    n: 3,
    name: 'Niveau 3, café au lait',
    tagline: 'Le plus clair qui tienne avec du texte crème.',
    resume: { fond: '#59443A', surface: '#675145', texte: '#FFFAF0', accent: 'bordeaux #86213B (plein), rosé #FFC9D6 (texte)' },
    change: [
      'Fond #59443A, surface #675145, surface haute #765E51 : le plus chaud et le plus cuir des trois, nettement moins sombre.',
      'Le bordeaux plein devient plus sombre que la surface (#86213B) : il se lit en creux et le crème dessus monte à 8,5:1.',
      'Les couleurs de texte (rosé, corail, cuir, olive) montent en clarté pour garder 4,5:1 sur la surface : elles deviennent des tons poudrés.',
    ],
    failles: [
      'C’est le plafond physique : une surface un peu plus claire et ni le texte crème ni l’encre ne passent 4,5:1. Pour aller plus clair il faudrait changer de polarité (texte encre sur cuir clair), c’est-à-dire revenir au mode clair que tu refuses.',
      'Les accents de texte sont à peine au-dessus du seuil (corail 4,6:1, cuir 4,8:1, rosé 5,1:1) : la moindre baisse de luminosité de l’écran les rend ternes, et ils tirent vers le pastel poudré que tu avais écarté.',
      'Le bordeaux plein est à 1,2:1 de la surface, quasi invisible en luminosité ; il ne tient que par la teinte.',
      'Sur la surface haute (#765E51), le texte discret ne fait que 4,6:1 : à ne pas utiliser pour du texte secondaire sous un survol ou un panneau ouvert.',
    ],
  },
];

export const RECO = {
  verdict: 'Niveau 2 (id cadran-cuir) : brun cuir #4A372F, surface #584238.',
  points: [
    'C’est le seul des trois où l’on ne dit ni « sombre » ni « clair » : le niveau 1 reste un sombre chaud, le niveau 3 est à la limite physique du texte crème et ses accents tournent au poudré.',
    'Les contrastes y sont confortables partout (texte 8,3:1, atténué 6,7:1) et le texte secondaire reste au-dessus de Lc 60 en APCA, ce que la charte Graphite ratait.',
    'Plage, tâche, retard et fait y sont distincts par la teinte (au moins 38 degrés entre plage, tâche, corail et vert, mesurés sur les jetons) et par la forme.',
  ],
  restes: [
    'Deux bordeaux restent nécessaires (plein et rosé). Si tu veux vraiment un seul bordeaux lisible, la seule voie est le texte encre sur cuir clair, donc un mode clair.',
    'Le bordeaux plein se confond presque avec la surface en luminosité : les boutons doivent porter un libellé crème et un filet rosé de 1 px.',
    'Corail et rosé sont voisins : le retard doit toujours porter son libellé et sa barre hachurée.',
    'Les boutons dessinés en parallèle s’appuient sur cadran-cuir : si tu changes de niveau, ils suivent sans rien refaire, puisque les noms de jetons ne bougent pas.',
  ],
};

export const PALETTE_CUIR = [...PALETTE_TOKENS, ['--surface-0', 'Fond profond'], ['--on-accent', 'Texte sur accent plein'], ['--laiton', 'Laiton']];
export const PAIRS_CUIR = [
  ...CONTRAST_PAIRS,
  ['Laiton (maintenant, couture) sur surface', '--laiton', '--surface', 3, 'trait'],
  ['Texte sur surface haute', '--text', '--surface-2', 4.5, 'texte'],
  ['Texte atténué sur surface haute', '--text-muted', '--surface-2', 4.5, 'secondaire'],
  ['Accent plein contre surface (information)', '--accent-solid', '--surface', 1, 'trait'],
];

export const ETATS = [
  { id: 'plage', label: 'Plage', hint: 'Bloc plein, barre épaisse à gauche', token: '--cat-cours' },
  { id: 'tache', label: 'Tâche', hint: 'Contour pointillé, pastille', token: '--cat-tache' },
  { id: 'retard', label: 'En retard', hint: 'Barre hachurée, libellé en gras', token: '--danger' },
  { id: 'fait', label: 'Fait', hint: 'Contour vert, titre barré', token: '--success' },
];
