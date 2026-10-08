// Vérification de la logique pure de la navigation fluide : node scripts/check-nav.mjs
// 1. Raccourcis « g puis une lettre » (lib/nav-shortcuts.js) : séquence, délai, garde de saisie et de dialogue.
// 2. Mémoire des positions de la Constellation (lib/constellation-sim.js) : aller-retour, taille, validation.
import assert from 'node:assert/strict';
import { ETAT_INITIAL, NAV_KEYS, SEQUENCE_MS, estSaisie, shortcutLabel, suite } from '../lib/nav-shortcuts.js';
import { appliquerPositions, construireSim, encoderPositions, positionsValides, refroidie, signatureGraphe } from '../lib/constellation-sim.js';

const ev = (key, o = {}) => ({ key, ctrl: false, meta: false, alt: false, repeat: false, saisie: false, dialogue: false, ...o });

// --- Séquence g puis lettre ---
let r = suite(ETAT_INITIAL, ev('g'), 1000);
assert.equal(r.href, null);
assert.equal(r.consommer, false, '`g` seul n\'est pas consommé');
assert.equal(r.etat.armeA, 1000);

const attendus = { c: '/', a: '/agenda', m: '/mails', r: '/a-ranger', i: '/brain', v: '/constellation' };
for (const [lettre, href] of Object.entries(attendus)) {
  const apresG = suite(ETAT_INITIAL, ev('g'), 5000).etat;
  const fin = suite(apresG, ev(lettre), 5000 + 300);
  assert.equal(fin.href, href, `g ${lettre} -> ${href}`);
  assert.equal(fin.consommer, true, `la lettre ${lettre} après g est consommée (pas de geste À ranger)`);
  assert.equal(fin.etat.armeA, null, 'séquence terminée');
}
assert.deepEqual(Object.keys(NAV_KEYS).sort(), Object.keys(attendus).sort());

// Majuscule (Maj ou verrouillage) : même chose.
assert.equal(suite(suite(ETAT_INITIAL, ev('G'), 0).etat, ev('A'), 100).href, '/agenda');

// Une lettre SEULE ne navigue pas et n'est pas consommée : V A C S P restent aux gestes de la liste.
for (const lettre of ['v', 'a', 'c', 's', 'p', 'z', 'm', 'r', 'i']) {
  const seul = suite(ETAT_INITIAL, ev(lettre), 100);
  assert.equal(seul.href, null, `${lettre} seul ne navigue pas`);
  assert.equal(seul.consommer, false, `${lettre} seul reste au geste`);
}

// Délai : au-delà d'une seconde la séquence est perdue, la lettre ne navigue pas.
const arme = suite(ETAT_INITIAL, ev('g'), 10000).etat;
assert.equal(suite(arme, ev('a'), 10000 + SEQUENCE_MS).href, '/agenda', 'pile dans le délai');
const tard = suite(arme, ev('a'), 10000 + SEQUENCE_MS + 1);
assert.equal(tard.href, null, 'trop tard');
assert.equal(tard.consommer, false, 'trop tard : la lettre garde son effet (geste)');
// Trop tard puis `g` : on repart à zéro.
assert.equal(suite(arme, ev('g'), 20000).etat.armeA, 20000);

// Autre touche après g : séquence annulée, touche non consommée (un geste reste possible).
const autre = suite(arme, ev('s'), 10100);
assert.equal(autre.href, null);
assert.equal(autre.consommer, false);
assert.equal(autre.etat.armeA, null);
// g g : on repart sans naviguer.
assert.equal(suite(arme, ev('g'), 10200).etat.armeA, 10200);
assert.equal(suite(arme, ev('g'), 10200).href, null);

// Un modificateur seul entre g et la lettre ne casse pas la séquence (Maj puis A).
const apresShift = suite(arme, ev('Shift'), 10100);
assert.equal(apresShift.etat.armeA, 10000);
assert.equal(suite(apresShift.etat, ev('A'), 10200).href, '/agenda');

// Touche maintenue : ignorée.
const rep = suite(arme, ev('a', { repeat: true }), 10100);
assert.equal(rep.href, null);
assert.equal(rep.etat.armeA, 10000);

// Ctrl / Meta / Alt : jamais de navigation, séquence annulée (Ctrl+K reste à la palette).
for (const mod of ['ctrl', 'meta', 'alt']) {
  assert.equal(suite(ETAT_INITIAL, ev('g', { [mod]: true }), 0).etat.armeA, null, `${mod}+g n'arme pas`);
  const annule = suite(arme, ev('a', { [mod]: true }), 10100);
  assert.equal(annule.href, null);
  assert.equal(annule.consommer, false);
  assert.equal(annule.etat.armeA, null);
}

