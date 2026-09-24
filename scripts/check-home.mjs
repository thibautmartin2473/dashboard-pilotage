// Vérification de la logique pure de l'accueil : node scripts/check-home.mjs
import assert from 'node:assert/strict';
import {
  HOME_PANEL_IDS, buildWeek, describeWhen, eventColor, eventForm, eventIdsOnDay, eventRow, formatMailDate, isMissingColumn,
  isMissingTable, isOverdue, isoToParisLocal, lastSync, latestMails, overlaps, parisToIso, reorderUpdates, resolveLayout,
  slugify, splitTasks, summarize, timeParis, todayEmptyMessage, todayEvents, todayLine, todayParis,
} from '../lib/home.js';
import { timeAgo } from '../lib/format.js';

const today = '2026-09-21';
const t = (o) => ({ bucket: 'inbox', due_date: null, done_at: null, position: 0, created_at: '2026-09-10', ...o });
const ids = (list) => list.map((x) => x.id);
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.001, `${actual} != ${expected}`);

// Jour de Paris : 23h30 UTC le 20 = déjà le 21 à Paris (été, UTC+2).
assert.equal(todayParis(new Date('2026-09-20T23:30:00Z')), '2026-09-21');

assert.equal(isOverdue(t({ due_date: '2026-09-20' }), today), true);
assert.equal(isOverdue(t({ due_date: '2026-09-21' }), today), false);
assert.equal(isOverdue(t({ due_date: '2026-09-20', done_at: 'x' }), today), false);

// --- Code couleur de l'agenda (Tomate/Myrtille/Mandarine, colorId Google) ---
assert.equal(eventColor({ color_id: '11' }), 'edhec');
assert.equal(eventColor({ color_id: '6' }), 'task');
assert.equal(eventColor({ color_id: '9' }), 'other');
assert.equal(eventColor({ color_id: null }), 'other'); // colonne pas encore synchronisée
assert.equal(eventColor({}), 'other'); // colonne pas encore créée (SQL pas exécuté)

// --- Tâches : quatre sections, tri par position puis date de création ---
const tasks = [
  t({ id: 'a' }),
  t({ id: 'b', bucket: 'today', position: 2 }),
  t({ id: 'c', due_date: '2026-09-21', position: 1 }), // échéance du jour -> Aujourd'hui
  t({ id: 'd', bucket: 'next_session', due_date: '2026-09-15' }), // en retard, quel que soit le bucket
  t({ id: 'e', bucket: 'next_session', due_date: '2026-09-30' }),
  t({ id: 'f', bucket: 'today', done_at: 'x' }), // faite : nulle part
  t({ id: 'g', bucket: 'today', created_at: '2026-09-01' }),
  t({ id: 'h', bucket: 'today', created_at: '2026-08-01' }),
  t({ id: 'i', due_date: '2026-10-05' }), // échéance future, bucket inbox
];
const p = splitTasks(tasks, today);
assert.deepEqual(ids(p.overdue), ['d']);
assert.deepEqual(ids(p.today), ['h', 'g', 'c', 'b']); // position 0 (plus ancienne d'abord), puis 1, puis 2
assert.deepEqual(ids(p.next_session), ['e']);
assert.deepEqual(ids(p.inbox), ['a', 'i']);
assert.deepEqual(ids(splitTasks([t({ id: 'x', bucket: 'today' }), t({ id: 'y', bucket: 'today', position: undefined })], today).today), ['x', 'y']); // colonne absente = 0

// Une tâche placée dans une plage du jour (tasks.event_id) compte dans « Aujourd'hui », même sans
// échéance ni bucket 'today' ; sans todayEventIds (comportement par défaut), elle reste ailleurs.
const placed = t({ id: 'z', bucket: 'next_session', event_id: 'ev1' });
assert.deepEqual(ids(splitTasks([placed], today).next_session), ['z']);
assert.deepEqual(ids(splitTasks([placed], today, new Set(['ev1'])).today), ['z']);
assert.deepEqual(ids(splitTasks([placed], today, new Set(['autre'])).next_session), ['z']);

// --- eventIdsOnDay : identifiants des événements dont le jour couvre `day` ---
assert.deepEqual(
  [...eventIdsOnDay(
    [
      { id: 'a', starts_at: '2026-09-21T09:00:00Z', ends_at: '2026-09-21T11:00:00Z' },
      { id: 'b', starts_at: '2026-09-20T22:00:00+02:00', ends_at: '2026-09-21T01:00:00+02:00' }, // finit le 21 à Paris
      { id: 'c', starts_at: '2026-09-22T09:00:00Z' }, // un autre jour
      { id: 'd', starts_at: '2026-09-21T09:00:00Z', all_day: true }, // toute la journée : hors champ
    ],
    '2026-09-21'
  )].sort(),
  ['a', 'b']
);

