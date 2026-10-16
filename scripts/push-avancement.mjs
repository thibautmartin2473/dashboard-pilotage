// Calcule le bloc « Avancement » du Cockpit depuis les notes locales de Thibaut et l'écrit dans la table
// `avancement` (Supabase). À lancer depuis la racine du repo :
//
//   node --env-file=.env.local scripts/push-avancement.mjs [--dry-run] [--today=AAAA-MM-JJ]
//
// 0 token : aucun appel à un modèle, aucun appel réseau sauf l'écriture Supabase. --dry-run lit les sources,
// calcule et affiche le JSON sans rien écrire (n'exige pas Supabase). Tâche planifiée Windows : tous les jours à
// 20h50 (scripts/install-taches.ps1). Les sources sont en LECTURE SEULE ; la table est un cache : les lignes qui
// ne sont plus produites sont supprimées, SAUF celles d'une source illisible (voir plus bas). Logique pure et
// lecture des tableaux : lib/avancement-calc.js, vérifiée par scripts/check-avancement.mjs. Règles complètes :
// CLAUDE.md, section « Avancement ».
//
// Source illisible (fichier absent, dossier vide, tableau introuvable) : jamais de 0 inventé, jamais d'effacement.
// Les lignes de cette source gardent leur ancienne valeur (ni écrasées ni supprimées), une ligne « source illisible »
// n'est insérée que s'il n'y a rien à garder, l'avertissement est écrit dans la ligne `note:avertissements`
// (affichée dans l'en-tête de l'onglet Avancement) et le script sort avec le code 1 une fois le reste écrit.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  anyNoteHas, asList, calculeLe, countNetworking, dashboardZone, daysBetween, expectedAt, isReadyStatus, lettreFichier, makeRow, nextTargets, nextTargetsText,
  norm, parseEtapes, parseFrontmatter, parseNotionsDetail, parseTests, parseVitesse, partielArgs, planWrite, planYear, priorityRank,
  resolveCabinet, tableRows,
} from '../lib/avancement-calc.js';

// ============================================================================================================
// CONSTANTES (décisions de Thibaut du 2026-10-13 ; tout se règle ici)
// ============================================================================================================

// Chemins (lecture seule). Surchargeables par variable d'environnement pour les essais.
const VAULT = process.env.AVANCEMENT_VAULT ?? 'C:/Users/thiba/GLOBAL/Vault';
const SKILLS = process.env.AVANCEMENT_SKILLS ?? 'C:/Users/thiba/.claude/skills';
// État du dernier export de la base, écrit par scripts/export-supabase.mjs (succès ou échec) ; relayé dans la table
// pour que l'onglet Avancement puisse le signaler.
const EXPORT_ETAT = process.env.AVANCEMENT_EXPORT_ETAT ?? 'C:/Users/thiba/GLOBAL/Backups/supabase/_etat.json';

// Départ commun des trajectoires (niveaux et compteurs) : le trait « où il devrait être aujourd'hui » est
// l'interpolation LINÉAIRE entre la valeur de départ à cette date et la cible à l'échéance.
const DEBUT = '2026-09-16';
// Échéances (décision du 2026-10-13) : candidature prête (lettres, tests en ligne, networking) ; cas et fit.
const ECHEANCE_CANDIDATURE = '2026-11-03';
const ECHEANCE_CAS_FIT = '2026-12-15';
// Niveaux /5 : départ 2/5, cible 4/5 (« solide »).
const NIVEAU_DEPART = 2;
const NIVEAU_CIBLE = 4;
// Compteurs : départ 0, cible = objectif (ci-dessous). Statut : écart relatif (écart / échelle) >= +SEUIL = en
// avance, <= -SEUIL = en retard, sinon dans les temps. 0,10 = +/- 0,5 niveau sur une échelle /5, ou +/- 10 points
// de pourcentage de l'objectif pour un compteur (lib/avancement-calc.js, statusOf).
const SEUIL = 0.1;
// Objectifs des compteurs.
const RESEAU_PAR_CABINET = 3; // personnes parlées par cabinet suivi (règle de Thibaut)
const HISTOIRES_OBJECTIF = 6; // 2 par dimension du PEI McKinsey
// Pitchs attendus pour le conseil (Fit.md, « Pitchs attendus », sans la finance « le jour venu »).
const PITCHS_ATTENDUS = ['Présentation conseil (2 min)', 'Présentation anglais', 'Pourquoi le conseil', 'Qualités et défauts', 'Projet professionnel'];
// Partiels, lecture PESSIMISTE (2026-10-13) : valeur et statut = notions réellement acquises (niveau 3) sur le total.
// Le suivi de révision commence le 2026-10-11 (plan des finals) ; à l'examen, la cible est d'avoir acquis 75 % des
// notions (les notions de faible poids peuvent rester au niveau 2). L'année des examens est lue dans plan.md.
const COURS_DEBUT = '2026-10-11';
const COURS_CIBLE = 0.75;
// Master Project (+ Research Methodology) : jalons datés (feuille de route du 13/10/2026). Aucun marqueur
// « fait » n'existe dans le vault : un jalon compte comme tenu quand sa date est passée.
const MASTER_JALONS = [
  { date: '2026-10-16', label: 'Session 2 (présentation)' },
  { date: '2026-11-10', label: 'Session 3' },
  { date: '2026-11-17', label: 'Mémo de 3 pages' },
  { date: '2027-03-15', label: 'Rapport' },
  { date: '2027-03-22', label: 'Soutenance (semaine du 22/03)' },
];

