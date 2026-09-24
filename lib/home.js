// Logique pure de la page d'accueil (sans accès base) : testée par
// scripts/check-home.mjs. Les dates « jour » sont des chaînes AAAA-MM-JJ.

export const BUCKETS = ['inbox', 'today', 'next_session'];
export const BUCKET_LABELS = { inbox: 'Sans échéance', today: "Aujourd'hui", next_session: 'Prochaine session' };
export const STALE_DAYS = 7;

// Le serveur Vercel est en UTC : « aujourd'hui » se calcule à l'heure de Paris.
export function todayParis(now = new Date()) {
  return now.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
}

// Table absente : PostgREST (PGRST205) ou Postgres direct (42P01).
export function isMissingTable(error) {
  return error?.code === 'PGRST205' || error?.code === '42P01';
}

// Colonne absente (SQL pas encore exécuté) : PostgREST (PGRST204) ou Postgres (42703).
export function isMissingColumn(error) {
  return error?.code === 'PGRST204' || error?.code === '42703';
}

export function isOverdue(task, today) {
  return !task.done_at && Boolean(task.due_date) && task.due_date < today;
}

// Sections du panneau « Tâches » : en retard (échéance passée, quel que soit le
// bucket), aujourd'hui (bucket today ou échéance du jour), prochaine session,
// puis le reste (bucket inbox : sans échéance ou à échéance future).
export const SECTIONS = ['overdue', 'today', 'next_session', 'inbox'];
export const SECTION_LABELS = {
  overdue: 'En retard',
  today: "Aujourd'hui",
  next_session: 'Prochaine session',
  inbox: 'Sans échéance / à venir',
};

// `todayEventIds` : identifiants d'événements (plages) qui touchent aujourd'hui (eventIdsOnDay) —
// une tâche placée dans l'une d'elles (tasks.event_id) compte dans « Aujourd'hui » même sans
// échéance ni bucket 'today'.
export function splitTasks(tasks, today, todayEventIds = new Set()) {
  const sections = { overdue: [], today: [], next_session: [], inbox: [] };
  for (const t of tasks) {
    if (t.done_at) continue;
    const section = isOverdue(t, today)
      ? 'overdue'
      : t.bucket === 'today' || t.due_date === today || (t.event_id && todayEventIds.has(t.event_id))
        ? 'today'
        : t.bucket;
    sections[section]?.push(t);
  }
  // Priorité : position croissante (colonne absente = 0), puis date de création.
  const byPriority = (x, y) =>
    (x.position ?? 0) - (y.position ?? 0) || String(x.created_at ?? '').localeCompare(String(y.created_at ?? ''));
  for (const list of Object.values(sections)) list.sort(byPriority);
  return sections;
}

// Mises à jour { id, position } pour monter (dir 'up') ou descendre ('down') la tâche `id`
// dans `list` (une section, déjà triée). Positions distinctes : on échange les deux voisines.
// Positions égales quelque part (tâches créées avant la colonne) : on renumérote la section.
export function reorderUpdates(list, id, dir) {
  const i = list.findIndex((t) => t.id === id);
  const j = i + (dir === 'up' ? -1 : 1);
  if (i < 0 || j < 0 || j >= list.length) return [];
  const pos = (t) => t.position ?? 0;
  if (new Set(list.map(pos)).size === list.length) {
    return [{ id: list[i].id, position: pos(list[j]) }, { id: list[j].id, position: pos(list[i]) }];
  }
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next.map((t, k) => ({ id: t.id, position: k })).filter((u) => pos(list.find((t) => t.id === u.id)) !== u.position);
}

// projects : [{ name, lastActivity }] (lastActivity = date ISO ou null).
// tasks : null quand la table est indisponible (les compteurs restent null).
export function summarize({ tasks, projects, today, now = Date.now() }) {
  const panels = tasks && splitTasks(tasks, today);
  const active = projects.filter((p) => p.lastActivity);
  const latest = active.reduce((a, p) => (!a || p.lastActivity > a.lastActivity ? p : a), null);
  const limit = now - STALE_DAYS * 86400000;
  return {
    todayCount: panels ? panels.today.length : null,
    overdueCount: tasks ? tasks.filter((t) => isOverdue(t, today)).length : null,
    latestProject: latest?.name ?? null,
    staleProjects: projects.filter((p) => !p.lastActivity || new Date(p.lastActivity).getTime() < limit).map((p) => p.name),
  };
}

// ---- Agenda et notifications : événements de `calendar_events`, mails de `mail_items` ----

