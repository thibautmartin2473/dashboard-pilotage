// Interpréteur de la zone « Commande » de l'accueil : une phrase française -> des actions à
// prévisualiser. Fonctions pures, déterministes : aucun modèle, aucune clé, aucun réseau.
// Testé par scripts/check-command.mjs (`now` injecté). Les dates sont interprétées à l'heure de Paris.
//
// interpret(texte, now) -> { ok: true, actions } | { ok: false, message, examples }
// action = { kind: 'event', title, start, end, label }        (start/end : AAAA-MM-JJTHH:MM, Paris)
//        | { kind: 'task', title, due_date, label }           (due_date : AAAA-MM-JJ ou null)
//        | { kind: 'idea', content, label }
import { timeParis, todayParis } from './home.js';

export const EXAMPLES = [
  'ajoute moi une session de travail Claude de 14 à 16h mercredi et vendredi',
  'tâche : appeler la banque pour vendredi',
  'idée : tester un mode sombre',
];

// Noms propres à rétablir dans les titres (on garde sinon les majuscules saisies).
const NAMES = ['Claude', 'Gmail', 'Google', 'EDHEC', 'Spircle', 'Vercel', 'Supabase', 'Instagram'];
const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']; // index = getUTCDay()
const MONTHS = [
  'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre',
];
const TITLE_MAX = 200;
const IDEA_MAX = 2000;

class Unclear extends Error {}
const fail = (reason) => {
  throw new Unclear(reason);
};

// ---- Jours (chaînes AAAA-MM-JJ) ----

const pad = (n) => String(n).padStart(2, '0');
const dayMs = (day) => Date.parse(`${day}T12:00:00Z`);
const addDays = (day, n) => new Date(dayMs(day) + n * 86400000).toISOString().slice(0, 10);
const weekday = (day) => new Date(dayMs(day)).getUTCDay();
const dayLabel = (day) =>
  new Date(dayMs(day)).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

function makeDay(y, m, d) {
  const t = new Date(Date.UTC(y, m - 1, d, 12));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) {
    fail(`La date ${pad(d)}/${pad(m)}/${y} n'existe pas.`);
  }
  return `${y}-${pad(m)}-${pad(d)}`;
}

// Un jour sans année : le prochain à venir (aujourd'hui compris).
function nextDate(d, m, y, today) {
  if (y != null) return makeDay(y, m, d);
  const thisYear = Number(today.slice(0, 4));
  const day = makeDay(thisYear, m, d);
  return day >= today ? day : makeDay(thisYear + 1, m, d);
}

// Jeton de jour. Groupes : 1 jour de semaine, 2 « prochain », 3 après-demain, 4 demain, 5 aujourd'hui,
// 6-8 « 24 septembre [2026] », 9-11 « 24/09[/2026] », 12 « le 25 » (jour du mois seul).
const TOKEN = String.raw`(?:le\s+)?(?:\b(${WEEKDAYS.join('|')})\b(\s+prochain\b)?|\b(apres[- ]demain)\b|\b(demain)\b|\b(aujourd'?hui)\b|\b(\d{1,2})(?:er)?\s+(${MONTHS.join('|')})\b(?:\s+(\d{4})\b)?|\b(\d{1,2})/(\d{1,2})(?:/(\d{2,4}))?\b)|\ble\s+(\d{1,2})(?:er)?\b(?![\dh:/]|\s*(?:h\b|:))`;

// Jour désigné par un jeton. Jour de semaine : sa prochaine occurrence (aujourd'hui compris si
// `startMin` est encore à venir, ou sans heure) ; « prochain » : celui de la semaine suivante.
function resolveDay(m, { today, nowMin, startMin }) {
  const wd = weekday(today);
  if (m[1]) {
    const w = WEEKDAYS.indexOf(m[1]);
    if (m[2]) return addDays(today, ((1 - wd + 7) % 7 || 7) + ((w + 6) % 7)); // lundi de la semaine suivante + décalage
    let delta = (w - wd + 7) % 7;
    if (delta === 0 && startMin != null && startMin <= nowMin) delta = 7;
    return addDays(today, delta);
  }
  if (m[3]) return addDays(today, 2);
  if (m[4]) return addDays(today, 1);
  if (m[5]) return today;
  if (m[6]) return nextDate(Number(m[6]), MONTHS.indexOf(m[7]) + 1, m[8] ? Number(m[8]) : null, today);
  if (m[9]) return nextDate(Number(m[9]), Number(m[10]), m[11] ? Number(m[11]) + (m[11].length === 2 ? 2000 : 0) : null, today);
  const [y, mo, d] = today.split('-').map(Number);
  const n = Number(m[12]);
  if (n >= d) return makeDay(y, mo, n);
  return mo === 12 ? makeDay(y + 1, 1, n) : makeDay(y, mo + 1, n);
}

