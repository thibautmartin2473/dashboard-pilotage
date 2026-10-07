// Le QG Recrutement : classement par mots-clés (fonctions pures, aucun accès base).
// Chaque tâche ou événement tombe dans UNE case : une cible de recrutement (carte de campagne),
// le socle conseil (cas, drills, fit, réseau), la piste Examens, la piste Admin et perso, les
// cours (hors périmètre) ou « non classé ». Les règles sont en haut du fichier : pour ranger
// autrement, on change une expression, pas un composant.
import { addDays, classify as classifyEcheances, dateInTitle, dayOfEvent, diffDays, sharesKeyword } from '../../../DeadlinesLogic.js';
import { timeParis } from '../../../../../lib/home.js';

// ---------------------------------------------------------------------------------------------
// Règles
// ---------------------------------------------------------------------------------------------

export const STAGES = [
  { id: 'prep', label: 'À préparer', hint: 'Fiches, fit, cas : se mettre en état avant de candidater' },
  { id: 'candidature', label: 'Candidature', hint: 'CV, lettre, dépôt de dossier, réseau à activer' },
  { id: 'tests', label: 'Tests', hint: 'Tests en ligne, séries Gorilla et SHL' },
  { id: 'entretiens', label: 'Entretiens', hint: 'Screening, cas, fit, mock' },
  { id: 'clos', label: 'Clos', hint: 'Terminé, refusé ou abandonné' },
];

// Une cible = un cabinet ou un programme. Si un titre en cite plusieurs, la première mention gagne.
export const TARGETS = [
  { id: 'boost', name: 'Strategy Boost', re: /\bboost\b/ },
  { id: 'bain', name: 'Bain', re: /\bbain|\bgorilla\b/ },
  { id: 'bcg', name: 'BCG', re: /\bbcg\b/ },
  { id: 'ow', name: 'Oliver Wyman', re: /\boliver wyman\b|\bwyman\b|\bow\b/ },
  { id: 'lek', name: 'L.E.K.', re: /\bl e k\b|\blek\b|\bshl\b/ },
  { id: 'bnp', name: 'BNP', re: /\bbnp\b/ },
  { id: 'vertone', name: 'Vertone', re: /\bvertone\b/ },
  { id: 'mckinsey', name: 'McKinsey', re: /\bmckinsey\b|\bpei\b/ },
  { id: 'kearney', name: 'Kearney', re: /\bkearney\b/ },
  {
    id: 'autres',
    name: 'Autres cabinets',
    re: /\bpmp\b|\bey parthenon\b|\bparthenon\b|\bdeloitte\b|\bcourcelles\b|\bargon\b|\badl\b|\broland berger\b/,
  },
];
const TARGET_BY_ID = Object.fromEntries(TARGETS.map((t) => [t.id, t]));

export const SOCLE = { id: 'socle', name: 'Socle conseil' };
export const DESTINATIONS = [
  ...TARGETS.map((t) => ({ id: t.id, name: t.name })),
  SOCLE,
  { id: 'exam', name: 'Examens' },
  { id: 'admin', name: 'Admin et perso' },
];

const EXAM_RE = /\bexams?\b|\bexamen\b|\bpartiels?\b|\bfinals?\b|\brevision/;
const ADMIN_RE = /\b(payer|paiement|loyer|virement|caution|recommande|banquier|banque|facturation|couturiere|black friday|acheter|impots|assurance|mutuelle)\b/;
const SOCLE_RE =
  /\b(cas|case|casecoach|drills?|calcul|fit|star|cv|pitch|networking|calls?|cocktail|qtem|carrieres?|mece|consultor|fast maths|fiches?|cabinets?|cooptation|lettre|cover|portfolio|stage|entrainement|histoires?|methodo|relancer|remercier|contacter|ecrire|message|inviter|appeler|rappeler|dm)\b/;
const RELANCE_RE = /\b(relancer|rappeler|appeler|appel|remercier|ecrire|recontacter|contacter|inviter|dm|message|networking)\b/;

