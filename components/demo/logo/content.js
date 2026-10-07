// Textes de /demo/logo (en français, sans tiret long) et petites fonctions d'état partagées par la page.
// Pur : aucun React.
import { MARKS } from './marques.js';

const pad2 = (n) => String(n).padStart(2, '0');
export const fmtMin = (m) => `${pad2(Math.floor(m / 60) % 24)} h ${pad2(Math.round(m % 60))}`;

export const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

// Jour ouvré 0 à 4 (lundi à vendredi) d'une date AAAA-MM-JJ, -1 le week-end.
export function weekdayIndex(day) {
  const [y, m, d] = day.split('-').map(Number);
  const g = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = dimanche
  const i = (g + 6) % 7;
  return i <= 4 ? i : -1;
}

// État réel du symbole : heure de Paris, jour, nombre à ranger, plages de l'agenda d'aujourd'hui.
export function liveState(id, { minutes, live }) {
  if (id === 'aiguille' || id === 'solaire') return minutes;
  if (id === 'secteurs') return weekdayIndex(live.today);
  if (id === 'monogramme') return live.toRanger;
  return { now: minutes, plages: live.plages, tasks: Math.min(3, live.toRanger) };
}

// Curseur de la version vivante : réglage, conversion état <-> valeur du curseur.
export const SLIDERS = {
  aiguille: { label: 'Heure de la journée', min: 0, max: 1430, step: 10, show: (v) => fmtMin(v), to: (s) => s, from: (v) => v },
  solaire: { label: 'Heure de la journée', min: 0, max: 1430, step: 10, show: (v) => fmtMin(v), to: (s) => s, from: (v) => v },
  secteurs: { label: 'Jour de la semaine', min: 0, max: 5, step: 1, show: (v) => (v >= 5 ? 'Week-end' : DAYS[v]), to: (s) => (s < 0 ? 5 : s), from: (v) => (v >= 5 ? -1 : v) },
  monogramme: { label: 'Éléments à ranger', min: 0, max: 15, step: 1, show: (v) => `${v}`, to: (s) => s, from: (v) => v },
  anneau: { label: 'Maintenant', min: 420, max: 1380, step: 10, show: (v) => fmtMin(v), to: (s) => s.now, from: (v, base) => ({ ...base, now: v }) },
};

// Phrase qui dit ce que le symbole exprime en ce moment.
export function describe(id, s) {
  if (id === 'aiguille') return `L'aiguille est sur ${fmtMin(s)} (cadran de 24 heures, midi en haut, minuit en bas).`;
  if (id === 'solaire') {
    const t = (s - 420) / 840;
    if (t < 0 || t > 1) return `Il est ${fmtMin(s)} : le soleil est couché, il ne reste que le gnomon, sans ombre.`;
    return `Il est ${fmtMin(s)} : le soleil ${t < 0.5 ? 'est à l’est, l’ombre tombe vers l’ouest' : 'est à l’ouest, l’ombre tombe vers l’est'} (soleil de 7 h à 21 h).`;
  }
  if (id === 'secteurs') return s < 0 ? 'Week-end : aucun secteur allumé, un point au centre.' : `${DAYS[s]} : le secteur ${s + 1} sur 5 est allumé, les jours passés sont éteints.`;
  if (id === 'monogramme') {
    const n = Math.min(12, s);
    return `${s} élément${s > 1 ? 's' : ''} à ranger : ${n} graduation${n > 1 ? 's' : ''} sur 12 allumée${n > 1 ? 's' : ''}${s > 12 ? ' (le compteur plafonne à 12)' : ''}.`;
  }
  const n = s.plages.length;
  return `${n} plage${n > 1 ? 's' : ''} aujourd’hui (arcs épais), ${s.tasks} bloc${s.tasks > 1 ? 's' : ''} de tâche (arcs fins, posés dans les creux d’après maintenant), maintenant ${fmtMin(s.now)}.`;
}

