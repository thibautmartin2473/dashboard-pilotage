// Mise en forme PURE de l'onglet « Avancement » et de son résumé du Cockpit (aucun accès base, aucun import) :
// regroupe et trie les lignes de la table `avancement` (calculées par scripts/push-avancement.mjs), prépare les
// positions de la barre et du trait, le résumé compact par grand poste, les notes d'en-tête (avertissements, export
// de la base). Vérifiée par scripts/check-avancement.mjs. Les lignes arrivent avec leurs textes déjà calculés
// (valeur, attendu, statut) ; le site ne recalcule rien.

// Ordre fixe des quatre groupes (choix de Thibaut, 2026-10-13).
export const GROUPS = [
  { id: 'strategy-boost', title: 'Strategy Boost' },
  { id: 'carriere', title: 'Carrière' },
  { id: 'cours', title: 'Cours EDHEC' },
  { id: 'autre', title: 'Autre' },
];

// Masqués par défaut (2026-10-13) : le groupe « Autre » (Spircle, EDHEC AI) et la ligne Master Project. Le réglage
// `avancement_afficher_masques` (dashboard_settings) les réaffiche. Leurs lignes sont quand même calculées et stockées.
export const GROUPES_MASQUES = ['autre'];
export const LIGNES_MASQUEES = ['cours:master-project'];
export const REGLAGE_MASQUES = 'avancement_afficher_masques';

// Au-delà de ce nombre de jours sans export réussi de la base, l'en-tête passe en corail (export hebdomadaire + marge).
export const EXPORT_PERIME_JOURS = 9;
// Écart (heures) à partir duquel une ligne dont la `maj` retarde sur la dernière synchro est dite « ancienne valeur ».
const ANCIENNE_H = 2;

const pct = (v, max) => (max > 0 ? Math.min(100, Math.max(0, (v / max) * 100)) : 0);

// « 3 nov. » (jour AAAA-MM-JJ, sans fuseau).
export function frShortDate(iso) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', day: 'numeric', month: 'short' }).format(new Date(`${iso}T12:00:00Z`));
}

// Date et heure de la dernière synchronisation, heure de Paris : « 13 oct. à 20 h 50 ».
export function frSync(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric', month: 'short' }).format(d);
  const time = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d);
  return `${day} à ${time.replace(':', ' h ')}`;
}

// Identifiant d'ancre d'une ligne (« sb:etape:synthese » -> « ligne-sb-etape-synthese »).
export const rowId = (cle) => `ligne-${String(cle).replace(/[^a-z0-9]+/gi, '-')}`;

// Vue d'une ligne : tout ce que le composant affiche, sans calcul dans le JSX. `latestMaj` (ms) : dernière synchro.
export function rowView(r, latestMaj = null) {
  const measured = r.valeur != null && r.max != null && r.kind !== 'note' && r.kind !== 'sans_mesure';
  const jalons = r.kind === 'jalons';
  const passe = r.extra?.passe === true;
  const maj = Date.parse(r.maj);
  const ancienne = latestMaj != null && Number.isFinite(maj) && latestMaj - maj > ANCIENNE_H * 3600000;
  return {
    key: r.cle,
    id: rowId(r.cle),
    typeLabel: r.type_label ?? '',
    label: r.libelle,
    explication: r.explication ?? '',
    detail: r.detail ?? '',
    kind: r.kind,
    measured,
    barPct: measured ? pct(Number(r.valeur), Number(r.max)) : 0,
    // Pas de trait pour les jalons (la valeur est l'attendu par construction) ni après l'examen.
    traitPct: measured && r.attendu != null && !jalons && !passe ? pct(Number(r.attendu), Number(r.max)) : null,
    ticks: measured && jalons ? Number(r.max) : 0,
    valueText: r.valeur_texte ?? '',
    // Jamais « attendu aujourd'hui » pour des jalons (Master Project) ni pour un examen passé.
    attenduText: jalons || passe ? '' : (r.attendu_texte ?? ''),
    statut: r.statut ?? null,
    statutText: r.statut_texte ?? '',
    passe,
    ecartRel: r.ecart_rel == null ? null : Number(r.ecart_rel),
    echeance: r.echeance ?? null,
    echeanceText: frShortDate(r.echeance),
    ordre: r.ordre ?? 0,
    ancienne: ancienne ? frShortDate(new Date(maj).toISOString().slice(0, 10)) : '',
    masquee: LIGNES_MASQUEES.includes(r.cle) || GROUPES_MASQUES.includes(r.groupe),
  };
}