const ms = (x) => new Date(x).getTime();
const dayParis = (x) => todayParis(new Date(x));
const addDays = (day, n) => new Date(ms(`${day}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const endMs = (e) => (e.ends_at ? ms(e.ends_at) : ms(e.starts_at));

export const WEEK_DAYS = 8; // J à J+7 inclus
const HOUR_MIN = 7; // plage horaire affichée par défaut (élargie si un événement déborde)
const HOUR_MAX = 22;
const MIN_BLOCK = 30; // durée d'affichage minimale (événement sans fin ou très court)

// « 14h30 », heure de Paris.
export function timeParis(iso) {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get('hour')}h${get('minute')}`;
}

const minutesParis = (iso) => {
  const [h, m] = timeParis(iso).split('h');
  return Number(h) * 60 + Number(m);
};

// Code couleur Google (colorId, poussé par scripts/push-agenda.mjs) : 11 Tomate = cours EDHEC
// (Aurion), 9 Myrtille = autres événements, 6 Mandarine = tâches / blocs de travail. Colonne pas
// encore créée ou couleur absente : repli sur « other » (bleu, le rendu déjà en place).
export function eventColor(e) {
  if (e.color_id === '11') return 'edhec';
  if (e.color_id === '6') return 'task';
  return 'other';
}

// Deux événements qui se touchent (fin = début) ne se chevauchent pas.
export function overlaps(a, b) {
  return ms(a.starts_at) < endMs(b) && ms(b.starts_at) < endMs(a);
}

// Identifiants des événements (plages ou tâches Google) dont le jour (Paris) couvre `day` : sert à
// classer dans « Aujourd'hui » une tâche de la to-do placée dans une plage du jour (splitTasks).
export function eventIdsOnDay(events, day) {
  const ids = new Set();
  for (const e of events) {
    if (e.all_day) continue;
    const first = dayParis(e.starts_at);
    const last = e.ends_at && endMs(e) > ms(e.starts_at) ? dayParis(endMs(e) - 1) : first;
    if (first <= day && day <= last) ids.add(e.id);
  }
  return ids;
}

export function dayLabel(day, today) {
  if (day === today) return "Aujourd'hui";
  if (day === addDays(today, 1)) return 'Demain';
  return new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
  });
}

const dayShort = (day) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

// Premier et dernier jour (Paris) couverts. « Toute la journée » : fin exclusive.
function span(e) {
  const first = dayParis(e.starts_at);
  let last = first;
  if (e.ends_at && endMs(e) > ms(e.starts_at)) {
    last = e.all_day ? addDays(dayParis(e.ends_at), -1) : dayParis(endMs(e) - 1);
    if (last < first) last = first;
  }
  return { first, last };
}

// Place côte à côte les blocs qui se chevauchent : renseigne `col` et `cols`.
// Un bloc qui commence quand un autre finit ouvre un nouveau groupe.
function packColumns(blocks) {
  let group = [];
  let groupEnd = -1;
  let colEnds = [];
  const flush = () => {
    group.forEach((b) => { b.cols = colEnds.length; });
    group = [];
    colEnds = [];
  };
  for (const b of blocks) {
    if (group.length && b.startMin >= groupEnd) flush();
    let col = colEnds.findIndex((end) => end <= b.startMin);
    if (col < 0) col = colEnds.length;
    colEnds[col] = b.endMin;
    b.col = col;
    group.push(b);
    groupEnd = Math.max(group.length === 1 ? -1 : groupEnd, b.endMin);
  }
  flush();
}

