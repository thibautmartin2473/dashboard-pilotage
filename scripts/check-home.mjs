// Vérification de la logique pure de l'accueil : node scripts/check-home.mjs
import assert from 'node:assert/strict';
import { buildAgenda, isMissingTable, isOverdue, lastSync, overlaps, splitTasks, summarize, timeParis, todayParis, topMails } from '../lib/home.js';
import { timeAgo } from '../lib/format.js';

const today = '2026-09-21';
const t = (o) => ({ bucket: 'inbox', due_date: null, done_at: null, ...o });

// Jour de Paris : 23h30 UTC le 20 = déjà le 21 à Paris (été, UTC+2).
assert.equal(todayParis(new Date('2026-09-20T23:30:00Z')), '2026-09-21');

assert.equal(isOverdue(t({ due_date: '2026-09-20' }), today), true);
assert.equal(isOverdue(t({ due_date: '2026-09-21' }), today), false);
assert.equal(isOverdue(t({ due_date: '2026-09-20', done_at: 'x' }), today), false);

const tasks = [
  t({ id: 'a' }),
  t({ id: 'b', bucket: 'today' }),
  t({ id: 'c', due_date: '2026-09-21' }), // échéance du jour -> Aujourd'hui
  t({ id: 'd', bucket: 'next_session', due_date: '2026-09-15' }), // en retard -> Aujourd'hui
  t({ id: 'e', bucket: 'next_session', due_date: '2026-09-30' }),
  t({ id: 'f', bucket: 'today', done_at: 'x' }), // faite : nulle part
];
const p = splitTasks(tasks, today);
assert.deepEqual(p.today.map((x) => x.id), ['d', 'c', 'b']); // échéances d'abord, sans date à la fin
assert.deepEqual(p.inbox.map((x) => x.id), ['a']);
assert.deepEqual(p.next_session.map((x) => x.id), ['e']);

const now = new Date('2026-09-21T12:00:00Z').getTime();
const projects = [
  { name: 'Spircle', lastActivity: '2026-09-21T08:00:00Z' },
  { name: 'Stage', lastActivity: '2026-09-10T08:00:00Z' },
  { name: 'Neuf', lastActivity: null },
];
assert.deepEqual(summarize({ tasks, projects, today, now }), {
  todayCount: 3, overdueCount: 1, latestProject: 'Spircle', staleProjects: ['Stage', 'Neuf'],
});
assert.equal(summarize({ tasks: null, projects, today, now }).todayCount, null);

assert.equal(isMissingTable({ code: 'PGRST205' }), true);
assert.equal(isMissingTable({ code: '42501' }), false);
assert.equal(isMissingTable(null), false);

// --- Agenda (heure de Paris, été = +02:00) ---
const ev = (id, start, end, o = {}) => ({ id, title: id, starts_at: start, ends_at: end, all_day: false, ...o });
const at = (h) => `2026-09-21T${h}:00+02:00`;
const nowAgenda = new Date(at('10:00'));

assert.equal(timeParis('2026-09-21T14:30:00Z'), '16h30');
assert.equal(timeParis('2026-01-21T14:30:00Z'), '15h30'); // hiver, UTC+1

// Se toucher (18h00-18h00) n'est pas un conflit ; empiéter en est un.
assert.equal(overlaps(ev('a', at('17:00'), at('18:00')), ev('b', at('18:00'), at('19:00'))), false);
assert.equal(overlaps(ev('a', at('17:00'), at('18:30')), ev('b', at('18:00'), at('19:00'))), true);
assert.equal(overlaps(ev('a', at('09:00'), at('12:00')), ev('b', at('10:00'), at('11:00'))), true); // inclus