// États types pour la bande sous chaque symbole.
export const STATES = {
  aiguille: () => [360, 570, 780, 1080, 1320].map((m) => ({ label: fmtMin(m), state: m })),
  solaire: () => [450, 600, 780, 960, 1140, 1320].map((m) => ({ label: fmtMin(m), state: m })),
  secteurs: () => [0, 1, 2, 3, 4, -1].map((d) => ({ label: d < 0 ? 'Week-end' : DAYS[d].slice(0, 3), state: d })),
  monogramme: () => [0, 3, 6, 9, 12].map((n) => ({ label: `${n} à ranger`, state: n })),
  anneau: (base) => [480, 660, 780, 1020, 1200].map((m) => ({ label: fmtMin(m), state: { ...base, now: m } })),
};

export const COPY = {
  aiguille: {
    kicker: 'Proposition A',
    title: "L'aiguille : un cadran de 24 heures",
    idea: "Un cadran d'instrument de bord, pas un compteur : une bague fine, des graduations toutes les deux heures, et une seule aiguille effilée en forme de dauphine, celle d'une montre d'aviateur. Le cadran fait 24 heures, midi en haut et minuit en bas, comme l'aiguille GMT d'une montre de pilote : l'aiguille montre l'heure du jour, donc ce qu'il reste. Tout est au trait fin sauf l'aiguille, la seule forme pleine et la seule en accent.",
    strengths: ["Le plus proche de l'objet que le nom évoque : un vrai cadran, tout de finesse, à l'opposé du compteur de vitesse de la première version.", "Une seule forme pleine, en accent : la hiérarchie est immédiate et le monochrome tient (l'aiguille reste une forme).", "Vivant sans aucune donnée : l'heure suffit, donc aucune panne possible et aucune journée vide."],
    flaws: ["Une horloge reste une horloge : c'est le symbole le moins propre à Cadran, on pense « montre » et on retrouve l'icône Horloge de n'importe quel système.", "Le cadran de 24 heures (midi en haut) déroute : le premier regard lit l'heure à l'envers, il faut le savoir.", "Les graduations fines (traits de 1,5 unité) n'existent plus sous 32 px : la variante petite les abandonne et ne garde que la bague, le repère de midi et l'aiguille.", "Ne dit rien des deux objets du cockpit (plages et tâches)."],
    legibility: "Moyenne. À 32 px tout tient. À 16 px la bague, l'aiguille et le moyeu restent, mais l'aiguille n'est plus qu'une barre dans un disque : on voit une horloge, pas l'heure.",
    typoNote: "Logotype tracé en minuscules très fines et très espacées (trait de 2,5), pour faire corps avec les graduations. Version composée équivalente : Fraunces 500, en minuscules, une serif d'horlogerie.",
  },
  solaire: {
    kicker: 'Proposition B',
    title: 'Le cadran solaire : un gnomon et son ombre',
    idea: "Le cadran dans son sens le plus ancien : un gnomon (le triangle qui porte l'ombre), le sol, un soleil qui parcourt son arc de 7 h à 21 h et l'ombre posée sur le sol, à l'opposé. L'ombre est la seule forme en accent : c'est elle qui dit maintenant. La nuit, le soleil et l'ombre disparaissent, il ne reste que le gnomon : la journée est finie.",
    strengths: ["Le plus singulier : aucun des 14 outils de référence n'a un cadran solaire, et il est exact avec le nom.", "Se lit sans légende : ombre courte à midi, longue le matin et le soir, du côté opposé au soleil.", "La disparition de l'ombre la nuit est une information, pas un trou : le logo se tait quand la journée est finie."],
    flaws: ["Le plus illustratif des cinq : il raconte une scène (un soleil, un sol) au lieu d'être un signe, donc le moins « instrument de bord » et le plus loin de la consigne « trait unique, 3 formes ».", "Le soleil évoque la météo ; il disparaît en petite taille, ce qui change le dessin selon la taille.", "Ne dit que matin ou après-midi : l'ombre donne l'heure en gros, pas à la minute.", "Sans l'accent, le gnomon seul ressemble à un panneau « lecture » ou à un toit."],
    legibility: "Moyenne à faible. À 16 px le soleil a disparu : reste un triangle noir sur une ligne, avec une barre d'accent qui bouge. Reconnaissable une fois expliqué, ambigu sinon.",
    typoNote: "Logotype tracé en minuscules grasses (trait de 5), compact, au poids du gnomon. Version composée équivalente : Instrument Sans 600.",
  },
  secteurs: {
    kicker: 'Proposition C',
    title: 'Les cinq secteurs : la semaine en un cadran',
    idea: "Cinq secteurs égaux, un par jour ouvré (lundi en haut, dans le sens des aiguilles), séparés par un vide et autour d'un trou central. Le secteur du jour est allumé en accent, les jours passés sont éteints, les jours à venir à demi allumés. Le week-end aucun secteur n'est allumé et un point central le dit. C'est l'agenda sur 5 jours du cockpit, réduit à un signe.",
    strengths: ["Le seul qui reprend la structure même du cockpit : l'agenda sur 5 jours.", "Le plus lisible à 16 px : des aplats séparés par un vide, aucun trait fin.", "Se comprend sans explication : on voit où l'on en est dans la semaine, et la couleur marque le jour."],
    flaws: ["Un camembert, ou un indicateur de chargement : sans l'accent, aucune personnalité. C'est le plus banal des cinq au premier regard.", "Ne change que cinq fois par semaine : le moins vivant, et aucune urgence à le regarder.", "Rien de l'heure ni du cadran : cinq parts de 72 degrés ne tombent sur aucun repère d'un cadran.", "Ne dit rien des deux objets du cockpit (plages et tâches)."],
    legibility: "Bonne. Cinq aplats, un vide de 12 degrés entre eux : à 16 px le jour allumé se repère tout de suite, c'est la meilleure lecture du lot.",
    typoNote: "Logotype tracé en majuscules à trait moyen (3) et très espacées, dans l'esprit d'un tableau de bord d'avion. Version composée équivalente : Geist Mono, majuscules, interlettrage 0,16 em.",
  },
  monogramme: {
    kicker: 'Proposition D',
    title: 'Le monogramme : un C formé par un arc gradué',
    idea: "Un C ouvert à droite, tracé au gros trait, bordé d'une règle de 12 graduations : le C est à la fois l'initiale, le cadran ouvert et une règle. Les graduations s'allument en accent selon le nombre d'éléments à ranger, jusqu'à 12. Rien à ranger : un C nu, calme. En petite taille la règle disparaît et c'est l'arc lui-même qui se colore, du bas vers le haut.",
    strengths: ["Un vrai signe de marque : la lettre fait l'icône, comme dans un monogramme de maison de tailleur.", "Le compteur se lit sans chiffre : on compte les crans allumés, et zéro est un état calme.", "Le plus solide en toutes tailles : un gros arc tient du favicon au 512 px."],
    flaws: ["C'est une lettre : le piège « lettre dans un cadre » de la recherche. Seules les graduations le sauvent, et elles disparaissent en petite taille.", "À 16 px il ne reste qu'un C épais : le plus lisible et le moins distinctif, on le prend pour la lettre C de n'importe quelle application.", "Le compteur plafonne à 12 : 12 ou 40 éléments donnent le même logo.", "Ne dit rien de l'agenda, des plages ni des tâches."],
    legibility: "Très bonne en lisibilité, faible en distinction. À 16 px un C épais avec un arc d'accent : on le lit, mais ce n'est plus Cadran, c'est un C.",
    typoNote: "Logotype tracé en minuscules grasses (trait de 6), au poids de l'arc. Version composée équivalente : Mona Sans en largeur 125 %, graisse 600.",
  },
  anneau: {
    kicker: 'Proposition E',
    title: "L'anneau horaire : plages et tâches",
    idea: "Un anneau qui porte la journée, de 7 h à 23 h (la nuit en haut), avec les deux types d'objets de l'agenda : les plages (cours, tennis, événements) en arcs épais, les tâches en arcs fins et colorés, posés dans les creux. Un trait intérieur pointe maintenant, et les arcs passés s'atténuent. Version vivante : les vraies plages d'aujourd'hui et un bloc de tâche par élément à ranger (3 au plus).",
    strengths: ["Le seul à montrer la vraie journée : c'est une miniature du cockpit, plages et tâches comprises.", "Reprend les deux types d'objets de l'agenda, avec le même vocabulaire (épais contre fin, neutre contre accent).", "Chaque jour a un logo différent : le plus vivant, et le plus propre à Cadran, introuvable ailleurs."],
    flaws: ["Sans données, un anneau découpé est abstrait : le sens ne vient qu'une fois qu'on connaît la règle.", "À 16 px les arcs fins s'écrasent : la variante petite reste une silhouette d'anneau coupé, plages et tâches se distinguent mal.", "Un jour sans événement donne un anneau presque vide : le logo s'efface le week-end, justement quand on ouvre moins le cockpit.", "Le plus complexe à dessiner, à exporter et à animer."],
    legibility: "Moyenne. À 16 px on lit un anneau interrompu avec un trait au centre : la forme est reconnaissable, l'information (plage ou tâche) ne passe plus. À 32 px tout se lit.",
    typoNote: "Logotype tracé en minuscules à trait moyen (4), espacement serré. Version composée équivalente : Inter Tight 600.",
  },
};