// Semaine glissante d'aujourd'hui (J) à J+7 : un bloc par événement et par jour
// touché (un événement qui traverse minuit figure sur chaque jour, borné à la
// journée), positionné en pourcentage de la plage horaire [hourStart, hourEnd].
// Les « toute la journée » forment un bandeau (`allDay`), jamais en conflit.
// -> { days: [{ day, label, short, isToday, allDay, blocks, nowTop }], hourStart, hourEnd, conflicts, next }
// conflicts = paires qui se chevauchent et ne sont pas terminées ; `conflict` = un bloc chevauche un autre.
// Un conflit n'oppose que deux plages (cours/événements, eventColor != 'task') ou deux tâches Google
// placées dans l'agenda (eventColor === 'task', colorId Mandarine) : une tâche posée sur une plage est
// volontaire (« pendant le cours »), jamais un conflit.
export function buildWeek(events, now = new Date()) {
  const today = todayParis(now);
  const dayList = Array.from({ length: WEEK_DAYS }, (_, n) => addDays(today, n));
  const lastDay = dayList[WEEK_DAYS - 1];
  const inWindow = events
    .map((e) => ({ ...e, ...span(e) }))
    .filter((e) => e.first <= lastDay && e.last >= today);

  const timed = inWindow.filter((e) => !e.all_day);
  const inConflict = new Set();
  let conflicts = 0;
  timed.forEach((a, i) =>
    timed.slice(i + 1).forEach((b) => {
      if (!overlaps(a, b)) return;
      if ((eventColor(a) === 'task') !== (eventColor(b) === 'task')) return; // tâche posée sur une plage : voulu
      inConflict.add(a.id).add(b.id);
      if (endMs(a) > now.getTime() && endMs(b) > now.getTime()) conflicts += 1;
    })
  );

  // Blocs d'abord en minutes, puis converti en % une fois la plage connue.
  const perDay = dayList.map((day) =>
    timed
      .filter((e) => e.first <= day && day <= e.last)
      .map((e) => {
        const startMin = e.first === day ? minutesParis(e.starts_at) : 0;
        const endMin =
          e.last === day && dayParis(endMs(e)) === day ? minutesParis(new Date(endMs(e)).toISOString()) : 1440;
        return { e, startMin, endMin: Math.min(1440, Math.max(endMin, startMin + MIN_BLOCK)) };
      })
  );
  const all = perDay.flat();
  const hourStart = Math.min(HOUR_MIN, all.length ? Math.floor(Math.min(...all.map((b) => b.startMin)) / 60) : HOUR_MIN);
  const hourEnd = Math.max(HOUR_MAX, all.length ? Math.ceil(Math.max(...all.map((b) => b.endMin)) / 60) : HOUR_MAX);
  const range = (hourEnd - hourStart) * 60;
  const pct = (min) => ((min - hourStart * 60) / range) * 100;

  const nowMin = minutesParis(now.toISOString());
  const days = dayList.map((day, n) => {
    const blocks = perDay[n]
      .sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin || a.e.title.localeCompare(b.e.title))
      .map(({ e, startMin, endMin }) => {
        const { first, last, ...event } = e;
        return { ...event, startMin, endMin, top: pct(startMin), height: pct(endMin) - pct(startMin), conflict: inConflict.has(e.id), col: 0, cols: 1 };
      });
    packColumns(blocks);
    return {
      day,
      label: dayLabel(day, today),
      short: dayShort(day),
      isToday: day === today,
      allDay: inWindow
        .filter((e) => e.all_day && e.first <= day && day <= e.last)
        .sort((a, b) => a.title.localeCompare(b.title))
        .map(({ first, last, ...event }) => event),
      blocks,
      nowTop: day === today && nowMin >= hourStart * 60 && nowMin <= hourEnd * 60 ? pct(nowMin) : null,
    };
  });

  const next = timed
    .filter((e) => ms(e.starts_at) > now.getTime() && e.first === today)
    .sort((a, b) => ms(a.starts_at) - ms(b.starts_at))[0];
  return { days, hourStart, hourEnd, conflicts, next: next ? { title: next.title, time: timeParis(next.starts_at) } : null };
}

// Événements du jour (J) d'une semaine construite par buildWeek : bandeau puis blocs.
export const todayEvents = (week) => (week ? [...week.days[0].allDay, ...week.days[0].blocks] : null);

// « Aujourd'hui : 1 événement, 0 tâche ». null = source indisponible (jamais présenté comme 0).
export function todayLine(events, tasks) {
  const n = (count, word, none) => (count === null ? none : `${count} ${word}${count > 1 ? 's' : ''}`);
  return `Aujourd'hui : ${n(events, 'événement', 'agenda indisponible')}, ${n(tasks, 'tâche', 'tâches indisponibles')}`;
}

// Texte de la section « Aujourd'hui » quand elle n'a pas de tâche : jamais « rien » si l'agenda a
// des événements ce jour-là ; null = rien à dire (la section a du contenu).
export function todayEmptyMessage(taskCount, events) {
  if (taskCount > 0 || events?.length > 0) return null;
  return events === null ? 'Aucune tâche (agenda indisponible).' : 'Rien ici.';
}

// « lun. 21 sept. · 17h00–18h00 » pour le détail d'un événement.
export function describeWhen(e) {
  const { first, last } = span(e);
  if (e.all_day) return first === last ? `${dayShort(first)} · toute la journée` : `du ${dayShort(first)} au ${dayShort(last)} · toute la journée`;
  if (!e.ends_at || endMs(e) === ms(e.starts_at)) return `${dayShort(first)} · ${timeParis(e.starts_at)}`;
  if (first === dayParis(e.ends_at)) return `${dayShort(first)} · ${timeParis(e.starts_at)}–${timeParis(e.ends_at)}`;
  return `${dayShort(first)} ${timeParis(e.starts_at)} → ${dayShort(dayParis(e.ends_at))} ${timeParis(e.ends_at)}`;
}

// ---- Saisie d'événements : heure de Paris, jamais l'heure du serveur ----

const wallMs = (t) => {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(t));
  const g = (type) => Number(p.find((x) => x.type === type).value);
  return Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second'));
};