// Échange de priorité : positions distinctes -> on échange les deux voisines.
const list = [{ id: 'a', position: 1 }, { id: 'b', position: 2 }, { id: 'c', position: 5 }];
assert.deepEqual(reorderUpdates(list, 'b', 'up'), [{ id: 'b', position: 1 }, { id: 'a', position: 2 }]);
assert.deepEqual(reorderUpdates(list, 'b', 'down'), [{ id: 'b', position: 5 }, { id: 'c', position: 2 }]);
assert.deepEqual(reorderUpdates(list, 'a', 'up'), []); // déjà en tête
assert.deepEqual(reorderUpdates(list, 'c', 'down'), []); // déjà en queue
assert.deepEqual(reorderUpdates(list, 'zz', 'up'), []);
// Positions égales (tâches créées avant la colonne) : on renumérote la section dans le nouvel ordre.
const tied = [{ id: 'a', position: 0 }, { id: 'b', position: 0 }, { id: 'c', position: 0 }];
assert.deepEqual(reorderUpdates(tied, 'a', 'down'), [{ id: 'a', position: 1 }, { id: 'c', position: 2 }]); // b, a, c
assert.deepEqual(reorderUpdates(tied, 'c', 'up'), [{ id: 'c', position: 1 }, { id: 'b', position: 2 }]); // a, c, b

const now = new Date('2026-09-21T12:00:00Z').getTime();
const projects = [
  { name: 'Spircle', lastActivity: '2026-09-21T08:00:00Z' },
  { name: 'Stage', lastActivity: '2026-09-10T08:00:00Z' },
  { name: 'Neuf', lastActivity: null },
];
assert.deepEqual(summarize({ tasks, projects, today, now }), {
  todayCount: 4, overdueCount: 1, latestProject: 'Spircle', staleProjects: ['Stage', 'Neuf'],
});
assert.equal(summarize({ tasks: null, projects, today, now }).todayCount, null);

assert.equal(isMissingTable({ code: 'PGRST205' }), true);
assert.equal(isMissingTable({ code: '42501' }), false);
assert.equal(isMissingTable(null), false);
assert.equal(isMissingColumn({ code: 'PGRST204' }), true);
assert.equal(isMissingColumn({ code: 'PGRST205' }), false);

// --- Agenda (heure de Paris, été = +02:00) ---
const ev = (id, start, end, o = {}) => ({ id, title: id, starts_at: start, ends_at: end, all_day: false, ...o });
const at = (h, day = '21') => `2026-09-${day}T${h}:00+02:00`;
const nowAgenda = new Date(at('10:00'));
const blocks = (week, i = 0) => week.days[i].blocks;

assert.equal(timeParis('2026-09-21T14:30:00Z'), '16h30');
assert.equal(timeParis('2026-01-21T14:30:00Z'), '15h30'); // hiver, UTC+1

// Se toucher (18h00-18h00) n'est pas un conflit ; empiéter en est un.
assert.equal(overlaps(ev('a', at('17:00'), at('18:00')), ev('b', at('18:00'), at('19:00'))), false);
assert.equal(overlaps(ev('a', at('17:00'), at('18:30')), ev('b', at('18:00'), at('19:00'))), true);
assert.equal(overlaps(ev('a', at('09:00'), at('12:00')), ev('b', at('10:00'), at('11:00'))), true); // inclus

// Fenêtre J -> J+7 : 8 jours, J+7 inclus, J+8 exclu ; les événements terminés d'aujourd'hui restent visibles.
let wk = buildWeek([
  ev('fini', at('08:00'), at('09:00')),
  ev('a', at('17:00'), at('18:00')),
  ev('b', at('18:00'), at('19:00')), // touche a : pas de conflit
  ev('jour', '2026-09-21T12:00:00Z', '2026-09-22T12:00:00Z', { all_day: true }), // bandeau, jamais en conflit
  ev('j7', at('09:00', '28'), at('10:00', '28')),
  ev('j8', at('09:00', '29'), at('10:00', '29')), // hors fenêtre
  ev('hier', at('09:00', '10'), at('10:00', '10')), // passé : hors fenêtre
], nowAgenda);
assert.equal(wk.days.length, 8);
assert.deepEqual([wk.days[0].day, wk.days[7].day], ['2026-09-21', '2026-09-28']);
assert.deepEqual(ids(wk.days.flatMap((d) => d.blocks)), ['fini', 'a', 'b', 'j7']);
assert.deepEqual(ids(wk.days[7].blocks), ['j7']);
assert.deepEqual(ids(wk.days[0].allDay), ['jour']);
assert.equal(wk.days[0].isToday, true);
assert.equal(wk.conflicts, 0);
assert.deepEqual(blocks(wk).map((b) => b.conflict), [false, false, false]);
assert.deepEqual(wk.next, { title: 'a', time: '17h00' });

