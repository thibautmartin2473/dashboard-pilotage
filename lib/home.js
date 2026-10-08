// Logique pure de la page d'accueil (sans accès base) : testée par
// scripts/check-home.mjs. Les dates « jour » sont des chaînes AAAA-MM-JJ.

export const BUCKETS = ['inbox', 'today', 'next_session'];
export const BUCKET_LABELS = { inbox: 'Sans échéance', today: "Aujourd'hui", next_session: 'Prochaine session' };

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

// `todayEventIds` : identifiants d'événements (plages) qui touchent aujourd'hui (eventIdsOnDay) :
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

// ---- Agenda et notifications : événements de `calendar_events`, mails de `mail_items` ----

const ms = (x) => new Date(x).getTime();
const dayParis = (x) => todayParis(new Date(x));
const addDays = (day, n) => new Date(ms(`${day}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const endMs = (e) => (e.ends_at ? ms(e.ends_at) : ms(e.starts_at));

export const WEEK_DAYS = 8; // J à J+7 inclus
// Plage horaire affichée : fixe, 8 h à 22 h. Un bloc qui déborde est tronqué au bord (`clippedTop` /
// `clippedBottom`), un bloc entièrement hors plage est signalé par `day.before` / `day.after`.
const HOUR_MIN = 8;
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

// ---- Catégories d'agenda (dashboard_settings, clé « agenda_categories ») ----
// Une catégorie = { key, name, color (hex), kind: 'plage' | 'tache' }. `key` est le colorId
// Google (poussé par scripts/push-agenda.mjs) pour les 3 catégories par défaut, ou une clé propre
// au site (`c-xxxxxxxx`) pour une catégorie créée sur le dashboard. La couleur et le nom se
// modifient depuis le site ; rien n'est jamais écrit dans Google Agenda.
export const OTHER_KEY = '9'; // catégorie de repli : événement sans couleur, ou catégorie supprimée
export const CATEGORY_KINDS = ['plage', 'tache'];
// Teintes des trois catégories par défaut (bleu ardoise, brun neutre, vert sourd) : ni rouge ni ambre, réservés aux
// états. Elles ne servent plus qu'au sélecteur de catégorie : les blocs de l'agenda suivent leur type, pas la couleur.
export const DEFAULT_CATEGORIES = [
  { key: '11', name: 'Cours EDHEC', color: '#3f5a7d', kind: 'plage' },
  { key: OTHER_KEY, name: 'Autre événement', color: '#7a6a5c', kind: 'plage' },
  { key: '6', name: 'Tâche / travail', color: '#2a6761', kind: 'tache' },
];
const HEX = /^#[0-9a-f]{6}$/i;

// Entrée de formulaire/réglage -> catégorie valide, ou null (ligne ignorée).
function normalizeCategory(c) {
  const key = String(c?.key ?? '').trim();
  const name = String(c?.name ?? '').trim().slice(0, 60);
  if (!key || !name || !HEX.test(c?.color ?? '') || !CATEGORY_KINDS.includes(c?.kind)) return null;
  return { key, name, color: c.color.toLowerCase(), kind: c.kind };
}

// Valeur enregistrée -> liste complète et valide : entrées invalides ignorées, clés en double
// gardent la première, les 3 catégories par défaut ajoutées si absentes (à la fin, pour ne pas
// écraser un ordre choisi sur le site). Clé absente (SQL déjà là, réglage jamais écrit) : les 3
// catégories par défaut, dans l'ordre d'origine.
export function resolveCategories(saved) {
  const list = Array.isArray(saved) ? saved.map(normalizeCategory).filter(Boolean) : [];
  const seen = new Set();
  const unique = list.filter((c) => (seen.has(c.key) ? false : (seen.add(c.key), true)));
  const missing = DEFAULT_CATEGORIES.filter((d) => !seen.has(d.key));
  return [...unique, ...missing];
}

// Catégorie d'un événement (par son color_id) dans une liste résolue : repli sur OTHER_KEY, puis
// sur la première catégorie (résolveCategories garantit toujours au moins les 3 par défaut).
export function categoryOf(categories, colorId) {
  return categories.find((c) => c.key === (colorId ?? OTHER_KEY)) ?? categories.find((c) => c.key === OTHER_KEY) ?? categories[0];
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

// ---- Types de blocs (présentation façon Calendrier d'Apple, SPEC section 3) ----
// Sept types reclassables d'un clic, plus « journée » (bandeau, jamais reclassé). Deux couches :
// les tâches (travail, courte) se posent PAR-DESSUS les plages (tous les autres types).
export const BLOCK_KINDS = ['cours', 'sport', 'examen', 'rdv', 'prepa', 'travail', 'courte'];
export const BLOCK_KIND_LABELS = {
  cours: 'Cours', sport: 'Sport', examen: 'Examen', rdv: 'Rendez-vous', prepa: 'Prépa', travail: 'Travail de fond',
  courte: 'Tâche courte', journee: 'Journée entière',
};
export const blockLayer = (kind) => (kind === 'travail' || kind === 'courte' ? 'tache' : 'plage');

// Minuscules sans accent, découpé en mots : « Strategy Boost, cas n°2 » -> strategy boost cas n 2.
const words = (title) =>
  String(title ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
const hasAny = (list, set) => list.some((w) => set.has(w));
const adjacent = (list, a, b) => list.some((w, i) => w === a && list[i + 1] === b);

const EXAM_WORDS = new Set(['examen', 'examens', 'exam', 'exams', 'test', 'tests', 'partiel', 'partiels', 'midterm', 'midterms', 'quiz']);
const RDV_WORDS = new Set(['call', 'calls', 'appel', 'rdv', 'entretien', 'entretiens', 'visio', 'interview']);
const PREPA_WORDS = new Set(['case', 'cases', 'cas', 'binome', 'binomes']);
const SPORT_WORDS = new Set(['sport', 'run', 'running', 'foot', 'football', 'padel', 'gym', 'muscu', 'musculation', 'tennis', 'natation', 'yoga', 'crossfit']);
// Prénoms courants (sans accent) : un titre qui commence par l'un d'eux, seul ou suivi d'un séparateur, est
// un rendez-vous. Liste volontairement sobre : une erreur se corrige d'un clic (menu « Type »).
const FIRST_NAMES = new Set(`adrien alexandre alexis alice amelie anais andre antoine arthur augustin aurelie baptiste benjamin bruno camille
carole caroline catherine cecile celine charles charlotte chloe christophe claire clara clement clemence corentin damien daniel david delphine
denis edouard elise emile emilie emma emmanuel eric etienne eva fabien fanny florian francois frederic gabriel gabrielle gaelle gautier geoffroy
guillaume hugo ines isabelle jacques jean jeanne jerome jules julia julie julien laura laure laurent lea leo leon lucas lucie ludovic luc manon
marc margaux marie marine mathieu mathilde matthieu maxime melanie michel nathalie nicolas noemie olivier oscar pascal patrick paul pauline
philippe pierre quentin raphael remi romain romane samuel sarah sebastien simon sophie stephane stephanie sylvain thibault thomas tiphanie theo
thierry valentin valerie vincent virginie xavier yann yasmine yves zoe john james michael peter anna sofia ahmed mohamed karim sami omar youssef`.split(/\s+/));

// « Marie », « Marie - point CV », « Thomas Gerber / Bain » : un prénom seul en tête (éventuellement suivi
// d'un nom), puis rien ou un séparateur. « Leadership » ou « Corporate Finance » ne passent pas.
function startsWithFirstName(title) {
  const m = String(title ?? '').match(/^\s*([A-ZÀ-Ý][\p{L}'’]*(?:-[A-ZÀ-Ý][\p{L}'’]*)?)(?:\s+[A-ZÀ-Ý][\p{L}'’]*)?\s*(?:$|[-\u2013:/,|(]|\sx\s|\s&\s)/u);
  if (!m) return false;
  const first = words(m[1].split('-')[0])[0];
  return FIRST_NAMES.has(first);
}

// Reclassement automatique d'un bloc de plage d'après son titre. Ordre : examen, rendez-vous, prépa, sport,
// sinon cours. Seuls des mots sans ambiguïté comptent : « final » seul n'est pas un examen (« Projet final »),
// « salle » seul n'est pas du sport (« Salle des marchés », « Salle 204 » = cours) ; « examen final »,
// « final exam », « salle de sport », « salle de gym » passent par « examen », « exam », « sport », « gym ».
export function titleKind(title) {
  const w = words(title);
  if (hasAny(w, EXAM_WORDS)) return 'examen';
  if (hasAny(w, RDV_WORDS) || adjacent(w, 'rendez', 'vous') || startsWithFirstName(title)) return 'rdv';
  if (hasAny(w, PREPA_WORDS) || adjacent(w, 'strategy', 'boost')) return 'prepa';
  if (hasAny(w, SPORT_WORDS)) return 'sport';
  return 'cours';
}

const ACTION_VERBS = new Set(`appeler rappeler envoyer renvoyer repondre relire payer reserver prendre ecrire verifier imprimer signer poster commander
acheter confirmer deposer remplir telephoner transmettre inscrire annuler valider demander recuperer chercher planifier classer scanner`.split(/\s+/));

// Durée réelle en minutes (0 sans heure de fin).
export const eventMinutes = (e) => (e.ends_at && endMs(e) > ms(e.starts_at) ? (endMs(e) - ms(e.starts_at)) / 60000 : 0);

// Tâche courte : 30 min ou moins (un bloc sans fin compte pour 30 min), ou une heure au plus avec un titre
// de cinq mots au plus qui commence par un verbe d'action (« Appeler la banque »).
export function isShortTask(e) {
  const minutes = eventMinutes(e) || MIN_BLOCK;
  const w = words(e.title);
  return minutes <= MIN_BLOCK || (minutes <= 60 && w.length <= 5 && ACTION_VERBS.has(w[0]));
}

// Type d'un bloc, par priorité : journée entière (bandeau) ; surcharge enregistrée (menu « Type ») ;
// catégorie de type `tache` -> travail ou courte ; catégorie `plage` -> reclassement d'après le titre.
// `overrides` = { [eventId]: type } (dashboard_settings, clé agenda_kind_overrides).
export function blockKind(event, category, overrides = {}) {
  if (event.all_day) return 'journee';
  if (overrides && Object.hasOwn(overrides, event.id) && BLOCK_KINDS.includes(overrides[event.id])) return overrides[event.id];
  if (category?.kind === 'tache') return isShortTask(event) ? 'courte' : 'travail';
  return titleKind(event.title);
}

// Réglage enregistré (clé agenda_kind_overrides) -> entrées valides { eventId: { kind, at } }, le reste est
// ignoré. `at` = date d'écriture en ms (sert à évincer les plus anciennes : l'ordre des clés d'un jsonb n'est
// pas celui des écritures). Ancien format { eventId: type } toujours lu, avec at = 0 (les plus anciennes).
export function resolveKindEntries(saved) {
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};
  return Object.fromEntries(
    Object.entries(saved).flatMap(([id, v]) => {
      const entry = v && typeof v === 'object' ? v : { kind: v };
      if (!id || !BLOCK_KINDS.includes(entry.kind)) return [];
      return [[id, { kind: entry.kind, at: Number.isFinite(entry.at) ? entry.at : 0 }]];
    })
  );
}

// Réglage enregistré -> surcharges valides { eventId: type } (ce que lisent blockKind et l'agenda).
export function resolveKindOverrides(saved) {
  return Object.fromEntries(Object.entries(resolveKindEntries(saved)).map(([id, entry]) => [id, entry.kind]));
}

// Au plus `max` entrées : les plus anciennes (`at`) partent d'abord, jamais `keepId` (celle qu'on écrit).
export function capKindEntries(entries, keepId, max) {
  const ids = Object.keys(entries);
  if (ids.length <= max) return entries;
  const out = { ...entries };
  ids
    .filter((id) => id !== keepId)
    .sort((a, b) => entries[a].at - entries[b].at)
    .slice(0, ids.length - max)
    .forEach((id) => delete out[id]);
  return out;
}

// Icône de type : masquée sous 30 minutes de durée réelle.
export const showBlockIcon = (e) => eventMinutes(e) >= MIN_BLOCK;

// Un bloc dont le titre se lit « à confirmer » (provisoire, point d'interrogation) s'affiche vide, en pointillé.
export const isToConfirm = (e) => e.status === 'tentative' || /\?|(?:^|\s)[àa] (?:re)?confirmer\b|\bprovisoire\b|\btentatif\b/i.test(e.title ?? '');

// En cours / passé, d'après les vraies heures de l'événement (pas la part du jour affichée).
export function blockTiming(e, nowMs) {
  const start = ms(e.starts_at);
  const end = eventMinutes(e) ? endMs(e) : start + MIN_BLOCK * 60000;
  return { running: start <= nowMs && nowMs < end, past: end <= nowMs };
}

// Urgence d'après les tâches OUVERTES liées au bloc : `late` = une échéance passée (filet corail) ;
// `urgent` = late, ou une échéance d'aujourd'hui alors que le bloc est fini (icône).
export function blockUrgency(openTasks, event, today, nowMs) {
  const late = (openTasks ?? []).some((t) => isOverdue(t, today));
  const dueTodayPassed = (openTasks ?? []).some((t) => !t.done_at && t.due_date === today) && blockTiming(event, nowMs).past;
  return { late, urgent: late || dueTodayPassed };
}

// Blocs « faits » : événements dont au moins une tâche liée est terminée et aucune ne reste ouverte.
export function doneEventIds(doneTasks, openTasks) {
  const open = new Set((openTasks ?? []).map((t) => t.event_id).filter(Boolean));
  return new Set((doneTasks ?? []).map((t) => t.event_id).filter((id) => id && !open.has(id)));
}

// Place côte à côte les blocs d'UNE couche qui se chevauchent (sur la part visible, visStart / visEnd) :
// renseigne `col` et `cols`. Un bloc qui commence quand un autre finit ouvre un nouveau groupe.
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
    if (group.length && b.visStart >= groupEnd) flush();
    let col = colEnds.findIndex((end) => end <= b.visStart);
    if (col < 0) col = colEnds.length;
    colEnds[col] = b.visEnd;
    b.col = col;
    group.push(b);
    groupEnd = Math.max(group.length === 1 ? -1 : groupEnd, b.visEnd);
  }
  flush();
}

// Mise en page d'un jour : les colonnes ne se calculent qu'entre blocs de la MÊME couche (deux plages, ou
// deux tâches). Une tâche qui chevauche une plage se pose par-dessus, en largeur presque pleine (`over`
// = vrai : l'affichage laisse voir le filet de la plage à gauche). `blocks` triés par début.
// Entrée : { layer, visStart, visEnd } ; sortie : les mêmes blocs avec col, cols, over.
export function layoutBlocks(blocks) {
  const plages = blocks.filter((b) => b.layer !== 'tache');
  const taches = blocks.filter((b) => b.layer === 'tache');
  packColumns(plages);
  packColumns(taches);
  plages.forEach((b) => { b.over = false; });
  taches.forEach((b) => { b.over = plages.some((p) => p.visStart < b.visEnd && b.visStart < p.visEnd); });
  return blocks;
}

// Fenêtre de `length` jours à partir de J+offset (par défaut 8 jours, aujourd'hui à J+7 ; offset négatif =
// jours passés ; l'agenda rend toute la frise, TIMELINE_DAYS jours). Un bloc par événement et par jour
// touché (un événement qui traverse minuit figure sur chaque jour, borné à la
// journée), positionné en pourcentage de la plage horaire fixe [8 h, 22 h] : la part hors plage est tronquée
// (`clippedTop` / `clippedBottom`, `startMin` / `endMin` gardent les vraies minutes du jour, `visStart` /
// `visEnd` la part visible), un bloc entièrement hors plage n'est pas dessiné mais listé dans `day.before`
// / `day.after` (titres). Chaque bloc porte son `kind` (blockKind, surcharges `kindOverrides`) et sa `layer`.
// Les « toute la journée » forment un bandeau (`allDay`), jamais en conflit.
// -> { days: [{ day, label, short, isToday, isPast, allDay, blocks, before, after, nowTop, nowBand }], hourStart, hourEnd, conflicts, next }
// `nowBand` = l'heure en cours { top, height } en % (bande teintée de la colonne d'aujourd'hui).
// `next` (prochain événement d'aujourd'hui) ne dépend pas de la fenêtre : null si aujourd'hui n'y est pas.
// conflicts = paires qui se chevauchent et ne sont pas terminées ; `conflict` = un bloc chevauche un autre.
// Un conflit n'oppose que deux blocs de la même couche : une tâche (travail, courte) posée sur une
// plage est volontaire (« pendant le cours »), jamais un conflit.
export function buildWeek(events, now = new Date(), categories = DEFAULT_CATEGORIES, offset = 0, length = WEEK_DAYS, kindOverrides = {}) {
  const today = todayParis(now);
  const dayList = Array.from({ length }, (_, n) => addDays(today, offset + n));
  const firstDay = dayList[0];
  const lastDay = dayList[length - 1];
  const inWindow = events
    .map((e) => ({ ...e, ...span(e) }))
    .filter((e) => e.first <= lastDay && e.last >= firstDay);

  const timed = inWindow.filter((e) => !e.all_day);
  const kinds = new Map(timed.map((e) => [e.id, blockKind(e, categoryOf(categories, e.color_id), kindOverrides)]));
  const inConflict = new Set();
  let conflicts = 0;
  timed.forEach((a, i) =>
    timed.slice(i + 1).forEach((b) => {
      if (!overlaps(a, b)) return;
      if (blockLayer(kinds.get(a.id)) !== blockLayer(kinds.get(b.id))) return; // couches différentes : voulu
      inConflict.add(a.id).add(b.id);
      if (endMs(a) > now.getTime() && endMs(b) > now.getTime()) conflicts += 1;
    })
  );

  const hourStart = HOUR_MIN;
  const hourEnd = HOUR_MAX;
  const winStart = hourStart * 60;
  const winEnd = hourEnd * 60;
  const pct = (min) => ((min - winStart) / (winEnd - winStart)) * 100;
  const nowMin = minutesParis(now.toISOString());

  const days = dayList.map((day) => {
    const before = [];
    const after = [];
    const blocks = [];
    timed
      .filter((e) => e.first <= day && day <= e.last)
      .map((e) => {
        const startMin = e.first === day ? minutesParis(e.starts_at) : 0;
        const endMin = e.last === day && dayParis(endMs(e)) === day ? minutesParis(new Date(endMs(e)).toISOString()) : 1440;
        return { e, startMin, endMin: Math.min(1440, Math.max(endMin, startMin + MIN_BLOCK)) };
      })
      .sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin || a.e.title.localeCompare(b.e.title))
      .forEach(({ e, startMin, endMin }) => {
        const visStart = Math.max(startMin, winStart);
        const visEnd = Math.min(endMin, winEnd);
        if (visEnd <= visStart) return void (endMin <= winStart ? before : after).push(e.title);
        const { first, last, ...event } = e;
        const kind = kinds.get(e.id);
        blocks.push({
          ...event, startMin, endMin, visStart, visEnd, top: pct(visStart), height: pct(visEnd) - pct(visStart),
          clippedTop: startMin < winStart, clippedBottom: endMin > winEnd,
          conflict: inConflict.has(e.id), col: 0, cols: 1, over: false, kind, layer: blockLayer(kind),
          category: categoryOf(categories, e.color_id),
        });
      });
    layoutBlocks(blocks);
    const inRange = day === today && nowMin >= winStart && nowMin < winEnd;
    const hourFloor = Math.floor(nowMin / 60) * 60;
    return {
      day,
      label: dayLabel(day, today),
      short: dayShort(day),
      isToday: day === today,
      isPast: day < today,
      allDay: inWindow
        .filter((e) => e.all_day && e.first <= day && day <= e.last)
        .sort((a, b) => a.title.localeCompare(b.title))
        .map(({ first, last, ...event }) => ({ ...event, kind: 'journee', layer: 'plage' })),
      blocks,
      before,
      after,
      nowTop: inRange ? pct(nowMin) : null,
      nowBand: inRange ? { top: pct(hourFloor), height: pct(hourFloor + 60) - pct(hourFloor) } : null,
    };
  });

  const next = timed
    .filter((e) => ms(e.starts_at) > now.getTime() && e.first === today)
    .sort((a, b) => ms(a.starts_at) - ms(b.starts_at))[0];
  return { days, hourStart, hourEnd, conflicts, next: next ? { title: next.title, time: timeParis(next.starts_at) } : null };
}

// ---- Bandeau « Maintenant » ----
// Où en est la journée à l'instant `now` (heure de Paris) : bloc en cours, prochains blocs d'aujourd'hui.
// Seuls les blocs horaires comptent (pas les événements « toute la journée »). Un bloc sans fin dure
// MIN_BLOCK minutes. Plusieurs blocs en cours : le plus récemment commencé (le plus précis), à égalité
// celui qui finit le premier. `kind` : 'current' (un bloc est en cours), 'between' (entre deux blocs),
// 'done' (journée finie : des blocs ont eu lieu, plus aucun à venir), 'none' (aucun bloc aujourd'hui).
// `upcoming` : les 2 prochains blocs qui commencent aujourd'hui après `now`, dans l'ordre.
export function nowState(events, now = new Date(), categories = DEFAULT_CATEGORIES) {
  const t = now.getTime();
  const day = todayParis(now);
  const mine = (events ?? [])
    .filter((e) => e.starts_at && !e.all_day)
    .map((e) => ({ e, start: ms(e.starts_at), end: e.ends_at && endMs(e) > ms(e.starts_at) ? endMs(e) : ms(e.starts_at) + MIN_BLOCK * 60000 }));
  const view = ({ e, start, end }) => ({
    id: e.id, title: e.title, time: timeParis(e.starts_at), endTime: timeParis(new Date(end).toISOString()),
    minutesLeft: Math.max(0, Math.ceil((end - t) / 60000)), minutesUntil: Math.max(0, Math.ceil((start - t) / 60000)),
    category: categoryOf(categories, e.color_id),
  });
  const running = mine
    .filter((b) => b.start <= t && t < b.end)
    .sort((a, b) => b.start - a.start || a.end - b.end || String(a.e.title).localeCompare(b.e.title))[0];
  const upcoming = mine
    .filter((b) => b.start > t && dayParis(b.start) === day)
    .sort((a, b) => a.start - b.start || a.end - b.end || String(a.e.title).localeCompare(b.e.title))
    .slice(0, 2)
    .map(view);
  const hadToday = mine.some((b) => dayParis(b.start) === day || (b.start <= t && t < b.end));
  const kind = running ? 'current' : upcoming.length ? 'between' : hadToday ? 'done' : 'none';
  return { kind, current: running ? view(running) : null, upcoming };
}

// « 1 h 05 », « 12 min » : durée restante ou à attendre, en minutes.
export function formatRemaining(minutes) {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`;
}

// Événements du jour (J) d'une semaine construite par buildWeek (offset 0) : bandeau puis blocs.
export const todayEvents = (week) => (week ? [...week.days[0].allDay, ...week.days[0].blocks] : null);

// Bornes des flèches de l'agenda (en jours depuis aujourd'hui) : de quoi remonter un mois et voir
// trois mois devant. Les événements Google passés restent en base (push-agenda ne purge que les
// événements pas encore terminés) ; au-delà de l'instantané poussé (35 jours), seuls les locaux existent.
export const WEEK_OFFSET_MIN = -35;
export const WEEK_OFFSET_MAX = 91;
export const clampOffset = (n) => Math.min(WEEK_OFFSET_MAX, Math.max(WEEK_OFFSET_MIN, n));
// Frise complète rendue dans l'agenda (glissée à la main ou aux flèches) : du premier au dernier jour
// atteignables, soit TIMELINE_DAYS colonnes à partir de J+WEEK_OFFSET_MIN.
export const TIMELINE_DAYS = WEEK_OFFSET_MAX - WEEK_OFFSET_MIN + WEEK_DAYS;

// Texte de la section « Aujourd'hui » quand elle n'a pas de tâche : jamais « rien » si l'agenda a
// des événements ce jour-là ; null = rien à dire (la section a du contenu).
export function todayEmptyMessage(taskCount, events) {
  if (taskCount > 0 || events?.length > 0) return null;
  return events === null ? 'Aucune tâche (agenda indisponible).' : 'Rien ici.';
}

// « lun. 21 sept. · 17h00-18h00 » pour le détail d'un événement.
export function describeWhen(e) {
  const { first, last } = span(e);
  if (e.all_day) return first === last ? `${dayShort(first)} · toute la journée` : `du ${dayShort(first)} au ${dayShort(last)} · toute la journée`;
  if (!e.ends_at || endMs(e) === ms(e.starts_at)) return `${dayShort(first)} · ${timeParis(e.starts_at)}`;
  if (first === dayParis(e.ends_at)) return `${dayShort(first)} · ${timeParis(e.starts_at)}-${timeParis(e.ends_at)}`;
  return `${dayShort(first)} ${timeParis(e.starts_at)} au ${dayShort(dayParis(e.ends_at))} ${timeParis(e.ends_at)}`;
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
export function eventRow({ title, start, end, all_day, location, category }, categories = DEFAULT_CATEGORIES) {
  title = String(title ?? '').trim();
  if (!title || title.length > 200) throw new Error('Titre requis (200 caractères max)');
  location = String(location ?? '').trim().slice(0, 200) || null;
  if (category && !categories.some((c) => c.key === category)) throw new Error('Catégorie invalide');
  const color_id = category || undefined;
  if (all_day) {
    const first = String(start ?? '').slice(0, 10);
    const lastDay = String(end ?? '').slice(0, 10) || first;
    if (!DAY.test(first) || !DAY.test(lastDay)) throw new Error('Date invalide');
    if (lastDay < first) throw new Error('La fin est avant le début');
    return { title, all_day: true, location, starts_at: `${first}T12:00:00Z`, ends_at: `${addDays(lastDay, 1)}T12:00:00Z`, ...(color_id && { color_id }) };
  }
  const starts_at = parisToIso(start);
  const ends_at = end ? parisToIso(end) : null;
  if (!starts_at) throw new Error('Début invalide');
  if (end && !ends_at) throw new Error('Fin invalide');
  if (ends_at && ends_at < starts_at) throw new Error('La fin est avant le début');
  return { title, all_day: false, location, starts_at, ends_at, ...(color_id && { color_id }) };
}

// Colonnes -> valeurs du formulaire d'édition (inverse d'eventRow).
export function eventForm(e) {
  if (e.all_day) {
    const start = dayParis(e.starts_at);
    return { title: e.title, all_day: true, location: e.location ?? '', start, end: e.ends_at ? addDays(dayParis(e.ends_at), -1) : start, category: e.color_id ?? OTHER_KEY };
  }
  return {
    title: e.title, all_day: false, location: e.location ?? '',
    start: isoToParisLocal(e.starts_at), end: e.ends_at ? isoToParisLocal(e.ends_at) : '', category: e.color_id ?? OTHER_KEY,
  };
}

// ---- Glisser-déposer et poignées de l'agenda (pas de 15 min, heure de Paris) ----

export const SNAP_MIN = 15;

// Déplacement vertical en pixels -> minutes, arrondi au pas de 15 min.
export const snapMinutes = (px, hourPx) => Math.round((px / hourPx) * (60 / SNAP_MIN)) * SNAP_MIN || 0;

// Nouvelles heures d'un événement (jamais « toute la journée ») -> { starts_at, ends_at } ISO UTC.
// mode 'move' : décale de `minutes` et de `days` jours (heure murale de Paris, le début reste dans le
// jour d'arrivée) ; 'start' / 'end' : déplace un seul bord, durée d'au moins 15 min.
// Sans fin : on part de la durée affichée (30 min).
export function shiftEvent(e, { mode = 'move', minutes = 0, days = 0 }) {
  const start = ms(e.starts_at);
  const end = e.ends_at && endMs(e) > start ? endMs(e) : start + MIN_BLOCK * 60000;
  const iso = (t) => new Date(t).toISOString();
  const min = SNAP_MIN * 60000;
  if (mode === 'start') return { starts_at: iso(Math.min(start + minutes * 60000, end - min)), ends_at: iso(end) };
  if (mode === 'end') return { starts_at: iso(start), ends_at: iso(Math.max(end + minutes * 60000, start + min)) };
  const wall = Math.min(Math.max(minutesParis(e.starts_at) + minutes, 0), 1440 - SNAP_MIN);
  const hhmm = `${String(Math.floor(wall / 60)).padStart(2, '0')}:${String(wall % 60).padStart(2, '0')}`;
  const s = ms(parisToIso(`${addDays(dayParis(e.starts_at), days)}T${hhmm}`));
  return { starts_at: iso(s), ends_at: iso(s + end - start) };
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
  agenda: { label: 'Agenda', wide: true }, // pleine largeur, jamais réduit ni replié
  ideas: { label: 'Idées', wide: false },
  actions: { label: 'Tâches', wide: false },
  mails: { label: 'Mails', wide: false },
  apps: { label: 'Mes apps', wide: false },
};
export const HOME_PANEL_IDS = Object.keys(HOME_PANELS);
// Taille d'un panneau non large : absent = compact (hauteur limitée, défilement interne).
export const PANEL_SIZES = ['expanded', 'collapsed'];

// Réglage enregistré { order, hidden, sizes } -> complet et valide :
// identifiants inconnus ignorés, panneaux manquants ajoutés à la fin, `sizes` absent (ancien format) = {}.
export function resolveLayout(saved) {
  const known = (list) => (Array.isArray(list) ? list.filter((id) => HOME_PANEL_IDS.includes(id)) : []);
  const order = [...new Set(known(saved?.order))];
  order.push(...HOME_PANEL_IDS.filter((id) => !order.includes(id)));
  const sizes = Object.fromEntries(
    Object.entries(saved?.sizes && typeof saved.sizes === 'object' ? saved.sizes : {}).filter(
      ([id, size]) => HOME_PANEL_IDS.includes(id) && !HOME_PANELS[id].wide && PANEL_SIZES.includes(size),
    ),
  );
  return { order, hidden: [...new Set(known(saved?.hidden))], sizes };
}
