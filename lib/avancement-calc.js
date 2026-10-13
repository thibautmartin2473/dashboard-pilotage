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
  if (r.valeur == null || r.attendu == null) {
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

// Propriétés YAML d'une note : { clé: valeur texte } (valeurs simples sur une ligne, guillemets retirés).
export function parseFrontmatter(text) {
  const m = String(text).replace(/\r/g, '').match(/^---\n([\s\S]*?)\n---/);
  const out = {};
  if (!m) return out;
  for (const line of m[1].split('\n')) {
    const k = line.match(/^([^\s:#][^:]*):\s*(.*)$/);
    if (!k) continue;
    out[k[1].trim()] = k[2].trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  }
  return out;
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
export function parseEtapes(zone) {
  const t = tableRows(zone, 'Étape|Niveau /5');
  if (!t) return [];
  return t.rows
    .map((c) => ({ etape: c[0], niveau: parseFr(c[1]), competences: c[2] ?? '' }))
    .filter((e) => e.etape && e.niveau != null);
}

// Tests en ligne : tableau « Id | Épreuve | Drill /5 | Séances | Dernière ».
export function parseTests(zone) {
  const t = tableRows(zone, 'Id|Épreuve|Drill /5');
  if (!t) return [];
  return t.rows
    .filter((c) => /^T\d+$/.test(c[0]))
    .map((c) => ({ id: c[0], epreuve: c[1], niveau: parseFr(c[2]), seances: parseFr(c[3]) ?? 0 }))
    .filter((x) => x.niveau != null);
}

// Phrase de vitesse de la semaine (« **Vitesse (...)** : -0,4 niveau sur 15 compétences, lente : ... »).
export function parseVitesse(zone) {
  const m = String(zone).match(/\*\*Vitesse[^*]*\*\*\s*:\s*([^\n]+)/);
  return m ? m[1].trim() : null;
}

// Notions d'un fichier de suivi de révision (matieres/<code>/progression.md, revision-acc812/progression.md) :
// lignes `| Nx | Sujet | Poids | Niveau | Dernier test | ... |` du tableau « Notion ». Poids = 1er entier de la
// cellule (« 3 (2 avant S8) » -> 3). Une notion est « testée » si son dernier test est renseigné.
export function parseNotions(markdown) {
  const t = tableRows(markdown, 'Notion|Sujet|Poids|Niveau');
  if (!t) return [];
  return t.rows
    .map((c) => ({ id: c[0], poids: parseInt(c[2], 10), niveau: parseInt(c[3], 10), teste: (c[4] ?? '') !== '' && c[4] !== '-' }))
    .filter((n) => n.id && Number.isFinite(n.poids) && Number.isFinite(n.niveau));
}

// Maîtrise pondérée : somme(poids x niveau) / (3 x somme des poids), en %. Niveau 3 = acquis ; c'est la formule
// du bilan de progression AFA (« taux 28 % = 39/138 »). Renvoie null s'il n'y a aucune notion testée (pas de
// mesure : toutes les notions à 0 et sans dernier test).
export function masteryPercent(notions) {
  if (!notions.length || !notions.some((n) => n.teste || n.niveau > 0)) return null;
  const total = notions.reduce((s, n) => s + n.poids * 3, 0);
  const got = notions.reduce((s, n) => s + n.poids * Math.min(3, n.niveau), 0);
  return { pct: (100 * got) / total, got, total, notions: notions.length, acquises: notions.filter((n) => n.niveau >= 3).length };
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

// Phrase « Prochain à viser : X (P1, personne). Ensuite : Y (P2, personne), Z (P2, 1 sur 3). »
export function nextTargetsText(targets, goal, count = 3) {
  if (!targets.length) return `Tous les cabinets suivis ont ${goal} personnes parlées.`;
  const label = (c) => `${c.nom} (${c.priorite}, ${c.n === 0 ? 'personne' : `${c.n} sur ${goal}`})`;
  const [first, ...rest] = targets.slice(0, count);
  return `Prochain à viser : ${label(first)}.${rest.length ? ` Ensuite : ${rest.map(label).join(', ')}.` : ''}`;
}