// Saisie ou dialogue ouvert : rien n'arme, rien ne navigue, et une séquence commencée est annulée.
assert.equal(suite(ETAT_INITIAL, ev('g', { saisie: true }), 0).etat.armeA, null);
assert.equal(suite(ETAT_INITIAL, ev('g', { dialogue: true }), 0).etat.armeA, null);
const enSaisie = suite(arme, ev('a', { saisie: true }), 10100);
assert.equal(enSaisie.href, null);
assert.equal(enSaisie.consommer, false);
assert.equal(suite(arme, ev('a', { dialogue: true }), 10100).href, null);
assert.equal(suite(arme, ev('a', { dialogue: true }), 10100).etat.armeA, null);

// L'état initial n'est jamais modifié (gelé).
assert.throws(() => {
  'use strict';
  ETAT_INITIAL.armeA = 1;
});

// --- Garde de saisie ---
assert.equal(estSaisie({ tagName: 'INPUT', type: 'text' }), true);
assert.equal(estSaisie({ tagName: 'input' }), true, 'type absent = texte');
assert.equal(estSaisie({ tagName: 'INPUT', type: 'search' }), true);
assert.equal(estSaisie({ tagName: 'INPUT', type: 'date' }), true);
assert.equal(estSaisie({ tagName: 'INPUT', type: 'checkbox' }), false, 'case à cocher : pas de saisie');
assert.equal(estSaisie({ tagName: 'INPUT', type: 'radio' }), false);
assert.equal(estSaisie({ tagName: 'TEXTAREA' }), true);
assert.equal(estSaisie({ tagName: 'SELECT' }), true);
assert.equal(estSaisie({ tagName: 'DIV', isContentEditable: true }), true);
assert.equal(estSaisie({ tagName: 'DIV' }), false);
assert.equal(estSaisie({ tagName: 'BUTTON' }), false);
assert.equal(estSaisie({ tagName: 'A' }), false);
assert.equal(estSaisie(null), false);

// --- Libellés du rail ---
assert.equal(shortcutLabel('/agenda', 'Agenda'), 'Agenda (G puis A)');
assert.equal(shortcutLabel('/', 'Cockpit'), 'Cockpit (G puis C)');
assert.equal(shortcutLabel('/a-ranger', 'À ranger'), 'À ranger (G puis R)');
assert.equal(shortcutLabel('/brain', 'Idées'), 'Idées (G puis I)');
assert.equal(shortcutLabel('/constellation', 'Constellation'), 'Constellation (G puis V)');
assert.equal(shortcutLabel('/apps', 'Apps et projets'), 'Apps et projets', 'pas de raccourci : libellé seul');

// --- Mémoire des positions de la Constellation ---
const N = 947;
const graphe = {
  nodes: Array.from({ length: N }, (_, i) => ({ path: `dossier/note-${i}.md`, name: `note-${i}`, type: 'Note', degree: i % 7 })),
  links: Array.from({ length: 1500 }, (_, i) => [i % N, (i * 7 + 3) % N]),
};
const sim = construireSim(graphe, null);
sim.x.forEach((_, i) => {
  sim.x[i] = Math.sin(i) * 612.3456;
  sim.y[i] = Math.cos(i * 1.3) * 487.6543;
});
const positions = encoderPositions(sim);
assert.equal(positions.length, 2 * N);
assert.ok(positions.every((v) => Math.round(v * 10) === v * 10 || Math.abs(Math.round(v * 10) / 10 - v) < 1e-9), 'arrondi à 0,1');
const octets = Buffer.byteLength(JSON.stringify({ signature: signatureGraphe(graphe), positions }));
assert.ok(octets < 60_000, `entrée mémoire ${octets} o < 60 Ko`);
console.log(`positions mémorisées pour ${N} noeuds : ${octets} octets`);

assert.equal(positionsValides(positions, N), true);
assert.equal(positionsValides(positions, N + 1), false, 'noeuds ajoutés : on recalcule');
assert.equal(positionsValides(positions.slice(1), N), false);
assert.equal(positionsValides(null, N), false);
assert.equal(positionsValides('x', N), false);
assert.equal(positionsValides([...positions.slice(0, -1), null], N), false, 'null refusé');
assert.equal(positionsValides([...positions.slice(0, -1), 'a'], N), false);

const neuve = construireSim(graphe, null);
assert.equal(refroidie(neuve), false, 'sans mémoire : calcul à faire');
appliquerPositions(neuve, positions);
assert.equal(refroidie(neuve), true, 'avec mémoire : plus rien à calculer');
assert.ok(Math.abs(neuve.x[10] - sim.x[10]) <= 0.05 + 1e-9);
assert.ok(Math.abs(neuve.y[900] - sim.y[900]) <= 0.05 + 1e-9);

// La signature change quand le graphe change (autre contenu, autre lien) : la mémoire ne sert plus.
const s0 = signatureGraphe(graphe);
assert.equal(signatureGraphe(JSON.parse(JSON.stringify(graphe))), s0, 'même contenu = même signature');
const modifie = JSON.parse(JSON.stringify(graphe));
modifie.links.push([0, 5]);
assert.notEqual(signatureGraphe(modifie), s0);
const renomme = JSON.parse(JSON.stringify(graphe));
renomme.nodes[3].path = 'autre/chemin.md';
assert.notEqual(signatureGraphe(renomme), s0);

console.log('check-nav : OK');
