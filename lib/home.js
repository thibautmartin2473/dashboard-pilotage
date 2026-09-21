// Logique pure de la page d'accueil (sans accès base) : testée par
// scripts/check-home.mjs. Les dates « jour » sont des chaînes AAAA-MM-JJ.

export const BUCKETS = ['inbox', 'today', 'next_session'];
export const BUCKET_LABELS = { inbox: 'À faire', today: "Aujourd'hui", next_session: 'Prochaine session' };
export const STALE_DAYS = 7;

// Le serveur Vercel est en UTC : « aujourd'hui » se calcule à l'heure de Paris.
export function todayParis(now = new Date()) {
  return now.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
}

// Table absente : PostgREST (PGRST205) ou Postgres direct (42P01).
export function isMissingTable(error) {
  return error?.code === 'PGRST205' || error?.code === '42P01';
}

export function isOverdue(task, today) {
  return !task.done_at && Boolean(task.due_date) && task.due_date < today;
}

// Un panneau par tâche : « Aujourd'hui » prend le bucket today et toute
// échéance du jour ou dépassée, sinon le bucket de la tâche.
export function splitTasks(tasks, today) {
  const panels = { inbox: [], today: [], next_session: [] };
  for (const t of tasks) {
    if (t.done_at) continue;
    const panel = t.bucket === 'today' || (t.due_date && t.due_date <= today) ? 'today' : t.bucket;
    panels[panel]?.push(t);
  }
  panels.today.sort((a, b) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999'));
  return panels;
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

// ---- Agenda et notifications : instantanés poussés par Claude (push-agenda.mjs) ----

const ms = (x) => new Date(x).getTime();
const dayParis = (x) => todayParis(new Date(x));
const addDays = (day, n) => new Date(ms(`${day}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const endMs = (e) => (e.ends_at ? ms(e.ends_at) : ms(e.starts_at));

// « 14h30 », heure de Paris.
export function timeParis(iso) {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get('hour')}h${get('minute')}`;
}

// Deux événements qui se touchent (fin = début) ne se chevauchent pas.
export function overlaps(a, b) {
  return ms(a.starts_at) < endMs(b) && ms(b.starts_at) < endMs(a);
}

export function dayLabel(day, today) {
  if (day === today) return "Aujourd'hui";
  if (day === addDays(today, 1)) return 'Demain';
  return new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
  });
}

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

function whenLabel(e, day, { first, last }) {
  if (e.all_day || (first < day && last > day)) return 'Toute la journée';
  if (first === day && last === day) return e.ends_at ? `${timeParis(e.starts_at)}–${timeParis(e.ends_at)}` : timeParis(e.starts_at);
  return first === day ? `dès ${timeParis(e.starts_at)}` : `jusqu'à ${timeParis(e.ends_at)}`;
}

// Événements d'aujourd'hui et des `days - 1` jours suivants, groupés par jour
// (un événement qui traverse minuit figure sur chaque jour touché). Les événements
// terminés sont masqués. Les « toute la journée » n'entrent jamais en conflit.
// -> { days: [{ day, label, events: [{ ...e, when, conflict }] }], conflicts (paires), next }
export function buildAgenda(events, now = new Date(), days = 8) {
  const today = todayParis(now);
  const live = events
    .map((e) => ({ ...e, ...span(e) }))
    .filter((e) => (e.all_day ? e.last >= today : endMs(e) > now.getTime()));

  const timed = live.filter((e) => !e.all_day);
  const inConflict = new Set();
  let conflicts = 0;
  timed.forEach((a, i) =>
    timed.slice(i + 1).forEach((b) => {
      if (!overlaps(a, b)) return;
      conflicts += 1;
      inConflict.add(a.id).add(b.id);
    })
  );

  const result = [];
  for (let n = 0; n < days; n++) {
    const day = addDays(today, n);
    const list = live
      .filter((e) => e.first <= day && day <= e.last)
      .sort((a, b) => b.all_day - a.all_day || ms(a.starts_at) - ms(b.starts_at) || a.title.localeCompare(b.title))
      .map(({ first, last, ...e }) => ({
        ...e,
        when: whenLabel(e, day, { first, last }),
        conflict: inConflict.has(e.id),
      }));
    if (list.length) result.push({ day, label: dayLabel(day, today), events: list });
  }
  const next = timed
    .filter((e) => ms(e.starts_at) > now.getTime() && e.first === today)
    .sort((a, b) => ms(a.starts_at) - ms(b.starts_at))[0];
  return { days: result, conflicts, next: next ? { title: next.title, time: timeParis(next.starts_at) } : null };
}

// Les `n` premières : importantes d'abord, puis les plus récentes.
export function topMails(mails, n = 10) {
  const at = (m) => (m.received_at ? ms(m.received_at) : 0);
  return [...mails].sort((a, b) => b.important - a.important || at(b) - at(a)).slice(0, n);
}

// Dernière synchro d'un cache (max de synced_at), ou null s'il est vide.
export function lastSync(rows) {
  const max = rows.reduce((m, r) => Math.max(m, ms(r.synced_at)), -Infinity);
  return Number.isFinite(max) ? new Date(max).toISOString() : null;
}
