// Vérification de la logique pure du bloc « Avancement » : node scripts/check-avancement.mjs
// (aucun accès disque ni base : interpolation du trait, statuts, textes, lecture des tableaux du vault,
// maîtrise pondérée, statut « prête », cabinets à viser, regroupement et tri pour la page).
import assert from 'node:assert/strict';
import {
  cabinetFromField, dashboardZone, daysBetween, expectedAt, fraction, isReadyStatus, lettreFichier, makeRow, masteryPercent, nextTargets,
  nextTargetsText, parseEtapes, parseFrontmatter, parseFr, parseNotions, parseTests, parseVitesse, priorityRank, statusOf,
} from '../lib/avancement-calc.js';
import { GROUPS, buildAvancement, frShortDate, rowView, syncInfo } from '../lib/avancement.js';

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
  { etape: 'Synthèse', niveau: 1, competences: 'E1' },
  { etape: 'Annonce du plan et concision', niveau: 2.5, competences: 'B4, B5' },
]);
assert.deepEqual(parseTests(zone), [{ id: 'T1', epreuve: 'Numérique sur tableaux (NUM, MC)', niveau: 3, seances: 3 }]); // T5 sans niveau : pas de mesure
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
  'Prochain à viser : Roland Berger (P1, personne). Ensuite : EY-Parthenon (P2, personne), McKinsey (P2, personne).',
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
assert.deepEqual(buildAvancement(null), { groups: [], late: 0, ok: 0, ahead: 0, unmeasured: 0 });

const info = syncInfo([{ maj: '2026-10-13T18:50:03+00:00' }, { maj: '2026-10-13T18:50:01+00:00' }], Date.parse('2026-10-14T06:50:03+00:00'));
assert.equal(info.label, '13 oct. à 20 h 50');
assert.equal(Math.round(info.ageHours), 12);
assert.equal(syncInfo([]), null);

console.log('check-avancement : OK');