export const CRITERIA = [
  ['Lisibilité à 16 px', ['moyenne', 'moyenne à faible', 'bonne', 'très bonne', 'moyenne']],
  ['Distinction (on ne le confond pas)', ['moyenne', 'forte', 'faible', 'faible', 'forte']],
  ['Lien avec le cockpit', ['faible', 'faible', 'fort (5 jours)', 'faible', 'très fort (plages, tâches)']],
  ['Vivant', ['toujours (heure)', 'toujours (heure)', '5 états', 'selon le rangement', 'chaque jour différent']],
  ['Coût pour le tenir', ['bas', 'moyen', 'bas', 'bas', 'élevé (données, variante petite)']],
];

export const ids = Object.keys(MARKS);

// Recommandation, écrite après lecture des rendus réels (loupes à 16 et 32 px, rail, onglet).
export const REC = {
  id: 'anneau',
  title: "L'anneau horaire (E), avec l'aiguille (A) en repli",
  paragraphs: [
    "Je recommande E. C'est le seul des cinq qui ne ressemble à aucun logo d'outil et qui montre ce que le cockpit contient vraiment : la journée, ses plages et ses tâches, avec le même vocabulaire que l'agenda (épais contre fin, neutre contre accent). Un logo informatif qui n'est pas décoratif, et un logo qui change chaque jour, donc que l'on regarde : c'est la règle « information vivante » de la recherche, tenue de bout en bout. Les quatre autres sont soit des horloges (A), soit des illustrations (B), soit des camemberts (C), soit une lettre (D).",
    "Le prix est réel et il faut le voir en face : à 16 px, l'anneau n'est plus qu'une couronne interrompue. La forme se reconnaît, la distinction plage ou tâche ne passe plus, et les arcs fins n'existent pas à cette taille (la variante petite les remplace par des arcs de même épaisseur, distingués par la couleur seule). Un jour sans événement, l'anneau se vide : il reste le trait de maintenant et un anneau presque nu. Aujourd'hui le cockpit n'a aucun élément à ranger, donc aucun bloc de tâche ne s'affiche : le bouton « Exemple » en haut montre la version pleine.",
    "Si ce prix te paraît trop haut, le repli est A : l'aiguille dauphine sur cadran de 24 heures est la plus élégante, à peine plus lisible à 16 px (bague, aiguille et moyeu tiennent), et la plus fidèle au nom, mais c'est une horloge, donc la moins propre à Cadran. C est le choix prudent (le plus net à 16 px, le seul lié aux cinq jours), à condition d'accepter qu'il ressemble à un camembert. B et D sont écartés : B raconte une scène qui s'efface en petite taille, D est une lettre qui ressemble à celle de n'importe quelle application.",
  ],
  questions: [
    "E malgré un 16 px faible, ou A / C pour la netteté ? (1 E, 2 A, 3 C)",
    "Logotype tracé à la main (reproductible, aucun fichier de police) ou composé en police (Inter Tight pour E) ?",
    "Accent du logo : le bleu de la charte, ou une piste de couleur automobile (voir les pastilles ci-dessous) ?",
    "Faut-il que le favicon d'onglet soit vivant (il change avec la journée) ou fixe (un anneau type, toujours identique) ?",
  ],
};