// ============================================================================================================
// Arguments, aide
// ============================================================================================================

const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const todayArg = args.find((a) => a.startsWith('--today='))?.slice(8);
const warnings = [];
const warn = (m) => warnings.push(m);
// Sources attendues illisibles : leurs lignes sont protégées (jamais écrasées ni supprimées), code de sortie 1.
const failures = [];
const protectedKeys = [];
const protectedPrefixes = [];
function sourceFail(message, { keys = [], prefixes = [] } = {}) {
  failures.push(message);
  warn(message);
  protectedKeys.push(...keys);
  protectedPrefixes.push(...prefixes);
}

function todayParis() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
const today = todayArg ?? todayParis();
if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) {
  console.error('--today doit être au format AAAA-MM-JJ.');
  process.exit(1);
}

// Lecture d'un fichier : null s'il est illisible (l'appelant décide s'il s'agit d'un échec de source).
const read = (path) => {
  try {
    return readFileSync(path, 'utf-8');
  } catch {
    return null;
  }
};
// Notes .md d'un dossier : tableau de noms, ou null si le dossier est illisible.
const listMd = (dir) => {
  try {
    return readdirSync(dir).filter((x) => x.endsWith('.md'));
  } catch {
    return null;
  }
};
const frDate = (iso) => {
  const parts = new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', weekday: 'short', day: '2-digit', month: '2-digit' }).formatToParts(new Date(`${iso}T12:00:00Z`));
  const g = (t) => parts.find((p) => p.type === t)?.value;
  return `${g('weekday')} ${g('day')}/${g('month')}`;
};
const inDays = (iso) => {
  const n = daysBetween(today, iso);
  return n < 0 ? `il y a ${-n} jour${-n > 1 ? 's' : ''}` : n === 0 ? "aujourd'hui" : `dans ${n} jour${n > 1 ? 's' : ''}`;
};

const rows = [];
const add = (r) => rows.push(makeRow({ seuil: SEUIL, ...r }));
// Ligne « source illisible » (sans mesure) : n'est insérée en table que s'il n'y a encore aucune valeur à garder
// (`_garde` = clé ou préfixe qu'elle remplace, voir planWrite).
const placeholder = (r, garde) => rows.push({ ...makeRow({ seuil: SEUIL, ...r, kind: 'sans_mesure', valeurTexte: 'source illisible' }), _garde: garde ?? r.cle });

// ============================================================================================================
// Strategy Boost : points de méthode de cas et tests en ligne (Progression.md, tableau généré)
// ============================================================================================================

// Libellé clair et explication de chaque étape (Thibaut ne comprenait pas « Synthèse », « Présence » seuls).
const ETAPES = {
  'Questions liminaires': ['Questions liminaires', 'Poser au début des questions ciblées, reliées à ce qu\'on veut savoir (objectif, horizon), avant la pause'],
  Reformulation: ["Reformulation de l'énoncé", 'Redire le problème en 2-3 phrases : objectif du client et contraintes'],
  'Frameworks (type, niveau 1, profondeur)': ['Frameworks et structure', 'Reconnaître le type de cas, couper en grandes branches sans recouvrement (MECE), puis descendre dans le détail'],
  'Annonce du plan et concision': ['Annonce du plan', "Annoncer la structure en 1 minute (nombre de temps, ordre) et la faire valider avant de dérouler"],
  Mathématiques: ['Calcul mental', 'Calculer juste et vite, en disant la démarche à voix haute'],
  'Cas chiffrés (hypothèses, so-what)': ['Hypothèses et so-what des chiffres', "Poser des hypothèses chiffrées en les annonçant, puis dire ce que le chiffre change pour l'objectif"],
  'Market sizing': ['Market sizing (estimer un marché)', "Volume x prix : poser l'équation d'abord, justifier les hypothèses, vérifier l'ordre de grandeur"],
  'Exhibit, créativité, business sense': ['Graphiques, créativité, sens du business', 'Lire un graphique (axes, message, ce qui manque), proposer des idées structurées, rester dans les données'],
  Synthèse: ['Synthèse entre les étapes du cas', 'Résumer où on en est avant de passer à la suite'],
  Conclusion: ['Conclusion du cas', 'Réponse d\'abord, puis les arguments, les risques et les prochaines étapes'],
  Présence: ["Présence face à l'interviewer", "Regarder l'interviewer plutôt que ses notes, gérer un blocage (dire « je ne sais pas », demander)"],
};
// Tests en ligne : pas de sigle sans explication (NUM, MC, VER, LOG, IND, DED, DS retirés ou glosés).
const TESTS = {
  T1: ['Test numérique (tableaux et graphiques)', 'Calculs sur des tableaux, des onglets Excel et des graphiques, avec des mini-cas chiffrés'],
  T2: ['Test verbal (vrai / faux / on ne peut pas dire)', 'Lire un texte et juger des affirmations : vrai, faux ou impossible à dire (raisonnement verbal)'],
  T3: ['Test logique et inductif', 'Trouver la règle dans une suite de figures (raisonnement logique et inductif)'],
  T4: ['Test déductif', 'Conclure à partir de règles données, sans rien supposer en plus (raisonnement déductif)'],
  T5: ['Data sufficiency (suffisance des données)', 'Dire si les données fournies suffisent pour répondre à la question posée'],
};
const slug = (s) => norm(s).replace(/ /g, '-');

