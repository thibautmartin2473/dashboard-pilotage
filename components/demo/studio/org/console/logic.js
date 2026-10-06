// Logique pure de La Console (aucun accès base, aucun effet de bord, rien de serveur).
// Boîte de réception à zéro : tout ce qui demande une décision, une ligne par élément.
import { STALE_DAYS, buildWeek, categoryOf, eventIdsOnDay, splitTasks, timeParis } from '@/lib/home';
import { interpret } from '@/lib/command';
import { addDays, dayOf, isCourse } from '@/components/demo/TodayLogic';
import {
  buildCards, cleanBlockTitle, enrichTask, frDateTime, frDay, groupNotifications, nextOrangeSlots, nextSunday, seriesKey,
} from '@/components/demo/TriageLogic';

export const GESTURES = [
  { g: 'F', label: 'fait', tone: 'success' },
  { g: 'R', label: 'recaser', tone: 'accent' },
  { g: 'A', label: 'abandonner', tone: 'danger' },
  { g: 'P', label: 'plus tard', tone: 'muted' },
];

const PLURAL = { F: 'faites', R: 'recasées', A: 'abandonnées', P: 'repoussées' };

export const frDays = (n) => `${n} j`;

const short = (s, n = 70) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}...` : s);

// ---- La boîte de réception ----

// Items : { id, kind, tag, tone, title, table, count, rappels, meta[], detail[] }.
// kind : bloc (bloc d'hier non soldé), retard (tâche ou série en retard), rappel / notif
// (notifications), idee (idée de plus de 7 jours).
export function buildInbox(data) {
  const { today, tasks, events, ideas, notifications, projects, categories } = data;
  const nowMs = Date.parse(data.nowIso);
  const yesterday = addDays(today, -1);
  const eventsById = Object.fromEntries(events.map((e) => [e.id, e]));
  const projectNames = Object.fromEntries(projects.map((p) => [p.slug, p.name]));
  const enriched = tasks.map((t) =>
    enrichTask({ ...t, created_at: t.created_at ?? data.nowIso }, { today, nowMs, projectNames, eventsById })
  );

  const eventOf = new Map(tasks.map((t) => [t.id, t.event_id]));
  // 1. Blocs d'hier (catégorie de travail) qui contiennent encore des tâches ouvertes.
  const items = [];
  const taken = new Set();
  const blocks = events
    .filter((e) => !e.all_day && dayOf(e.starts_at) === yesterday && categoryOf(categories, e.color_id).kind === 'tache')
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
  for (const e of blocks) {
    const list = enriched.filter((t) => eventOf.get(t.id) === e.id);
    if (!list.length) continue;
    list.forEach((t) => taken.add(t.id));
    items.push({
      id: `b:${e.id}`,
      kind: 'bloc',
      tag: 'BLOC',
      tone: 'warning',
      table: 'tasks',
      title: cleanBlockTitle(e.title),
      count: list.length,
      rappels: 0,
      keys: list.map((t) => seriesKey(t.title)),
      meta: [`hier ${timeParis(e.starts_at)}`, `${list.length} tâche${list.length > 1 ? 's' : ''} non soldée${list.length > 1 ? 's' : ''}`],
      detail: list.map((t) => t.title),
    });
  }

  // 2. Tâches en retard (hors blocs déjà listés), séries regroupées.
  const late = enriched.filter((t) => !taken.has(t.id) && t.late > 0);
  for (const c of buildCards(late)) {
    const meta = [`retard ${frDays(c.late)}`];
    if (c.isSeries) meta.push(`série de ${c.tasks.length}`);
    if (c.project) meta.push(c.project);
    items.push({
      id: `r:${c.id}`,
      kind: 'retard',
      tag: 'RETARD',
      tone: 'danger',
      table: 'tasks',
      title: c.title,
      count: c.tasks.length,
      rappels: 0,
      keys: c.isSeries ? [c.id.slice(2)] : [seriesKey(c.title)],
      meta,
      detail: [
        ...(c.isSeries ? c.tasks.map((t) => `${t.title}${t.late ? ` (retard ${frDays(t.late)})` : ''}`) : []),
        c.origin ? `posée dans : ${c.origin}` : null,
        `créée il y a ${frDays(c.age)}${c.due ? `, échéance ${frDay(c.due)}` : ''}`,
      ].filter(Boolean),
    });
  }

  // 3. Notifications : « Oublié hier ? » regroupées par tâche. Si la tâche est déjà dans la
  // boîte, le nombre de rappels s'ajoute à sa ligne ; sinon le groupe devient sa propre ligne.
  const info = groupNotifications(notifications);
  const orphans = [];
  for (const g of info.groups) {
    const host = items.find((it) => it.keys?.includes(g.key));
    if (host) host.rappels += g.count;
    else orphans.push(g);
  }
  for (const it of items) if (it.rappels) it.meta.push(`rappelée ${it.rappels} fois`);
  // Une tâche rappelée plusieurs fois mérite sa ligne ; les rappels isolés (une seule fois) se
  // regroupent en un lot, sinon la boîte se remplit de lignes sans enjeu.
  const repeated = orphans.filter((g) => g.count >= 2);
  const single = orphans.filter((g) => g.count < 2);
  for (const g of repeated) {
    items.push({
      id: `n:${g.key}`,
      kind: 'rappel',
      tag: 'RAPPEL',
      tone: 'accent',
      table: 'notifications',
      title: g.title,
      count: 1,
      rappels: g.count,
      meta: [`rappelée ${g.count} fois`, 'oublié hier ?'],
      detail: ['Toutes les notifications de cette tâche tiennent sur cette seule ligne.'],
    });
  }
  if (single.length) {
    items.push({
      id: 'n:lot',
      kind: 'rappel',
      lot: true,
      tag: 'LOT',
      tone: 'accent',
      table: 'notifications',
      title: `${single.length} rappels isolés « Oublié hier ? »`,
      count: single.length,
      rappels: single.length,
      meta: ['une seule fois chacun'],
      detail: single.map((g) => g.title),
    });
  }
  for (const n of info.others) {
    items.push({
      id: `o:${n.id}`,
      kind: 'notif',
      tag: 'NOTIF',
      tone: 'accent',
      table: 'notifications',
      title: n.title,
      count: 1,
      rappels: 0,
      meta: [n.kind ?? 'info', n.due_date ? `échéance ${frDay(n.due_date)}` : null].filter(Boolean),
      detail: [n.detail].filter(Boolean),
    });
  }

  // 4. Idées de plus de 7 jours, les plus anciennes d'abord.
  const stale = ideas
    .map((i) => ({ ...i, age: Math.max(0, Math.floor((nowMs - Date.parse(i.created_at)) / 86400000)) }))
    .filter((i) => i.age >= STALE_DAYS)
    .sort((a, b) => b.age - a.age);
  for (const i of stale) {
    items.push({
      id: `i:${i.id}`,
      kind: 'idee',
      tag: 'IDÉE',
      tone: 'muted',
      table: 'brain_notes',
      title: short(i.content ?? '(idée vide)', 140),
      count: 1,
      rappels: 0,
      meta: [`depuis ${frDays(i.age)}`, i.project_slug].filter(Boolean),
      detail: [i.content ?? ''],
    });
  }
  return items;
}

// ---- Ce que chaque geste écrirait (une ligne par écriture, simulée) ----
// ctx = { slot, sunday } ; slot = prochain bloc orange à venir (nextOrangeSlots) ou undefined.
export function writesFor(item, g, ctx) {
  const t = `"${short(item.title, 60)}"`;
  const what = item.count > 1 ? `${item.count} tâches ${t}` : t;
  const where = ctx.slot ? `dans le bloc "${short(ctx.slot.title, 40)}" du ${frDay(ctx.slot.day)}` : '(aucun bloc orange à venir)';
  const sunday = `à dimanche ${frDay(ctx.sunday)}`;
  const out = [];
  if (item.table === 'tasks') {
    out.push(
      { F: `tasks : marquer fait ${what}`, R: `tasks : recaser ${what} ${where}`, A: `tasks : abandonner ${what}`, P: `tasks : repousser ${what} ${sunday}` }[g]
    );
    if (item.rappels && (g === 'F' || g === 'A')) out.push(`notifications : ignorer ${item.rappels} rappels ${t}`);
  } else if (item.lot) {
    const n = item.count;
    out.push(
      {
        F: `notifications : ignorer ${n} rappels isolés (c'était fait)`,
        R: `tasks : recaser les ${n} tâches rappelées ${where}`,
        A: `notifications : ignorer ${n} rappels isolés`,
        P: `notifications : reporter ${n} rappels isolés ${sunday}`,
      }[g]
    );
  } else if (item.table === 'notifications') {
    out.push(
      {
        F: `notifications : ignorer ${t} (c'était fait)`,
        R: `tasks : créer ${t} ${where}`,
        A: `notifications : ignorer ${t}`,
        P: `notifications : reporter ${t} ${sunday}`,
      }[g]
    );
    if (g === 'R') out.push(`notifications : accepter ${t}`);
  } else {
    out.push(
      {
        F: `brain_notes : classer ${t} (status = triaged)`,
        R: `tasks : créer depuis l'idée ${t} ${where}`,
        A: `brain_notes : abandonner ${t}`,
        P: `brain_notes : repousser ${t} ${sunday}`,
      }[g]
    );
  }
  return out;
}