// Étape déduite des mots du titre (hors parenthèses) : le mot qui apparaît en premier décide.
const STAGE_WORDS = [
  ['entretiens', /\b(entretiens?|interviews?|mock|jdr|screen\w*|cracking|oral)\b/],
  ['tests', /\b(tests?|gorilla|shl|logique|sjt)\b/],
  ['candidature', /\b(candidat\w*|postul\w*|cv|lettre|deadline|depot\w*|graduate first)\b/],
  ['prep', /\b(fit|star|drills?|cas|case|histoires?|pitch|prepar\w*|revision|lire|fiches?|retravailler|mece|calcul|networking|name drop\w*|recouper|rediger)\b/],
];

// ---------------------------------------------------------------------------------------------
// Outils de texte et de date
// ---------------------------------------------------------------------------------------------

const plain = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
export const norm = (s) => plain(s).replace(/[^a-z0-9]+/g, ' ').trim();

// Texte affichable : sans le préfixe de bloc et sans tiret long (jamais de cadratin à l'écran).
export const clean = (s) =>
  String(s ?? '')
    .replace(/^\[bloc planifi[ée]\]\s*/i, '')
    .replace(/\s[\u2014\u2013]\s/g, ' : ')
    .replace(/[\u2014\u2013]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

const WEEKDAYS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
export const weekday = (day) => WEEKDAYS[new Date(`${day}T12:00:00Z`).getUTCDay()];
export const dd = (day) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;
export const fmtDay = (day) => `${weekday(day)} ${dd(day)}`;
export const fmtRange = (from, to) => (!to || to === from ? fmtDay(from) : `${dd(from)} au ${dd(to)}`);
export const isWeekend = (day) => [0, 6].includes(new Date(`${day}T12:00:00Z`).getUTCDay());
export const isMonday = (day) => new Date(`${day}T12:00:00Z`).getUTCDay() === 1;

// « J-3 », « demain », « retard 5 j ».
export function whenLabel(days) {
  if (days === null || days === undefined) return '';
  if (days < 0) return `retard ${-days} j`;
  if (days === 0) return "aujourd'hui";
  if (days === 1) return 'demain';
  return `J-${days}`;
}
export const whenTone = (days) =>
  days === null || days === undefined ? 'muted' : days < 0 ? 'late' : days <= 3 ? 'soon' : 'muted';

export function initials(name) {
  return String(name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

const PERSON_RE =
  /(?:[Rr]emercier|[Rr]elancer|[Rr]appeler|[Aa]ppeler|[Aa]ppel|[ÉéEe]crire à|message à|[Ii]nviter|DM|[Cc]ontacter)\s+(?:M\.?\s+|Mme\s+)?([A-ZÉÈÀ][\p{L}'’-]+(?:\s+[A-ZÉÈÀ][\p{L}'’-]+)?)/u;
export function personOf(title) {
  const m = String(title ?? '').match(PERSON_RE);
  return m ? m[1] : null;
}

// Libellé court : sans préfixe de cible, sans parenthèses, borné.
export function shortTitle(title, max = 64) {
  let s = clean(title)
    .replace(/^(strategy boost|boost|bain|bcg|oliver wyman|ow|l\.e\.k\.|bnp|vertone|kearney|mckinsey)\s*[:·]\s*/i, '')
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*:\s*«.*$/, '')
    .trim();
  if (s.length > max) s = `${s.slice(0, max - 1).trimEnd()}…`;
  return s || clean(title);
}

// ---------------------------------------------------------------------------------------------
// Classement d'un titre
// ---------------------------------------------------------------------------------------------

export function findTarget(n) {
  let best = null;
  for (const t of TARGETS) {
    const m = t.re.exec(n);
    if (m && (best === null || m.index < best.index)) best = { id: t.id, index: m.index };
  }
  return best ? TARGET_BY_ID[best.id] : null;
}

// -> { lane: 'cible' | 'exam' | 'admin' | 'socle' | 'cours' | null, target?: id }
export function classifyTitle(title, kind = 'task', colorId = '') {
  const n = norm(title);
  const t = findTarget(n);
  if (t) return { lane: 'cible', target: t.id };
  if (EXAM_RE.test(n)) return { lane: 'exam' };
  if (ADMIN_RE.test(n)) return { lane: 'admin' };
  if (SOCLE_RE.test(n)) return { lane: 'socle' };
  if (kind === 'event' && (String(colorId) === '11' || /^vacances/.test(n))) return { lane: 'cours' };
  return { lane: null };
}

export function stageOf(title) {
  const n = norm(String(title ?? '').replace(/\([^)]*\)/g, ' '));
  let best = null;
  for (const [id, re] of STAGE_WORDS) {
    const m = re.exec(n);
    if (m && (best === null || m.index < best.index)) best = { id, index: m.index };
  }
  return best ? best.id : 'prep';
}

