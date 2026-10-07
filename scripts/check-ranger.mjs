// Vérification de la logique pure de « À ranger » : node scripts/check-ranger.mjs
// (aucun accès base : suggestions, composition de la liste, éléments dus, dimanche suivant à Paris).
import assert from 'node:assert/strict';
import { DEFAULT_CATEGORIES } from '../lib/home.js';
import {
  blockOptions, buildRangerItems, cleanBlockTitle, dayError, dueForBlock, fmtSlot, gesturesFor, isRecent, nextSundayParis, sameValue, seriesKey, seriesOf,
  sortItems, suggestPlacement, themesOf, workBlocks,
} from '../lib/ranger.js';

const cats = DEFAULT_CATEGORIES;
const now = new Date('2026-10-07T10:00:00+02:00'); // mercredi 7 octobre 2026, heure de Paris
assert.equal(new Date('2026-10-07T12:00:00Z').getUTCDay(), 3);

const ev = (id, title, day, from, to, color = '6') => ({
  id,
  title,
  starts_at: new Date(`${day}T${from}:00+02:00`).toISOString(),
  ends_at: new Date(`${day}T${to}:00+02:00`).toISOString(),
  all_day: false,
  color_id: color,
});
const events = [
  ev('b-past', '[bloc planifié] Case Coach', '2026-10-06', '14:00', '16:00'), // terminé hier
  ev('course', 'Cours Corporate Finance', '2026-10-08', '08:00', '10:00', '11'), // plage : jamais un bloc de travail
  ev('b-case', '[bloc planifié] Case Coach', '2026-10-08', '14:00', '16:00'),
  ev('b-claude', 'Session de travail Claude', '2026-10-09', '10:00', '12:00'),
  ev('b-fit', 'Fit et networking', '2026-10-12', '09:00', '10:30'),
  ev('b-spircle', 'Spircle', '2026-10-13', '14:00', '17:00'),
  ev('b-late', 'Case Coach', '2026-10-30', '14:00', '16:00'), // au-delà de 14 jours
  { id: 'allday', title: 'Journée', starts_at: '2026-10-09T00:00:00Z', ends_at: '2026-10-10T00:00:00Z', all_day: true, color_id: '6' },
];
const task = (o) => ({ title: 'x', bucket: 'inbox', due_date: null, done_at: null, dropped_at: null, snoozed_until: null, event_id: null, project_slug: null, created_at: '2026-10-07T07:00:00Z', ...o });
const tasks = [task({ id: 't0', title: 'Drill arborescences MECE', event_id: 'b-case', due_date: '2026-10-08' })];
const sug = (title, extra = {}, list = tasks, evs = events) => suggestPlacement({ kind: 'task', title, ...extra }, evs, list, cats, now);

// --- Utilitaires de date ---
assert.equal(fmtSlot(events.find((e) => e.id === 'b-case')), 'jeu. 8/10 14h-16h');
assert.equal(fmtSlot(events.find((e) => e.id === 'b-fit')), 'lun. 12/10 9h-10h30');
assert.equal(cleanBlockTitle('[bloc planifié] Case Coach'), 'Case Coach');
assert.equal(cleanBlockTitle('[Bloc planifie]  '), 'Bloc sans titre');

// --- Dimanche suivant, heure de Paris ---
assert.equal(nextSundayParis(new Date('2026-10-07T10:00:00+02:00')), '2026-10-11'); // mercredi
assert.equal(nextSundayParis(new Date('2026-10-10T12:00:00+02:00')), '2026-10-11'); // samedi
assert.equal(nextSundayParis(new Date('2026-10-11T09:00:00+02:00')), '2026-10-18'); // un dimanche : le suivant
assert.equal(nextSundayParis(new Date('2026-10-11T23:30:00+02:00')), '2026-10-18'); // dimanche soir
assert.equal(nextSundayParis(new Date('2026-10-10T22:30:00Z')), '2026-10-18'); // samedi 22h30 UTC = dimanche 00h30 à Paris
assert.equal(nextSundayParis(new Date('2026-10-12T00:30:00+02:00')), '2026-10-18'); // lundi
assert.equal(nextSundayParis(new Date('2026-10-24T12:00:00+02:00')), '2026-10-25'); // veille du passage à l'heure d'hiver
assert.equal(nextSundayParis(new Date('2026-12-31T12:00:00+01:00')), '2027-01-03'); // fin d'année