const progressionPath = join(VAULT, '01 Carrière et études/EDHEC/Strategy Boost/Entraînement/Progression.md');
const progression = read(progressionPath);
const zone = progression ? dashboardZone(progression) : null;
const ligneSource = (cle, libelle, typeLabel) => ({ cle, groupe: 'strategy-boost', typeLabel, libelle, explication: "Source illisible : les valeurs précédentes sont conservées s'il y en a" });

if (!zone) {
  sourceFail(
    progression == null ? `Source illisible : Progression.md (${progressionPath}).` : 'Progression.md : zone <!-- tableau:debut --> / <!-- tableau:fin --> introuvable.',
    { prefixes: ['sb:etape:', 'sb:test:', 'note:strategy-boost'] },
  );
  placeholder(ligneSource('sb:etape:source-illisible', 'Méthode de cas', 'Méthode de cas'), 'sb:etape:');
  placeholder(ligneSource('sb:test:source-illisible', 'Tests en ligne', 'Test en ligne'), 'sb:test:');
} else {
  const niveauAttendu = (end) => expectedAt({ start: DEBUT, end, from: NIVEAU_DEPART, to: NIVEAU_CIBLE, today });
  const etapes = parseEtapes(zone);
  if (!etapes.length) {
    sourceFail('Progression.md : tableau « Par étape » vide ou illisible.', { prefixes: ['sb:etape:'] });
    placeholder(ligneSource('sb:etape:source-illisible', 'Méthode de cas', 'Méthode de cas'), 'sb:etape:');
  }
  for (const e of etapes) {
    const [libelle, explication] = ETAPES[e.etape] ?? [e.etape, `Compétences : ${e.competences}`];
    if (!ETAPES[e.etape]) warn(`Étape sans explication écrite : « ${e.etape} » (ajouter à ETAPES).`);
    const cle = `sb:etape:${slug(e.etape)}`;
    if (e.niveau == null) {
      // Niveau « - » ou format inattendu : la ligne reste, sans mesure (jamais de disparition ni de 0).
      if (e.brut && e.brut !== '-') warn(`Progression.md : niveau « ${e.brut} » illisible pour l'étape « ${e.etape} » : ligne sans mesure.`);
      add({ cle, groupe: 'strategy-boost', typeLabel: 'Méthode de cas', libelle, explication, kind: 'sans_mesure', valeurTexte: 'pas de mesure', echeance: ECHEANCE_CAS_FIT, detail: `Compétences ${e.competences}` });
      continue;
    }
    add({ cle, groupe: 'strategy-boost', typeLabel: 'Méthode de cas', libelle, explication, kind: 'niveau', valeur: e.niveau, max: 5, attendu: niveauAttendu(ECHEANCE_CAS_FIT), echeance: ECHEANCE_CAS_FIT, detail: `Compétences ${e.competences}`, extra: { competences: e.competences } });
  }
  const tests = parseTests(zone);
  if (!tests.length) {
    sourceFail('Progression.md : tableau « Tests en ligne » vide ou illisible.', { prefixes: ['sb:test:'] });
    placeholder(ligneSource('sb:test:source-illisible', 'Tests en ligne', 'Test en ligne'), 'sb:test:');
  }
  for (const t of tests) {
    const [libelle, explication] = TESTS[t.id] ?? [t.epreuve, t.epreuve];
    const cle = `sb:test:${t.id.toLowerCase()}`;
    if (t.niveau == null) {
      if (t.brut && t.brut !== '-') warn(`Progression.md : niveau « ${t.brut} » illisible pour le test ${t.id} : ligne sans mesure.`);
      add({ cle, groupe: 'strategy-boost', typeLabel: 'Test en ligne', libelle, explication, kind: 'sans_mesure', valeurTexte: 'pas de mesure', echeance: ECHEANCE_CANDIDATURE, detail: `${t.seances} séance${t.seances > 1 ? 's' : ''} de drill` });
      continue;
    }
    add({ cle, groupe: 'strategy-boost', typeLabel: 'Test en ligne', libelle, explication, kind: 'niveau', valeur: t.niveau, max: 5, attendu: niveauAttendu(ECHEANCE_CANDIDATURE), echeance: ECHEANCE_CANDIDATURE, detail: `${t.seances} séance${t.seances > 1 ? 's' : ''} de drill` });
  }
  // Vitesse de la semaine + fraîcheur réelle de la source (« Calculé le » de Progression.md), affichées en tête du groupe.
  const vitesse = parseVitesse(zone);
  const calcule = calculeLe(zone);
  if (vitesse || calcule) {
    rows.push({ ...makeRow({ cle: 'note:strategy-boost', groupe: 'strategy-boost', libelle: 'Source du groupe', kind: 'note', detail: vitesse ? `Cette semaine contre la précédente : ${vitesse}` : '', extra: { calcule_le: calcule }, valeur: null }), ordre: -1 });
  }
  if (!calcule) warn('Progression.md : date « Calculé le » introuvable (fraîcheur de la source inconnue).');
}