// Positionnement : plage 7h-22h (900 min). a = 17h00-18h00 -> top 600/900, hauteur 60/900.
assert.deepEqual([wk.hourStart, wk.hourEnd], [7, 22]);
const a = blocks(wk)[1];
assert.deepEqual([a.startMin, a.endMin], [1020, 1080]);
near(a.top, (600 / 900) * 100);
near(a.height, (60 / 900) * 100);
assert.deepEqual([a.col, a.cols, blocks(wk)[2].col, blocks(wk)[2].cols], [0, 1, 0, 1]); // 18h00-18h00 : pas côte à côte

// Repère de l'heure actuelle : 10h00 -> 180 min après 7h00, sur la colonne du jour seulement.
near(wk.days[0].nowTop, 20);
assert.deepEqual(wk.days.slice(1).map((d) => d.nowTop), Array(7).fill(null));
assert.equal(buildWeek([], new Date(at('23:30'))).days[0].nowTop, null); // hors plage affichée

// Conflit : a et b empiètent, ils s'affichent côte à côte ; c reste seul.
wk = buildWeek([ev('a', at('17:00'), at('18:30')), ev('b', at('18:00'), at('19:00')), ev('c', at('20:00'), at('21:00'))], nowAgenda);
assert.equal(wk.conflicts, 1);
assert.deepEqual(blocks(wk).map((b) => b.conflict), [true, true, false]);
assert.deepEqual(blocks(wk).map((b) => [b.col, b.cols]), [[0, 2], [1, 2], [0, 1]]);

// Un conflit n'oppose que deux plages (cours/événements) ou deux tâches Google placées dans
// l'agenda (color_id Mandarine « 6 ») : une tâche posée sur une plage est volontaire, pas un
// conflit. Cas réels : « Networking » et « Case Coach n°1 » (orange) chevauchent « Leadership »
// (rouge), le 25/09.
wk = buildWeek(
  [
    ev('leadership', '2026-09-25T09:00:00+02:00', '2026-09-25T12:00:00+02:00', { color_id: '11' }), // rouge Tomate
    ev('networking', '2026-09-25T11:00:00+02:00', '2026-09-25T12:00:00+02:00', { color_id: '6' }), // orange Mandarine
    ev('casecoach1', '2026-09-25T09:00:00+02:00', '2026-09-25T11:00:00+02:00', { color_id: '6' }), // orange Mandarine
  ],
  new Date('2026-09-25T06:00:00Z')
);
assert.equal(wk.conflicts, 0);
assert.deepEqual(blocks(wk, 0).map((b) => b.conflict), [false, false, false]);

// Deux plages (rouge/bleu) qui se chevauchent restent un conflit.
wk = buildWeek(
  [
    ev('coursA', at('09:00', '25'), at('11:00', '25'), { color_id: '11' }),
    ev('coursB', at('10:00', '25'), at('12:00', '25'), { color_id: '9' }),
  ],
  new Date('2026-09-25T06:00:00Z')
);
assert.equal(wk.conflicts, 1);

// Deux tâches (orange) qui se chevauchent restent un conflit.
wk = buildWeek(
  [
    ev('tacheA', at('09:00', '25'), at('11:00', '25'), { color_id: '6' }),
    ev('tacheB', at('10:00', '25'), at('12:00', '25'), { color_id: '6' }),
  ],
  new Date('2026-09-25T06:00:00Z')
);
assert.equal(wk.conflicts, 1);

// Événement qui traverse minuit : un bloc sur chaque jour, borné à la journée ; plage étendue à 0h-24h.
wk = buildWeek([
  ev('nuit', at('23:00'), at('01:00', '22')),
  ev('tot', at('00:30', '22'), at('02:00', '22')),
  ev('soir', at('22:00', '23'), at('00:00', '24')), // finit à minuit pile : pas sur le 24
], nowAgenda);
assert.deepEqual([wk.hourStart, wk.hourEnd], [0, 24]);
assert.deepEqual(ids(blocks(wk, 0)), ['nuit']);
assert.deepEqual(ids(blocks(wk, 1)), ['nuit', 'tot']);
assert.deepEqual(ids(blocks(wk, 2)), ['soir']);
assert.deepEqual(ids(blocks(wk, 3)), []);
assert.deepEqual([blocks(wk, 0)[0].startMin, blocks(wk, 0)[0].endMin], [1380, 1440]);
assert.deepEqual([blocks(wk, 1)[0].startMin, blocks(wk, 1)[0].endMin], [0, 60]);
assert.deepEqual([blocks(wk, 2)[0].startMin, blocks(wk, 2)[0].endMin], [1320, 1440]);
near(blocks(wk, 0)[0].top, (1380 / 1440) * 100);
assert.equal(wk.conflicts, 1); // nuit et tot se chevauchent entre 0h30 et 1h00
assert.deepEqual(blocks(wk, 1).map((b) => b.conflict), [true, true]);

