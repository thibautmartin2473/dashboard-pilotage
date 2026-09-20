// Vérification de la logique pure de l'accueil : node scripts/check-home.mjs
import assert from 'node:assert/strict';
import { isMissingTable, isOverdue, splitTasks, summarize, todayParis } from '../lib/home.js';

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

console.log('check-home : OK');
