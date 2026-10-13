// Logique pure du bloc « Avancement » (aucun accès disque, base ni réseau, aucun import) : interpolation du
// trait « où il devrait être aujourd'hui », statut, textes français, lecture des tableaux Markdown du vault.
// Utilisée par scripts/push-avancement.mjs (qui lit les sources et écrit la table `avancement`) et vérifiée par
// scripts/check-avancement.mjs. Les CONSTANTES (dates de départ, échéances, cibles, seuils) sont en tête de
// scripts/push-avancement.mjs : ici on ne reçoit que des paramètres.
// Les dates « jour » sont des chaînes AAAA-MM-JJ.

const DAY_MS = 86400000;

function utcDay(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

// Nombre de jours entre deux dates AAAA-MM-JJ (b - a).
export function daysBetween(a, b) {
  return Math.round((utcDay(b) - utcDay(a)) / DAY_MS);
}

// Part du chemin parcouru entre `start` et `end` à la date `today`, bornée à [0, 1].
export function fraction(start, end, today) {
  const total = daysBetween(start, end);
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, daysBetween(start, today) / total));
}

// Valeur attendue aujourd'hui : interpolation linéaire de `from` (au départ) à `to` (à l'échéance).
export function expectedAt({ start, end, from, to, today }) {
  return from + (to - from) * fraction(start, end, today);
}

// Statut d'après l'écart RELATIF (écart / échelle). Niveau /5 : 0,5 niveau = 0,10 ; compteur ou pourcentage :
// 10 % de l'objectif. Arrondi à 4 décimales pour que 0,5 pile ne dépende pas des flottants.
export function statusOf(ecartRel, seuil = 0.1) {
  const e = Math.round(ecartRel * 10000) / 10000;
  if (e >= seuil) return 'en_avance';
  if (e <= -seuil) return 'en_retard';
  return 'dans_les_temps';
}

export const STATUS_WORDS = { en_avance: 'en avance', dans_les_temps: 'dans les temps', en_retard: 'en retard' };

// 2.5 -> « 2,5 » ; entier sans décimale quand `decimals` = 0.
export function fmt(n, decimals = 1) {
  const v = Math.round(n * 10 ** decimals) / 10 ** decimals;
  return String(v.toFixed(decimals)).replace('.', ',');
}

// « 1,6 niveau », « 2,4 niveaux » (pluriel dès 2, comme en français : 1,6 reste singulier).
function plural(n, one, many) {
  return Math.abs(n) >= 2 ? many : one;
}