// ============================================================================================================
// Cabinets suivis : dossiers de Strategy Boost qui ont une fiche <Nom>/<Nom>.md avec `priorité:`
// ============================================================================================================

const sbDir = join(VAULT, '01 Carrière et études/EDHEC/Strategy Boost/Cabinets');
const cabinets = [];
try {
  for (const d of readdirSync(sbDir)) {
    const fiche = join(sbDir, d, `${d}.md`);
    if (!existsSync(fiche)) continue;
    const prio = parseFrontmatter(read(fiche) ?? '')['priorité'];
    if (prio) cabinets.push({ nom: d, priorite: String(prio).trim(), rank: priorityRank(prio), cle: norm(d) });
  }
} catch {
  /* dossier illisible : traité juste après (aucun cabinet) */
}
cabinets.sort((a, b) => a.rank - b.rank || a.nom.localeCompare(b.nom, 'fr'));
const cabinetParCle = new Map(cabinets.map((c) => [c.cle, c]));
const cibles = cabinets.filter((c) => c.rank <= 2);
const cabinetsOk = cabinets.length > 0 && cibles.length > 0;
if (!cabinetsOk) {
  sourceFail(`Source illisible : fiches des cabinets suivis (${sbDir}) : aucun cabinet avec une priorité.`, { keys: ['sb:lettres', 'sb:reseau'] });
  for (const [cle, libelle, typeLabel] of [['sb:lettres', 'Lettres de motivation prêtes', 'Candidature'], ['sb:reseau', 'Personnes parlées dans les cabinets', 'Réseau']]) {
    placeholder({ cle, groupe: 'strategy-boost', typeLabel, libelle, explication: "Source illisible : la valeur précédente est conservée s'il y en a une" });
  }
}

// ---- Lettres de motivation ----------------------------------------------------------------------------
// « Prête » = la note de la lettre porte un `fichier:` qui n'est pas « à créer » ET ce fichier (Word ou PDF mis en
// forme) existe dans Lettres/Fichiers. Un premier jet .md sans fichier = brouillon, pas prête (aucune propriété
// `statut` n'existe sur les lettres). Objectif : une lettre prête par cabinet P1 et P2. Les lettres d'avant la
// campagne (préfixe de date antérieur au mois de DEBUT : finance, candidatures passées) sont ignorées sans bruit ;
// une lettre de la campagne dont l'entreprise n'est pas un cabinet suivi est signalée.
const lettresDir = join(VAULT, '01 Carrière et études/Carrière/Lettres');
if (cabinetsOk) {
  const notes = listMd(lettresDir)?.filter((x) => /^\d{4}-\d{2} /.test(x));
  if (!notes?.length) {
    sourceFail(`Source illisible : dossier des lettres (${lettresDir}) absent ou sans lettre.`, { keys: ['sb:lettres'] });
    placeholder({ cle: 'sb:lettres', groupe: 'strategy-boost', typeLabel: 'Candidature', libelle: 'Lettres de motivation prêtes', explication: "Source illisible : la valeur précédente est conservée s'il y en a une" });
  } else {
    const etatLettre = new Map(); // cabinet -> 'prete' | 'brouillon'
    for (const f of notes) {
      const fm = parseFrontmatter(read(join(lettresDir, f)) ?? '');
      const entreprise = asList(fm.entreprise)[0] ?? '';
      const cab = resolveCabinet(entreprise, cabinetParCle);
      if (!cab) {
        if (f.slice(0, 7) >= DEBUT.slice(0, 7)) warn(`Lettre ${f} : entreprise « ${entreprise || 'non renseignée'} » inconnue (pas de fiche cabinet suivie) : ignorée.`);
        continue;
      }
      const fichier = lettreFichier(fm.fichier);
      const existe = fichier && [join(lettresDir, fichier), join(lettresDir, 'Fichiers', fichier)].some((p) => existsSync(p));
      if (fichier && !existe) warn(`Lettre ${f} : fichier « ${fichier} » introuvable, comptée en brouillon.`);
      if (existe) etatLettre.set(cab.nom, 'prete');
      else if (!etatLettre.has(cab.nom)) etatLettre.set(cab.nom, 'brouillon');
    }
    const nom = (c) => c.nom;
    const pretes = cibles.filter((c) => etatLettre.get(c.nom) === 'prete');
    const brouillons = cibles.filter((c) => etatLettre.get(c.nom) === 'brouillon');
    const aucune = cibles.filter((c) => !etatLettre.has(c.nom));
    const part = (label, list) => (list.length ? `${label} : ${list.map(nom).join(', ')}.` : '');
    add({
      cle: 'sb:lettres', groupe: 'strategy-boost', typeLabel: 'Candidature', libelle: 'Lettres de motivation prêtes',
      explication: `Une lettre finalisée (Word ou PDF fait) pour chaque cabinet de priorité 1 et 2, soit ${cibles.length} cabinets`,
      kind: 'compteur', valeur: pretes.length, max: cibles.length, unite: ['lettre', 'lettres'],
      attendu: expectedAt({ start: DEBUT, end: ECHEANCE_CANDIDATURE, from: 0, to: cibles.length, today }), echeance: ECHEANCE_CANDIDATURE,
      detail: [part('Prêtes', pretes), part('Brouillon sans fichier', brouillons), part('Pas encore de lettre', aucune)].filter(Boolean).join(' '),
      extra: { pretes: pretes.map(nom), brouillons: brouillons.map(nom), aucune: aucune.map(nom) },
    });
  }
}

