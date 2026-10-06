// Logique pure de la démo « Le grand ménage » (aucun accès base, aucun effet de bord).
// Les dates « jour » sont des chaînes AAAA-MM-JJ, l'heure de référence vient du serveur.

export const GESTURES = {
  F: { label: 'Fait', key: 'F', past: 'faites' },
  R: { label: 'Recaser', key: 'R', past: 'recasées' },
  A: { label: 'Abandonner', key: 'A', past: 'abandonnées' },
  P: { label: 'Plus tard', key: 'P', past: 'repoussées à dimanche' },
  G: { label: 'Garder telle quelle', key: 'G', past: 'gardées' },
};

const MONTHS = 'janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre';

const strip = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Titre normalisé : sans accents, sans numéro de série (n°2, #3, x3), sans mois ni date, sans
// parenthèses, sans ponctuation. Deux tâches de même clé forment une série.
export function seriesKey(title) {
  const key = strip(title)
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(n\s*°|no\.?|num(ero)?|#)\s*\d+/g, ' ')
    .replace(/\b\d{1,2}\s*\/\s*\d{1,2}(\s*\/\s*\d{2,4})?/g, ' ')
    .replace(new RegExp(`\\b(d'|de |du |en |pour )?(${MONTHS})\\b`, 'g'), ' ')
    .replace(new RegExp(`\\b(a|au|jusqu'a)\\s+(${MONTHS})\\b`, 'g'), ' ')
    .replace(/\bx\s*\d+\b/g, ' ')
    .replace(/\b\d+\b/g, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return key.length >= 4 ? key : strip(title).trim();
}

const dayDiff = (a, b) => Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86400000);

export const frDay = (day) => (day ? `${day.slice(8, 10)}/${day.slice(5, 7)}` : '');

export function dayParis(iso) {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
}

export function frDateTime(iso) {
  const day = dayParis(iso);
  const hm = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .format(new Date(iso))
    .replace(':', 'h');
  const wd = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'short' }).format(new Date(iso));
  return `${wd} ${frDay(day)} à ${hm}`;
}

export const cleanBlockTitle = (t) => (t ?? '').replace(/^\s*\[bloc planifi[ée]\]\s*/i, '').trim() || 'Bloc sans titre';

export function nextSunday(today) {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + ((7 - d.getUTCDay()) % 7 || 7));
  return d.toISOString().slice(0, 10);
}

// Les 3 prochains blocs orange (colorId 6) à venir, un par créneau.
export function nextOrangeSlots(events, nowMs, n = 3) {
  return (events ?? [])
    .filter((e) => e.color_id === '6' && !e.all_day && Date.parse(e.starts_at) > nowMs)
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))
    .slice(0, n)
    .map((e) => ({ id: e.id, title: cleanBlockTitle(e.title), startsAt: e.starts_at, label: `${cleanBlockTitle(e.title)}, ${frDateTime(e.starts_at)}`, day: dayParis(e.starts_at) }));
}

// Une tâche enrichie pour l'affichage : âge, retard, bloc d'origine, projet.
export function enrichTask(t, { today, nowMs, projectNames, eventsById }) {
  const ev = t.event_id ? eventsById[t.event_id] : null;
  const age = Math.max(0, Math.floor((nowMs - Date.parse(t.created_at)) / 86400000));
  const late = t.due_date ? dayDiff(today, t.due_date) : null;
  return {
    id: t.id,
    title: t.title,
    age,
    due: t.due_date ?? null,
    late: late !== null && late > 0 ? late : 0,
    bucket: t.bucket,
    project: t.project_slug ? (projectNames[t.project_slug] ?? t.project_slug) : null,
    origin: !t.event_id ? null : ev ? `${cleanBlockTitle(ev.title)}, ${frDateTime(ev.starts_at)}` : "bloc introuvable dans l'agenda actuel (déplacé ou supprimé)",
    source: t.source,
  };
}

