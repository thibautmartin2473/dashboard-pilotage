// Vérification de la logique pure de l'accueil : node scripts/check-home.mjs
import assert from 'node:assert/strict';
import {
  DEFAULT_CATEGORIES, HOME_PANEL_IDS, OTHER_KEY, TIMELINE_DAYS, WEEK_OFFSET_MAX, WEEK_OFFSET_MIN, buildWeek, categoryOf, clampOffset, doneByDay, describeWhen, eventForm, eventIdsOnDay, eventRow,
  formatMailDate, isMissingColumn, isMissingTable, isOverdue, isoToParisLocal, lastSync, latestMails, overlaps, parisToIso,
  reorderUpdates, resolveCategories, resolveLayout, shiftEvent, slugify, snapMinutes, splitTasks, summarize, timeParis,
  todayEmptyMessage, todayEvents, todayLine, todayParis,
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

// --- Catégories d'agenda (dashboard_settings, clé agenda_categories) ---
assert.equal(categoryOf(DEFAULT_CATEGORIES, '11').name, 'Cours EDHEC');
assert.equal(categoryOf(DEFAULT_CATEGORIES, '6').kind, 'tache');
assert.equal(categoryOf(DEFAULT_CATEGORIES, null).key, OTHER_KEY); // colonne pas encore synchronisée
assert.equal(categoryOf(DEFAULT_CATEGORIES, undefined).key, OTHER_KEY); // colonne pas encore créée (SQL pas exécuté)
assert.equal(categoryOf(DEFAULT_CATEGORIES, 'zzz').key, OTHER_KEY); // catégorie supprimée : repli

// Réglage absent -> les 3 catégories par défaut ; entrées invalides ignorées ; clés en double :
// la première gagne ; défauts renommés/recolorés respectés ; défaut manquant rajouté à la fin.
assert.deepEqual(resolveCategories(undefined), DEFAULT_CATEGORIES);
assert.deepEqual(resolveCategories([{ key: '11', name: 'Aurion', color: '#000000', kind: 'plage' }]).find((c) => c.key === '11'), {
  key: '11', name: 'Aurion', color: '#000000', kind: 'plage',
});
const custom = resolveCategories([
  { key: '9', name: 'Autre', color: '#3b82f6', kind: 'plage' },
  { key: 'c-1', name: 'Perso', color: '#22c55e', kind: 'plage' },
  { key: 'c-1', name: 'Doublon', color: '#000000', kind: 'plage' }, // même clé : ignorée
  { key: 'c-2', name: 'Sans couleur valide', color: 'rouge', kind: 'plage' }, // invalide : ignorée
]);
assert.deepEqual(custom.map((c) => c.key), ['9', 'c-1', '11', '6']); // 11 et 6 rajoutés (absents du réglage)
assert.equal(custom.find((c) => c.key === 'c-1').name, 'Perso');

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

// Flèches : offset -11 = du 10 au 17 (hier visible, aujourd'hui exclu) ; offset +7 = du 28 au 5 octobre.
const fleches = [ev('hier', at('09:00', '10'), at('10:00', '10')), ev('j8', at('09:00', '29'), at('10:00', '29'))];
let fw = buildWeek(fleches, nowAgenda, DEFAULT_CATEGORIES, -11);
assert.deepEqual([fw.days[0].day, fw.days[7].day], ['2026-09-10', '2026-09-17']);
assert.deepEqual(ids(fw.days[0].blocks), ['hier']);
assert.deepEqual([fw.days[0].isPast, fw.days.some((d) => d.isToday), fw.next], [true, false, null]);
assert.equal(fw.days[0].nowTop, null);
fw = buildWeek(fleches, nowAgenda, DEFAULT_CATEGORIES, 7);
assert.deepEqual([fw.days[0].day, fw.days[7].day], ['2026-09-28', '2026-10-05']);
assert.deepEqual(ids(fw.days[1].blocks), ['j8']);
assert.equal(fw.days[0].isPast, false);
assert.deepEqual([clampOffset(-999), clampOffset(999), clampOffset(3)], [WEEK_OFFSET_MIN, WEEK_OFFSET_MAX, 3]);
// Frise complète de l'agenda : TIMELINE_DAYS jours de J-35 à J+98, aujourd'hui à l'index 35.
fw = buildWeek(fleches, nowAgenda, DEFAULT_CATEGORIES, WEEK_OFFSET_MIN, TIMELINE_DAYS);
assert.equal(fw.days.length, TIMELINE_DAYS);
assert.deepEqual([fw.days[0].day, fw.days[-WEEK_OFFSET_MIN].day, fw.days.at(-1).day], ['2026-08-17', '2026-09-21', '2026-12-28']);
assert.equal(fw.days[-WEEK_OFFSET_MIN].isToday, true);
assert.deepEqual(ids(fw.days.flatMap((d) => d.blocks)), ['hier', 'j8']);

// Ligne « Fait » : tâches terminées rangées par jour de Paris (00h30 à Paris le 21 = 22h30 UTC le 20).
const faits = doneByDay([
  { id: 'x', done_at: '2026-09-20T22:30:00Z' },
  { id: 'y', done_at: '2026-09-20T08:00:00Z' },
  { id: 'z', done_at: '2026-09-20T06:00:00Z' },
  { id: 'pas-fait', done_at: null },
]);
assert.deepEqual(Object.keys(faits).sort(), ['2026-09-20', '2026-09-21']);
assert.deepEqual(ids(faits['2026-09-20']), ['z', 'y']); // plus ancienne d'abord
assert.deepEqual(ids(faits['2026-09-21']), ['x']);
assert.deepEqual(doneByDay(undefined), {});

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

// Catégorie personnalisée (kind 'tache') posée sur une plage : pas un conflit, comme les tâches
// Google ; le bloc porte la bonne catégorie (nom/couleur) même pour une clé inconnue (repli OTHER_KEY).
const withCustom = resolveCategories([
  { key: '11', name: 'Cours EDHEC', color: '#ef4444', kind: 'plage' },
  { key: OTHER_KEY, name: 'Autre événement', color: '#3b82f6', kind: 'plage' },
  { key: '6', name: 'Tâche / travail', color: '#f59e0b', kind: 'tache' },
  { key: 'c-perso', name: 'Perso', color: '#22c55e', kind: 'tache' },
]);
wk = buildWeek(
  [
    ev('coursC', at('09:00', '25'), at('12:00', '25'), { color_id: '11' }),
    ev('perso', at('10:00', '25'), at('11:00', '25'), { color_id: 'c-perso' }),
    ev('inconnu', at('10:30', '25'), at('11:30', '25'), { color_id: 'supprimee' }),
  ],
  new Date('2026-09-25T06:00:00Z'),
  withCustom
);
assert.equal(wk.conflicts, 1); // coursC/inconnu (deux plages) seulement
assert.equal(blocks(wk, 0).find((b) => b.id === 'perso').category.name, 'Perso');
assert.equal(blocks(wk, 0).find((b) => b.id === 'inconnu').category.key, OTHER_KEY);

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
assert.deepEqual(eventForm(row), { title: 'Congé', all_day: true, location: 'Lyon', start: '2026-09-21', end: '2026-09-22', category: OTHER_KEY });
assert.deepEqual(
  eventForm({ title: 'RDV', all_day: false, location: null, starts_at: '2026-09-21T12:30:00.000Z', ends_at: null }),
  { title: 'RDV', all_day: false, location: '', start: '2026-09-21T14:30', end: '', category: OTHER_KEY }
);
assert.equal(eventForm({ title: 'x', all_day: false, starts_at: '2026-09-21T12:30:00.000Z', color_id: 'c-perso' }).category, 'c-perso');
assert.throws(() => eventRow({ title: ' ', start: '2026-09-21T14:30', all_day: false }), /Titre/);
assert.throws(() => eventRow({ title: 'x', start: '2026-09-21T14:30', end: '2026-09-21T13:00', all_day: false }), /fin est avant/);
assert.throws(() => eventRow({ title: 'x', start: '2026-09-22', end: '2026-09-21', all_day: true }), /fin est avant/);
assert.throws(() => eventRow({ title: 'x', start: 'demain', all_day: false }), /Début invalide/);

// Catégorie -> color_id (édition depuis le site) : la clé choisie EST le color_id, validée contre
// la liste de catégories fournie (défaut : DEFAULT_CATEGORIES).
assert.equal(eventRow({ title: 'x', start: '2026-09-21T14:30', all_day: false, category: '11' }).color_id, '11');
assert.equal(eventRow({ title: 'x', start: '2026-09-21T14:30', all_day: false, category: '6' }).color_id, '6');
assert.equal(eventRow({ title: 'x', start: '2026-09-21T14:30', all_day: false }).color_id, undefined); // pas touché si non fourni
assert.throws(() => eventRow({ title: 'x', start: '2026-09-21T14:30', all_day: false, category: 'rouge' }), /Catégorie/);
assert.equal(
  eventRow({ title: 'x', start: '2026-09-21T14:30', all_day: false, category: 'c-perso' }, resolveCategories([{ key: 'c-perso', name: 'Perso', color: '#22c55e', kind: 'tache' }])).color_id,
  'c-perso'
);

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

// --- Glisser-déposer / poignées : pas de 15 min, heure de Paris, durée min 15 min ---
assert.equal(snapMinutes(0, 44), 0);
assert.equal(snapMinutes(10, 44), 15); // 13,6 min -> 15
assert.equal(snapMinutes(5, 44), 0); // 6,8 min -> 0
assert.equal(snapMinutes(-33, 44), -45);
const plage = { starts_at: '2026-09-21T12:00:00Z', ends_at: '2026-09-21T13:00:00Z' }; // 14h-15h Paris
assert.deepEqual(shiftEvent(plage, { minutes: 30 }), { starts_at: '2026-09-21T12:30:00.000Z', ends_at: '2026-09-21T13:30:00.000Z' });
assert.deepEqual(shiftEvent(plage, { minutes: -15, days: 2 }), { starts_at: '2026-09-23T11:45:00.000Z', ends_at: '2026-09-23T12:45:00.000Z' });
assert.equal(shiftEvent(plage, { minutes: -24 * 60 }).starts_at, '2026-09-20T22:00:00.000Z'); // borné à 0h Paris
assert.equal(shiftEvent(plage, { minutes: 24 * 60 }).starts_at, '2026-09-21T21:45:00.000Z'); // borné à 23h45 Paris
assert.deepEqual(shiftEvent(plage, { mode: 'end', minutes: 45 }), { starts_at: '2026-09-21T12:00:00.000Z', ends_at: '2026-09-21T13:45:00.000Z' });
assert.equal(shiftEvent(plage, { mode: 'end', minutes: -120 }).ends_at, '2026-09-21T12:15:00.000Z'); // 15 min au moins
assert.equal(shiftEvent(plage, { mode: 'start', minutes: -15 }).starts_at, '2026-09-21T11:45:00.000Z');
assert.equal(shiftEvent(plage, { mode: 'start', minutes: 120 }).starts_at, '2026-09-21T12:45:00.000Z');
assert.equal(shiftEvent({ starts_at: plage.starts_at, ends_at: null }, { mode: 'end', minutes: 15 }).ends_at, '2026-09-21T12:45:00.000Z'); // sans fin : 30 min
// Changement d'heure (25 oct. 2026) : on garde l'heure murale, 14h reste 14h.
assert.equal(shiftEvent({ starts_at: '2026-10-24T12:00:00Z', ends_at: '2026-10-24T13:00:00Z' }, { days: 1 }).starts_at, '2026-10-25T13:00:00.000Z');

console.log('check-home : OK');