// ---- Networking ---------------------------------------------------------------------------------------
// Une personne parlée = une note d'échange 03 Perso et ressources/Ressources/Networking/*.md (`cabinet:` = cabinet suivi, nom court,
// alias, lien ou liste), comptée une fois par personne (propriété `personne:`, à défaut nom de fichier nettoyé), et
// seulement si la date de l'échange est passée ou du jour. Au plus RESEAU_PAR_CABINET par cabinet dans le total.
const netDir = join(VAULT, '03 Perso et ressources/Ressources/Networking');
if (cabinetsOk) {
  const fichiers = listMd(netDir);
  // Dossier non vide mais sans aucune propriété `cabinet:` : source cassée, pas un vrai 0.
  const sansCabinet = fichiers?.length && !anyNoteHas(fichiers.map((f) => read(join(netDir, f))), 'cabinet');
  if (!fichiers?.length || sansCabinet) {
    sourceFail(`Source illisible : dossier Networking (${netDir}) ${fichiers?.length ? 'sans note exploitable (aucune propriété cabinet)' : 'absent ou sans note'}.`, { keys: ['sb:reseau'] });
    placeholder({ cle: 'sb:reseau', groupe: 'strategy-boost', typeLabel: 'Réseau', libelle: 'Personnes parlées dans les cabinets', explication: "Source illisible : la valeur précédente est conservée s'il y en a une" });
  } else {
    const notes = [];
    for (const file of fichiers) {
      const text = read(join(netDir, file));
      if (text == null) warn(`Networking : « ${file} » illisible : non comptée.`);
      else notes.push({ file, text });
    }
    const { personnes, warnings: netWarnings } = countNetworking(notes, cabinets, today);
    for (const w of netWarnings) warn(w);
    const parCabinet = cabinets.map((c) => ({ nom: c.nom, priorite: c.priorite, rank: c.rank, n: personnes.get(c.nom).size }));
    const total = parCabinet.reduce((s, c) => s + Math.min(c.n, RESEAU_PAR_CABINET), 0);
    const objectif = cabinets.length * RESEAU_PAR_CABINET;
    const aucun = parCabinet.filter((c) => c.n === 0).length;
    const cibles3 = nextTargets(parCabinet, RESEAU_PAR_CABINET);
    add({
      cle: 'sb:reseau', groupe: 'strategy-boost', typeLabel: 'Réseau', libelle: 'Personnes parlées dans les cabinets',
      explication: `${RESEAU_PAR_CABINET} personnes parlées par cabinet suivi (${cabinets.length} cabinets), en commençant par ceux où il n'a parlé à personne`,
      kind: 'compteur', valeur: total, max: objectif, unite: ['personne', 'personnes'],
      attendu: expectedAt({ start: DEBUT, end: ECHEANCE_CANDIDATURE, from: 0, to: objectif, today }), echeance: ECHEANCE_CANDIDATURE,
      detail: `${aucun} cabinet${aucun > 1 ? 's' : ''} sans personne parlée. ${nextTargetsText(cibles3, RESEAU_PAR_CABINET)}`,
      extra: { cabinets_sans_personne: aucun, prochains: cibles3.slice(0, 3).map((c) => ({ nom: c.nom, priorite: c.priorite, n: c.n })) },
    });
  }
}

// ============================================================================================================
// Carrière : histoires de fit et pitchs (propriété `statut`)
// ============================================================================================================