// --- Thèmes ---
assert.deepEqual(themesOf('Case Coach n°3 : cas complet'), ['cas']);
assert.deepEqual(themesOf('Drill arborescences MECE'), ['cas']);
assert.deepEqual(themesOf('Écrire à Dimitri Bach'), ['reseau']);
assert.deepEqual(themesOf('Teste LM Studio'), ['claude']);
assert.deepEqual(themesOf('Payer le loyer'), ['admin']);
assert.deepEqual(themesOf('Appeler la banque'), ['admin']); // appeler + banque : administratif, pas réseau
assert.deepEqual(themesOf('Lettre de motivation Bain'), ['candidature']);
assert.deepEqual(themesOf('Révision ACC 812'), ['revision']);
assert.deepEqual(themesOf('Boost CV'), ['cas', 'candidature']);
assert.deepEqual(themesOf('Truc sans thème'), []);

// --- Blocs candidats : travail, à venir, 14 jours, pas « toute la journée » ---
assert.deepEqual(workBlocks(events, cats, now).map((e) => e.id), ['b-case', 'b-claude', 'b-fit', 'b-spircle']);
assert.equal(blockOptions(events, cats, tasks, now).length, 4);
assert.equal(blockOptions(events, cats, tasks, now)[0].tasks, 1); // b-case a déjà une tâche
assert.equal(blockOptions(events, cats, tasks, now, 2).length, 2);
const many = Array.from({ length: 14 }, (_, i) => ev(`m${i}`, 'Case Coach', `2026-10-${String(8 + (i % 6)).padStart(2, '0')}`, '17:00', '18:00'));
assert.equal(blockOptions(many, cats, [], now).length, 10);

