// Logique pure des notifications (regroupement des « Oublié hier ? », plan de nettoyage).
// Vérifiée par scripts/check-notifications.mjs. Aucun accès base ici.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RECAP_PREFIX = /^\s*oubli[ée]+\s+hier\s*\?\s*/i;
// recap:<date d'hier>:<id Google d'un bloc ou uuid de tâche>:<n° de la tâche dans le bloc>
const RECAP_KEY = /^recap:(\d{4}-\d{2}-\d{2}):([^:]+):(\d+)$/;

export const isUuid = (s) => typeof s === 'string' && UUID.test(s);
export const isRecap = (n) => typeof n?.dedupe_key === 'string' && n.dedupe_key.startsWith('recap:');

// { date, id, n } ou null si la clé n'a pas le format attendu.
export function parseRecapKey(dedupeKey) {
  const m = RECAP_KEY.exec(dedupeKey ?? '');
  return m ? { date: m[1], id: m[2], n: Number(m[3]) } : null;
}

// Uuid de la tâche visée par une notification « recap: », ou null (id Google d'un bloc, autre format).
export function recapTaskId(n) {
  if (!isRecap(n)) return null;
  const key = parseRecapKey(n.dedupe_key);
  return key && isUuid(key.id) ? key.id : null;
}

// Titre sans le préfixe « Oublié hier ? » (espaces superflus retirés).
export const recapTitle = (title) => (title ?? '').replace(RECAP_PREFIX, '').replace(/\s+/g, ' ').trim();

// Clé de regroupement : titre sans préfixe, sans accents ni majuscules.
export const recapGroupKey = (title) =>
  recapTitle(title)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const byRecent = (a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '');

// Sépare les notifications : `others` (inchangées, ordre d'origine) et `recaps` (une entrée par tâche) :
// { key, title, count, latest, ids }. `latest` = la notification la plus récente du groupe (sa date
// proposée est celle qu'on affiche) ; `ids` = toutes celles du groupe. Groupes triés du plus récent au plus ancien.
export function groupNotifications(list) {
  const others = [];
  const groups = new Map();
  for (const n of list) {
    if (!isRecap(n)) {
      others.push(n);
      continue;
    }
    const key = recapGroupKey(n.title);
    const g = groups.get(key) ?? { key, items: [] };
    g.items.push(n);
    groups.set(key, g);
  }
  const recaps = [...groups.values()].map(({ key, items }) => {
    const sorted = [...items].sort(byRecent);
    return { key, title: recapTitle(sorted[0].title), count: items.length, latest: sorted[0], ids: items.map((n) => n.id) };
  });
  recaps.sort((a, b) => byRecent(a.latest, b.latest));
  return { others, recaps };
}

// Jours entiers entre deux dates AAAA-MM-JJ (b - a).
const dayDiff = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);

export const STALE_RECAP_DAYS = 3;

// Plan de nettoyage : parmi les « recap: » encore `new`, ce qu'on passerait en `dismissed` :
// - ceux dont due_date est passée depuis plus de 3 jours (raison « perimee »),
// - les doublons d'une même tâche, hors la plus récente (raison « doublon »).
// Retour : [{ id, title, reason }], sans doublon d'id.
export function planCleanup(list, today) {
  const pending = list.filter((n) => isRecap(n) && (n.status ?? 'new') === 'new');
  const plan = new Map();
  for (const n of pending) {
    if (n.due_date && dayDiff(n.due_date, today) > STALE_RECAP_DAYS) plan.set(n.id, { id: n.id, title: n.title, reason: 'perimee' });
  }
  const { recaps } = groupNotifications(pending);
  const byId = new Map(pending.map((n) => [n.id, n]));
  for (const g of recaps) {
    for (const id of g.ids) {
      if (id !== g.latest.id && !plan.has(id)) plan.set(id, { id, title: byId.get(id).title, reason: 'doublon' });
    }
  }
  return [...plan.values()];
}