// Lit un nombre français (« 2,5 », « 4 », « 31 % ») ; « - » ou vide = null.
export function parseFr(text) {
  const t = String(text ?? '').replace('%', '').replace(/\s/g, '').replace(',', '.');
  if (t === '' || t === '-') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

// Texte du statut, avec l'écart dans l'unité de la ligne : « en retard de 1,6 niveau », « en avance de 3 lettres ».
export function statusText(statut, ecart, unit) {
  if (statut === 'dans_les_temps') return 'dans les temps';
  const word = STATUS_WORDS[statut];
  const gap = Math.abs(ecart);
  if (unit.kind === 'niveau') return `${word} de ${fmt(gap)} ${plural(gap, 'niveau', 'niveaux')}`;
  if (unit.kind === 'points') return `${word} de ${fmt(gap, 0)} ${plural(Math.round(gap), 'point', 'points')}`;
  const n = Math.max(1, Math.round(gap));
  return `${word} de ${n} ${n >= 2 ? unit.many : unit.one}`;
}

// Construit la ligne à écrire dans la table. `kind` : niveau (/5), compteur, pourcentage ; `valeur` null = pas de
// mesure (ligne sans chiffre, sans statut). `attendu` = trait du jour. Les textes affichés sont calculés ici : le
// site ne fait que les montrer.
export function makeRow(r) {
  const base = {
    cle: r.cle,
    groupe: r.groupe,
    ordre: r.ordre ?? 0,
    type_label: r.typeLabel ?? null,
    libelle: r.libelle,
    explication: r.explication ?? null,
    kind: r.kind,
    valeur: null,
    max: r.max ?? null,
    attendu: null,
    ecart_rel: null,
    statut: null,
    valeur_texte: r.valeurTexte ?? null,
    attendu_texte: null,
    statut_texte: r.statutTexte ?? null,
    echeance: r.echeance ?? null,
    detail: r.detail ?? null,
    extra: r.extra ?? null,
  };
  // Sans mesure : pas de valeur, pas de trait, ou échelle nulle (objectif 0 : jamais de division par 0).
  if (r.valeur == null || r.attendu == null || !(Number(r.max) > 0)) {
    if (r.valeur != null) base.valeur = r.valeur;
    return base;
  }
  const ecart = r.valeur - r.attendu;
  const ecartRel = ecart / r.max;
  const statut = statusOf(ecartRel, r.seuil ?? 0.1);
  const unit = r.kind === 'niveau' ? { kind: 'niveau' } : r.kind === 'pourcentage' ? { kind: 'points' } : { kind: 'compteur', one: r.unite[0], many: r.unite[1] };
  const decimals = r.kind === 'niveau' ? 1 : 0;
  return {
    ...base,
    valeur: r.valeur,
    attendu: Math.round(r.attendu * 100) / 100,
    ecart_rel: Math.round(ecartRel * 10000) / 10000,
    statut,
    valeur_texte: r.valeurTexte ?? (r.kind === 'niveau' ? `${fmt(r.valeur)} / ${fmt(r.max, 0)}` : r.kind === 'pourcentage' ? `${fmt(r.valeur, 0)} %` : `${fmt(r.valeur, 0)} / ${fmt(r.max, 0)}`),
    attendu_texte: r.attenduTexte ?? (r.kind === 'pourcentage' ? `${fmt(r.attendu, 0)} %` : fmt(r.attendu, decimals)),
    statut_texte: statusText(statut, ecart * (r.kind === 'pourcentage' ? 100 / r.max : 1), unit),
  };
}

// ---------------------------------------------------------------------------------------------------------
// Lecture du vault
// ---------------------------------------------------------------------------------------------------------

// Propriétés YAML d'une note : { clé: valeur texte } (valeurs sur une ligne, guillemets retirés). Tolère le BOM et
// les fins de ligne Windows. Une liste YAML en tirets (`cabinet:` puis `  - A`) devient un TABLEAU de textes ;
// une liste en ligne (`[A, B]`) et un lien Obsidian (`[[A]]`) restent du texte, à lire avec `asList`.
export function parseFrontmatter(text) {
  const raw = String(text);
  const m = (raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw).replace(/\r/g, '').match(/^---\n([\s\S]*?)\n---/);
  const out = {};
  if (!m) return out;
  const unquote = (v) => v.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  let lastKey = null;
  for (const line of m[1].split('\n')) {
    const item = line.match(/^\s*-\s+(.*)$/);
    if (item && lastKey !== null) {
      if (!Array.isArray(out[lastKey])) out[lastKey] = out[lastKey] ? [out[lastKey]] : [];
      out[lastKey].push(unquote(item[1]));
      continue;
    }
    const k = line.match(/^([^\s:#-][^:]*):\s*(.*)$/);
    if (!k) continue;
    lastKey = k[1].trim();
    out[lastKey] = unquote(k[2]);
  }
  return out;
}

// Valeur de propriété -> liste de textes : tableau YAML, `[A, B]`, `[[A]], [[B]]`, ou texte simple.
export function asList(value) {
  if (Array.isArray(value)) return value.flatMap(asList);
  const v = String(value ?? '').trim();
  if (!v) return [];
  const links = [...v.matchAll(/\[\[([^\]]+)\]\]/g)].map((x) => x[1].split('|')[0].trim());
  if (links.length) return links;
  if (/^\[.*\]$/.test(v)) return v.slice(1, -1).split(',').map((x) => x.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  return [v];
}

// Vrai si au moins une des notes (textes bruts) a une propriété `key` renseignée. Sert à distinguer un dossier
// vraiment à 0 d'un dossier dont aucune note n'est exploitable (propriété absente ou vide partout) : dans ce cas la
// source est cassée et le script ne doit pas écrire 0.
export function anyNoteHas(texts, key) {
  return texts.some((t) => asList(parseFrontmatter(t ?? '')[key]).length > 0);
}

// Texte sans accents, sans ponctuation, en minuscules : pour rapprocher « Bain & Company » de « bain company ».
export function norm(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Valeur du champ `cabinet:` d'une note de networking : « Bain & Company » ou « [[Oliver Wyman]] » ou
// « [[Oliver Wyman|OW]] » -> nom brut.
export function cabinetFromField(value) {
  return String(value ?? '')
    .replace(/^\[\[/, '')
    .replace(/\]\]$/, '')
    .split('|')[0]
    .trim();
}

// Noms courts ou usuels d'un cabinet -> nom du dossier de sa fiche (comparés après `norm`). Un nom absent de cette
// table et de la liste des fiches est « inconnu » (le script le signale au lieu de l'ignorer en silence).
export const CABINET_ALIAS = {
  bain: 'Bain & Company',
  'bain co': 'Bain & Company',
  bcg: 'Boston Consulting Group',
  boston: 'Boston Consulting Group',
  mckinsey: 'McKinsey & Company',
  mck: 'McKinsey & Company',
  ow: 'Oliver Wyman',
  lek: 'L.E.K. Consulting',
  'l e k': 'L.E.K. Consulting',
  adl: 'Arthur D. Little',
  eyp: 'EY-Parthenon',
  'ey p': 'EY-Parthenon',
  'ey parthenon': 'EY-Parthenon',
  parthenon: 'EY-Parthenon',
  rb: 'Roland Berger',
  sk: 'Simon-Kucher',
  'simon kucher': 'Simon-Kucher',
  'strategy and': 'Strategy&',
  pwc: 'Strategy&',
  pmp: 'PMP Strategy',
  capgemini: 'Capgemini Invent',
  deloitte: 'Monitor Deloitte',
  monitor: 'Monitor Deloitte',
  kearney: 'Kearney',
  'at kearney': 'Kearney',
  alix: 'AlixPartners',
  'a m': 'Alvarez & Marsal',
  'alvarez marsal': 'Alvarez & Marsal',
};

// Cabinet suivi correspondant à un nom brut (note de networking, lettre) : égalité après `norm`, puis alias, puis
// « Bain Company » pour « Bain » (nom brut = début du nom de la fiche, au moins 3 lettres et un seul candidat).
// `byKey` : Map norm(nom de fiche) -> cabinet. Renvoie le cabinet ou null.
export function resolveCabinet(raw, byKey) {
  const n = norm(String(raw ?? '').replace(/\(.*?\)/g, ''));
  if (!n) return null;
  if (byKey.has(n)) return byKey.get(n);
  const alias = CABINET_ALIAS[n];
  if (alias && byKey.has(norm(alias))) return byKey.get(norm(alias));
  if (n.length >= 3) {
    const cands = [...byKey.entries()].filter(([k]) => k.startsWith(`${n} `));
    if (cands.length === 1) return cands[0][1];
  }
  return null;
}

// Personne d'une note de networking : propriété `personne:` (sans parenthèse finale : « Matteo (nom de famille à
// confirmer) » -> « Matteo »), à défaut le nom de fichier nettoyé (préfixe de date, « (Cabinet) » et suffixes du
// type « - fiche et questions » retirés).
export function personneKey(fm, fileName) {
  const clean = (s) => String(s ?? '').replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
  const prop = clean(Array.isArray(fm?.personne) ? fm.personne[0] : fm?.personne);
  if (prop) return norm(prop);
  const base = String(fileName ?? '')
    .replace(/\.[A-Za-z0-9]+$/, '')
    .replace(/^\d{4}-\d{2}-\d{2}\s+/, '')
    .replace(/\s+-\s+.*$/, '');
  return norm(clean(base));
}

// Date d'un échange : `date-échange:` (AAAA-MM-JJ), à défaut (propriété absente ou vide) la date en tête du nom de
// fichier ; null si aucune. Une propriété renseignée sans date AAAA-MM-JJ donne null (pas de repli silencieux sur
// le nom de fichier : voir `countNetworking`, qui le signale).
export function exchangeDate(fm, fileName) {
  const prop = String(fm?.['date-échange'] ?? '').trim();
  if (prop) return prop.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? null;
  return String(fileName ?? '').match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
}

// Personnes parlées par cabinet, d'après les notes du dossier Networking. `notes` = [{ file, text }], `cabinets` =
// [{ nom, cle }] (fiches suivies), `today` = AAAA-MM-JJ. Règles : une personne compte une fois par cabinet (clé =
// `personne:`, repli nom de fichier nettoyé) ; seuls les échanges dont la date est <= aujourd'hui comptent (un call
// préparé mais pas encore passé ne compte pas) ; `cabinet:` peut être une liste. Renvoie { personnes: Map(nom du
// cabinet -> Set), warnings }.
export function countNetworking(notes, cabinets, today) {
  const byKey = new Map(cabinets.map((c) => [c.cle, c]));
  const personnes = new Map(cabinets.map((c) => [c.nom, new Set()]));
  const warnings = [];
  for (const { file, text } of notes) {
    const fm = parseFrontmatter(text);
    const noms = asList(fm.cabinet);
    if (!noms.length) {
      warnings.push(`Networking : « ${file} » n'a pas de propriété cabinet : non comptée.`);
      continue;
    }
    const date = exchangeDate(fm, file);
    if (!date) {
      const prop = String(fm['date-échange'] ?? '').trim();
      warnings.push(prop
        ? `Networking : « ${file} » : date-échange « ${prop} » sans date AAAA-MM-JJ : non comptée.`
        : `Networking : « ${file} » n'a pas de date d'échange : non comptée.`);
      continue;
    }
    if (date > today) continue; // préparé, pas encore passé
    const personne = personneKey(fm, file);
    if (!personne) {
      warnings.push(`Networking : « ${file} » : personne introuvable (propriété personne ou nom de fichier) : non comptée.`);
      continue;
    }
    for (const brut of noms) {
      const cab = resolveCabinet(brut, byKey);
      if (!cab) {
        warnings.push(`Networking : « ${file} » cite le cabinet « ${brut} », qui n'a pas de fiche suivie : ignoré.`);
        continue;
      }
      personnes.get(cab.nom).add(personne);
    }
  }
  return { personnes, warnings };
}

// Cellules d'une ligne de tableau Markdown.
function cells(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

// Lignes de données du premier tableau dont l'en-tête commence par `header` (1re cellule, comparée telle quelle),
// à partir de `fromIndex` ; s'arrête à la première ligne qui n'est pas du tableau.
export function tableRows(markdown, header, fromIndex = 0) {
  const lines = String(markdown).replace(/\r/g, '').split('\n');
  for (let i = fromIndex; i < lines.length; i += 1) {
    if (!lines[i].trim().startsWith('|')) continue;
    const head = cells(lines[i]);
    if (head.join('|').startsWith(header)) {
      const rows = [];
      for (let j = i + 2; j < lines.length && lines[j].trim().startsWith('|'); j += 1) rows.push(cells(lines[j]));
      return { head, rows };
    }
  }
  return null;
}

// Zone du tableau de bord généré (Progression.md) : entre <!-- tableau:debut --> et <!-- tableau:fin -->.
export function dashboardZone(markdown) {
  const m = String(markdown).match(/<!-- tableau:debut -->([\s\S]*?)<!-- tableau:fin -->/);
  return m ? m[1] : null;
}

// Points de méthode : tableau « Par étape » (Étape | Niveau /5 | Compétences | Statut).
// Une étape dont le niveau est « - » ou d'un format inattendu n'est PAS écartée : `niveau` vaut null (ligne sans
// mesure) et `brut` garde le texte de la cellule (le script signale un format inattendu).
export function parseEtapes(zone) {
  const t = tableRows(zone, 'Étape|Niveau /5');
  if (!t) return [];
  return t.rows
    .map((c) => ({ etape: c[0], niveau: parseFr(c[1]), competences: c[2] ?? '', brut: c[1] ?? '' }))
    .filter((e) => e.etape);
}

// Date « Calculé le AAAA-MM-JJ » écrite par le script qui génère le tableau (fraîcheur réelle de la source).
export function calculeLe(zone) {
  return String(zone ?? '').match(/Calculé le (\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
}

// Tests en ligne : tableau « Id | Épreuve | Drill /5 | Séances | Dernière ». Un test sans niveau (« - » ou format
// inattendu) est gardé avec `niveau: null` (ligne sans mesure), jamais écarté.
export function parseTests(zone) {
  const t = tableRows(zone, 'Id|Épreuve|Drill /5');
  if (!t) return [];
  return t.rows
    .filter((c) => /^T\d+$/.test(c[0]))
    .map((c) => ({ id: c[0], epreuve: c[1], niveau: parseFr(c[2]), seances: parseFr(c[3]) ?? 0, brut: c[2] ?? '' }));
}

// Phrase de vitesse de la semaine (« **Vitesse (...)** : -0,4 niveau sur 15 compétences, lente : ... »).
export function parseVitesse(zone) {
  const m = String(zone).match(/\*\*Vitesse[^*]*\*\*\s*:\s*([^\n]+)/);
  return m ? m[1].trim() : null;
}

// Premier nombre d'une cellule, virgule ou point décimal (« 1,5 » -> 1.5 ; « 3 (2 avant S8) » -> 3) ; null sinon.
function leadingNumber(cell) {
  const m = String(cell ?? '').match(/^\s*(\d+(?:[.,]\d+)?)/);
  return m ? Number(m[1].replace(',', '.')) : null;
}

// Notions d'un fichier de suivi de révision (matieres/<code>/progression.md, revision-acc812/progression.md) :
// lignes `| Nx | Sujet | Poids | Niveau | Dernier test | ... |` du tableau « Notion ». Poids et niveau = 1er nombre de
// la cellule, décimales comprises (« 3 (2 avant S8) » -> 3 ; niveau « 1,5 » -> 1,5, jamais tronqué à 1). Une notion
// est « testée » si son dernier test est renseigné. `ignorees` = lignes dont le poids ou le niveau est illisible.
export function parseNotionsDetail(markdown) {
  const t = tableRows(markdown, 'Notion|Sujet|Poids|Niveau');
  if (!t) return { notions: [], ignorees: 0 };
  const notions = [];
  let ignorees = 0;
  for (const c of t.rows) {
    if (!c[0]) continue;
    const poids = leadingNumber(c[2]);
    const niveau = leadingNumber(c[3]);
    if (poids == null || niveau == null) {
      ignorees += 1;
      continue;
    }
    notions.push({ id: c[0], poids, niveau, teste: (c[4] ?? '') !== '' && c[4] !== '-' });
  }
  return { notions, ignorees };
}
export const parseNotions = (markdown) => parseNotionsDetail(markdown).notions;

// Maîtrise pondérée : somme(poids x niveau) / (3 x somme des poids), en %. Niveau 3 = acquis ; c'est la formule
// du bilan de progression AFA (« taux 28 % = 39/138 »). Renvoie null s'il n'y a aucune notion testée (pas de
// mesure : toutes les notions à 0 et sans dernier test). `acquises` = notions au niveau 3 (réellement acquises) :
// c'est elle, pas le pourcentage pondéré, qui donne la valeur et le statut d'un partiel (lecture pessimiste).
export function masteryPercent(notions) {
  if (!notions.length || !notions.some((n) => n.teste || n.niveau > 0)) return null;
  const total = notions.reduce((s, n) => s + n.poids * 3, 0);
  const got = notions.reduce((s, n) => s + n.poids * Math.min(3, n.niveau), 0);
  return { pct: (100 * got) / total, got, total, notions: notions.length, acquises: notions.filter((n) => n.niveau >= 3).length };
}

// Année des examens : celle du titre de plan.md (« Plan des finals, cycle A (octobre 2026) »), à défaut celle d'aujourd'hui.
export function planYear(plan, today) {
  const titre = String(plan).split('\n').find((l) => /^#\s/.test(l)) ?? '';
  const y = titre.match(/\b(20\d{2})\b/)?.[1];
  return y ? Number(y) : Number(String(today).slice(0, 4));
}

// Arguments de makeRow pour un partiel, en lecture PESSIMISTE : la valeur et le statut portent sur les notions
// réellement acquises (niveau 3) sur le total, jamais sur la maîtrise pondérée (qui reste en mention secondaire).
// Le trait suit la même unité : 0 notion acquise au début du suivi (`debut`), `cible` (part, 0-1) des notions
// acquises à l'examen. Après la date de l'examen : ligne « passée », plus de statut calculé.
export function partielArgs({ code, libelle, notions, date, quand, today, debut, cible }) {
  const base = { cle: `cours:${code}`, groupe: 'cours', typeLabel: 'Partiel', libelle, echeance: date };
  const m = masteryPercent(notions);
  if (!m) {
    return { ...base, explication: "Notions du cours réellement acquises (niveau 3 sur 3), sur le total", kind: 'sans_mesure', valeurTexte: 'pas encore de suivi', detail: `${quand}. Aucune notion testée dans le suivi de révision.` };
  }
  const n = notions.length;
  const s = (k) => (k > 1 ? 's' : '');
  const secondaire = `Maîtrise pondérée par le poids à l'examen, à titre indicatif : ${fmt(m.pct, 0)} %.`;
  const explication = `Notions réellement acquises (niveau 3 sur 3) : ${m.acquises} sur ${n}. ${secondaire}`;
  const common = { ...base, explication, kind: 'compteur', valeur: m.acquises, max: n, unite: ['notion', 'notions'], valeurTexte: `${m.acquises} / ${n} notion${s(n)}`, extra: { ponderee_pct: Math.round(m.pct * 10) / 10, points: m.got, total_points: m.total } };
  if (String(today) > String(date)) {
    return { ...common, statutTexte: 'examen passé', detail: `${quand}.`, extra: { ...common.extra, passe: true } };
  }
  return { ...common, attendu: expectedAt({ start: debut, end: date, from: 0, to: cible * n, today }), detail: `${quand}. Cible à l'examen : ${fmt(cible * 100, 0)} % des notions acquises.` };
}

// Plan d'écriture de la table `avancement` (pur, testé). `rows` = lignes calculées ; une ligne « source illisible »
// porte `_garde` (clé ou préfixe qu'elle remplace). `existing` = clés déjà en table. Règles : une source illisible
// n'efface rien (ses clés ou préfixes protégés ne sont ni écrasés ni supprimés) ; une ligne « source illisible »
// n'est insérée que s'il n'y a encore aucune valeur à garder ; les lignes qui ne sont plus produites et ne sont pas
// protégées sont supprimées.
export function planWrite({ rows, existing, protectedKeys = [], protectedPrefixes = [] }) {
  const isProtected = (k) => protectedKeys.includes(k) || protectedPrefixes.some((p) => k.startsWith(p));
  const clean = (r) => {
    const { _garde, ...rest } = r;
    return rest;
  };
  const upsert = rows.filter((r) => !r._garde && !isProtected(r.cle)).map(clean);
  const insert = rows
    .filter((r) => r._garde)
    .filter((r) => !existing.some((k) => k !== r.cle && k.startsWith(r._garde)) && !(r._garde === r.cle && existing.includes(r.cle)))
    .map(clean);
  const keep = new Set([...upsert, ...insert].map((r) => r.cle));
  const remove = existing.filter((k) => !keep.has(k) && !isProtected(k));
  return { upsert, insert, remove };
}

// Statut « prête » (histoires, pitchs) : vocabulaire du modèle Histoire (brouillon -> rédigée -> rodée) plus
// prête / validée / finalisée. Tout le reste (brouillon, semi-travaillé, matière brute, à construire...) : pas prête.
export function isReadyStatus(statut) {
  return /^(redigee?|rodee?|prets?|pretes?|validee?|finalisee?|final)\b/.test(norm(statut));
}

// Valeur du champ `fichier:` d'une lettre -> nom du fichier final, ou null si « à créer » / vide.
// `2026-09 Lettre - X.docx` ; `Fichiers/... .pdf` ; `... .docx (+ .pdf)`.
export function lettreFichier(value) {
  const v = String(value ?? '').trim();
  if (!v || /^(a|à)\s*cr[ée]er$/i.test(v) || v === '-') return null;
  const first = v.split(' (+')[0].split(' / ')[0].replace(/`/g, '').trim();
  return first || null;
}

// Rang d'une priorité « P1 » -> 1 ; inconnue -> 9.
export function priorityRank(p) {
  const m = String(p ?? '').match(/P(\d)/i);
  return m ? Number(m[1]) : 9;
}

// Cabinets à viser pour le networking : ceux sous l'objectif par cabinet (`goal` personnes), en commençant par
// ceux où personne n'a été parlé, puis P1, P2, P3, puis le moins avancé, puis l'ordre alphabétique.
export function nextTargets(cabinets, goal) {
  return cabinets
    .filter((c) => c.n < goal)
    .sort((a, b) => (a.n > 0) - (b.n > 0) || a.rank - b.rank || a.n - b.n || a.nom.localeCompare(b.nom, 'fr'));
}

// Phrase « Prochain à viser : X (P1, aucune personne parlée). Ensuite : Y (P2, aucune personne parlée), Z (P2, 1 sur 3). »
export function nextTargetsText(targets, goal, count = 3) {
  if (!targets.length) return `Tous les cabinets suivis ont ${goal} personnes parlées.`;
  const label = (c) => `${c.nom} (${c.priorite}, ${c.n === 0 ? 'aucune personne parlée' : `${c.n} sur ${goal}`})`;
  const [first, ...rest] = targets.slice(0, count);
  return `Prochain à viser : ${label(first)}.${rest.length ? ` Ensuite : ${rest.map(label).join(', ')}.` : ''}`;
}