// --- Suggestions sur des titres réels ---
{
  const s = sug('Case Coach n°3 : cas complet', { due: '2026-10-11', originTitle: 'Case Coach' });
  assert.equal(s.kind, 'block');
  assert.equal(s.eventId, 'b-case');
  assert.equal(s.label, 'Case Coach, jeu. 8/10 14h-16h');
  assert.match(s.reason, /^Case Coach, jeu\. 8\/10 14h-16h : /);
  assert.match(s.reason, /même thème \(cas\)/);
  assert.match(s.reason, /1 tâche déjà dedans/);
  assert.match(s.reason, /avant l'échéance du 11\/10/);
  assert.deepEqual(s.target, { type: 'block', eventId: 'b-case' });
}
{
  // Échéance avant tous les blocs de thème : le bloc reste le meilleur, mais la raison le dit.
  const s = sug('Case Coach n°4', { due: '2026-10-07' });
  assert.equal(s.kind, 'block');
  assert.match(s.reason, /après l'échéance du 07\/10/);
}
{
  const s = sug('Payer le loyer');
  assert.equal(s.kind, 'today');
  assert.deepEqual(s.target, { type: 'today' });
  assert.match(s.reason, /administrative/);
}
{
  const s = sug('Appeler la banque pour la caution');
  assert.equal(s.kind, 'today'); // admin et court, aucun bloc administratif
}
{
  // S'il existe un bloc administratif, il passe avant « Aujourd'hui ».
  const withAdmin = [...events, ev('b-admin', 'Administratif et paiements', '2026-10-09', '17:00', '18:00')];
  const s = sug('Payer le loyer', {}, tasks, withAdmin);
  assert.equal(s.kind, 'block');
  assert.equal(s.eventId, 'b-admin');
}
{
  const s = sug('Écrire à Dimitri Bach');
  assert.equal(s.kind, 'block');
  assert.equal(s.eventId, 'b-fit');
  assert.match(s.reason, /même thème \(fit et réseau\)/);
}
{
  const s = sug('Teste LM Studio', { project: 'claude' });
  assert.equal(s.eventId, 'b-claude');
  assert.match(s.reason, /même thème \(Claude et outils\)/);
}
{
  const s = sug('Avancer sur la partie pricing', { project: 'spircle' });
  assert.equal(s.eventId, 'b-spircle'); // même projet (titre du bloc = projet)
  assert.match(s.reason, /même projet/);
}
{
  // Aucun thème, aucun projet : premier bloc de travail libre.
  const s = sug('Truc sans thème');
  assert.equal(s.kind, 'block');
  assert.equal(s.eventId, 'b-case');
  assert.match(s.reason, /premier bloc de travail libre/);
}
{
  // Le bloc le plus plein cède : trois tâches dans un bloc de 2 h le rendent presque plein.
  const loaded = [1, 2, 3, 4].map((n) => task({ id: `l${n}`, event_id: 'b-case' }));
  const s = sug('Case Coach n°5', {}, loaded);
  assert.equal(s.kind, 'block');
  assert.match(s.reason, /(même thème \(cas\)|bloc presque plein)/);
  const free = sug('Truc sans thème', {}, loaded);
  assert.notEqual(free.eventId, 'b-case'); // repli : premier bloc libre, pas le plein
}
{
  // Pas de bloc du tout : une tâche non administrative n'a pas de suggestion de bloc.
  const none = sug('Case Coach n°5', {}, [], []);
  assert.equal(none.kind, 'none');
  assert.equal(none.target, null);
  // ... mais une tâche administrative courte reste « Aujourd'hui ».
  assert.equal(sug('Payer le loyer', {}, [], []).kind, 'today');
}
{
  // Tâche terminée dans un bloc : elle ne compte pas dans la charge.
  const s = sug('Case Coach n°6', {}, [task({ id: 'd1', event_id: 'b-case', done_at: '2026-10-07T08:00:00Z' })]);
  assert.match(s.reason, /bloc encore vide/);
}

// --- Notifications ---
const notif = (o) => ({ kind: 'todo', status: 'new', title: 'N', detail: null, due_date: null, mail_link: null, starts_at: null, ends_at: null, dedupe_key: 'k', created_at: '2026-10-07T06:00:00Z', ...o });
{
  const s = suggestPlacement({ kind: 'notification', notifKind: 'event', title: 'Conférence', startsAt: '2026-10-15T15:00:00Z', endsAt: '2026-10-15T16:00:00Z' }, events, tasks, cats, now);
  assert.equal(s.kind, 'accept');
  assert.deepEqual(s.target, { type: 'accept' });
  assert.match(s.reason, /jeu\. 15\/10 17h-18h/);
  const past = suggestPlacement({ kind: 'notification', notifKind: 'event', title: 'Passé', startsAt: '2026-10-01T15:00:00Z' }, events, tasks, cats, now);
  assert.equal(past.kind, 'none');
  const info = suggestPlacement({ kind: 'notification', notifKind: 'info', title: 'Info' }, events, tasks, cats, now);
  assert.equal(info.kind, 'accept');
  const dl = suggestPlacement({ kind: 'notification', notifKind: 'deadline', title: 'Candidature Bain lettre', due: '2026-11-02' }, events, tasks, cats, now);
  assert.equal(dl.kind, 'block'); // une échéance se prépare dans un bloc
}

// --- Composition de la liste ---
{
  const mk = (list) => buildRangerItems({ tasks: list, ideas: [], notifications: [], events, categories: cats, now });
  const keys = (r) => r.items.map((i) => i.id);

  // Exclusions
  const out = mk([
    task({ id: 'done', done_at: '2026-10-06T10:00:00Z' }),
    task({ id: 'dropped', dropped_at: '2026-10-06T10:00:00Z' }),
    task({ id: 'snoozed', snoozed_until: '2026-10-11' }),
    task({ id: 'in-block', event_id: 'b-case' }), // posée dans un bloc à venir
  ]);
  assert.deepEqual(keys(out), []);

  // Inclusions
  const list = [
    task({ id: 'ended', title: 'Case Coach n°1', event_id: 'b-past', due_date: '2026-10-06', created_at: '2026-10-01T08:00:00Z' }),
    task({ id: 'missing', title: 'Bloc disparu', event_id: 'inconnu' }),
    task({ id: 'old-free', title: 'Ancienne sans bloc', created_at: '2026-10-01T08:00:00Z' }),
    task({ id: 'new-free', title: 'Créée ce matin' }),
    task({ id: 'wake', title: 'Report arrivé', snoozed_until: '2026-10-07', created_at: '2026-10-01T08:00:00Z' }),
    task({ id: 'late', title: 'En retard', due_date: '2026-10-03', created_at: '2026-10-01T08:00:00Z' }),
    task({ id: 'today', title: 'Pour aujourd\'hui', bucket: 'today', due_date: '2026-10-07', created_at: '2026-10-01T08:00:00Z' }),
    task({ id: 'colmissing', title: 'Ancienne, colonnes absentes', created_at: '2026-10-01T08:00:00Z', dropped_at: undefined, snoozed_until: undefined }),
  ];
  const r = mk(list);
  assert.deepEqual([...keys(r)].sort(), ['colmissing', 'ended', 'late', 'missing', 'new-free', 'old-free', 'wake']);
  assert.deepEqual(r.todayTasks.map((t) => t.id), ['today']); // planifiée aujourd'hui sans bloc : rangée, pas dans la liste
  const due = Object.fromEntries(r.items.map((i) => [i.id, i.isDue]));
  assert.deepEqual(due, { ended: true, missing: true, 'old-free': true, 'new-free': false, wake: true, late: true, colmissing: true });
  assert.match(r.items.find((i) => i.id === 'ended').dueReason, /retard/);
  assert.equal(r.items.find((i) => i.id === 'ended').origin, 'Case Coach, mar. 6/10 14h-16h');
  assert.match(r.items.find((i) => i.id === 'missing').origin, /introuvable/);
  assert.match(r.items.find((i) => i.id === 'wake').dueReason, /report/);
  assert.deepEqual(r.dueItems.map((i) => i.id).includes('new-free'), false);
  // Tri : en retard (le plus ancien d'abord), puis le reste du plus vieux au plus récent
  assert.deepEqual(r.items.slice(0, 2).map((i) => i.id), ['late', 'ended']);
  assert.equal(r.items.at(-1).id, 'new-free');
  // chaque élément porte sa suggestion
  assert.ok(r.items.every((i) => i.suggestion && 'reason' in i.suggestion));
}
{
  // Idées et notifications
  const ideas = [
    { id: 'i-new', content: 'Tester Obsidian Bases', status: 'new', created_at: '2026-10-07T07:30:00Z' },
    { id: 'i-old', content: 'Vieille idée', status: 'new', created_at: '2026-10-02T07:30:00Z' },
    { id: 'i-dropped', content: 'Abandonnée', status: 'dropped', created_at: '2026-10-02T07:30:00Z' },
    { id: 'i-done', content: 'Faite', status: 'done', created_at: '2026-10-02T07:30:00Z' },
    { id: 'i-snooze', content: 'Reportée', status: 'new', snoozed_until: '2026-10-11', created_at: '2026-10-02T07:30:00Z' },
    { id: 'i-wake', content: 'Report échu', status: 'new', snoozed_until: '2026-10-06', created_at: '2026-10-02T07:30:00Z' },
    { id: 'i-block', content: 'Rangée dans un bloc', status: 'new', event_id: 'b-claude', created_at: '2026-10-02T07:30:00Z' },
    { id: 'i-task', content: 'Rangée sous une tâche', status: 'new', task_id: 't0', created_at: '2026-10-02T07:30:00Z' },
  ];
  const notifications = [
    notif({ id: 'n-recap', title: 'Oublié hier ? Drill', dedupe_key: 'recap:2026-10-06:abc:1' }),
    notif({ id: 'n-old', title: 'Répondre au recruteur', kind: 'todo', created_at: '2026-10-05T06:00:00Z' }),
    notif({ id: 'n-today', title: 'Candidature OW', kind: 'deadline', due_date: '2026-10-26' }),
    notif({ id: 'n-event', title: 'Webinaire', kind: 'event', starts_at: '2026-10-15T15:00:00Z', created_at: '2026-10-06T06:00:00Z' }),
    notif({ id: 'n-done', title: 'Déjà traitée', status: 'accepted' }),
  ];
  const r = buildRangerItems({ tasks, ideas, notifications, events, categories: cats, now });
  assert.deepEqual(r.items.map((i) => i.key).sort(), [
    'idea:i-new', 'idea:i-old', 'idea:i-wake', 'notification:n-event', 'notification:n-old', 'notification:n-today',
  ]);
  const by = Object.fromEntries(r.items.map((i) => [i.key, i]));
  assert.equal(by['idea:i-new'].isDue, false); // créée aujourd'hui : dans la colonne, pas dans l'écran forcé
  assert.equal(by['idea:i-old'].isDue, true);
  assert.equal(by['idea:i-wake'].isDue, true);
  assert.equal(by['notification:n-today'].isDue, false);
  assert.equal(by['notification:n-old'].isDue, true);
  assert.equal(by['notification:n-event'].typeLabel, 'Mail');
  assert.equal(by['idea:i-new'].typeLabel, 'Idée');
  assert.equal(by['notification:n-today'].due, '2026-10-26');
  assert.equal(by['notification:n-event'].suggestion.kind, 'accept');
  assert.equal(by['idea:i-old'].suggestion.kind, 'block');
  assert.equal(by['notification:n-event'].isDue, true); // créée hier
  assert.equal(r.dueItems.length, 4);
}

// --- Séries ---
assert.equal(seriesKey('Payer le loyer octobre'), seriesKey('Payer le loyer de novembre'));
assert.equal(seriesKey('Case Coach n°1'), seriesKey('Case Coach n°3 '));
assert.equal(seriesKey('Drill arborescences MECE'), seriesKey('drill arborescences  MECE'));
assert.notEqual(seriesKey('Payer le loyer'), seriesKey('Payer la caution'));
{
  const mk = (id, title) => ({ id, title, series: seriesKey(title), late: 0, due: null, age: 0 });
  const l = [mk('1', 'Case Coach n°1'), mk('2', 'Payer le loyer'), mk('3', 'Case Coach n°2')];
  assert.deepEqual(seriesOf(l[0], l).map((i) => i.id), ['1', '3']);
  assert.deepEqual(seriesOf(l[1], l).map((i) => i.id), ['2']);
  assert.deepEqual(sortItems([{ ...l[0], late: 2 }, { ...l[1], due: '2026-10-09' }, { ...l[2], late: 5 }]).map((i) => i.id), ['3', '1', '2']);
}

// --- Gestes disponibles ---
{
  const item = (o) => ({ kind: 'task', suggestion: { target: { type: 'today' } }, ...o });
  assert.deepEqual(gesturesFor(item({}), { ready: true }), { validate: true, elsewhere: true, done: true, doneLabel: 'Cocher', drop: true, later: true });
  const noSql = gesturesFor(item({}), { ready: false });
  assert.equal(noSql.drop, false);
  assert.equal(noSql.later, false);
  assert.equal(noSql.validate, true); // le reste marche avant l'exécution du SQL
  const mail = gesturesFor(item({ kind: 'notification', notifKind: 'todo' }), { ready: false });
  assert.equal(mail.doneLabel, 'Déjà fait');
  assert.equal(mail.drop, true); // une proposition s'écarte sans la colonne
  assert.equal(gesturesFor(item({ kind: 'notification', notifKind: 'info' })).doneLabel, 'Cocher');
  assert.equal(gesturesFor(item({ kind: 'notification', notifKind: 'event' })).elsewhere, false);
  assert.equal(gesturesFor(item({ suggestion: { target: null } })).validate, false);
}

// --- Règles pures des gestes : affectation à un bloc, jour choisi, comparaison pour l'annulation ---
{
  // 1. Un bloc ne remplace pas une échéance existante ; sans échéance, il pose la date du bloc.
  assert.equal(dueForBlock('2026-10-09', '2026-10-12'), '2026-10-09');
  assert.equal(dueForBlock(null, '2026-10-12'), '2026-10-12');
  assert.equal(dueForBlock(undefined, '2026-10-12'), '2026-10-12');
  assert.equal(dueForBlock('', '2026-10-12'), '2026-10-12');
  // 6. Jour choisi : date réelle, pas dans le passé (aujourd'hui = 2026-10-07).
  assert.equal(dayError('2026-10-07', '2026-10-07'), null);
  assert.equal(dayError('2026-12-31', '2026-10-07'), null);
  assert.equal(dayError('2028-02-29', '2026-10-07'), null); // bissextile
  assert.match(dayError('2026-10-06', '2026-10-07'), /déjà passé/);
  assert.match(dayError('2026-02-30', '2026-10-07'), /n'existe pas/);
  assert.match(dayError('2027-02-29', '2026-10-07'), /n'existe pas/);
  assert.match(dayError('2026-13-01', '2026-10-07'), /n'existe pas/);
  assert.match(dayError('07/10/2026', '2026-10-07'), /invalide/);
  assert.match(dayError(undefined, '2026-10-07'), /invalide/);
  // Annulation : comparaison à l'état relu en base.
  assert.ok(sameValue('2026-10-07T08:00:00.000Z', '2026-10-07T10:00:00+02:00')); // même instant
  assert.ok(sameValue(null, undefined));
  assert.ok(!sameValue('2026-10-07', null));
  assert.ok(!sameValue('2026-10-07T08:00:00Z', '2026-10-07T08:00:01Z'));
  const nowMs = Date.parse('2026-10-07T10:00:00Z');
  assert.ok(isRecent('2026-10-07T09:45:00Z', nowMs, 30 * 60000));
  assert.ok(!isRecent('2026-10-07T09:00:00Z', nowMs, 30 * 60000));
  assert.ok(!isRecent('2026-10-07T10:30:00Z', nowMs, 30 * 60000)); // dans le futur : refusé
  assert.ok(!isRecent(null, nowMs, 30 * 60000));
}

console.log('check-ranger : tout est bon');