// Commencé hier soir et encore en cours : présent aujourd'hui de 0h à 11h.
wk = buildWeek([ev('nuit', '2026-09-20T23:00:00+02:00', '2026-09-21T11:00:00+02:00')], nowAgenda);
assert.deepEqual([blocks(wk)[0].startMin, blocks(wk)[0].endMin], [0, 660]);
assert.equal(wk.conflicts, 0);

// Sans heure de fin : bloc de 30 min. Jour entier de plusieurs jours (fin exclusive) : 21 et 22 seulement.
wk = buildWeek([
  ev('ponct', at('14:00'), null),
  ev('conge', '2026-09-21T12:00:00Z', '2026-09-23T12:00:00Z', { all_day: true }),
], nowAgenda);
assert.deepEqual([blocks(wk)[0].startMin, blocks(wk)[0].endMin], [840, 870]);
assert.deepEqual(wk.days.map((d) => d.allDay.length).slice(0, 4), [1, 1, 0, 0]);
wk = buildWeek([], nowAgenda);
assert.deepEqual([wk.days.length, wk.hourStart, wk.hourEnd, wk.conflicts, wk.next], [8, 7, 22, 0, null]);

// Un jour avec un événement et zéro tâche ne doit jamais dire « rien ».
wk = buildWeek([ev('rdv', at('17:00'), at('18:00'))], nowAgenda);
const line = todayLine(todayEvents(wk).length, splitTasks([], today).today.length);
assert.equal(line, "Aujourd'hui : 1 événement, 0 tâche");
assert.doesNotMatch(line, /rien/i);
assert.equal(todayEmptyMessage(0, todayEvents(wk)), null);
assert.equal(todayEmptyMessage(2, []), null);
assert.equal(todayEmptyMessage(0, todayEvents(buildWeek([], nowAgenda))), 'Rien ici.');
assert.equal(todayEmptyMessage(0, todayEvents(null)), 'Aucune tâche (agenda indisponible).');
assert.equal(todayLine(2, 3), "Aujourd'hui : 2 événements, 3 tâches");
assert.equal(todayLine(null, 0), "Aujourd'hui : agenda indisponible, 0 tâche");
assert.deepEqual(ids(todayEvents(buildWeek([ev('j', '2026-09-21T12:00:00Z', '2026-09-22T12:00:00Z', { all_day: true }), ev('r', at('09:00'), at('10:00'))], nowAgenda))), ['j', 'r']);

assert.ok(describeWhen(ev('x', at('15:00'), at('16:00'))).includes('15h00–16h00'));
assert.ok(describeWhen(ev('x', '2026-09-21T12:00:00Z', '2026-09-23T12:00:00Z', { all_day: true })).includes('toute la journée'));

// --- Saisie d'événements (heure de Paris) ---
assert.equal(parisToIso('2026-09-21T14:30'), '2026-09-21T12:30:00.000Z'); // été
assert.equal(parisToIso('2026-01-21T14:30'), '2026-01-21T13:30:00.000Z'); // hiver
assert.equal(parisToIso('2026-03-28T12:00'), '2026-03-28T11:00:00.000Z'); // veille du changement d'heure
assert.equal(parisToIso('2026-03-29T12:00'), '2026-03-29T10:00:00.000Z'); // lendemain
assert.equal(parisToIso('pas une date'), null);
assert.equal(isoToParisLocal('2026-09-21T12:30:00.000Z'), '2026-09-21T14:30');

