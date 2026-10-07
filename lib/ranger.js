// Logique pure de la liste « À ranger » (tâches, idées et propositions des mails regroupées) et de
// ses suggestions de placement. Aucun accès base ni effet de bord : vérifiée par
// scripts/check-ranger.mjs. Les dates « jour » sont des chaînes AAAA-MM-JJ, heure de Paris.
import { categoryOf, timeParis, todayParis } from './home.js';
import { isRecap } from './notifications.js';

const DAY_MS = 86400000;
const TASK_MIN = 30; // minutes qu'une tâche déjà posée dans un bloc retire à sa durée
export const HORIZON_DAYS = 14; // les blocs candidats sont cherchés sur 14 jours
export const OPTION_COUNT = 10; // blocs proposés par « Affecter ailleurs »

const ms = (v) => (typeof v === 'number' ? v : Date.parse(v));
const endMs = (e) => (e.ends_at ? ms(e.ends_at) : ms(e.starts_at));
export const dayParis = (v) => new Date(ms(v)).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });

export function addDays(day, n) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Jours entiers de a à b (b - a).
const dayDiff = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY_MS);

// Dimanche suivant, heure de Paris : strictement après aujourd'hui (un dimanche renvoie le dimanche d'après).
export function nextSundayParis(now = new Date()) {
  const today = todayParis(now);
  const dow = new Date(`${today}T12:00:00Z`).getUTCDay(); // 0 = dimanche
  return addDays(today, (7 - dow) % 7 || 7);
}

export const frDay = (day) => (day ? `${day.slice(8, 10)}/${day.slice(5, 7)}` : '');

// « 14h » ou « 14h30 ».
const hm = (iso) => timeParis(iso).replace(/^0/, '').replace(/h00$/, 'h');

// « jeu. 9/10 14h-16h » (heure de Paris).
export function fmtSlot(e) {
  const day = dayParis(e.starts_at);
  const wd = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'short' }).format(new Date(ms(e.starts_at)));
  const when = `${wd} ${Number(day.slice(8, 10))}/${Number(day.slice(5, 7))}`;
  const to = e.ends_at && endMs(e) > ms(e.starts_at) ? `-${hm(e.ends_at)}` : '';
  return `${when} ${hm(e.starts_at)}${to}`;
}

export const cleanBlockTitle = (t) => String(t ?? '').replace(/^\s*\[bloc planifi[ée]\]\s*/i, '').trim() || 'Bloc sans titre';

const norm = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\blm studio\b/g, 'lmstudio');

const tokens = (s) => norm(s).split(/[^a-z0-9]+/).filter(Boolean);

// ---- Dictionnaire de thèmes : même thème entre un élément et un bloc = bon candidat ----
export const THEMES = [
  { id: 'cas', label: 'cas', words: ['cas', 'case', 'cases', 'casebook', 'drill', 'drills', 'calcul', 'calculs', 'mece', 'boost', 'framework', 'frameworks'] },
  {
    id: 'reseau',
    label: 'fit et réseau',
    words: ['fit', 'pitch', 'star', 'starm', 'histoire', 'histoires', 'networking', 'linkedin', 'call', 'calls', 'appeler', 'ecrire', 'remercier', 'relancer', 'relance', 'relances'],
  },
  { id: 'candidature', label: 'candidatures', words: ['candidater', 'candidature', 'candidatures', 'postuler', 'lettre', 'lettres', 'cover', 'cv', 'motivation'] },
  { id: 'revision', label: 'révisions', words: ['revision', 'revisions', 'reviser', 'exam', 'exams', 'examen', 'partiel', 'partiels', 'research', 'accounting', 'acc', 'final', 'finals'] },
  { id: 'spircle', label: 'Spircle', words: ['spircle'] },
  {
    id: 'claude',
    label: 'Claude et outils',
    words: ['claude', 'dashboard', 'vault', 'connecteur', 'connecteurs', 'audit', 'instagram', 'lmstudio', 'llm', 'ollama', 'mcp', 'skill', 'skills'],
  },
  { id: 'admin', label: 'administratif', words: ['payer', 'paiement', 'loyer', 'banque', 'caution', 'papa', 'admin', 'administratif', 'impot', 'impots', 'assurance', 'facture'] },
];

// Thèmes présents dans un texte. « appeler la banque » est administratif, pas réseau.
export function themesOf(text) {
  const set = new Set(tokens(text));
  const found = THEMES.filter((t) => t.words.some((w) => set.has(w))).map((t) => t.id);
  return found.includes('admin') ? found.filter((id) => id !== 'reseau') : found;
}
const themeLabel = (id) => THEMES.find((t) => t.id === id).label;