// Statuts d'un dossier de notes : tableau, ou null si le dossier est illisible ou vide (pas de 0 inventé).
function statuts(dir) {
  const files = listMd(dir);
  if (!files?.length) return null;
  return files.map((f) => ({ nom: f.replace(/\.md$/, ''), statut: String(parseFrontmatter(read(join(dir, f)) ?? '').statut ?? '') }));
}
const decompte = (list) => {
  const m = new Map();
  for (const x of list) m.set(x.statut || 'sans statut', (m.get(x.statut || 'sans statut') ?? 0) + 1);
  return [...m].map(([s, n]) => `${s} (${n})`).join(' ; ');
};
const fitDir = join(VAULT, '01 Carrière et études/Carrière/Fit');
{
  // « Prête » : statut rédigée, rodée, prête, validée ou finalisée (modèle Histoire : brouillon, rédigée, rodée).
  const histoires = statuts(join(fitDir, 'Histoires'));
  if (!histoires || !histoires.some((h) => h.statut)) {
    sourceFail(`Source illisible : dossier des histoires de fit (${join(fitDir, 'Histoires')}) ${histoires ? 'sans note exploitable (aucune propriété statut)' : 'absent ou vide'}.`, { keys: ['carriere:histoires'] });
    placeholder({ cle: 'carriere:histoires', groupe: 'carriere', typeLabel: 'Fit', libelle: 'Histoires de fit prêtes', explication: "Source illisible : la valeur précédente est conservée s'il y en a une" });
  } else {
    const pretes = histoires.filter((h) => isReadyStatus(h.statut));
    add({
      cle: 'carriere:histoires', groupe: 'carriere', typeLabel: 'Fit', libelle: 'Histoires de fit prêtes',
      explication: `Histoires d'entretien rédigées selon la méthode STARM (situation, tâche, action, résultat, morale) : ${HISTOIRES_OBJECTIF} au total, 2 par dimension du PEI McKinsey (entretien d'expérience personnelle)`,
      kind: 'compteur', valeur: pretes.length, max: HISTOIRES_OBJECTIF, unite: ['histoire', 'histoires'],
      attendu: expectedAt({ start: DEBUT, end: ECHEANCE_CAS_FIT, from: 0, to: HISTOIRES_OBJECTIF, today }), echeance: ECHEANCE_CAS_FIT,
      detail: `${histoires.length} fiche${histoires.length > 1 ? 's' : ''} écrite${histoires.length > 1 ? 's' : ''} : ${decompte(histoires)}`,
    });
  }
  const pitchs = statuts(join(fitDir, 'Pitchs'));
  const fitMd = read(join(fitDir, 'Fit.md')) ?? '';
  for (const titre of PITCHS_ATTENDUS) if (fitMd && !norm(fitMd).includes(norm(titre))) warn(`Pitch attendu « ${titre} » absent de Fit.md : mettre à jour PITCHS_ATTENDUS.`);
  if (!pitchs || !pitchs.some((p) => p.statut)) {
    sourceFail(`Source illisible : dossier des pitchs (${join(fitDir, 'Pitchs')}) ${pitchs ? 'sans note exploitable (aucune propriété statut)' : 'absent ou vide'}.`, { keys: ['carriere:pitchs'] });
    placeholder({ cle: 'carriere:pitchs', groupe: 'carriere', typeLabel: 'Fit', libelle: 'Pitchs prêts', explication: "Source illisible : la valeur précédente est conservée s'il y en a une" });
  } else {
    const pitchsPrets = pitchs.filter((p) => isReadyStatus(p.statut));
    add({
      cle: 'carriere:pitchs', groupe: 'carriere', typeLabel: 'Fit', libelle: 'Pitchs prêts',
      explication: `Présentation de 2 minutes, pourquoi le conseil, qualités et défauts... : ${PITCHS_ATTENDUS.length} pitchs attendus pour le conseil`,
      kind: 'compteur', valeur: pitchsPrets.length, max: PITCHS_ATTENDUS.length, unite: ['pitch', 'pitchs'],
      attendu: expectedAt({ start: DEBUT, end: ECHEANCE_CAS_FIT, from: 0, to: PITCHS_ATTENDUS.length, today }), echeance: ECHEANCE_CAS_FIT,
      detail: `${pitchs.length} note${pitchs.length > 1 ? 's' : ''} existe${pitchs.length > 1 ? 'nt' : ''} : ${decompte(pitchs)}`,
    });
  }
}

// ============================================================================================================
// Cours EDHEC : partiels du cycle A (dates du plan) et Master Project
// ============================================================================================================

