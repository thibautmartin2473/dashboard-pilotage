// Vérification de la logique pure du bloc « Avancement » : node scripts/check-avancement.mjs
// (aucun accès disque ni base : interpolation du trait, statuts, textes, lecture des tableaux du vault,
// maîtrise pondérée, statut « prête », cabinets à viser, regroupement et tri pour la page).
import assert from 'node:assert/strict';
import {
  anyNoteHas, asList, cabinetFromField, calculeLe, countNetworking, dashboardZone, daysBetween, exchangeDate, expectedAt, fraction, isReadyStatus,
  lettreFichier, makeRow, masteryPercent, nextTargets, nextTargetsText, norm, parseEtapes, parseFrontmatter, parseFr, parseNotions,
  parseNotionsDetail, parseTests, parseVitesse, partielArgs, personneKey, planWrite, planYear, priorityRank, resolveCabinet, statusOf,
} from '../lib/avancement-calc.js';
import { GROUPS, buildAvancement, frShortDate, headerNotes, rowView, summaryPosts, syncInfo } from '../lib/avancement.js';

// ---- Dates et trait --------------------------------------------------------------------------------------
assert.equal(daysBetween('2026-09-16', '2026-12-15'), 90);
assert.equal(daysBetween('2026-09-16', '2026-11-03'), 48);
assert.equal(fraction('2026-09-16', '2026-12-15', '2026-09-01'), 0); // avant le départ : borné
assert.equal(fraction('2026-09-16', '2026-12-15', '2027-01-01'), 1); // après l'échéance : borné
// Niveau : départ 2, cible 4, au 13/10 = 27 jours sur 90 -> 2,6.
assert.equal(Math.round(expectedAt({ start: '2026-09-16', end: '2026-12-15', from: 2, to: 4, today: '2026-10-13' }) * 100) / 100, 2.6);
assert.equal(expectedAt({ start: '2026-09-16', end: '2026-11-03', from: 0, to: 54, today: '2026-09-16' }), 0);
assert.equal(expectedAt({ start: '2026-09-16', end: '2026-11-03', from: 0, to: 54, today: '2026-11-03' }), 54);

// ---- Statut : seuil +/- 0,10 de l'échelle (0,5 niveau sur 5 ; 10 % d'un compteur) ---------------------------
assert.equal(statusOf(0.1), 'en_avance');
assert.equal(statusOf(0.5 / 5), 'en_avance'); // +0,5 niveau pile : en avance (flottants)
assert.equal(statusOf(-0.5 / 5), 'en_retard');
assert.equal(statusOf(0.0999), 'dans_les_temps');
assert.equal(statusOf(-0.05), 'dans_les_temps');
assert.equal(statusOf((2.5 - 3) / 5), 'en_retard');
assert.equal(statusOf((3.1 - 2.6) / 5), 'en_avance');

// ---- Ligne : textes français -------------------------------------------------------------------------------
const niveau = makeRow({ cle: 'a', groupe: 'strategy-boost', libelle: 'Synthèse', kind: 'niveau', valeur: 1, max: 5, attendu: 2.6 });
assert.equal(niveau.statut, 'en_retard');
assert.equal(niveau.valeur_texte, '1,0 / 5');
assert.equal(niveau.attendu_texte, '2,6');
assert.equal(niveau.statut_texte, 'en retard de 1,6 niveau');
assert.equal(niveau.ecart_rel, -0.32);
assert.equal(makeRow({ cle: 'b', groupe: 'g', libelle: 'x', kind: 'niveau', valeur: 3.5, max: 5, attendu: 2.6 }).statut_texte, 'en avance de 0,9 niveau');
assert.equal(makeRow({ cle: 'b', groupe: 'g', libelle: 'x', kind: 'niveau', valeur: 1, max: 5, attendu: 3.2 }).statut_texte, 'en retard de 2,2 niveaux');
assert.equal(makeRow({ cle: 'c', groupe: 'g', libelle: 'x', kind: 'niveau', valeur: 2.5, max: 5, attendu: 2.6 }).statut_texte, 'dans les temps');
const lettres = makeRow({ cle: 'l', groupe: 'g', libelle: 'Lettres', kind: 'compteur', valeur: 1, max: 10, attendu: 5.6, unite: ['lettre', 'lettres'] });
assert.equal(lettres.statut, 'en_retard');
assert.equal(lettres.valeur_texte, '1 / 10');
assert.equal(lettres.statut_texte, 'en retard de 5 lettres');
const un = makeRow({ cle: 'l', groupe: 'g', libelle: 'x', kind: 'compteur', valeur: 4, max: 10, attendu: 5, unite: ['lettre', 'lettres'] });
assert.equal(un.statut_texte, 'en retard de 1 lettre'); // -10 % de l'objectif pile = en retard
assert.equal(statusOf(-0.1), 'en_retard');
const cours = makeRow({ cle: 'c', groupe: 'cours', libelle: 'AFA', kind: 'pourcentage', valeur: 31.2, max: 100, attendu: 15 });
assert.equal(cours.statut, 'en_avance');
assert.equal(cours.valeur_texte, '31 %');
assert.equal(cours.statut_texte, 'en avance de 16 points');
// Sans mesure : aucune valeur, aucun statut, aucun chiffre inventé.
const rien = makeRow({ cle: 'p', groupe: 'autre', libelle: 'Spircle', kind: 'sans_mesure', valeurTexte: 'pas de jalons suivis' });
assert.equal(rien.valeur, null);
assert.equal(rien.statut, null);
assert.equal(rien.ecart_rel, null);
assert.equal(rien.valeur_texte, 'pas de jalons suivis');