// Cartes : une par série de 2+ tâches de même clé, une par tâche sinon.
// Ordre : les plus en retard d'abord, puis les échéances futures, puis les sans échéance par âge.
export function buildCards(tasks) {
  const byKey = new Map();
  for (const t of tasks) {
    const k = seriesKey(t.title);
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(t);
  }
  const cards = [...byKey.entries()].map(([k, list]) => {
    const dues = list.map((t) => t.due).filter(Boolean).sort();
    const first = list.reduce((a, b) => (b.late > a.late ? b : a), list[0]);
    return {
      id: list.length > 1 ? `s:${k}` : `t:${list[0].id}`,
      isSeries: list.length > 1,
      title: list.length > 1 ? commonTitle(list) : list[0].title,
      tasks: list,
      due: dues[0] ?? null,
      lastDue: dues[dues.length - 1] ?? null,
      late: Math.max(...list.map((t) => t.late)),
      age: Math.max(...list.map((t) => t.age)),
      project: first.project,
      origin: list.map((t) => t.origin).find(Boolean) ?? null,
    };
  });
  const rank = (c) => (c.late > 0 ? 0 : c.due ? 1 : 2);
  return cards.sort((a, b) => rank(a) - rank(b) || (rank(a) === 0 ? b.late - a.late : rank(a) === 1 ? a.due.localeCompare(b.due) : b.age - a.age));
}

// Titre d'une série : le début commun des titres, sans numéro ni particule finale.
function commonTitle(list) {
  const titles = list.map((t) => t.title);
  let prefix = titles[0];
  for (const t of titles) while (!t.startsWith(prefix)) prefix = prefix.slice(0, -1);
  const clean = prefix.replace(/[\s(:,-]+$/, '').replace(/\s+(n\s*°|#|d'|de|du|l')$/i, '').replace(/[\s(:,-]+$/, '').trim();
  if (clean.length >= 6) return clean;
  return [...titles].sort((a, b) => a.length - b.length)[0];
}

// ---- Notifications « Oublié hier ? » ----
const FORGOT = /^\s*oubli[ée]+\s+hier\s*\??\s*[:\-]?\s*/i;

export function groupNotifications(notifications) {
  const groups = new Map();
  const others = [];
  for (const n of notifications) {
    if (!FORGOT.test(n.title ?? '')) {
      others.push(n);
      continue;
    }
    const title = n.title.replace(FORGOT, '').trim() || '(sans titre)';
    const key = seriesKey(title);
    const g = groups.get(key) ?? { key, title, count: 0 };
    g.count += 1;
    groups.set(key, g);
  }
  const list = [...groups.values()].sort((a, b) => b.count - a.count || a.title.localeCompare(b.title));
  return { groups: list, forgotCount: list.reduce((s, g) => s + g.count, 0), others };
}

export const rappelLabel = (g) => `${g.title} : rappelée ${g.count} fois`;

// ---- Ce qui serait écrit ----
// decision = { g: 'F'|'R'|'A'|'P'|'G'|'I', slot? }. Renvoie des lignes { table, text } (G n'écrit rien).
export function writesFor(card, decision, ctx) {
  const n = card.tasks.length;
  const what = card.isSeries ? `${n} lignes "${card.title}"` : `"${card.title}"`;
  switch (decision.g) {
    case 'F':
      return [{ table: 'tasks', text: `marquer fait ${what} (done_at = maintenant)` }];
    case 'A':
      return [{ table: 'tasks', text: `abandonner ${what} (nouvelle colonne status = 'dropped', jamais réaffichée)` }];
    case 'P':
      return [{ table: 'tasks', text: `repousser ${what} à la revue du dimanche ${frDay(ctx.sunday)} (nouvelle colonne snoozed_until = ${ctx.sunday})` }];
    case 'R':
      return [
        { table: 'tasks', text: `recaser ${what} : event_id = ${decision.slot.id}, due_date = ${decision.slot.day}` },
        { table: 'calendar_events', text: `poser ${what} dans le bloc "${decision.slot.title}" du ${frDay(decision.slot.day)}` },
      ];
    default:
      return [];
  }
}

export function notifWrites(info, decision) {
  if (decision?.g !== 'I') return [];
  return [{ table: 'notifications', text: `status = 'dismissed' sur ${info.forgotCount} lignes "Oublié hier ?" (${info.groups.length} tâches distinctes)` }];
}

// Totaux en nombre de tâches (une série de 3 compte pour 3).
export function totals(cards, decisions) {
  const t = { F: 0, R: 0, A: 0, P: 0, G: 0, left: 0 };
  for (const c of cards) {
    const d = decisions[c.id];
    if (d) t[d.g] += c.tasks.length;
    else t.left += c.tasks.length;
  }
  return t;
}

export function summaryText(t) {
  const parts = [`${t.F} faites`, `${t.A} abandonnées`, `${t.R} recasées`, `${t.P} repoussées à dimanche`, `${t.G} gardées`];
  if (t.left) parts.push(`${t.left} pas encore triées`);
  return parts.join(', ');
}