export const isRelance = (title) => RELANCE_RE.test(norm(title));

// Nature d'un événement d'agenda.
export function eventKind(title) {
  const n = norm(title);
  if (/^(pendant le cours|revision)/.test(n)) return 'prep';
  if (/\bexam(en)?s?\b|\bpartiel\b|\bfinal exams?\b/.test(n)) return 'exam';
  if (/^tests? /.test(n) || /\btests? en ligne\b/.test(n)) return 'test';
  if (/^call\b|\bzoom\b|\bsession\b|\bmock up\b|\bcocktail\b|\bcracking\b/.test(n)) return 'rdv';
  return 'prep';
}

// « Payer le loyer d'octobre » x3 : même clé, une seule ligne.
const groupKey = (title) => norm(String(title).replace(/\s\(.*$/, '')).slice(0, 48);

// ---------------------------------------------------------------------------------------------
// Construction du QG
// ---------------------------------------------------------------------------------------------

function taskItem(t, today) {
  const day = dateInTitle(t.title, today) ?? t.due_date ?? null;
  return {
    key: `t-${t.id}`,
    kind: 'task',
    title: t.title,
    text: clean(t.title),
    day,
    days: day ? diffDays(day, today) : null,
  };
}

function eventItem(e, today) {
  const day = dayOfEvent(e.starts_at);
  return {
    key: `e-${e.id}`,
    kind: 'event',
    title: e.title,
    text: clean(e.title),
    day,
    days: diffDays(day, today),
    time: e.all_day ? 'journée' : timeParis(e.starts_at),
    colorId: String(e.color_id ?? ''),
    ekind: eventKind(e.title),
  };
}

// Regroupe les tâches de même titre (hors parenthèses) : { ...premier, count, keys }.
function groupTasks(items) {
  const map = new Map();
  for (const it of items) {
    const k = groupKey(it.title);
    const g = map.get(k);
    if (!g) map.set(k, { ...it, count: 1, keys: [it.key] });
    else {
      g.count += 1;
      g.keys.push(it.key);
      if (it.day && (!g.day || it.day < g.day)) {
        g.day = it.day;
        g.days = it.days;
      }
    }
  }
  return [...map.values()];
}

const byDay = (a, b) => (a.day ?? '9999').localeCompare(b.day ?? '9999') || (a.time ?? '').localeCompare(b.time ?? '');
// À venir d'abord (le plus proche en tête), puis sans date, puis les retards (le moins ancien en tête).
const upcomingFirst = (a, b) => {
  const rank = (x) => (x.days === null || x.days === undefined ? 1 : x.days >= 0 ? 0 : 2);
  const ra = rank(a);
  const rb = rank(b);
  if (ra !== rb) return ra - rb;
  if (ra === 2) return b.days - a.days;
  return (a.days ?? 0) - (b.days ?? 0);
};

const KIND_OF_STAGE = { candidature: 'candidature', tests: 'test', entretiens: 'rdv' };

function buildCampaign(raw, today, stageOv) {
  const target = raw.target;
  const relances = [];
  const milestones = []; // lignes datées : candidature, test, rendez-vous
  const todo = [];

  for (const it of groupTasks(raw.tasks.sort(byDay))) {
    const stage = stageOf(it.title);
    if (isRelance(it.title)) {
      relances.push({ ...it, person: personOf(it.title), stage, text: shortTitle(it.text, 90) });
    } else if (stage !== 'prep') {
      milestones.push({
        key: it.key,
        keys: it.keys,
        task: it,
        label: shortTitle(it.text, 56),
        kindKey: KIND_OF_STAGE[stage],
        stage,
        day: it.day,
        to: it.day,
        days: it.days,
        count: it.count,
        dayList: it.day ? [it.day] : [],
      });
    } else {
      todo.push({ ...it, text: shortTitle(it.text, 90) });
    }
  }

  const prep = [];
  const groups = new Map();
  for (const e of [...raw.events].sort(byDay)) {
    if (e.ekind === 'prep') {
      prep.push(e);
      continue;
    }
    const label = shortTitle(e.text.split(' : ')[0], 60);
    const gk = `${e.ekind}|${norm(label)}`;
    const g = groups.get(gk);
    if (g) {
      g.to = e.day;
      g.count += 1;
      g.dayList.push(e.day);
    } else {
      groups.set(gk, {
        key: gk,
        label,
        kindKey: e.ekind === 'exam' ? 'exam' : e.ekind,
        stage: e.ekind === 'test' ? 'tests' : stageOf(e.title),
        day: e.day,
        to: e.day,
        days: e.days,
        time: e.time,
        count: 1,
        dayList: [e.day],
      });
    }
  }
  milestones.push(...groups.values());
  milestones.sort((a, b) => (a.day ?? '9999').localeCompare(b.day ?? '9999'));

  // L'étape : celle du jalon daté le plus proche qui n'est pas de la préparation.
  const candidates = [...milestones.filter((m) => m.stage !== 'prep'), ...relances.filter((r) => r.stage !== 'prep')].sort(upcomingFirst);
  const open = raw.tasks.length + raw.events.length;
  let stage = candidates[0]?.stage ?? 'prep';
  if (open === 0 && raw.done.length + raw.past.length > 0) stage = 'clos';
  if (stageOv[target.id]) stage = stageOv[target.id];

  const nextUp = [...milestones, ...relances].filter((m) => (m.days ?? -1) >= 0).sort(upcomingFirst)[0] ?? null;
  return {
    target,
    stage,
    milestones,
    relances: relances.sort(upcomingFirst),
    prep,
    todo,
    doneCount: raw.done.length + raw.past.length,
    openTasks: raw.tasks.length,
    next: nextUp ? { label: nextUp.label ?? shortTitle(nextUp.text, 56), days: nextUp.days, day: nextUp.day } : null,
  };
}

export function buildQg({ tasks = [], done = [], events = [], today, overrides = {}, stageOv = {}, fait = new Set() }) {
  const win = 30;
  const winEnd = addDays(today, win - 1);
  const byTarget = {};
  const ensure = (id) => (byTarget[id] ??= { target: TARGET_BY_ID[id], tasks: [], events: [], past: [], done: [] });
  const socle = { tasks: [], events: [], past: 0, doneCount: 0 };
  const exam = { tasks: [], events: [] };
  const admin = { tasks: [], events: [] };
  const unclassified = [];
  let cours = 0;

  const place = (item) => {
    const ov = overrides[item.key];
    if (ov) return ['socle', 'exam', 'admin'].includes(ov) ? { lane: ov } : { lane: 'cible', target: ov };
    return classifyTitle(item.title, item.kind, item.colorId);
  };

  for (const t of tasks) {
    const item = taskItem(t, today);
    const p = place(item);
    if (fait.has(item.key)) {
      if (p.lane === 'cible') ensure(p.target).done.push(item);
      else if (p.lane === 'socle') socle.doneCount += 1;
      continue;
    }
    if (p.lane === 'cible') ensure(p.target).tasks.push(item);
    else if (p.lane === 'socle') socle.tasks.push(item);
    else if (p.lane === 'exam') exam.tasks.push(item);
    else if (p.lane === 'admin') admin.tasks.push(item);
    else unclassified.push(item);
  }
  for (const d of done) {
    const p = classifyTitle(d.title);
    if (p.lane === 'cible') ensure(p.target).done.push({ key: `d-${d.id}`, title: d.title });
    else if (p.lane === 'socle') socle.doneCount += 1;
  }
  for (const e of events) {
    const item = eventItem(e, today);
    const p = place(item);
    if (item.days < 0) {
      if (p.lane === 'cible') ensure(p.target).past.push(item);
      else if (p.lane === 'socle') socle.past += 1;
      continue;
    }
    if (p.lane === 'cible') ensure(p.target).events.push(item);
    else if (p.lane === 'socle') socle.events.push(item);
    else if (p.lane === 'exam') exam.events.push(item);
    else if (p.lane === 'admin') admin.events.push(item);
    else if (p.lane === 'cours') cours += 1;
    else unclassified.push(item);
  }

  const campaigns = Object.values(byTarget).map((raw) => buildCampaign(raw, today, stageOv));
  campaigns.sort((a, b) => (a.next?.days ?? 1e9) - (b.next?.days ?? 1e9) || a.target.name.localeCompare(b.target.name));

  // ---- Socle conseil ----
  const socleRelances = [];
  const socleTodo = [];
  for (const it of groupTasks(socle.tasks.sort(byDay))) {
    if (isRelance(it.title)) socleRelances.push({ ...it, person: personOf(it.title), text: shortTitle(it.text, 90) });
    else socleTodo.push({ ...it, text: shortTitle(it.text, 90) });
  }
  const themeOf = (title) => {
    const n = norm(title);
    if (/\bdrills?\b|\bcalcul\b|\bmece\b/.test(n)) return 'Drills et calcul mental';
    if (/\bfit\b|\bstar\b|\bpitch\b/.test(n)) return 'Fit et histoires';
    if (/\bnetworking\b|\bcall\b|\bcocktail\b|\bmessage\b|\bcarrieres?\b/.test(n)) return 'Réseau';
    return 'Cas et case coach';
  };
  const themes = {};
  const socleBlocks = [];
  for (const e of socle.events.sort(byDay)) {
    if (e.ekind === 'prep') {
      const th = themeOf(e.title);
      themes[th] = (themes[th] ?? 0) + 1;
      socleBlocks.push(e);
    } else socleBlocks.push(e);
  }

  // ---- Examens ----
  const examMarks = [];
  const examGroups = new Map();
  const revisions = [];
  for (const e of exam.events.sort(byDay)) {
    const dated = /\(\s*(exam|partiel)/i.test(e.title) ? dateInTitle(e.title, today) : null;
    if (e.ekind === 'exam') {
      const label = clean(e.text.replace(/^examen final\s*:\s*/i, ''));
      const g = examGroups.get(norm(label));
      if (g) {
        g.to = e.day;
        g.count += 1;
        g.dayList.push(e.day);
      } else examGroups.set(norm(label), { key: `x-${norm(label)}`, label, day: e.day, to: e.day, count: 1, dayList: [e.day] });
    } else {
      revisions.push(e);
      if (dated) {
        const m = e.text.match(/^(?:r[ée]vision\s+)?(.*?)\s*\(/i);
        const label = `Exam ${m ? m[1] : e.text}`;
        examGroups.set(norm(label), { key: `x-${norm(label)}`, label, day: dated, to: dated, count: 1, dayList: [dated] });
      }
    }
  }
  for (const it of exam.tasks) {
    const dated = /\(\s*(exam|partiel)/i.test(it.title) ? dateInTitle(it.title, today) : null;
    if (dated) {
      const m = it.text.match(/^(?:r[ée]vision\s+)?(.*?)\s*\(/i);
      const label = `Exam ${m ? m[1] : it.text}`;
      if (!examGroups.has(norm(label))) examGroups.set(norm(label), { key: `x-${norm(label)}`, label, day: dated, to: dated, count: 1, dayList: [dated] });
    }
  }
  examMarks.push(...examGroups.values());
  examMarks.sort((a, b) => a.day.localeCompare(b.day));
  for (const m of examMarks) m.days = diffDays(m.day, today);
  const examNext = examMarks.find((m) => m.days >= 0 || diffDays(m.to, today) >= 0) ?? null;

  // ---- Admin et perso ----
  const adminSource = admin.tasks.map((it) => ({ id: it.key, title: it.title, due_date: it.day }));
  const rec = classifyEcheances({ tasks: adminSource, events: [], today }).recurrences;
  const inRec = new Set(rec.flatMap((r) => r.tasks.map((t) => t.id)));
  const recurrences = rec.map((r) => ({
    key: r.key,
    label: r.label,
    dom: r.dom,
    next: r.next,
    days: diffDays(r.next, today),
    tasks: r.tasks
      .map((t) => admin.tasks.find((it) => it.key === t.id))
      .filter(Boolean)
      .sort(byDay),
  }));
  const adminItems = admin.tasks.filter((it) => !inRec.has(it.key)).sort(byDay);
  const adminEvents = admin.events.filter((e) => !admin.tasks.some((t) => sharesKeyword(t.title, e.title)));

  // ---- Frise des 30 jours ----
  const marks = [];
  const mark = (day, kind, group, label) => {
    if (day && day >= today && day <= winEnd) marks.push({ day, kind, group, label });
  };
  for (const c of campaigns) {
    const pre = (label) => (norm(label).includes(norm(c.target.name)) ? label : `${c.target.name} · ${label}`);
    for (const m of c.milestones) {
      if (!m.kindKey) continue;
      for (const d of m.dayList) mark(d, m.kindKey, `${c.target.id}|${m.label}`, pre(m.label));
    }
    for (const r of c.relances) if (r.stage !== 'prep' && r.day) mark(r.day, KIND_OF_STAGE[r.stage], `${c.target.id}|${r.key}`, pre(r.text));
  }
  for (const m of examMarks) for (const d of m.dayList) mark(d, 'exam', m.key, m.label);
  for (const e of socleBlocks) if (e.ekind === 'rdv') mark(e.day, 'rdv', `socle|${norm(e.text)}`, shortTitle(e.text, 50));
  for (const r of recurrences) mark(r.next, 'admin', `admin|${r.key}`, r.label);

  const days = Array.from({ length: win }, (_, i) => {
    const day = addDays(today, i);
    return { day, marks: marks.filter((m) => m.day === day) };
  });
  const chipMap = new Map();
  for (const m of marks) {
    const g = chipMap.get(`${m.kind}|${m.group}`);
    if (g) {
      g.dayList.push(m.day);
    } else chipMap.set(`${m.kind}|${m.group}`, { key: `${m.kind}|${m.group}`, kind: m.kind, label: m.label, day: m.day, dayList: [m.day] });
  }
  const chips = [...chipMap.values()].sort((a, b) => a.day.localeCompare(b.day) || a.label.localeCompare(b.label));
  for (const c of chips) c.days = diffDays(c.day, today);

  unclassified.sort((a, b) => (a.kind === b.kind ? byDay(a, b) : a.kind === 'task' ? -1 : 1));

  return {
    today,
    winEnd,
    campaigns,
    socle: {
      relances: socleRelances.sort(upcomingFirst),
      todo: socleTodo,
      blocks: socleBlocks,
      themes: Object.entries(themes).sort((a, b) => b[1] - a[1]),
      doneCount: socle.doneCount,
    },
    exam: { marks: examMarks, next: examNext, revisions, tasks: groupTasks(exam.tasks.sort(byDay)) },
    admin: { recurrences, items: adminItems, events: adminEvents },
    frise: { days, chips },
    cours,
    unclassified,
  };
}