export function slotFor(data, recased) {
  const slots = nextOrangeSlots(data.events, Date.parse(data.nowIso), 3);
  return slots.length ? slots[recased % slots.length] : undefined;
}

export const slotLabel = (slot) => (slot ? `${short(slot.title, 36)}, ${frDateTime(slot.startsAt)}` : null);
export const sundayOf = (data) => nextSunday(data.today);

export function summarize(decisions) {
  const n = { F: 0, R: 0, A: 0, P: 0 };
  for (const d of Object.values(decisions)) n[d.g] += d.count;
  return Object.entries(n).filter(([, v]) => v > 0).map(([g, v]) => `${v} ${PLURAL[g]}`);
}

// ---- Le champ de commande ----

const NAV = [
  [/^(?:bilan|revue|bilan de la semaine)$/, 'revue', 'Bilan'],
  [/^(?:echeances?|deadlines?)$/, 'echeances', 'Échéances'],
  [/^(?:menage|grand menage|tri|trier|taches?)$/, 'taches', 'Ménage'],
  [/^(?:mails?|courriers?|messages?)$/, 'mails', 'Mails'],
  [/^(?:agenda|calendrier|semaine)$/, 'agenda', 'Agenda'],
  [/^(?:idees?|brain)$/, 'idees', 'Idées'],
  [/^(?:apps?|projets?|applis?)$/, 'apps', 'Apps et projets'],
  [/^(?:accueil|console|home)$/, 'accueil', 'Accueil'],
];
const DAY_WORDS = /^(?:ma journee|journee|aujourd'?hui|jour)$/;

const fold = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();

// Texte tapé -> { type: 'nav' | 'day' | 'preview' | 'error' | 'empty' }.
export function runCommand(text, data) {
  const raw = String(text ?? '').trim();
  if (!raw) return { type: 'empty' };
  const key = fold(raw)
    .replace(/^(?:ouvre|ouvrir|va|aller|montre|affiche|passe)\s+(?:(?:a|au)\s+)?/, '')
    .replace(/^(?:(?:le|la|les|mon|mes|ma)\s+|l')/, '');
  for (const [re, section, label] of NAV) if (re.test(key)) return { type: 'nav', section, label };
  if (DAY_WORDS.test(fold(raw)) || DAY_WORDS.test(key)) return { type: 'day' };
  const res = interpret(raw, new Date(data.nowIso), { events: data.events, tasks: data.tasks });
  if (!res.ok) return { type: 'error', message: res.message, examples: res.examples };
  return { type: 'preview', actions: res.actions };
}

// Écritures simulées d'une action confirmée.
export function actionLog(a) {
  if (a.kind === 'task') return `tasks : créer "${short(a.title, 60)}" ${a.due_date ? `pour le ${frDay(a.due_date)}` : 'sans échéance'}`;
  if (a.kind === 'idea') return `brain_notes : ajouter l'idée "${short(a.content, 60)}"`;
  return `calendar_events : créer "${short(a.title, 60)}" le ${frDay(a.start.slice(0, 10))} de ${a.start.slice(11).replace(':', 'h')} à ${a.end.slice(11).replace(':', 'h')}`;
}

// ---- La journée en colonne compacte ----

const minutesOf = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
export const hm = (min) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}h${String(min % 60).padStart(2, '0')}`;

// -> { label, nowMin, allDay: [{id,title}], entries: [{id,title,startMin,endMin,kind,conflict,tasks[]}], free: [task] }
export function buildDay(data, added = []) {
  const now = new Date(data.nowIso);
  const week = buildWeek(data.events, now, data.categories, 0, 1);
  const day = week.days[0];
  const open = data.tasks.filter((t) => !t.done_at);
  const byEvent = new Map();
  for (const t of open) {
    if (!t.event_id) continue;
    if (!byEvent.has(t.event_id)) byEvent.set(t.event_id, []);
    byEvent.get(t.event_id).push({ id: t.id, title: t.title });
  }
  const entries = day.blocks.map((b) => ({
    id: b.id,
    title: cleanBlockTitle(b.title),
    startMin: b.startMin,
    endMin: b.endMin,
    kind: isCourse(b) ? 'cours' : b.category.kind === 'tache' ? 'tache' : 'autre',
    conflict: b.conflict,
    tasks: byEvent.get(b.id) ?? [],
  }));
  for (const a of added) entries.push({ ...a, tasks: [], conflict: false });
  entries.sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
  const ids = eventIdsOnDay(data.events, data.today);
  const free = splitTasks(open, data.today, ids).today.filter((t) => !t.event_id || !ids.has(t.event_id));
  const [h, m] = timeParis(data.nowIso).split('h').map(Number);
  return {
    label: day.label,
    nowMin: h * 60 + m,
    allDay: day.allDay.map((e) => ({ id: e.id, title: e.title })),
    entries,
    free: free.map((t) => ({ id: t.id, title: t.title })),
  };
}

// Action 'event' confirmée dont le jour est aujourd'hui -> entrée locale de la colonne.
export function localEntry(a, today, n) {
  if (a.kind !== 'event' || a.start.slice(0, 10) !== today) return null;
  const endMin = a.end.slice(0, 10) === today ? minutesOf(a.end.slice(11)) : 1440;
  return { id: `local:${n}`, title: a.title, startMin: minutesOf(a.start.slice(11)), endMin, kind: 'autre', local: true };
}