// ---- Lecture du vault -------------------------------------------------------------------------------------
assert.equal(parseFr('2,5'), 2.5);
assert.equal(parseFr('-'), null);
assert.equal(parseFr('31 %'), 31);
const fm = parseFrontmatter('---\ncréé: 2026-10-11\nentreprise: "Bain & Company"\nfichier: "à créer"\npriorité: P1\n---\n# Titre');
assert.equal(fm.entreprise, 'Bain & Company');
assert.equal(fm['priorité'], 'P1');
assert.equal(cabinetFromField('"[[Oliver Wyman]]"'.replace(/"/g, '')), 'Oliver Wyman');
assert.equal(cabinetFromField('[[Oliver Wyman|OW]]'), 'Oliver Wyman');
assert.equal(cabinetFromField('Bain & Company'), 'Bain & Company');
assert.equal(lettreFichier('à créer'), null);
assert.equal(lettreFichier(''), null);
assert.equal(lettreFichier('Fichiers/2026-09 Lettre - Oliver Wyman.docx'), 'Fichiers/2026-09 Lettre - Oliver Wyman.docx');
assert.equal(lettreFichier('Fichiers/2025-09 Lettre - X.docx (+ .pdf)'), 'Fichiers/2025-09 Lettre - X.docx');
assert.equal(priorityRank('P2'), 2);
assert.equal(priorityRank(''), 9);

// « Prête » : modèle Histoire (brouillon, rédigée, rodée) ; semi-travaillé et matière brute ne sont pas prêts.
for (const s of ['rédigée', 'rodée', 'Prête', 'validée', 'finalisée']) assert.equal(isReadyStatus(s), true, s);
for (const s of ['brouillon', 'semi-travaillé', 'matière brute, à mettre en forme', '', 'à travailler avec mon-fit']) assert.equal(isReadyStatus(s), false, s);

const progression = `texte
<!-- tableau:debut -->
**Vitesse (semaine en cours contre la précédente, en cas)** : -0,4 niveau sur 15 compétences, lente : changer de méthode.

**Par étape** (médiane)

| Étape | Niveau /5 | Compétences | Statut |
|---|---|---|---|
| Synthèse | 1,0 | E1 | à travailler |
| Annonce du plan et concision | 2,5 | B4, B5 | à travailler |

| Id | Compétence | Niveau cas /5 |
|---|---|---|
| A1 | Reformulation | 3,0 |

**Tests en ligne** (drills)

| Id | Épreuve | Drill /5 | Séances | Dernière |
|---|---|---|---|---|
| T1 | Numérique sur tableaux (NUM, MC) | 3,0 | 3 | 0 j |
| T5 | Data sufficiency (DS) | - | 0 | - |
<!-- tableau:fin -->
après`;
const zone = dashboardZone(progression);
assert.ok(zone);
assert.deepEqual(parseEtapes(zone), [
  { etape: 'Synthèse', niveau: 1, competences: 'E1', brut: '1,0' },
  { etape: 'Annonce du plan et concision', niveau: 2.5, competences: 'B4, B5', brut: '2,5' },
]);
// T5 sans niveau (« - ») : GARDÉ avec niveau null (ligne sans mesure), jamais écarté.
assert.deepEqual(parseTests(zone), [
  { id: 'T1', epreuve: 'Numérique sur tableaux (NUM, MC)', niveau: 3, seances: 3, brut: '3,0' },
  { id: 'T5', epreuve: 'Data sufficiency (DS)', niveau: null, seances: 0, brut: '-' },
]);
assert.equal(parseVitesse(zone), '-0,4 niveau sur 15 compétences, lente : changer de méthode.');
assert.equal(dashboardZone('rien'), null);

// Maîtrise pondérée = formule du bilan AFA (39/138 = 28 %).
const afa = `
## Niveaux
| Notion | Sujet | Poids | Niveau | Dernier test | Source principale |
|---|---|---|---|---|---|
| N1 | IFRS 15 | 5 | 1 | 2026-10-12 | S2 |
| N2 | PoC | 5 | 1 | 2026-10-12 | S2 |
| N3 | Rémunération | 5 | 1 | 2026-10-12 | S4 |
| N4 | IFRS 2 | 4 | 1 | 2026-10-12 | S4 |
| N5 | IAS 19 | 4 | 0 | - | S4 |
| N6 | IFRS 16 preneur | 4 | 3 | 2026-10-13 | S5 |
| N7 | IAS 36 | 4 | 2 | 2026-10-12 | S3 |
| N8 | Bailleur | 3 | 0 | - | S5 |
| N9 | Agent | 3 | 0 | - | S2 |
| N10 | IFRS 8 | 3 | 0 | - | S6 |
| N11 | Non-GAAP | 3 | 0 | - | S6 |
| N12 | Cadre IFRS | 3 (2 avant S8) | 0 | - | S1 |
`;
const notions = parseNotions(afa);
assert.equal(notions.length, 12);
assert.equal(notions[11].poids, 3);
const m = masteryPercent(notions);
assert.equal(m.got, 39);
assert.equal(m.total, 138);
assert.equal(Math.round(m.pct), 28);
assert.equal(m.acquises, 1);
// Aucune notion testée (toutes à 0, dernier test « - ») : pas de mesure.
const fmVide = `| Notion | Sujet | Poids | Niveau | Dernier test | Source |\n|---|---|---|---|---|---|\n| N1 | TVM | 5 | 0 | - | EF |\n| N2 | NPV | 5 | 0 | - | EF |`;
assert.equal(masteryPercent(parseNotions(fmVide)), null);
assert.equal(masteryPercent([]), null);

// ---- Cabinets à viser (networking) -----------------------------------------------------------------------
const cabs = [
  { nom: 'Bain', priorite: 'P1', rank: 1, n: 3 },
  { nom: 'Oliver Wyman', priorite: 'P1', rank: 1, n: 2 },
  { nom: 'Roland Berger', priorite: 'P1', rank: 1, n: 0 },
  { nom: 'McKinsey', priorite: 'P2', rank: 2, n: 0 },
  { nom: 'EY-Parthenon', priorite: 'P2', rank: 2, n: 0 },
  { nom: 'Kearney', priorite: 'P3', rank: 3, n: 0 },
  { nom: 'LEK', priorite: 'P2', rank: 2, n: 1 },
];
const cibles = nextTargets(cabs, 3);
assert.deepEqual(cibles.map((c) => c.nom), ['Roland Berger', 'EY-Parthenon', 'McKinsey', 'Kearney', 'Oliver Wyman', 'LEK']);
assert.equal(
  nextTargetsText(cibles, 3),
  'Prochain à viser : Roland Berger (P1, aucune personne parlée). Ensuite : EY-Parthenon (P2, aucune personne parlée), McKinsey (P2, aucune personne parlée).',
);
assert.equal(nextTargetsText([], 3), 'Tous les cabinets suivis ont 3 personnes parlées.');
assert.match(nextTargetsText([{ nom: 'LEK', priorite: 'P2', n: 1 }], 3), /LEK \(P2, 1 sur 3\)/);

// ---- Page : regroupement, tri, positions de la barre et du trait ----------------------------------------
const L = (cle, groupe, ordre, extra = {}) => ({ cle, groupe, ordre, libelle: cle, kind: 'niveau', valeur: 2, max: 5, attendu: 3, statut: 'en_retard', ...extra });
const view = buildAvancement([
  L('a2', 'strategy-boost', 2, { statut: 'en_avance', valeur: 4 }),
  L('a0', 'strategy-boost', 0),
  L('a1', 'strategy-boost', 1, { statut: 'dans_les_temps', valeur: 3 }),
  { cle: 'note:strategy-boost', groupe: 'strategy-boost', ordre: -1, libelle: 'Vitesse', kind: 'note', detail: 'lente' },
  L('c1', 'cours', 1, { kind: 'sans_mesure', valeur: null, max: null, attendu: null, statut: null, valeur_texte: 'pas encore de suivi' }),
  L('c0', 'cours', 0, { kind: 'jalons', valeur: 0, max: 5, attendu: 0, statut: null, echeance: '2026-10-21' }),
  L('z', 'inconnu', 0),
]);
assert.deepEqual(view.groups.map((g) => g.id), ['strategy-boost', 'cours']); // ordre fixe, groupes vides et inconnus écartés
assert.deepEqual(view.groups[0].lignes.map((l) => l.key), ['a0', 'a1', 'a2']); // du plus en retard au plus en avance
assert.equal(view.groups[0].note, 'lente');
assert.equal(view.groups[0].lignes.length, 3); // la note n'est pas une ligne
assert.deepEqual([view.late, view.ok, view.ahead, view.unmeasured], [1, 1, 1, 2]);
assert.deepEqual(view.groups.map((g) => g.title), [GROUPS[0].title, GROUPS[2].title]);
assert.deepEqual(view.groups[1].echeances, ['21 oct.']);
const rv = rowView(L('x', 'strategy-boost', 0, { valeur: 1, attendu: 2.6 }));
assert.equal(rv.barPct, 20);
assert.equal(rv.traitPct, 52);
assert.equal(rv.measured, true);
const jalons = rowView(L('j', 'cours', 0, { kind: 'jalons', valeur: 2, max: 5, attendu: 2, statut: null }));
assert.equal(jalons.ticks, 5);
const sans = rowView(L('s', 'autre', 0, { kind: 'sans_mesure', valeur: null, max: null, attendu: null, statut: null }));
assert.equal(sans.measured, false);
assert.equal(sans.traitPct, null);
assert.equal(rowView(L('o', 'autre', 0, { valeur: 9, max: 5 })).barPct, 100); // borné
assert.equal(frShortDate('2026-11-03'), '3 nov.');
assert.deepEqual(buildAvancement(null), { groups: [], late: 0, ok: 0, ahead: 0, unmeasured: 0, past: 0, hidden: 0 });

const info = syncInfo([{ maj: '2026-10-13T18:50:03+00:00' }, { maj: '2026-10-13T18:50:01+00:00' }], Date.parse('2026-10-14T06:50:03+00:00'));
assert.equal(info.label, '13 oct. à 20 h 50');
assert.equal(Math.round(info.ageHours), 12);
assert.equal(syncInfo([]), null);

// ============================================================================================================
// Correctifs du 2026-10-13 (relecture de la PR 38)
// ============================================================================================================

// ---- B1 : garde-fou division par 0, source illisible --------------------------------------------------------
const objectifZero = makeRow({ cle: 'z', groupe: 'g', libelle: 'x', kind: 'compteur', valeur: 0, max: 0, attendu: 0, unite: ['a', 'b'] });
assert.equal(objectifZero.statut, null, 'objectif 0 : sans mesure');
assert.equal(objectifZero.ecart_rel, null);
assert.equal(makeRow({ cle: 'z', groupe: 'g', libelle: 'x', kind: 'niveau', valeur: 2, max: 0, attendu: 2 }).ecart_rel, null);

// planWrite : une source illisible n'efface rien et n'écrit pas de 0.
const R = (cle, extra = {}) => ({ cle, groupe: 'strategy-boost', libelle: cle, kind: 'niveau', ...extra });
const plan1 = planWrite({
  rows: [
    R('sb:etape:source-illisible', { kind: 'sans_mesure', _garde: 'sb:etape:' }),
    R('sb:test:t1'),
    R('sb:reseau', { kind: 'sans_mesure', _garde: 'sb:reseau' }),
    R('carriere:pitchs'),
  ],
  existing: ['sb:etape:synthese', 'sb:etape:conclusion', 'sb:test:t1', 'sb:test:t9', 'sb:reseau', 'carriere:pitchs', 'carriere:vieux'],
  protectedKeys: ['sb:reseau'],
  protectedPrefixes: ['sb:etape:'],
});
assert.deepEqual(plan1.upsert.map((r) => r.cle), ['sb:test:t1', 'carriere:pitchs']);
assert.deepEqual(plan1.insert, [], 'des valeurs précédentes existent : aucune ligne « source illisible » à insérer');
assert.deepEqual(plan1.remove.sort(), ['carriere:vieux', 'sb:test:t9'], 'les lignes protégées (sb:etape:*, sb:reseau) ne sont jamais supprimées');
assert.equal(plan1.upsert.every((r) => !('_garde' in r)), true);
// Première fois (rien à garder) : la ligne « source illisible » est insérée.
const plan2 = planWrite({ rows: [R('sb:reseau', { kind: 'sans_mesure', _garde: 'sb:reseau' }), R('sb:etape:source-illisible', { kind: 'sans_mesure', _garde: 'sb:etape:' })], existing: [], protectedKeys: ['sb:reseau'], protectedPrefixes: ['sb:etape:'] });
assert.deepEqual(plan2.insert.map((r) => r.cle).sort(), ['sb:etape:source-illisible', 'sb:reseau']);
assert.equal(plan2.insert.every((r) => !('_garde' in r)), true);
// La source revient : la ligne « source illisible » d'avant est supprimée, les vraies lignes écrites.
const plan3 = planWrite({ rows: [R('sb:etape:synthese')], existing: ['sb:etape:source-illisible', 'sb:etape:synthese'] });
assert.deepEqual(plan3.remove, ['sb:etape:source-illisible']);

// ---- B2 : networking ------------------------------------------------------------------------------------------
// Frontmatter tolérant : BOM, fins de ligne Windows, liste YAML en tirets, liste en ligne, lien Obsidian.
const fmWin = parseFrontmatter('﻿---\r\ncabinet:\r\n  - Bain\r\n  - "[[Oliver Wyman|OW]]"\r\npersonne: Ada Lovelace\r\ndate-échange: 2026-10-01\r\n---\r\n# t');
assert.deepEqual(fmWin.cabinet, ['Bain', '[[Oliver Wyman|OW]]']);
assert.equal(fmWin.personne, 'Ada Lovelace');
assert.deepEqual(asList(fmWin.cabinet), ['Bain', 'Oliver Wyman']);
// Élément de liste YAML non indenté (« cabinet: » puis « - Bain » en colonne 0) : lu comme une liste, comme l'indenté.
const fmFlat = parseFrontmatter('---\ncabinet:\n- Bain\n- "[[Oliver Wyman|OW]]"\npersonne: Ada\n---\n# t');
assert.deepEqual(fmFlat.cabinet, ['Bain', '[[Oliver Wyman|OW]]']);
assert.equal(fmFlat.personne, 'Ada', 'la clé suivante repart normalement');
assert.deepEqual(parseFrontmatter('---\n- orphelin\nstatut: rédigée\n---\n').statut, 'rédigée', 'tiret sans clé précédente : ignoré');
assert.deepEqual(asList('[Bain, "BCG"]'), ['Bain', 'BCG']);
assert.deepEqual(asList('[[Oliver Wyman]]'), ['Oliver Wyman']);
assert.deepEqual(asList(''), []);

const cabsNet = ['Bain & Company', 'Boston Consulting Group', 'McKinsey & Company', 'Oliver Wyman', 'L.E.K. Consulting', 'Arthur D. Little', 'EY-Parthenon', 'Roland Berger'].map((nom) => ({ nom, cle: norm(nom) }));
const byKey = new Map(cabsNet.map((c) => [c.cle, c]));
for (const [brut, attendu] of [['Bain', 'Bain & Company'], ['Bain & Company', 'Bain & Company'], ['BCG', 'Boston Consulting Group'], ['McKinsey', 'McKinsey & Company'], ['OW', 'Oliver Wyman'], ['LEK', 'L.E.K. Consulting'], ['ADL', 'Arthur D. Little'], ['EYP', 'EY-Parthenon'], ['Roland Berger', 'Roland Berger']]) {
  assert.equal(resolveCabinet(brut, byKey)?.nom, attendu, brut);
}
assert.equal(resolveCabinet('Goldman Sachs', byKey), null);
assert.equal(resolveCabinet('', byKey), null);

// Clé de dédoublonnage : `personne:` d'abord, sinon nom de fichier nettoyé (préfixe de date, cabinet, suffixes).
assert.equal(personneKey({ personne: 'Matteo (nom de famille à confirmer)' }, '2026-09-29 Matteo (Vertone).md'), 'matteo');
assert.equal(personneKey({}, '2026-10-03 Morgane Tabary (Bain).md'), 'morgane tabary');
assert.equal(personneKey({}, '2026-10-01 Morgane Tabary (Bain) - fiche et questions.html'), 'morgane tabary');
assert.equal(personneKey({ personne: 'Morgane Tabary' }, '2026-10-01 Morgane Tabary (Bain) - fiche et questions.pdf'), 'morgane tabary');
assert.equal(exchangeDate({ 'date-échange': '2026-10-05' }, 'x.md'), '2026-10-05');
assert.equal(exchangeDate({}, '2026-10-02 A.md'), '2026-10-02');
assert.equal(exchangeDate({}, 'A.md'), null);
assert.equal(exchangeDate({ 'date-échange': '' }, '2026-10-02 A.md'), '2026-10-02', 'propriété vide : repli sur le nom de fichier');
assert.equal(exchangeDate({ 'date-échange': 'bientôt' }, '2026-10-02 A.md'), null, 'propriété sans date : pas de repli silencieux');

const note = (file, fm) => ({ file, text: `---\n${fm}\n---\n# ${file}` });
const net = countNetworking(
  [
    note('2026-10-01 Bruno (Bain).md', 'cabinet: Bain & Company\npersonne: Bruno B\ndate-échange: 2026-10-01'),
    note('2026-10-03 Bruno (Bain) - fiche.md', 'cabinet: Bain\npersonne: Bruno B\ndate-échange: 2026-10-03'), // même personne, alias : une seule fois
    note('2026-10-04 Clara (LEK).md', 'cabinet: LEK\ndate-échange: 2026-10-04'), // personne dans le nom de fichier
    note('2026-10-20 Dana (BCG).md', 'cabinet: BCG\npersonne: Dana D\ndate-échange: 2026-10-20'), // call préparé, pas encore passé
    note('2026-10-05 Eva (deux).md', 'cabinet:\n  - McKinsey\n  - Roland Berger\npersonne: Eva E\ndate-échange: 2026-10-05'),
    note('2026-10-06 Sans cabinet.md', 'personne: Fred F\ndate-échange: 2026-10-06'),
    note('2026-10-07 Inconnu.md', 'cabinet: Goldman Sachs\npersonne: Gil G\ndate-échange: 2026-10-07'),
  ],
  cabsNet,
  '2026-10-13',
);
const n = (nom) => net.personnes.get(nom).size;
assert.equal(n('Bain & Company'), 1, 'dédoublonnage par personne:');
assert.equal(n('L.E.K. Consulting'), 1);
assert.equal(n('Boston Consulting Group'), 0, 'call préparé mais pas passé : ne compte pas');
assert.equal(n('McKinsey & Company'), 1, 'cabinet: en liste');
assert.equal(n('Roland Berger'), 1);
assert.equal(net.warnings.length, 2);
// date-échange présente mais sans date AAAA-MM-JJ : avertissement dédié, note non comptée (pas de repli sur le nom).
const netBad = countNetworking([note('2026-10-02 Hugo (Bain).md', 'cabinet: Bain\npersonne: Hugo H\ndate-échange: bientôt')], cabsNet, '2026-10-13');
assert.equal(netBad.personnes.get('Bain & Company').size, 0);
assert.equal(netBad.warnings.length, 1);
assert.match(netBad.warnings[0], /Hugo \(Bain\)\.md.*date-échange « bientôt » sans date AAAA-MM-JJ.*non comptée/);
// Dossier non vide mais sans note exploitable : détecté (le script appelle alors sourceFail au lieu d'écrire 0).
assert.equal(anyNoteHas(['---\npersonne: A\n---\n', 'pas de frontmatter', '---\ncabinet:\n---\n'], 'cabinet'), false);
assert.equal(anyNoteHas(['---\npersonne: A\n---\n', '---\ncabinet: Bain\n---\n'], 'cabinet'), true);
assert.equal(anyNoteHas(['---\ncabinet:\n- Bain\n---\n'], 'cabinet'), true);
assert.equal(anyNoteHas(['---\nstatut: rodée\n---\n', '---\ntitre: x\n---\n'], 'statut'), true);
assert.equal(anyNoteHas(['---\ntitre: x\n---\n', null], 'statut'), false);
assert.equal(anyNoteHas([], 'statut'), false);
assert.match(net.warnings.join('\n'), /Sans cabinet\.md.*pas de propriété cabinet/);
assert.match(net.warnings.join('\n'), /Goldman Sachs.*pas de fiche suivie/);

// ---- B6 : « - » et formats inattendus ; décimales des notions ---------------------------------------------------
const etapesTrou = parseEtapes('| Étape | Niveau /5 | Compétences | Statut |\n|---|---|---|---|\n| Synthèse | - | E1 | à travailler |\n| Présence | n.d. | F1 | à travailler |\n| Conclusion | 2,0 | E2 | ok |');
assert.deepEqual(etapesTrou.map((e) => [e.etape, e.niveau]), [['Synthèse', null], ['Présence', null], ['Conclusion', 2]], 'les étapes sans niveau restent (ligne sans mesure)');
assert.equal(etapesTrou[1].brut, 'n.d.');
const notionsDec = parseNotionsDetail('| Notion | Sujet | Poids | Niveau | Dernier test |\n|---|---|---|---|---|\n| N1 | A | 3 | 1,5 | 2026-10-12 |\n| N2 | B | 2,5 | 2.5 | 2026-10-12 |\n| N3 | C | 4 | ? | - |\n| N4 | D | 3 (2 avant S8) | 3 | 2026-10-13 |');
assert.deepEqual(notionsDec.notions.map((x) => [x.poids, x.niveau]), [[3, 1.5], [2.5, 2.5], [3, 3]], '« 1,5 » n\'est pas tronqué en 1');
assert.equal(notionsDec.ignorees, 1);
assert.equal(calculeLe('_Calculé le 2026-10-13 par `Systeme/Tools/x.py` : ne pas éditer._'), '2026-10-13');
assert.equal(calculeLe('rien'), null);

// ---- A4 : partiels, lecture pessimiste ---------------------------------------------------------------------------
const acc = Array.from({ length: 23 }, (_, i) => ({ id: `N${i + 1}`, poids: 2, niveau: i < 5 ? 2 : 1, teste: true })); // 25 % pondéré environ, 0 acquise
const mAcc = masteryPercent(acc);
assert.equal(mAcc.acquises, 0);
assert.ok(mAcc.pct > 20 && mAcc.pct < 50, `maîtrise pondérée indicative : ${mAcc.pct}`);
const argsAcc = partielArgs({ code: 'acc812', libelle: 'ACC 812', notions: acc, date: '2026-10-22', quand: 'Examen jeu. 22/10', today: '2026-10-16', debut: '2026-10-11', cible: 0.75 });
const rowAcc = makeRow({ seuil: 0.1, ...argsAcc });
assert.equal(rowAcc.valeur, 0, 'valeur = notions acquises, pas le pourcentage pondéré');
assert.equal(rowAcc.max, 23);
assert.equal(rowAcc.valeur_texte, '0 / 23 notions');
assert.equal(rowAcc.statut, 'en_retard');
assert.match(rowAcc.statut_texte, /^en retard de \d+ notions$/);
assert.match(rowAcc.explication, /Notions réellement acquises \(niveau 3 sur 3\) : 0 sur 23/);
assert.match(rowAcc.explication, /Maîtrise pondérée .* : \d+ %/, 'la maîtrise pondérée reste en mention secondaire explicite');
assert.equal(Math.round(rowAcc.attendu * 100) / 100, Math.round(0.75 * 23 * (5 / 11) * 100) / 100, 'le trait suit la même unité (notions)');
// Trait et statut selon les notions : 12 notions sur 23 acquises à mi-parcours = en avance.
const bien = Array.from({ length: 23 }, (_, i) => ({ id: `N${i}`, poids: 1, niveau: i < 12 ? 3 : 0, teste: true }));
assert.equal(makeRow({ seuil: 0.1, ...partielArgs({ code: 'x', libelle: 'X', notions: bien, date: '2026-10-22', quand: 'q', today: '2026-10-16', debut: '2026-10-11', cible: 0.75 }) }).statut, 'en_avance');
// Après la date de l'examen : « passé », plus de statut ni de trait.
const passe = makeRow({ seuil: 0.1, ...partielArgs({ code: 'acc812', libelle: 'ACC 812', notions: acc, date: '2026-10-22', quand: 'Examen jeu. 22/10', today: '2026-10-23', debut: '2026-10-11', cible: 0.75 }) });
assert.equal(passe.statut, null);
assert.equal(passe.attendu, null);
assert.equal(passe.statut_texte, 'examen passé');
assert.equal(passe.extra.passe, true);
assert.equal(rowView(passe).passe, true);
assert.equal(rowView(passe).traitPct, null);
assert.equal(rowView(passe).attenduText, '');
// Le jour de l'examen, la ligne est encore calculée.
assert.equal(makeRow({ seuil: 0.1, ...partielArgs({ code: 'acc812', libelle: 'A', notions: acc, date: '2026-10-22', quand: 'q', today: '2026-10-22', debut: '2026-10-11', cible: 0.75 }) }).statut, 'en_retard');
// Aucune notion testée : pas de mesure.
assert.equal(partielArgs({ code: 'fm', libelle: 'FM', notions: [{ id: 'N1', poids: 1, niveau: 0, teste: false }], date: '2026-10-22', quand: 'q', today: '2026-10-16', debut: '2026-10-11', cible: 0.75 }).kind, 'sans_mesure');
// Année lue dans plan.md, plus codée en dur.
assert.equal(planYear('# Plan des finals, cycle A (octobre 2027)\n...', '2026-10-13'), 2027);
assert.equal(planYear('# Plan sans année\n', '2026-10-13'), 2026);

// ---- A5 : masquage par défaut, Master Project sans « attendu aujourd'hui » ---------------------------------------
const mp = { cle: 'cours:master-project', groupe: 'cours', ordre: 3, libelle: 'Master Project', kind: 'jalons', valeur: 0, max: 5, attendu: 0, attendu_texte: '0', valeur_texte: '0 / 5', statut: null, statut_texte: 'prochain jalon dans 3 jours' };
const rowsMasque = [
  L('c0', 'cours', 0, { statut: 'en_retard' }),
  mp,
  L('spirc', 'autre', 0, { kind: 'sans_mesure', valeur: null, max: null, attendu: null, statut: null }),
  { cle: 'note:export', groupe: 'general', libelle: 'Export', kind: 'note', extra: { ok: true, date: '2026-10-11', dernier_succes: '2026-10-11' } },
];
const vMasque = buildAvancement(rowsMasque);
assert.deepEqual(vMasque.groups.map((g) => g.id), ['cours'], 'groupe Autre masqué par défaut');
assert.deepEqual(vMasque.groups[0].lignes.map((l) => l.key), ['c0'], 'Master Project masqué par défaut');
assert.equal(vMasque.hidden, 2);
assert.equal(vMasque.unmeasured, 0, 'les lignes masquées ne comptent pas');
const vTout = buildAvancement(rowsMasque, { showHidden: true });
assert.deepEqual(vTout.groups.map((g) => g.id), ['cours', 'autre']);
const vMp = vTout.groups[0].lignes.find((l) => l.key === 'cours:master-project');
assert.equal(vMp.attenduText, '', 'jamais « attendu aujourd\'hui » pour des jalons');
assert.equal(vMp.traitPct, null);
assert.equal(vMp.ticks, 5);

// ---- Résumé du Cockpit : une barre par grand poste, retards d'abord ---------------------------------------------
const P = (cle, typeLabel, statut, extra = {}) => ({ cle, groupe: 'strategy-boost', ordre: 0, type_label: typeLabel, libelle: cle, kind: 'niveau', valeur: 2, max: 5, attendu: 3, ecart_rel: statut === 'en_retard' ? -0.2 : 0, statut, valeur_texte: '2,0 / 5', statut_texte: statut === 'en_retard' ? 'en retard de 1 niveau' : 'dans les temps', ...extra });
const posts = summaryPosts(buildAvancement([
  P('t1', 'Test en ligne', 'dans_les_temps'),
  P('e1', 'Méthode de cas', 'dans_les_temps'),
  P('e2', 'Méthode de cas', 'en_retard', { ordre: 1 }),
  P('e3', 'Méthode de cas', 'en_retard', { ordre: 0 }),
  P('l1', 'Candidature', 'en_retard', { kind: 'compteur', valeur_texte: '1 / 10', statut_texte: 'en retard de 5 lettres' }),
  P('a1', 'Fit', 'en_avance'),
]));
assert.deepEqual(posts.map((p) => p.id), ['Candidature', 'Méthode de cas', 'Test en ligne', 'Fit'], 'retards d\'abord (plus forte part en retard en tête), puis dans les temps, puis en avance');
assert.equal(posts[0].text, '1 / 10 : en retard de 5 lettres');
assert.equal(posts[1].text, '2 en retard sur 3');
assert.equal(posts[1].href, '/avancement#ligne-e3', 'mène à la ligne la plus en retard du poste');
assert.equal(posts[2].status, 'dans_les_temps');
assert.equal(posts[3].status, 'en_avance');

// ---- B3 / B1 : en-tête de l'onglet (avertissements, export) --------------------------------------------------------
const NOW = Date.parse('2026-10-13T20:00:00+02:00');
const hn = headerNotes([
  { cle: 'note:avertissements', groupe: 'general', kind: 'note', detail: 'Source illisible : A\nLettre X : inconnue' },
  { cle: 'note:export', groupe: 'general', kind: 'note', extra: { ok: true, date: '2026-10-11', dernier_succes: '2026-10-11' } },
], NOW);
assert.deepEqual(hn.avertissements, ['Source illisible : A', 'Lettre X : inconnue']);
assert.equal(hn.exportInfo.text, 'Dernier export de la base : il y a 2 jours (11 oct.)');
assert.equal(hn.exportInfo.late, false);
const vieux = headerNotes([{ cle: 'note:export', kind: 'note', extra: { ok: true, date: '2026-09-27', dernier_succes: '2026-09-27' } }], NOW);
assert.equal(vieux.exportInfo.late, true, 'plus de 9 jours : en corail');
const echec = headerNotes([{ cle: 'note:export', kind: 'note', extra: { ok: false, date: '2026-10-13', erreur: 'fetch failed', dernier_succes: '2026-10-06' } }], NOW);
assert.match(echec.exportInfo.text, /échec le 13 oct\. \(fetch failed\), dernier réussi il y a 7 jours/);
assert.equal(echec.exportInfo.late, true);
assert.match(headerNotes([{ cle: 'note:export', kind: 'note', extra: { ok: null } }], NOW).exportInfo.text, /aucun enregistré/);
assert.equal(headerNotes([], NOW).exportInfo, null);
assert.deepEqual(headerNotes([], NOW).avertissements, []);

// ---- B5 : date « Calculé le » de la source, ancienne valeur ------------------------------------------------------------
const vSrc = buildAvancement([
  { cle: 'note:strategy-boost', groupe: 'strategy-boost', ordre: -1, libelle: 'Source', kind: 'note', detail: 'lente', extra: { calcule_le: '2026-10-13' } },
  L('a', 'strategy-boost', 0, { maj: '2026-10-13T18:50:00Z' }),
  L('b', 'strategy-boost', 1, { maj: '2026-10-10T18:50:00Z' }),
]);
assert.equal(vSrc.groups[0].calculeLe, '2026-10-13');
assert.equal(vSrc.groups[0].lignes[0].ancienne, '', 'ligne à jour');
assert.equal(vSrc.groups[0].lignes[1].ancienne, '10 oct.', 'valeur gardée d\'un calcul précédent (source illisible)');

console.log('check-avancement : OK');
