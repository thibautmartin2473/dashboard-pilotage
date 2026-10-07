// Vérification de la logique pure des notifications : node scripts/check-notifications.mjs
import assert from 'node:assert/strict';
import { groupNotifications, isRecap, parseRecapKey, planCleanup, recapGroupKey, recapTaskId, recapTitle } from '../lib/notifications.js';

const UUID = '3f2b8c1e-5d4a-4e7b-9c10-0a1b2c3d4e5f';
const n = (o) => ({ kind: 'deadline', status: 'new', detail: null, due_date: null, created_at: '2026-10-01T06:00:00Z', ...o });

// Reconnaissance et clé
assert.equal(isRecap({ dedupe_key: 'recap:2026-10-01:abc:1' }), true);
assert.equal(isRecap({ dedupe_key: '18c2ab:deadline' }), false);
assert.equal(isRecap({}), false);
assert.deepEqual(parseRecapKey(`recap:2026-10-01:${UUID}:2`), { date: '2026-10-01', id: UUID, n: 2 });
assert.equal(parseRecapKey('recap:cassé'), null);
assert.equal(parseRecapKey(null), null);

// Id de tâche : uuid seulement
assert.equal(recapTaskId({ dedupe_key: `recap:2026-10-01:${UUID}:1` }), UUID);
assert.equal(recapTaskId({ dedupe_key: 'recap:2026-10-01:7k2m9q0abcgoogleid:1' }), null); // id Google d'un bloc
assert.equal(recapTaskId({ dedupe_key: `x:2026-10-01:${UUID}:1` }), null); // pas un recap
assert.equal(recapTaskId({ dedupe_key: 'recap:2026-10-01:not-a-uuid:1' }), null);

// Titre normalisé
assert.equal(recapTitle('Oublié hier ? Drill MECE'), 'Drill MECE');
assert.equal(recapTitle('Oublié hier ?   Drill   MECE '), 'Drill MECE');
assert.equal(recapTitle('oublie hier? Drill MECE'), 'Drill MECE');
assert.equal(recapTitle('Payer le loyer'), 'Payer le loyer');
assert.equal(recapGroupKey('Oublié hier ? Drill  MECÉ'), recapGroupKey('Oublié hier ? drill mece'));

// Regroupement : une ligne par tâche, la plus récente fait foi
const list = [
  n({ id: 'a1', title: 'Oublié hier ? Drill MECE', dedupe_key: 'recap:2026-09-28:g1:1', due_date: '2026-09-30', created_at: '2026-09-29T06:00:00Z' }),
  n({ id: 'info', kind: 'info', title: 'Mail EDHEC', dedupe_key: 'mailx:info' }),
  n({ id: 'a2', title: 'Oublié hier ? Drill MECE', dedupe_key: 'recap:2026-09-30:g1:1', due_date: '2026-10-02', created_at: '2026-10-01T06:00:00Z' }),
  n({ id: 'a3', title: 'Oublié hier ?  drill mece', dedupe_key: 'recap:2026-09-29:g1:1', due_date: '2026-10-01', created_at: '2026-09-30T06:00:00Z' }),
  n({ id: 'b1', title: 'Oublié hier ? Payer le loyer', dedupe_key: `recap:2026-10-02:${UUID}:1`, due_date: '2026-10-05', created_at: '2026-10-03T06:00:00Z' }),
  n({ id: 'ev', kind: 'event', title: 'Entretien', dedupe_key: 'mail9:event' }),
];
const { others, recaps } = groupNotifications(list);
assert.deepEqual(others.map((x) => x.id), ['info', 'ev']);
assert.equal(recaps.length, 2);
assert.equal(recaps[0].title, 'Payer le loyer'); // le plus récent d'abord
assert.equal(recaps[0].count, 1);
const drill = recaps[1];
assert.equal(drill.title, 'Drill MECE');
assert.equal(drill.count, 3);
assert.equal(drill.latest.id, 'a2');
assert.equal(drill.latest.due_date, '2026-10-02');
assert.deepEqual([...drill.ids].sort(), ['a1', 'a2', 'a3']);
assert.deepEqual(groupNotifications([]), { others: [], recaps: [] });