// Liste de jours (« mercredi et vendredi », « lundi, mardi et jeudi ») : jetons + intervalle occupé.
function findDays(f) {
  const first = new RegExp(TOKEN, 'g').exec(f);
  if (!first) return null;
  const tokens = [first];
  let end = first.index + first[0].length;
  const sep = /\s*,\s*(?:et\s+)?|\s+et\s+/y;
  for (;;) {
    sep.lastIndex = end;
    if (!sep.test(f)) break;
    const next = new RegExp(TOKEN, 'y');
    next.lastIndex = sep.lastIndex;
    const m = next.exec(f);
    if (!m) break;
    tokens.push(m);
    end = m.index + m[0].length;
  }
  const lead = /\b(?:pour|avant|d'ici|jusqu'au?|les|ce)\s+$/.exec(f.slice(0, first.index));
  return { tokens, from: lead ? lead.index : first.index, to: end };
}

// ---- Heures ----

const HM = String.raw`(\d{1,2})(?:\s*[h:](\d{2})?)?`; // « 14 », « 14h », « 14h30 », « 14:30 »
const HM_H = String.raw`(\d{1,2})\s*[h:](\d{2})?`; // idem, avec « h » ou « : » obligatoire
const SEP = String.raw`(?:\s+(?:a|et)\s+|\s*[-–]\s*)`;
const RANGE_A = new RegExp(String.raw`\b(?:de|entre)\s+${HM}${SEP}${HM}(?!\d)`);
const RANGE_B = new RegExp(String.raw`\b${HM_H}${SEP}${HM}(?!\d)`);
const AT = new RegExp(
  String.raw`\b(?:a|vers)\s+${HM_H}(?:\s+pendant\s+(?:(\d{1,3})\s*(?:min|minutes?|mn)\b|(\d{1,2})\s*(?:h|heures?)\s*(\d{2})?|(une)\s+heure\b))?`
);

const hm = (h, m) => {
  const min = Number(h) * 60 + Number(m || 0);
  if (Number(h) > 23 || Number(m || 0) > 59) fail(`L'heure « ${h}h${m ?? ''} » n'existe pas.`);
  return min;
};
const clock = (min) => `${Math.floor(min / 60) % 24}h${min % 60 ? pad(min % 60) : ''}`;
const hhmm = (min) => `${pad(Math.floor(min / 60) % 24)}:${pad(min % 60)}`;

// { s, e, from, to } : début et fin en minutes depuis minuit du jour de début (e peut dépasser 1440 :
// fin le lendemain). Plage « 23h à 1h » : passage de minuit accepté si la durée reste <= 12 h.
function findTime(f) {
  let m = RANGE_A.exec(f) || RANGE_B.exec(f);
  if (m) {
    const s = hm(m[1], m[2]);
    let e = hm(m[3], m[4]);
    if (e <= s) {
      if (s - e < 720) fail(`L'heure de fin (${clock(e)}) n'est pas après le début (${clock(s)}).`);
      e += 1440;
    }
    return { s, e, from: m.index, to: m.index + m[0].length };
  }
  m = AT.exec(f);
  if (!m) return null;
  const s = hm(m[1], m[2]);
  const dur = m[3] ? Number(m[3]) : m[4] ? Number(m[4]) * 60 + Number(m[5] || 0) : 60;
  if (dur <= 0) fail('La durée doit être positive.');
  return { s, e: s + dur, from: m.index, to: m.index + m[0].length };
}

// ---- Texte ----

// Blanchit les intervalles (longueur inchangée : les positions restent valables).
const cut = (text, spans) =>
  spans.reduce((t, [from, to]) => t.slice(0, from) + ' '.repeat(to - from) + t.slice(to), text);