// Dernière synchronisation (max de `maj`) et son âge en heures ; null si aucune ligne.
export function syncInfo(rows, now = Date.now()) {
  const times = (Array.isArray(rows) ? rows : []).map((r) => Date.parse(r.maj)).filter(Number.isFinite);
  if (!times.length) return null;
  const last = Math.max(...times);
  return { iso: new Date(last).toISOString(), ms: last, label: frSync(new Date(last).toISOString()), ageHours: (now - last) / 3600000 };
}

// Regroupe, trie (du plus en retard au plus en avance : `ordre` calculé par le script, sans mesure à la fin) et
// compte. Les lignes de kind `note` (une phrase par groupe, ex. la vitesse de la semaine) ne sont pas des lignes, ni
// celles du groupe `general` (avertissements, export). Sans `showHidden`, le groupe « Autre » et Master Project sont
// écartés (et de tous les comptes) ; `hidden` dit combien de lignes le sont.
export function buildAvancement(rows, { showHidden = false } = {}) {
  const list = Array.isArray(rows) ? rows : [];
  const sync = syncInfo(list);
  const latest = sync?.ms ?? null;
  let hidden = 0;
  const groups = GROUPS.map((g) => {
    const inGroup = list.filter((r) => r.groupe === g.id);
    const all = inGroup
      .filter((r) => r.kind !== 'note')
      .map((r) => rowView(r, latest))
      .sort((a, b) => a.ordre - b.ordre || a.label.localeCompare(b.label, 'fr'));
    hidden += all.filter((l) => l.masquee).length;
    const lignes = showHidden ? all : all.filter((l) => !l.masquee);
    const dates = [...new Set(lignes.map((l) => l.echeance).filter(Boolean))].sort();
    const note = inGroup.find((r) => r.kind === 'note');
    const active = lignes.filter((l) => !l.passe);
    return {
      ...g,
      lignes,
      note: note?.detail ?? '',
      calculeLe: note?.extra?.calcule_le ?? '',
      echeances: dates.map(frShortDate),
      late: active.filter((l) => l.statut === 'en_retard').length,
      ok: active.filter((l) => l.statut === 'dans_les_temps').length,
      ahead: active.filter((l) => l.statut === 'en_avance').length,
      unmeasured: active.filter((l) => !l.statut).length,
      past: lignes.filter((l) => l.passe).length,
    };
  }).filter((g) => g.lignes.length > 0);
  const sum = (k) => groups.reduce((s, g) => s + g[k], 0);
  return { groups, late: sum('late'), ok: sum('ok'), ahead: sum('ahead'), unmeasured: sum('unmeasured'), past: sum('past'), hidden };
}