// « 2026-09-21T14:30 » (heure de Paris, valeur d'un champ datetime-local) -> ISO UTC.
export function parisToIso(local) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local ?? '')) return null;
  const asUtc = ms(`${local}:00Z`);
  if (Number.isNaN(asUtc)) return null;
  let t = asUtc - (wallMs(asUtc) - asUtc);
  t = asUtc - (wallMs(t) - t); // 2e passe : l'écart peut changer autour d'un changement d'heure
  return new Date(t).toISOString();
}

export const isoToParisLocal = (iso) => `${dayParis(iso)}T${timeParis(iso).replace('h', ':')}`;

const DAY = /^\d{4}-\d{2}-\d{2}$/;

// Champs du formulaire -> colonnes de calendar_events (ou Error lisible).
// Toute la journée : dates seules, `end` = dernier jour inclus ; stocké en midi UTC,
// fin exclusive (même convention que les événements Google).
export function eventRow({ title, start, end, all_day, location }) {
  title = String(title ?? '').trim();
  if (!title || title.length > 200) throw new Error('Titre requis (200 caractères max)');
  location = String(location ?? '').trim().slice(0, 200) || null;
  if (all_day) {
    const first = String(start ?? '').slice(0, 10);
    const lastDay = String(end ?? '').slice(0, 10) || first;
    if (!DAY.test(first) || !DAY.test(lastDay)) throw new Error('Date invalide');
    if (lastDay < first) throw new Error('La fin est avant le début');
    return { title, all_day: true, location, starts_at: `${first}T12:00:00Z`, ends_at: `${addDays(lastDay, 1)}T12:00:00Z` };
  }
  const starts_at = parisToIso(start);
  const ends_at = end ? parisToIso(end) : null;
  if (!starts_at) throw new Error('Début invalide');
  if (end && !ends_at) throw new Error('Fin invalide');
  if (ends_at && ends_at < starts_at) throw new Error('La fin est avant le début');
  return { title, all_day: false, location, starts_at, ends_at };
}

// Colonnes -> valeurs du formulaire d'édition (inverse d'eventRow).
export function eventForm(e) {
  if (e.all_day) {
    const start = dayParis(e.starts_at);
    return { title: e.title, all_day: true, location: e.location ?? '', start, end: e.ends_at ? addDays(dayParis(e.ends_at), -1) : start };
  }
  return {
    title: e.title, all_day: false, location: e.location ?? '',
    start: isoToParisLocal(e.starts_at), end: e.ends_at ? isoToParisLocal(e.ends_at) : '',
  };
}

// ---- Mails : instantané, tri strictement par date décroissante ----

export const MAIL_SOURCES = ['gmail', 'edhec'];
export const MAIL_LIMIT = 50;

// Les `n` derniers mails (les plus récents d'abord, aucune pondération), éventuellement
// d'une seule source. Sans `source` (colonne pas encore créée) : gmail.
export function latestMails(mails, source = 'all', n = MAIL_LIMIT) {
  const at = (m) => (m.received_at ? ms(m.received_at) : 0);
  return mails
    .filter((m) => source === 'all' || (m.source ?? 'gmail') === source)
    .sort((a, b) => at(b) - at(a))
    .slice(0, n);
}

// « 21/09 14:30 », heure de Paris.
export function formatMailDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('fr-FR', {
    timeZone: 'Europe/Paris', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
}

// Dernière synchro d'un cache (max de synced_at), ou null s'il est vide.
export function lastSync(rows) {
  const max = rows.reduce((m, r) => Math.max(m, ms(r.synced_at)), -Infinity);
  return Number.isFinite(max) ? new Date(max).toISOString() : null;
}

// ---- Projets : identifiant lisible dérivé du nom ----

export function slugify(name) {
  return String(name ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---- Mise en page de l'accueil (dashboard_settings, clé « home_layout ») ----

export const HOME_PANELS = {
  agenda: { label: 'Agenda', wide: true },
  ideas: { label: 'Idées', wide: false },
  actions: { label: 'Tâches', wide: true },
  mails: { label: 'Mails', wide: true },
  apps: { label: 'Mes apps', wide: true },
};
export const HOME_PANEL_IDS = Object.keys(HOME_PANELS);

// Réglage enregistré { order, hidden } -> { order, hidden } complet et valide :
// identifiants inconnus ignorés, panneaux manquants ajoutés à la fin.
export function resolveLayout(saved) {
  const known = (list) => (Array.isArray(list) ? list.filter((id) => HOME_PANEL_IDS.includes(id)) : []);
  const order = [...new Set(known(saved?.order))];
  order.push(...HOME_PANEL_IDS.filter((id) => !order.includes(id)));
  return { order, hidden: [...new Set(known(saved?.hidden))] };
}
