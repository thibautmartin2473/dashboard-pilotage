// Logique pure de la démo « Fonctionnalités » : aucun accès base, aucun effet de bord.
// Les jours sont des chaînes AAAA-MM-JJ (Paris), les heures des minutes depuis minuit.
import { categoryOf, timeParis } from '@/lib/home';
import { cleanBlockTitle, dayParis, frDateTime, frDay } from '@/components/demo/TriageLogic';
import { addDays } from '@/components/demo/TodayLogic';
import { deadlineKind, recurrenceName } from '@/components/demo/DeadlinesLogic';

export { addDays, cleanBlockTitle, dayParis, frDateTime, frDay };

// Sa vraie journée de travail (DIAGNOSTIC.md) : 9h-12h puis 14h-19h = 8 h.
export const WINDOWS = [
  [540, 720],
  [840, 1140],
];
export const WORK_MIN = WINDOWS.reduce((s, [a, b]) => s + (b - a), 0);
export const STEP = 15;
export const HORIZON = 5;
export const AGENDA_FROM = 480; // grille d'affichage 8h-20h
export const AGENDA_TO = 1200;

const plain = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const dayDiff = (a, b) => Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86400000);

export const minOf = (iso) => {
  const [h, m] = timeParis(iso).split('h');
  return Number(h) * 60 + Number(m);
};
export const hm = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}h${String(min % 60).padStart(2, '0')}`;

export function fmtMin(m) {
  const v = Math.max(0, Math.round(m));
  const h = Math.floor(v / 60);
  const r = v % 60;
  if (!h) return `${r} min`;
  return r ? `${h} h ${String(r).padStart(2, '0')}` : `${h} h`;
}

export const dayShort = (day) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', timeZone: 'UTC' }).replace('.', '');
export const dayLong = (day, today) => {
  if (day === today) return "aujourd'hui";
  if (day === addDays(today, 1)) return 'demain';
  return new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
};
export const weekdayOf = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'long', timeZone: 'UTC' });

// ---- Durée estimée : la vraie table n'a pas de colonne durée, la démo la devine du titre ----
const RULES = [
  [/\b(appel|appeler|rappeler|relancer|remercier|ecrire|message|contacter)\b/, 15],
  [/\b(payer|virement|loyer|confirmer|envoyer|inscrire)\b/, 15],
  [/\b(lettre|cover)\b/, 90],
  [/\b(revis|reviser|revision|exam|partiel|final)\b|acc 812/, 120],
  [/\b(cv)\b/, 60],
  [/\b(cas|case|drill|drills|mece|arborescences?|fit|histoires?|pitch|presentation)\b/, 60],
  [/\b(trouver|noms|networking|bainies|name drop)\b/, 45],
  [/\b(lire|lecture|article|guide|checklist|brancher|installer)\b/, 30],
];
export function estimateMin(title) {
  const t = plain(title);
  for (const [re, m] of RULES) if (re.test(t)) return m;
  return 30;
}

const ageDays = (iso, nowMs) => Math.max(0, Math.floor((nowMs - Date.parse(iso)) / 86400000));

// ---- 1. Fin de vie ----
// Éléments soumis à la règle : idées, tâches sans date, et (option) retards dont la date vient d'un
// bloc posé par Claude. Exemptées : vraies échéances (candidature, test, examen, dépôt), paiements
// récurrents, tâches datées à venir. L'âge d'un retard = jours depuis l'échéance.
export function lifeItems({ tasks, ideas, nowMs, today, includeLate }) {
  const items = [];
  const exempt = { real: 0, future: 0, recurring: 0, lateKept: 0 };
  for (const t of tasks) {
    const late = t.due_date && t.due_date < today ? dayDiff(today, t.due_date) : 0;
    if (recurrenceName(t.title)) {
      exempt.recurring += 1;
      continue;
    }
    if (deadlineKind(t.title)) {
      exempt.real += 1;
      continue;
    }
    if (t.due_date && !late) {
      exempt.future += 1;
      continue;
    }
    if (late && !includeLate) {
      exempt.lateKept += 1;
      continue;
    }
    items.push({
      id: `t:${t.id}`,
      kind: 'tâche',
      title: t.title,
      age: late || ageDays(t.created_at, nowMs),
      basis: late ? `échéance dépassée de ${late} j` : 'sans date',
    });
  }
  for (const n of ideas) {
    items.push({
      id: `i:${n.id}`,
      kind: 'idée',
      title: String(n.content ?? '').replace(/\s+/g, ' ').trim().slice(0, 140) || '(idée vide)',
      age: ageDays(n.created_at, nowMs),
      basis: 'idée jamais triée',
    });
  }
  return { items: items.sort((a, b) => b.age - a.age), exempt };
}

export function zoneOf(item, { reserveAt, expireAt, touched, forced }) {
  if (touched[item.id]) return 'active';
  if (forced[item.id]) return forced[item.id];
  return item.age >= expireAt ? 'expired' : item.age >= reserveAt ? 'reserve' : 'active';
}

// ---- 2. Budget de durée ----
export const evMinutes = (e) => {
  const end = e.ends_at ? Date.parse(e.ends_at) : Date.parse(e.starts_at) + 30 * 60000;
  return Math.max(STEP, Math.round((end - Date.parse(e.starts_at)) / 60000));
};
const evEndMs = (e) => (e.ends_at ? Date.parse(e.ends_at) : Date.parse(e.starts_at) + 30 * 60000);

export function makeCtx({ tasks, events, nowMs, today }) {
  const eventsById = Object.fromEntries(events.map((e) => [e.id, e]));
  const perEvent = new Map();
  for (const t of tasks) if (t.event_id) perEvent.set(t.event_id, (perEvent.get(t.event_id) ?? 0) + 1);
  return { eventsById, perEvent, nowMs, today };
}

// Budget d'une tâche : B estimé, L consigné (fait), F posé dans un bloc à venir (part de la tâche
// dans le bloc), P part d'un bloc passé non consignée, R reste à faire, U reste sans bloc.
export function taskBudget(t, ctx, { est = {}, logged = {} } = {}) {
  const B = est[t.id] ?? estimateMin(t.title);
  const L = Math.min(B, logged[t.id] ?? 0);
  const R = Math.max(0, B - L);
  const ev = t.event_id ? ctx.eventsById[t.event_id] : null;
  let F = 0;
  let P = 0;
  if (ev && !ev.all_day) {
    const share = Math.max(STEP, Math.round(evMinutes(ev) / Math.max(1, ctx.perEvent.get(ev.id) ?? 1) / STEP) * STEP);
    if (evEndMs(ev) > ctx.nowMs) F = Math.min(share, R);
    else P = share;
  }
  const U = Math.max(0, R - F);
  const late = t.due_date && t.due_date < ctx.today ? dayDiff(ctx.today, t.due_date) : 0;
  return { B, L, R, F, P, U, late, ev };
}

// Grammaire d'états (Motion) : verrouillée, dort, en retard, sans bloc, à l'heure, faite.
export function taskState(b, { locked, asleep, done }) {
  if (done) return { key: 'done', label: 'Faite' };
  if (asleep) return { key: 'asleep', label: "Dort jusqu'à demain" };
  if (b.R === 0) return { key: 'done', label: 'Budget consommé' };
  if (locked) return { key: 'locked', label: 'Verrouillée' };
  if (b.late > 0) return { key: 'late', label: `En retard de ${b.late} j` };
  if (b.F === 0) return { key: 'nobloc', label: 'Sans bloc' };
  return { key: 'ontime', label: 'Posée' };
}

// ---- Agenda d'un jour ----
export function dayIntervals(events, day, categories) {
  const out = [];
  for (const e of events) {
    if (e.all_day) continue;
    const start = Date.parse(e.starts_at);
    const end = evEndMs(e);
    if (end <= start) continue;
    const first = dayParis(e.starts_at);
    const last = dayParis(new Date(end - 1).toISOString());
    if (day < first || day > last) continue;
    const s = first === day ? minOf(e.starts_at) : 0;
    const eMin = dayParis(new Date(end).toISOString()) === day ? minOf(new Date(end).toISOString()) : 1440;
    out.push({ ev: e, kind: categoryOf(categories, e.color_id).kind, s, e: Math.max(eMin, s + STEP) });
  }
  return out.sort((a, b) => a.s - b.s || a.e - b.e);
}

// Côte à côte les intervalles qui se chevauchent : ajoute col et cols.
export function packColumns(list) {
  const items = list.map((x) => ({ ...x })).sort((a, b) => a.s - b.s || b.e - a.e);
  let group = [];
  let groupEnd = -1;
  let colEnds = [];
  const flush = () => {
    for (const g of group) g.cols = colEnds.length;
    group = [];
    colEnds = [];
  };
  for (const it of items) {
    if (group.length && it.s >= groupEnd) flush();
    let col = colEnds.findIndex((end) => end <= it.s);
    if (col < 0) col = colEnds.length;
    colEnds[col] = it.e;
    it.col = col;
    group.push(it);
    groupEnd = group.length === 1 ? it.e : Math.max(groupEnd, it.e);
  }
  flush();
  return items;
}

export function merge(list) {
  const sorted = list.map((x) => ({ s: x.s, e: x.e })).sort((a, b) => a.s - b.s);
  const out = [];
  for (const i of sorted) {
    const last = out[out.length - 1];
    if (last && i.s <= last.e) last.e = Math.max(last.e, i.e);
    else out.push({ ...i });
  }
  return out;
}

// Minutes de la fenêtre de travail couvertes par `merged`, à partir de `from`.
export function busyInWindow(merged, from = 0) {
  let t = 0;
  for (const [ws, we] of WINDOWS) {
    const a = Math.max(ws, from);
    if (a >= we) continue;
    for (const m of merged) t += Math.max(0, Math.min(we, m.e) - Math.max(a, m.s));
  }
  return t;
}
export function freeInWindow(merged, from = 0) {
  let span = 0;
  for (const [ws, we] of WINDOWS) span += Math.max(0, we - Math.max(ws, from));
  return span - busyInWindow(merged, from);
}

export function findSlot(merged, dur, from = 0) {
  for (const [ws, we] of WINDOWS) {
    let c = Math.max(ws, Math.ceil(from / STEP) * STEP);
    while (c + dur <= we) {
      const hit = merged.find((o) => o.s < c + dur && c < o.e);
      if (!hit) return c;
      c = Math.ceil(hit.e / STEP) * STEP;
    }
  }
  return null;
}

export const horizonDays = (today) => Array.from({ length: HORIZON }, (_, i) => addDays(today, i));

// Capacité libre sur l'horizon (aujourd'hui compté à partir de maintenant).
export function weekFree({ events, categories, today, nowMs }) {
  const nowMin = minOf(new Date(nowMs).toISOString());
  return horizonDays(today).reduce(
    (s, d) => s + freeInWindow(merge(dayIntervals(events, d, categories)), d === today ? nowMin : 0),
    0
  );
}

// ---- 3. Journée plafonnée ----
// Une ligne par tâche ouverte (minutes = sa part du bloc du jour, sinon son reste à faire) et par
// bloc orange sans tâche liée (minutes = durée du bloc). `moved` surcharge le jour d'une ligne.
export function buildRows({ tasks, events, categories, today, nowMs, est, logged, done, asleep }) {
  const ctx = makeCtx({ tasks, events, nowMs, today });
  const days = horizonDays(today);
  const rows = [];
  const linked = new Set();
  for (const t of tasks) {
    if (done[t.id] || asleep[t.id]) continue;
    const b = taskBudget(t, ctx, { est, logged });
    if (b.R === 0) continue;
    const evDay = b.ev && !b.ev.all_day ? dayParis(b.ev.starts_at) : null;
    const baseDay = evDay && days.includes(evDay) ? evDay : null;
    if (baseDay) linked.add(b.ev.id);
    rows.push({
      id: t.id,
      kind: 'tâche',
      title: t.title,
      min: baseDay ? Math.max(STEP, Math.round(evMinutes(b.ev) / Math.max(1, ctx.perEvent.get(b.ev.id) ?? 1) / STEP) * STEP) : b.R,
      baseDay,
      due: t.due_date ?? null,
      late: b.late,
      block: baseDay ? `${cleanBlockTitle(b.ev.title)}, ${hm(minOf(b.ev.starts_at))}` : null,
    });
  }
  for (const d of days) {
    for (const i of dayIntervals(events, d, categories)) {
      if (i.kind !== 'tache' || linked.has(i.ev.id)) continue;
      if (rows.some((r) => r.id === `b:${i.ev.id}:${d}`)) continue;
      rows.push({
        id: `b:${i.ev.id}:${d}`,
        kind: 'bloc',
        title: cleanBlockTitle(i.ev.title),
        min: i.e - i.s,
        baseDay: d,
        due: null,
        late: 0,
        block: `${hm(i.s)} à ${hm(i.e)}`,
      });
    }
  }
  return rows;
}

// Plages = cours et événements. Un bloc de tâche posé sur une plage (« pendant le cours ») rend ce
// temps travaillable : il est retiré des plages, donc de l'indisponible.
export function dayCapacity({ events, categories, day }) {
  const iv = dayIntervals(events, day, categories);
  const plages = merge(iv.filter((i) => i.kind !== 'tache'));
  const taches = merge(iv.filter((i) => i.kind === 'tache'));
  const p = busyInWindow(plages);
  const overlap = p + busyInWindow(taches) - busyInWindow(merge([...plages, ...taches]));
  const plage = Math.max(0, p - overlap);
  return { plage, avail: Math.max(0, WORK_MIN - plage) };
}

export function loadState(load, avail, pct) {
  const target = Math.round((avail * pct) / 100 / STEP) * STEP;
  if (load > target) return { key: 'over', target, label: 'Au-dessus de la cible' };
  if (load > target * 0.85) return { key: 'near', target, label: 'Proche de la cible' };
  return { key: 'ok', target, label: 'Sous la cible' };
}

// ---- 4. Aperçu avant écriture ----
// Un bloc indépendant par tâche, dans le premier créneau libre (hors plages et autres blocs), jamais
// « X + Y » dans un même bloc. `freeDays` : jours où Claude ne pose rien.
export function planProposals({ tasks, events, categories, today, nowMs, est, logged, locked, asleep, done, freeDays, extraBusy = [], exclude = {}, max = 8 }) {
  const ctx = makeCtx({ tasks, events, nowMs, today });
  const days = horizonDays(today);
  const nowMin = minOf(new Date(nowMs).toISOString());
  const occ = Object.fromEntries(days.map((d) => [d, dayIntervals(events, d, categories).map((i) => ({ s: i.s, e: i.e }))]));

  for (const x of extraBusy) if (occ[x.day]) occ[x.day].push({ s: x.s, e: x.e });

  const cands = tasks
    .filter((t) => !done[t.id] && !asleep[t.id] && !locked[t.id] && !exclude[t.id])
    .map((t) => ({ t, b: taskBudget(t, ctx, { est, logged }) }))
    .filter(({ t, b }) => {
      if (b.R === 0 || b.F > 0) return false;
      const soon = t.due_date && t.due_date >= today && dayDiff(t.due_date, today) <= 7;
      return b.late > 0 || b.P > 0 || soon;
    })
    .sort((x, y) => (x.t.due_date ?? '9999').localeCompare(y.t.due_date ?? '9999') || x.t.title.localeCompare(y.t.title))
    .slice(0, max);

  return cands.map(({ t, b }) => {
    const chunk = Math.max(STEP, Math.min(b.R, 60));
    const openDays = days.filter((d) => !freeDays[d]);
    const before = t.due_date && t.due_date >= today ? openDays.filter((d) => d <= t.due_date) : [];
    let slot = null;
    for (const d of [...before, ...openDays.filter((x) => !before.includes(x))]) {
      const s = findSlot(merge(occ[d]), chunk, d === today ? nowMin + STEP : 0);
      if (s !== null) {
        slot = { day: d, s, e: s + chunk };
        occ[d].push({ s, e: s + chunk });
        break;
      }
    }
    const dueIn = t.due_date && t.due_date >= today ? dayDiff(t.due_date, today) : null;
    const why = [
      b.late > 0
        ? `En retard de ${b.late} j (échéance ${frDay(t.due_date)}).`
        : b.P > 0
          ? `Son bloc du ${frDateTime(b.ev.starts_at)} est passé sans qu'elle soit cochée.`
          : `Échéance dans ${dueIn} j et aucun bloc posé.`,
      `${fmtMin(chunk)} sur ${fmtMin(b.R)} à faire${b.R > chunk ? ', le reste sera reproposé' : ''}.`,
      slot ? 'Premier créneau libre, hors plages et hors autres blocs.' : 'Aucun créneau libre sur 5 jours.',
    ];
    const source = b.ev
      ? `Bloc « ${cleanBlockTitle(b.ev.title)} » du ${frDateTime(b.ev.starts_at)}`
      : `Tâche ajoutée par ${t.source === 'claude' ? 'Claude' : t.source ?? 'toi'} le ${frDay(dayParis(t.created_at))}`;
    return { id: `p:${t.id}`, taskId: t.id, title: t.title, chunk, remaining: b.R, slot, late: b.late, why, source };
  });
}