assert.deepEqual(
  eventRow({ title: ' RDV ', start: '2026-09-21T14:30', end: '2026-09-21T15:30', all_day: false, location: ' ' }),
  { title: 'RDV', all_day: false, location: null, starts_at: '2026-09-21T12:30:00.000Z', ends_at: '2026-09-21T13:30:00.000Z' }
);
assert.equal(eventRow({ title: 'x', start: '2026-09-21T14:30', end: '', all_day: false }).ends_at, null);
const row = eventRow({ title: 'Congé', start: '2026-09-21', end: '2026-09-22', all_day: true, location: 'Lyon' });
assert.deepEqual([row.starts_at, row.ends_at], ['2026-09-21T12:00:00Z', '2026-09-23T12:00:00Z']);
assert.deepEqual(eventForm(row), { title: 'Congé', all_day: true, location: 'Lyon', start: '2026-09-21', end: '2026-09-22' });
assert.deepEqual(
  eventForm({ title: 'RDV', all_day: false, location: null, starts_at: '2026-09-21T12:30:00.000Z', ends_at: null }),
  { title: 'RDV', all_day: false, location: '', start: '2026-09-21T14:30', end: '' }
);
assert.throws(() => eventRow({ title: ' ', start: '2026-09-21T14:30', all_day: false }), /Titre/);
assert.throws(() => eventRow({ title: 'x', start: '2026-09-21T14:30', end: '2026-09-21T13:00', all_day: false }), /fin est avant/);
assert.throws(() => eventRow({ title: 'x', start: '2026-09-22', end: '2026-09-21', all_day: true }), /fin est avant/);
assert.throws(() => eventRow({ title: 'x', start: 'demain', all_day: false }), /Début invalide/);

// --- Mails : tri strictement par date décroissante, filtre par source, 50 au plus ---
const mail = (id, received_at, o = {}) => ({ id, received_at, ...o });
const mails = [
  mail('vieux', '2026-09-01T00:00:00Z'),
  mail('edhec', '2026-08-01T00:00:00Z', { source: 'edhec' }),
  mail('neuf', '2026-09-20T00:00:00Z', { source: 'gmail' }),
  mail('sans-date', null),
  mail('important', '2026-09-10T00:00:00Z', { important: true, source: 'edhec' }), // aucune pondération
];
assert.deepEqual(ids(latestMails(mails)), ['neuf', 'important', 'vieux', 'edhec', 'sans-date']);
assert.deepEqual(ids(latestMails(mails, 'gmail')), ['neuf', 'vieux', 'sans-date']); // sans source : gmail
assert.deepEqual(ids(latestMails(mails, 'edhec')), ['important', 'edhec']);
assert.equal(latestMails(Array.from({ length: 60 }, (_, i) => mail(String(i), '2026-09-20T00:00:00Z'))).length, 50);
assert.equal(mails.length, 5); // l'entrée n'est pas modifiée
assert.match(formatMailDate('2026-09-21T12:30:00Z'), /21\/09.*14:30/);
assert.equal(formatMailDate(null), '');

// --- Projets et disposition ---
assert.equal(slugify('Café Été 2026 !'), 'cafe-ete-2026');
assert.equal(slugify('!!!'), '');
assert.deepEqual(resolveLayout(undefined), { order: HOME_PANEL_IDS, hidden: [], sizes: {} });
assert.deepEqual(resolveLayout({ order: ['mails', 'zzz', 'agenda', 'mails'], hidden: ['ideas', 'nope', 'ideas'] }), {
  order: ['mails', 'agenda', 'ideas', 'actions', 'apps'],
  hidden: ['ideas'],
  sizes: {}, // ancien format sans `sizes` : tout compact
});
// Tailles : agenda jamais réduit, valeurs et panneaux inconnus ignorés.
assert.deepEqual(
  resolveLayout({ sizes: { ideas: 'expanded', mails: 'collapsed', agenda: 'collapsed', apps: 'huge', zzz: 'expanded' } }).sizes,
  { ideas: 'expanded', mails: 'collapsed' },
);
assert.deepEqual(resolveLayout({ sizes: 'expanded' }).sizes, {});
assert.deepEqual(HOME_PANEL_IDS, ['agenda', 'ideas', 'actions', 'mails', 'apps']); // ordre imposé par défaut

// Dates relatives et dernière synchro.
const nowMs = new Date('2026-09-21T12:00:00Z').getTime();
assert.equal(timeAgo('2026-09-21T11:59:40Z', nowMs), "à l'instant");
assert.equal(timeAgo('2026-09-21T11:30:00Z', nowMs), 'il y a 30 min');
assert.equal(timeAgo('2026-09-21T09:00:00Z', nowMs), 'il y a 3 h');
assert.equal(timeAgo('2026-09-18T12:00:00Z', nowMs), 'il y a 3 j');
assert.equal(lastSync([]), null);
assert.equal(lastSync([{ synced_at: '2026-09-21T10:00:00.5+00:00' }, { synced_at: '2026-09-21T11:00:00+00:00' }]), '2026-09-21T11:00:00.000Z');

console.log('check-home : OK');