const MATIERES = [
  { code: 'afa', match: /Advanced Financial Accounting/i, libelle: 'Advanced Financial Accounting (AFA)', file: join(SKILLS, 'revision-express/matieres/afa/progression.md') },
  { code: 'fm', match: /Financial Modeling/i, libelle: 'Financial Modeling (Excel)', file: join(SKILLS, 'revision-express/matieres/fm/progression.md') },
  { code: 'acc812', match: /ACC 812/i, libelle: 'International Accounting (ACC 812)', file: join(SKILLS, 'revision-acc812/progression.md') },
];
const planPath = join(SKILLS, 'revision-express/matieres/plan.md');
const plan = read(planPath);
const examens = plan ? tableRows(plan, 'Date|Heure|Matière') : null;
const annee = plan ? planYear(plan, today) : Number(today.slice(0, 4));
const coursFail = (m, message) => {
  sourceFail(message, { keys: [`cours:${m.code}`] });
  placeholder({ cle: `cours:${m.code}`, groupe: 'cours', typeLabel: 'Partiel', libelle: m.libelle, explication: "Source illisible : la valeur précédente est conservée s'il y en a une" });
};
for (const m of MATIERES) {
  if (!examens) {
    coursFail(m, `Source illisible : plan des finals (${planPath}) ou son tableau des examens, pour ${m.libelle}.`);
    continue;
  }
  const ligne = examens.rows.find((c) => m.match.test(c[2] ?? ''));
  const jm = ligne?.[0].match(/(\d{2})\/(\d{2})/);
  if (!jm) {
    coursFail(m, `plan.md : date d'examen introuvable pour ${m.libelle}.`);
    continue;
  }
  const date = `${annee}-${jm[2]}-${jm[1]}`;
  const heure = (ligne[1] ?? '').split('-')[0];
  const quand = `Examen ${frDate(date)} à ${heure}, ${inDays(date)}`;
  const suivi = read(m.file);
  if (suivi == null) {
    coursFail(m, `Source illisible : suivi de révision de ${m.libelle} (${m.file}).`);
    continue;
  }
  const { notions, ignorees } = parseNotionsDetail(suivi);
  if (!notions.length) {
    coursFail(m, `Suivi de révision de ${m.libelle} : tableau « Notion » introuvable ou vide.`);
    continue;
  }
  if (ignorees) warn(`Suivi de révision de ${m.libelle} : ${ignorees} notion(s) au poids ou au niveau illisible, ignorée(s).`);
  add({ seuil: SEUIL, ...partielArgs({ code: m.code, libelle: m.libelle, notions, date, quand, today, debut: COURS_DEBUT, cible: COURS_CIBLE }) });
}
{
  const passes = MASTER_JALONS.filter((j) => j.date < today).length;
  const prochain = MASTER_JALONS.find((j) => j.date >= today);
  const row = makeRow({
    cle: 'cours:master-project', groupe: 'cours', typeLabel: 'Master Project', libelle: 'Master Project et Research Methodology',
    explication: 'Jalons datés : Session 2, Session 3, mémo de 3 pages, rapport, soutenance. Un jalon compte comme tenu quand sa date est passée',
    kind: 'jalons', valeur: passes, max: MASTER_JALONS.length, attendu: passes, valeurTexte: `${passes} / ${MASTER_JALONS.length}`, attenduTexte: String(passes), unite: ['jalon', 'jalons'],
    echeance: MASTER_JALONS.at(-1).date,
    detail: prochain ? `Prochain jalon : ${prochain.label}, ${frDate(prochain.date)}${prochain.date.slice(0, 4) !== today.slice(0, 4) ? `/${prochain.date.slice(0, 4)}` : ''}, ${inDays(prochain.date)}.` : 'Tous les jalons sont passés.',
    extra: { jalons: MASTER_JALONS },
  });
  // Pas de verdict : rien dans le vault ne dit si un jalon est vraiment fait (valeur = attendu par construction).
  rows.push({ ...row, statut: null, ecart_rel: null, attendu: null, attendu_texte: null, statut_texte: prochain ? `prochain jalon ${inDays(prochain.date)}` : 'terminé' });
}

// ============================================================================================================
// Autre : projets (jamais le dashboard lui-même, ni Stage : ancien outil, retiré le 2026-10-13). Un jalon mesurable = des cases cochées d'un SUITE / plan.
// Groupe masqué par défaut dans le site (réglage `avancement_afficher_masques`), mais toujours calculé.
// ============================================================================================================

function cases(path) {
  const t = read(path);
  if (t == null) return null;
  const all = [...t.matchAll(/^[ \t]*[-*] \[([ xX])\][ \t]+(\S.*)$/gm)];
  return { ouvertes: all.filter((m) => m[1] === ' ').length, cochees: all.filter((m) => m[1] !== ' ').length };
}
for (const p of [
  { cle: 'spircle', nom: 'Spircle', note: join(VAULT, '02 Projets/Fiches projets/Spircle/Spircle.md'), explication: 'Application de bars et site, en cours de lancement' },
  { cle: 'edhec-ai', nom: 'EDHEC AI', note: join(VAULT, '02 Projets/Fiches projets/EDHEC AI/EDHEC AI.md'), explication: 'Cartes de révision générées depuis les cours' },
]) {
  const c = cases(p.note);
  if (c == null) sourceFail(`Source illisible : note du projet ${p.nom} (${p.note}).`);
  const detail = c == null
    ? 'Note du projet illisible'
    : c.ouvertes + c.cochees > 0
      ? `${c.ouvertes} case${c.ouvertes > 1 ? 's' : ''} à cocher ouverte${c.ouvertes > 1 ? 's' : ''} dans la note du projet, ${c.cochees} cochée${c.cochees > 1 ? 's' : ''}, sans date cible : pas un avancement`
      : 'Aucune liste de jalons à cocher, aucune date cible';
  add({ cle: `autre:${p.cle}`, groupe: 'autre', typeLabel: 'Projet', libelle: p.nom, explication: p.explication, kind: 'sans_mesure', valeurTexte: 'pas de jalons suivis', detail });
}