const STOP = new Set([
  'avec', 'dans', 'pour', 'plus', 'cette', 'sans', 'sous', 'tout', 'tous', 'mes', 'des', 'les', 'une', 'aux', 'par', 'sur', 'chez', 'bloc', 'planifie', 'seance',
  'session', 'travail', 'tache', 'faire', 'fait', 'complet', 'complete', 'coach',
]);
const keywords = (s) => new Set(tokens(s).filter((w) => w.length >= 4 && !STOP.has(w) && !/^\d+$/.test(w)));

// Clé de série : titre sans accents, sans numéro (n°2, #3, x3), sans date ni mois, sans parenthèses.
// Deux éléments de même clé forment une série (« Payer le loyer » d'octobre et de novembre).
const MONTHS = 'janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre';
export function seriesKey(title) {
  const key = norm(title)
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(n\s*°|no\.?|num(ero)?|#)\s*\d+/g, ' ')
    .replace(/\b\d{1,2}\s*\/\s*\d{1,2}(\s*\/\s*\d{2,4})?/g, ' ')
    .replace(new RegExp(`\\b(d'|de |du |en |pour )?(${MONTHS})\\b`, 'g'), ' ')
    .replace(/\bx\s*\d+\b/g, ' ')
    .replace(/\b\d+\b/g, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return key.length >= 4 ? key : norm(title).trim();
}

// ---- Blocs candidats ----

// Événements de travail (catégorie de type « tache », colorId 6 par défaut) encore à venir, sur
// HORIZON_DAYS jours, dans l'ordre horaire.
export function workBlocks(events, categories, now = new Date()) {
  const nowMs = now.getTime();
  const last = addDays(todayParis(now), HORIZON_DAYS);
  return (events ?? [])
    .filter((e) => !e.all_day && endMs(e) > nowMs && dayParis(e.starts_at) <= last && categoryOf(categories, e.color_id).kind === 'tache')
    .sort((a, b) => ms(a.starts_at) - ms(b.starts_at) || String(a.title).localeCompare(String(b.title)));
}

const isLive = (t) => !t.done_at && !t.dropped_at;
const durationMin = (e) => (e.ends_at && endMs(e) > ms(e.starts_at) ? (endMs(e) - ms(e.starts_at)) / 60000 : TASK_MIN);

// Tâches ouvertes déjà posées dans le bloc `e`.
const linkedTasks = (e, tasks) => (tasks ?? []).filter((t) => t.event_id === e.id && isLive(t));

// Les OPTION_COUNT prochains blocs de travail (sélecteur « Affecter ailleurs »).
export function blockOptions(events, categories, tasks, now = new Date(), n = OPTION_COUNT) {
  return workBlocks(events, categories, now)
    .slice(0, n)
    .map((e) => ({
      eventId: e.id,
      day: dayParis(e.starts_at),
      label: `${cleanBlockTitle(e.title)}, ${fmtSlot(e)}`,
      tasks: linkedTasks(e, tasks).length,
    }));
}

const isShortAdmin = (title) => title.trim().length <= 70 && title.trim().split(/\s+/).length <= 8;

// ---- Suggestion de placement ----
// item : { kind: 'task' | 'idea' | 'notification', title, project?, originTitle?, due?, notifKind?, startsAt? }
// Retour : { kind: 'block' | 'today' | 'accept' | 'none', label, reason, target, eventId?, day?, score? }
// `target` est ce que Valider envoie au serveur : { type: 'block', eventId } | { type: 'today' } | { type: 'accept' } | null.
export function suggestPlacement(item, events, tasks, categories, now = new Date()) {
  const today = todayParis(now);
  const nowMs = now.getTime();

  if (item.kind === 'notification') {
    if (item.notifKind === 'event') {
      if (!item.startsAt) return { kind: 'none', label: '', reason: 'Proposition sans date : à écarter ou à noter ailleurs.', target: null };
      const when = `${fmtSlot({ starts_at: item.startsAt, ends_at: item.endsAt })}`;
      if (ms(item.startsAt) < nowMs) {
        return { kind: 'none', label: when, reason: `La date proposée (${when}) est passée : écarter la proposition.`, target: null };
      }
      return { kind: 'accept', label: `à sa date, ${when}`, reason: `Proposition tirée d'un mail : l'ajouter à l'agenda le ${when}.`, target: { type: 'accept' } };
    }
    if (item.notifKind === 'info') {
      return { kind: 'accept', label: 'la noter comme lue', reason: 'Information sans action à mener : la noter comme lue.', target: { type: 'accept' } };
    }
  }

  const due = item.due && item.due >= today ? item.due : null;
  const mine = themesOf(`${item.title} ${item.project ?? ''} ${item.originTitle ?? ''}`);
  const mineWords = keywords(`${item.title} ${item.originTitle ?? ''}`);
  const projectWord = item.project ? norm(item.project) : null;
  const blocks = workBlocks(events, categories, now);

  const scored = blocks.map((e) => {
    const title = cleanBlockTitle(e.title);
    const day = dayParis(e.starts_at);
    const linked = linkedTasks(e, tasks);
    const sharedThemes = themesOf(title).filter((id) => mine.includes(id));
    const sharedWords = [...keywords(title)].filter((w) => mineWords.has(w) && !THEMES.some((t) => t.words.includes(w)));
    const sameProject =
      Boolean(item.project) && (linked.some((t) => t.project_slug === item.project) || (projectWord.length >= 3 && norm(title).includes(projectWord)));
    const load = linked.length * TASK_MIN;
    const duration = durationMin(e);
    const full = load + TASK_MIN > duration;

    const relevance = Math.min(sharedThemes.length, 2) * 50 + Math.min(sharedWords.length, 2) * 12 + (sameProject ? 15 : 0);
    let score = relevance;
    let beforeDue = null;
    if (due) {
      beforeDue = day <= due;
      score += beforeDue ? 20 : -40;
    }
    score -= (load / duration) * 30 + (full ? 30 : 0);
    score -= Math.min(28, 2 * dayDiff(today, day));
    return { e, title, day, linked: linked.length, sharedThemes, sharedWords, sameProject, full, relevance, score, beforeDue };
  });

  const relevant = scored.filter((c) => c.relevance > 0).sort((a, b) => b.score - a.score || ms(a.e.starts_at) - ms(b.e.starts_at));
  const best = relevant[0] ?? null;

  // Tâche administrative courte sans bloc adapté : à faire aujourd'hui, sans bloc.
  if (!best && mine.includes('admin') && isShortAdmin(item.title)) {
    return {
      kind: 'today',
      label: "Aujourd'hui",
      reason: "Tâche administrative courte, sans bloc adapté : à faire aujourd'hui, sans bloc.",
      target: { type: 'today' },
      day: today,
    };
  }

  const pick = best ?? scored.find((c) => !c.full) ?? scored[0] ?? null;
  if (!pick) {
    return { kind: 'none', label: '', reason: `Aucun bloc de travail dans les ${HORIZON_DAYS} prochains jours : choisir un jour sans bloc.`, target: null };
  }

  const parts = [];
  if (pick.sharedThemes.length) parts.push(`même thème (${pick.sharedThemes.map(themeLabel).join(', ')})`);
  else if (pick.sharedWords.length) parts.push(`mot commun (${pick.sharedWords[0]})`);
  if (pick.sameProject) parts.push('même projet');
  if (!best) parts.push(pick.full ? 'premier bloc de travail à venir (tous presque pleins)' : 'premier bloc de travail libre');
  if (pick.linked > 0) parts.push(`${pick.linked} tâche${pick.linked > 1 ? 's' : ''} déjà dedans`);
  else if (best) parts.push('bloc encore vide');
  if (pick.full && best) parts.push('bloc presque plein');
  if (due) parts.push(pick.beforeDue ? `avant l'échéance du ${frDay(due)}` : `après l'échéance du ${frDay(due)} (aucun bloc plus tôt)`);

  const label = `${pick.title}, ${fmtSlot(pick.e)}`;
  return {
    kind: 'block',
    label,
    reason: `${label} : ${parts.join(', ')}`,
    target: { type: 'block', eventId: pick.e.id },
    eventId: pick.e.id,
    day: pick.day,
    score: Math.round(pick.score),
  };
}

// ---- Composition de la liste ----

const TYPE_LABELS = { task: 'Tâche', idea: 'Idée', notification: 'Mail' };
const NOTIF_LABELS = { event: 'Événement proposé', deadline: 'Échéance', todo: 'À faire', info: 'Information' };

export const ageDays = (iso, nowMs) => (iso ? Math.max(0, dayDiff(dayParis(iso), dayParis(nowMs))) : 0);
export const ageLabel = (age) => (age <= 0 ? "aujourd'hui" : age === 1 ? 'hier' : `${age} j`);

// Report encore actif ? (snoozed_until absent, ou arrivé à échéance = revient)
const snoozedFuture = (row, today) => Boolean(row.snoozed_until) && row.snoozed_until > today;
const snoozeBack = (row, today) => Boolean(row.snoozed_until) && row.snoozed_until <= today;

// Union de : (a) tâches ouvertes non reportées et pas dans un bloc à venir ; (b) idées `new` non
// reportées ; (c) notifications `new` hors « recap: » (doublons des tâches).
// Une tâche déjà planifiée pour aujourd'hui sans bloc (bucket today + échéance du jour) est rangée :
// elle va dans `todayTasks`. Une idée affectée à un bloc à venir ou à une tâche ouverte a déjà sa
// place (elle s'affiche dans le bloc) : hors liste.
// Retour : { items (triés), dueItems (ceux que le rangement forcé présente), todayTasks, options }.
export function buildRangerItems({ tasks = [], ideas = [], notifications = [], events = [], categories, now = new Date(), projectNames = {} }) {
  const today = todayParis(now);
  const nowMs = now.getTime();
  const eventsById = new Map(events.map((e) => [e.id, e]));
  const openTaskIds = new Set(tasks.filter(isLive).map((t) => t.id));
  const upcoming = (e) => Boolean(e) && endMs(e) > nowMs;
  const list = [];
  const todayTasks = [];

  const base = (kind, row, extra) => {
    const age = ageDays(row.created_at, nowMs);
    const item = {
      key: `${kind}:${row.id}`,
      kind,
      id: row.id,
      typeLabel: TYPE_LABELS[kind],
      title: String(kind === 'task' || kind === 'notification' ? row.title : row.content ?? '').trim(),
      createdAt: row.created_at ?? null,
      age,
      ageLabel: ageLabel(age),
      due: null,
      late: 0,
      project: row.project_slug ?? null,
      projectName: row.project_slug ? projectNames[row.project_slug] ?? row.project_slug : null,
      origin: null,
      originTitle: null,
      notifKind: null,
      notifLabel: null,
      detail: null,
      mailLink: null,
      snoozedUntil: row.snoozed_until ?? null,
      isDue: false,
      dueReason: null,
      ...extra,
    };
    item.series = seriesKey(item.title);
    return item;
  };

  for (const t of tasks) {
    if (!isLive(t) || snoozedFuture(t, today)) continue;
    const origin = t.event_id ? eventsById.get(t.event_id) : null;
    if (upcoming(origin)) continue; // posée dans un bloc à venir : visible dans la frise
    const blockEnded = Boolean(origin) && !upcoming(origin);
    const blockMissing = Boolean(t.event_id) && !origin;
    if (!t.event_id && t.bucket === 'today' && t.due_date === today) {
      todayTasks.push({ id: t.id, title: t.title, project: t.project_slug ?? null });
      continue;
    }
    const late = t.due_date && t.due_date < today ? dayDiff(t.due_date, today) : 0;
    const createdBefore = t.created_at && dayParis(t.created_at) < today;
    const dueReason = late
      ? `en retard de ${late} j`
      : blockEnded
        ? 'son bloc est terminé'
        : blockMissing
          ? 'son bloc a disparu de l\'agenda'
          : snoozeBack(t, today)
            ? 'report arrivé à échéance'
            : !t.event_id && createdBefore
              ? "sans bloc, créée avant aujourd'hui"
              : null;
    list.push(
      base('task', t, {
        due: t.due_date ?? null,
        late,
        originTitle: origin ? cleanBlockTitle(origin.title) : null,
        origin: origin ? `${cleanBlockTitle(origin.title)}, ${fmtSlot(origin)}` : blockMissing ? "bloc introuvable dans l'agenda" : null,
        isDue: Boolean(dueReason),
        dueReason,
      })
    );
  }

  for (const n of ideas) {
    if ((n.status ?? 'new') !== 'new' || snoozedFuture(n, today)) continue;
    if (n.event_id && upcoming(eventsById.get(n.event_id))) continue;
    if (n.task_id && openTaskIds.has(n.task_id)) continue;
    const dueReason = snoozeBack(n, today) ? 'report arrivé à échéance' : n.created_at && dayParis(n.created_at) < today ? 'idée créée avant aujourd\'hui' : null;
    list.push(base('idea', n, { isDue: Boolean(dueReason), dueReason }));
  }

  for (const n of notifications) {
    if ((n.status ?? 'new') !== 'new' || isRecap(n)) continue;
    const dueReason = n.created_at && dayParis(n.created_at) < today ? 'proposition créée avant aujourd\'hui' : null;
    const due = n.kind === 'event' && n.starts_at ? dayParis(n.starts_at) : n.due_date ?? null;
    list.push(
      base('notification', n, {
        due,
        late: due && due < today ? dayDiff(due, today) : 0,
        notifKind: n.kind,
        notifLabel: NOTIF_LABELS[n.kind] ?? 'Proposition',
        detail: n.detail ?? null,
        mailLink: n.mail_link ?? null,
        startsAt: n.starts_at ?? null,
        endsAt: n.ends_at ?? null,
        isDue: Boolean(dueReason),
        dueReason,
      })
    );
  }

  const openTasks = tasks.filter(isLive);
  for (const item of list) item.suggestion = suggestPlacement(item, events, openTasks, categories, now);
  const items = sortItems(list);
  return {
    items,
    dueItems: items.filter((i) => i.isDue),
    todayTasks,
    options: blockOptions(events, categories, openTasks, now),
  };
}

// Ordre : en retard d'abord (le plus ancien en premier), puis les échéances à venir, puis le reste
// du plus vieux au plus récent.
export function sortItems(list) {
  const rank = (i) => (i.late > 0 ? 0 : i.due ? 1 : 2);
  return [...list].sort(
    (a, b) =>
      rank(a) - rank(b) ||
      (rank(a) === 0 ? b.late - a.late : rank(a) === 1 ? a.due.localeCompare(b.due) : b.age - a.age) ||
      a.title.localeCompare(b.title)
  );
}

// Éléments restants de la série de `item` (même titre normalisé, `item` compris), dans l'ordre de `list`.
export function seriesOf(item, list) {
  return list.filter((i) => i.series === item.series);
}

// Gestes disponibles pour un élément. `ready` = supabase/ranger.sql exécuté (Supprimer et Plus tard
// d'une tâche ou d'une idée en dépendent). « Cocher » devient « Déjà fait » pour une proposition de mail
// (sauf une information, qui se coche).
export function gesturesFor(item, { ready = true } = {}) {
  const suggestion = item.suggestion ?? { target: null };
  const eventNotif = item.kind === 'notification' && item.notifKind === 'event';
  return {
    validate: Boolean(suggestion.target),
    elsewhere: !eventNotif && !(item.kind === 'notification' && item.notifKind === 'info'),
    done: true,
    doneLabel: item.kind === 'notification' && item.notifKind !== 'info' ? 'Déjà fait' : 'Cocher',
    drop: item.kind === 'notification' ? true : ready,
    later: ready,
  };
}

// ---- Règles pures des gestes (utilisées par app/ranger-actions.js, vérifiées par check-ranger) ----

// Jour choisi pour « Affecter à un jour » : message d'erreur, ou null si valide. Date réelle (le 31/02 est
// refusé), AAAA-MM-JJ, pas dans le passé (heure de Paris).
export function dayError(day, today) {
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return 'Date invalide (AAAA-MM-JJ attendu)';
  const d = new Date(`${day}T12:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== day) return `Cette date n'existe pas : ${day}`;
  if (day < today) return `Ce jour est déjà passé : ${day}`;
  return null;
}

// Échéance d'une tâche affectée à un bloc : l'échéance existante est gardée (le bloc dit quand on la
// fait, pas quand elle est due) ; sans échéance, la date du bloc.
export const dueForBlock = (existingDue, blockDay) => existingDue || blockDay;

const ISO_LIKE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

// Deux valeurs de colonne identiques ? null et absent s'équivalent ; deux horodatages se comparent à l'instant.
export function sameValue(a, b) {
  a = a ?? null;
  b = b ?? null;
  if (a === b) return true;
  if (typeof a === 'string' && typeof b === 'string' && ISO_LIKE.test(a) && ISO_LIKE.test(b)) return Date.parse(a) === Date.parse(b);
  return false;
}

// Horodatage posé il y a moins de `windowMs` (60 s de tolérance sur l'horloge de la base).
export function isRecent(ts, nowMs, windowMs) {
  const t = Date.parse(ts);
  return Number.isFinite(t) && nowMs - t <= windowMs && t - nowMs < 60000;
}