// Âge en jours entiers d'un jour AAAA-MM-JJ par rapport à `now` (ms), jour de Paris.
export function joursDepuis(iso, now) {
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));
  return Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${iso}T00:00:00Z`)) / 86400000);
}
const ilYa = (n) => (n <= 0 ? "aujourd'hui" : `il y a ${n} jour${n > 1 ? 's' : ''}`);

// Notes d'en-tête de l'onglet : avertissements du dernier calcul et état du dernier export de la base.
// Renvoie { avertissements: [texte], exportInfo: { text, late } | null }.
export function headerNotes(rows, now = Date.now()) {
  const list = Array.isArray(rows) ? rows : [];
  const avert = list.find((r) => r.cle === 'note:avertissements');
  const avertissements = avert?.detail ? String(avert.detail).split('\n').filter(Boolean) : [];
  const exp = list.find((r) => r.cle === 'note:export');
  if (!exp) return { avertissements, exportInfo: null };
  const x = exp.extra ?? {};
  if (x.ok == null) return { avertissements, exportInfo: { text: "Dernier export de la base : aucun enregistré", late: true } };
  const dernier = x.dernier_succes ?? (x.ok ? x.date : null);
  const age = dernier ? joursDepuis(dernier, now) : null;
  if (x.ok === false) {
    const suite = dernier ? `, dernier réussi ${ilYa(age)}` : ', aucun export réussi enregistré';
    return { avertissements, exportInfo: { text: `Dernier export de la base : échec le ${frShortDate(x.date)}${x.erreur ? ` (${x.erreur})` : ''}${suite}`, late: true } };
  }
  return { avertissements, exportInfo: { text: `Dernier export de la base : ${ilYa(age ?? 0)} (${frShortDate(x.date)})`, late: age != null && age > EXPORT_PERIME_JOURS } };
}

// Noms des grands postes du résumé du Cockpit (par `type_label` des lignes).
const POSTES = {
  'Méthode de cas': 'Méthode de cas',
  'Test en ligne': 'Tests en ligne',
  Candidature: 'Lettres de motivation',
  Réseau: 'Réseau dans les cabinets',
  Fit: 'Fit : histoires et pitchs',
  Partiel: 'Partiels',
  'Master Project': 'Master Project',
  Projet: 'Projets',
};
const RANG = { en_retard: 0, dans_les_temps: 1, en_avance: 2 };

// Résumé compact : une barre par grand poste, les retards d'abord (puis les dans les temps, les en avance, les
// postes sans mesure). Chaque poste mène à sa ligne la plus en retard dans l'onglet (`href`).
export function summaryPosts(view) {
  const postes = new Map();
  for (const g of view.groups) {
    for (const l of g.lignes) {
      const id = l.typeLabel || g.id;
      if (!postes.has(id)) postes.set(id, { id, title: POSTES[id] ?? l.typeLabel ?? g.title, lignes: [] });
      postes.get(id).lignes.push(l);
    }
  }
  const items = [...postes.values()].map((p) => {
    const mesurees = p.lignes.filter((l) => l.statut);
    const late = mesurees.filter((l) => l.statut === 'en_retard');
    const ahead = mesurees.filter((l) => l.statut === 'en_avance');
    const status = !mesurees.length ? null : late.length ? 'en_retard' : ahead.length === mesurees.length ? 'en_avance' : 'dans_les_temps';
    const avec = mesurees.filter((l) => l.traitPct != null);
    const moy = (k) => (avec.length ? avec.reduce((s, l) => s + l[k], 0) / avec.length : null);
    const pire = late.length ? [...late].sort((a, b) => a.ordre - b.ordre)[0] : p.lignes[0];
    let text;
    if (!mesurees.length) text = p.lignes.every((l) => l.passe) ? 'examen passé' : (p.lignes[0].valueText || 'pas de mesure');
    else if (mesurees.length === 1) text = `${mesurees[0].valueText} : ${mesurees[0].statutText}`;
    else if (late.length) text = `${late.length} en retard sur ${mesurees.length}`;
    else text = status === 'en_avance' ? 'en avance' : 'dans les temps';
    const ecart = mesurees.length ? mesurees.reduce((s, l) => s + (l.ecartRel ?? 0), 0) / mesurees.length : 0;
    return {
      id: p.id, title: p.title, status, text, late: late.length, total: mesurees.length,
      barPct: moy('barPct') ?? 0, traitPct: moy('traitPct'), href: `/avancement#${pire.id}`, ecart,
    };
  });
  return items.sort((a, b) => (RANG[a.status] ?? 3) - (RANG[b.status] ?? 3) || b.late / (b.total || 1) - a.late / (a.total || 1) || a.ecart - b.ecart || a.title.localeCompare(b.title, 'fr'));
}
