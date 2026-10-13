// Mise en forme PURE du bloc « Avancement » du Cockpit (aucun accès base, aucun import) : regroupe et trie les
// lignes de la table `avancement` (calculées par scripts/push-avancement.mjs), prépare les positions de la barre
// et du trait. Vérifiée par scripts/check-avancement.mjs. Les lignes arrivent avec leurs textes déjà calculés
// (valeur, attendu, statut) ; le site ne recalcule rien.

// Ordre fixe des quatre groupes (choix de Thibaut, 2026-10-13).
export const GROUPS = [
  { id: 'strategy-boost', title: 'Strategy Boost' },
  { id: 'carriere', title: 'Carrière' },
  { id: 'cours', title: 'Cours EDHEC' },
  { id: 'autre', title: 'Autre' },
];

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

// Vue d'une ligne : tout ce que le composant affiche, sans calcul dans le JSX.
export function rowView(r) {
  const measured = r.valeur != null && r.max != null && r.kind !== 'note' && r.kind !== 'sans_mesure';
  return {
    key: r.cle,
    typeLabel: r.type_label ?? '',
    label: r.libelle,
    explication: r.explication ?? '',
    detail: r.detail ?? '',
    kind: r.kind,
    measured,
    barPct: measured ? pct(Number(r.valeur), Number(r.max)) : 0,
    traitPct: measured && r.attendu != null ? pct(Number(r.attendu), Number(r.max)) : null,
    ticks: measured && r.kind === 'jalons' ? Number(r.max) : 0,
    valueText: r.valeur_texte ?? '',
    attenduText: r.attendu_texte ?? '',
    statut: r.statut ?? null,
    statutText: r.statut_texte ?? '',
    echeance: r.echeance ?? null,
    echeanceText: frShortDate(r.echeance),
    ordre: r.ordre ?? 0,
  };
}

// Regroupe, trie (du plus en retard au plus en avance : `ordre` calculé par le script, sans mesure à la fin) et
// compte. Les lignes de kind `note` (une phrase par groupe, ex. la vitesse de la semaine) ne sont pas des lignes.
export function buildAvancement(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const groups = GROUPS.map((g) => {
    const inGroup = list.filter((r) => r.groupe === g.id);
    const lignes = inGroup
      .filter((r) => r.kind !== 'note')
      .map(rowView)
      .sort((a, b) => a.ordre - b.ordre || a.label.localeCompare(b.label, 'fr'));
    const dates = [...new Set(lignes.map((l) => l.echeance).filter(Boolean))].sort();
    return {
      ...g,
      lignes,
      note: inGroup.find((r) => r.kind === 'note')?.detail ?? '',
      echeances: dates.map(frShortDate),
      late: lignes.filter((l) => l.statut === 'en_retard').length,
      ok: lignes.filter((l) => l.statut === 'dans_les_temps').length,
      ahead: lignes.filter((l) => l.statut === 'en_avance').length,
      unmeasured: lignes.filter((l) => !l.statut).length,
    };
  }).filter((g) => g.lignes.length > 0);
  const sum = (k) => groups.reduce((s, g) => s + g[k], 0);
  return { groups, late: sum('late'), ok: sum('ok'), ahead: sum('ahead'), unmeasured: sum('unmeasured') };
}

// Dernière synchronisation (max de `maj`) et son âge en heures ; null si aucune ligne.
export function syncInfo(rows, now = Date.now()) {
  const times = (Array.isArray(rows) ? rows : []).map((r) => Date.parse(r.maj)).filter(Number.isFinite);
  if (!times.length) return null;
  const last = Math.max(...times);
  return { iso: new Date(last).toISOString(), label: frSync(new Date(last).toISOString()), ageHours: (now - last) / 3600000 };
}