// ============================================================================================================
// Tri : dans chaque groupe, du plus en retard au plus en avance ; sans mesure à la fin
// ============================================================================================================

for (const g of ['strategy-boost', 'carriere', 'cours', 'autre']) {
  rows
    .filter((r) => r.groupe === g && r.kind !== 'note')
    .sort((a, b) => (a.ecart_rel == null) - (b.ecart_rel == null) || (a.ecart_rel ?? 0) - (b.ecart_rel ?? 0) || a.libelle.localeCompare(b.libelle, 'fr'))
    .forEach((r, i) => {
      r.ordre = i;
    });
}

// ============================================================================================================
// Lignes d'en-tête de l'onglet : état du dernier export de la base, avertissements
// ============================================================================================================

{
  const brut = read(EXPORT_ETAT);
  let etat = null;
  try {
    etat = brut ? JSON.parse(brut) : null;
  } catch {
    warn(`État de l'export illisible (${EXPORT_ETAT}).`);
  }
  rows.push(makeRow({
    cle: 'note:export', groupe: 'general', libelle: "Dernier export de la base", kind: 'note',
    detail: etat ? (etat.ok ? `Export du ${etat.date}` : `Échec de l'export du ${etat.date} : ${etat.erreur ?? 'erreur inconnue'}`) : "Aucun export de la base enregistré",
    extra: etat ? { ok: etat.ok === true, date: etat.date ?? null, dernier_succes: etat.dernier_succes ?? null, erreur: etat.erreur ?? null } : { ok: null },
  }));
}
if (warnings.length) {
  rows.push(makeRow({ cle: 'note:avertissements', groupe: 'general', libelle: 'Avertissements du calcul', kind: 'note', detail: warnings.join('\n'), extra: { echecs: failures.length } }));
}

const result = { calcule_le: new Date().toISOString(), aujourd_hui: today, lignes: rows, avertissements: warnings, echecs: failures };

// ============================================================================================================
// Sortie : --dry-run affiche, sinon upsert (sources lisibles) puis suppression des lignes qui ne sont plus produites
// ============================================================================================================

if (dry) {
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = failures.length ? 1 : 0;
} else {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Variables NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises (node --env-file=.env.local ...).');
    process.exit(1);
  }
  const { createClient } = await import('@supabase/supabase-js');
  const db = createClient(url, key, { auth: { persistSession: false } });
  const stamp = new Date().toISOString();
  const absente = (error) => error && ['PGRST205', '42P01'].includes(error.code);
  const fail = (what, error) => {
    console.error(absente(error) ? 'Table `avancement` absente : exécuter supabase/avancement.sql dans le SQL Editor de Supabase.' : `${what} : ${error.message}`);
    process.exit(1);
  };

  const { data: existingRows, error: selErr } = await db.from('avancement').select('cle');
  if (selErr) fail('Lecture impossible', selErr);
  const plan2 = planWrite({ rows, existing: (existingRows ?? []).map((r) => r.cle), protectedKeys, protectedPrefixes });

  if (plan2.upsert.length) {
    const { error } = await db.from('avancement').upsert(plan2.upsert.map((r) => ({ ...r, maj: stamp })), { onConflict: 'cle' });
    if (error) fail('Écriture impossible', error);
  }
  if (plan2.insert.length) {
    const { error } = await db.from('avancement').upsert(plan2.insert.map((r) => ({ ...r, maj: stamp })), { onConflict: 'cle', ignoreDuplicates: true });
    if (error) fail('Écriture impossible', error);
  }
  for (let i = 0; i < plan2.remove.length; i += 100) {
    const { error } = await db.from('avancement').delete().in('cle', plan2.remove.slice(i, i + 100));
    if (error) fail('Suppression impossible', error);
  }
  console.log(`avancement : ${plan2.upsert.length} ligne(s) upsertée(s), ${plan2.insert.length} « source illisible » insérée(s), ${plan2.remove.length} supprimée(s) (${today}).`);
  for (const w of warnings) console.warn(`Avertissement : ${w}`);
  if (failures.length) {
    console.error(`${failures.length} source(s) attendue(s) illisible(s) : leurs anciennes valeurs sont conservées. Code de sortie 1.`);
    process.exitCode = 1;
  }
}