const NAME_RE = new RegExp(`\\b(${NAMES.join('|')})\\b`, 'gi');
const EDGE = /^[\s,;:.\-–]+|[\s,;:.\-–]+$|\s(?:le|la|les|de|du|des|d'|à|a|pour|et|ce)$/i;

// Espaces réduits, première lettre en majuscule, noms propres rétablis ; les autres majuscules restent.
function clean(s, { edges = true } = {}) {
  s = s.replace(/\s+/g, ' ').trim();
  if (edges) for (let t = ''; t !== s; ) [t, s] = [s, s.replace(EDGE, '')];
  s = s.replace(NAME_RE, (w) => NAMES.find((n) => n.toLowerCase() === w.toLowerCase()));
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

const need = (title, max, what) => {
  if (!title) fail(`Il manque ${what}.`);
  if (title.length > max) fail(`Texte trop long (${max} caractères au plus).`);
  return title;
};

const VERB = String.raw`(?:(?:ajoute|ajouter|rajoute|cree|creer|note|mets|mettre|planifie|programme)(?:[\s-]+moi)?\s+(?:(?:une?|des|la|le|les)\s+|l')?)?`;
const IDEA = new RegExp(String.raw`^${VERB}idee\s*[:\-–]\s*`);
const TASK = new RegExp(String.raw`^(?:${VERB}(?:tache|a faire|todo)(?:\s*[:\-–]\s*|\s+)|rappelle[\s-]+moi\s+(?:de\s+|d'|que\s+)?)`);
const EVENT_VERB = new RegExp(`^${VERB}`);
const CALENDAR = /\b(?:dans|sur|a)\s+(?:mon\s+|l')?(?:agenda|calendrier)\b/;
const RECURRING = /\b(?:chaque|tous les|toutes les|hebdomadaire)\b/;

// ---- Analyse ----

function parse(input, now) {
  const raw = String(input ?? '').normalize('NFC').replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
  if (!raw) fail("Écris d'abord ce que tu veux ajouter.");
  const fold = raw.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  if (fold.length !== raw.length) fail('Caractères non pris en charge.');

  const today = todayParis(now);
  const [h, m] = timeParis(now.toISOString()).split('h').map(Number);
  const ctx = { today, nowMin: h * 60 + m };

  let hit = IDEA.exec(fold);
  if (hit) {
    const content = need(clean(raw.slice(hit[0].length), { edges: false }), IDEA_MAX, "le texte de l'idée");
    return [{ kind: 'idea', content, label: `Ajouter l'idée « ${content} »` }];
  }

  hit = TASK.exec(fold);
  if (hit) {
    const f = fold.slice(hit[0].length);
    const days = findDays(f);
    const due_date = days ? resolveDay(days.tokens[0], { ...ctx, startMin: null }) : null;
    const text = raw.slice(hit[0].length);
    // Le jour peut s'intercaler avant la liaison (« rappelle-moi jeudi d'acheter du lait ») : une fois
    // le jour retiré, elle se retrouve en tête du titre. Retiré ici seulement (un titre d'événement
    // peut légitimement commencer par « de »).
    const body = (days ? cut(text, [[days.from, days.to]]) : text).replace(/^\s*(?:de\s+|d'|que\s+|qu')/i, '');
    const title = need(clean(body), TITLE_MAX, 'le titre de la tâche');
    const when = due_date ? `pour ${dayLabel(due_date)}` : 'sans échéance';
    return [{ kind: 'task', title, due_date, label: `Créer la tâche « ${title} » · ${when}` }];
  }

  // Événement : une heure est obligatoire.
  const verb = EVENT_VERB.exec(fold)[0].length;
  if (RECURRING.test(fold)) fail('Les événements récurrents ne sont pas gérés : nomme chaque jour (« lundi et jeudi »).');
  const time = findTime(fold);
  if (!time) fail(verb ? 'Il manque une heure : « de 14 à 16h » ou « à 14h ».' : '');
  const days = findDays(fold);
  const calendar = CALENDAR.exec(fold);
  const spans = [[0, verb], [time.from, time.to]];
  if (days) spans.push([days.from, days.to]);
  if (calendar) spans.push([calendar.index, calendar.index + calendar[0].length]);
  const title = need(clean(cut(raw, spans)), TITLE_MAX, "le titre de l'événement");

  const list = days
    ? days.tokens.map((t) => resolveDay(t, { ...ctx, startMin: time.s }))
    : [time.s > ctx.nowMin ? today : addDays(today, 1)]; // sans jour : la prochaine fois qu'il est cette heure
  return [...new Set(list)].sort().map((day) => {
    const endDay = addDays(day, Math.floor(time.e / 1440));
    return {
      kind: 'event',
      title,
      start: `${day}T${hhmm(time.s)}`,
      end: `${endDay}T${hhmm(time.e)}`,
      label: `Créer l'événement « ${title} » · ${dayLabel(day)} ${clock(time.s)}–${clock(time.e)}${time.e >= 1440 ? ' (le lendemain)' : ''}`,
    };
  });
}

export function interpret(input, now = new Date()) {
  try {
    return { ok: true, actions: parse(input, now) };
  } catch (err) {
    if (!(err instanceof Unclear)) throw err;
    return { ok: false, message: `Je n'ai pas compris.${err.message ? ` ${err.message}` : ''}`, examples: EXAMPLES };
  }
}