let ag = buildAgenda([
  ev('fini', at('08:00'), at('09:00')), // terminé : masqué
  ev('a', at('17:00'), at('18:00')),
  ev('b', at('18:00'), at('19:00')), // touche a : pas de conflit
  ev('jour', '2026-09-21T12:00:00Z', '2026-09-22T12:00:00Z', { all_day: true }), // n'entre pas en conflit
  ev('demain', '2026-09-22T09:00:00+02:00', '2026-09-22T10:00:00+02:00'),
  ev('loin', '2026-09-29T09:00:00+02:00', '2026-09-29T10:00:00+02:00'), // J+8 : hors fenêtre
], nowAgenda);
assert.deepEqual(ag.days.map((d) => d.label), ["Aujourd'hui", 'Demain']);
assert.deepEqual(ag.days[0].events.map((e) => e.id), ['jour', 'a', 'b']); // toute la journée d'abord
assert.equal(ag.conflicts, 0);
assert.equal(ag.days[0].events[0].when, 'Toute la journée');
assert.equal(ag.days[0].events[1].when, '17h00–18h00');
assert.deepEqual(ag.next, { title: 'a', time: '17h00' });

ag = buildAgenda([ev('a', at('17:00'), at('18:30')), ev('b', at('18:00'), at('19:00')), ev('c', at('20:00'), at('21:00'))], nowAgenda);
assert.equal(ag.conflicts, 1);
assert.deepEqual(ag.days[0].events.map((e) => e.conflict), [true, true, false]);

// Traverse minuit : sur les deux jours, et en conflit avec un événement de 00h30.
ag = buildAgenda([
  ev('nuit', at('23:00'), '2026-09-22T01:00:00+02:00'),
  ev('tot', '2026-09-22T00:30:00+02:00', '2026-09-22T02:00:00+02:00'),
], nowAgenda);
assert.deepEqual(ag.days.map((d) => d.day), ['2026-09-21', '2026-09-22']);
assert.equal(ag.days[0].events[0].when, 'dès 23h00');
assert.equal(ag.days[1].events[0].when, "jusqu'à 01h00");
assert.equal(ag.conflicts, 1);

// Déjà commencé hier soir et encore en cours : présent aujourd'hui.
ag = buildAgenda([ev('nuit', '2026-09-20T23:00:00+02:00', '2026-09-21T11:00:00+02:00')], nowAgenda);
assert.equal(ag.days[0].events[0].when, "jusqu'à 11h00");
assert.equal(buildAgenda([ev('nuit', '2026-09-20T23:00:00+02:00', '2026-09-21T09:00:00+02:00')], nowAgenda).days.length, 0);

// Jour entier de plusieurs jours (fin exclusive) : 21 et 22 seulement.
ag = buildAgenda([ev('conge', '2026-09-21T12:00:00Z', '2026-09-23T12:00:00Z', { all_day: true })], nowAgenda);
assert.deepEqual(ag.days.map((d) => d.day), ['2026-09-21', '2026-09-22']);
assert.equal(buildAgenda([], nowAgenda).days.length, 0);

// Mails : importants d'abord, puis récents ; 10 au plus.
const mail = (id, received_at, important = false) => ({ id, received_at, important });
assert.deepEqual(
  topMails([mail('vieux', '2026-09-01T00:00:00Z'), mail('imp', '2026-08-01T00:00:00Z', true), mail('neuf', '2026-09-20T00:00:00Z')]).map((m) => m.id),
  ['imp', 'neuf', 'vieux']
);
assert.equal(topMails(Array.from({ length: 15 }, (_, i) => mail(String(i), '2026-09-20T00:00:00Z'))).length, 10);

// Dates relatives et dernière synchro.
const nowMs = ms0('2026-09-21T12:00:00Z');
function ms0(x) { return new Date(x).getTime(); }
assert.equal(timeAgo('2026-09-21T11:59:40Z', nowMs), "à l'instant");
assert.equal(timeAgo('2026-09-21T11:30:00Z', nowMs), 'il y a 30 min');
assert.equal(timeAgo('2026-09-21T09:00:00Z', nowMs), 'il y a 3 h');
assert.equal(timeAgo('2026-09-18T12:00:00Z', nowMs), 'il y a 3 j');
assert.equal(lastSync([]), null);
assert.equal(lastSync([{ synced_at: '2026-09-21T10:00:00.5+00:00' }, { synced_at: '2026-09-21T11:00:00+00:00' }]), '2026-09-21T11:00:00.000Z');

console.log('check-home : OK');