// Deux tâches de même titre mais d'uuid différents : deux groupes ; même uuid, titres différents : un seul
const UUID2 = '9a8b7c6d-1111-4222-8333-444455556666';
const two = groupNotifications([
  n({ id: 't1', title: 'Oublié hier ? Relire', dedupe_key: `recap:2026-10-01:${UUID}:1`, created_at: '2026-10-02T06:00:00Z' }),
  n({ id: 't2', title: 'Oublié hier ? Relire', dedupe_key: `recap:2026-10-01:${UUID2}:1`, created_at: '2026-10-02T07:00:00Z' }),
  n({ id: 't3', title: 'Oublié hier ? Relire', dedupe_key: `recap:2026-10-02:${UUID}:1`, created_at: '2026-10-03T06:00:00Z' }),
  n({ id: 't4', title: 'Oublié hier ? Relire le mémo', dedupe_key: `recap:2026-10-03:${UUID}:1`, created_at: '2026-10-04T06:00:00Z' }), // renommée : même tâche
  n({ id: 't5', title: 'Oublié hier ? Relire', dedupe_key: 'recap:2026-10-03:googleblock:1', created_at: '2026-10-04T07:00:00Z' }), // sans uuid : par titre
]);
assert.equal(two.recaps.length, 3);
assert.deepEqual(two.recaps.map((g) => [...g.ids].sort().join('+')).sort(), ['t1+t3+t4', 't2', 't5']);

// Plan de nettoyage (today = 2026-10-06)
const today = '2026-10-06';
const plan = planCleanup(
  [
    n({ id: 'old', title: 'Oublié hier ? A', dedupe_key: 'recap:2026-09-20:x:1', due_date: '2026-09-25' }), // 11 j : périmée
    n({ id: 'edge', title: 'Oublié hier ? B', dedupe_key: 'recap:2026-10-01:y:1', due_date: '2026-10-03' }), // 3 j pile : gardée
    n({ id: 'edge4', title: 'Oublié hier ? C', dedupe_key: 'recap:2026-10-01:z:1', due_date: '2026-10-02' }), // 4 j : périmée
    n({ id: 'd1', title: 'Oublié hier ? D', dedupe_key: 'recap:2026-10-03:d:1', due_date: '2026-10-07', created_at: '2026-10-04T06:00:00Z' }),
    n({ id: 'd2', title: 'Oublié hier ? D', dedupe_key: 'recap:2026-10-04:d:1', due_date: '2026-10-07', created_at: '2026-10-05T06:00:00Z' }), // la plus récente : gardée
    n({ id: 'both', title: 'Oublié hier ? E', dedupe_key: 'recap:2026-09-10:e:1', due_date: '2026-09-12', created_at: '2026-09-11T06:00:00Z' }),
    n({ id: 'both2', title: 'Oublié hier ? E', dedupe_key: 'recap:2026-10-05:e:1', due_date: '2026-10-08', created_at: '2026-10-05T06:00:00Z' }),
    n({ id: 'nodate', title: 'Oublié hier ? F', dedupe_key: 'recap:2026-10-05:f:1', due_date: null }),
    n({ id: 'done', status: 'dismissed', title: 'Oublié hier ? G', dedupe_key: 'recap:2026-09-01:g:1', due_date: '2026-09-02' }), // déjà traitée
    n({ id: 'mail', title: 'Autre', dedupe_key: 'mailx:deadline', due_date: '2026-08-01' }), // pas un recap
  ],
  today
);
assert.deepEqual(
  plan.map((p) => `${p.id}:${p.reason}`).sort(),
  ['both:perimee', 'd1:doublon', 'edge4:perimee', 'old:perimee']
);
assert.deepEqual(planCleanup([], today), []);
// Deux tâches de même titre (uuid différents) ne sont pas des doublons
assert.deepEqual(
  planCleanup(
    [
      n({ id: 'u1', title: 'Oublié hier ? Relire', dedupe_key: `recap:2026-10-05:${UUID}:1`, due_date: '2026-10-08' }),
      n({ id: 'u2', title: 'Oublié hier ? Relire', dedupe_key: `recap:2026-10-05:${UUID2}:1`, due_date: '2026-10-08' }),
    ],
    today
  ),
  []
);

console.log('check-notifications : OK');
