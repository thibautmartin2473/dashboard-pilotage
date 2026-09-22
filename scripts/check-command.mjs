// Vérification de l'interpréteur de la zone Commande : node scripts/check-command.mjs
// `now` injecté : lundi 2026-09-21 à 15h, heure de Paris (13h UTC).
import assert from 'node:assert/strict';
import { EXAMPLES, interpret } from '../lib/command.js';
import { parisToIso } from '../lib/home.js';

const now = new Date('2026-09-21T13:00:00Z');
const ok = (text, at = now) => {
  const r = interpret(text, at);
  assert.ok(r.ok, `${text} -> ${r.message}`);
  return r.actions;
};
const events = (text, at) => ok(text, at).map((a) => [a.kind, a.title, a.start, a.end]);
const unclear = (text, part) => {
  const r = interpret(text, now);
  assert.equal(r.ok, false, text);
  assert.ok(r.message.startsWith("Je n'ai pas compris"), r.message);
  assert.equal(r.examples.length, 3);
  if (part) assert.match(r.message, part, r.message);
};

// Phrase d'exemple : deux événements, mercredi 23 et vendredi 25, 14h-16h (avec ou sans majuscule saisie).
const sample = ok('ajoute moi une session de travail claude de 14 à 16h mercredi et vendredi');
assert.deepEqual(
  sample.map((a) => [a.kind, a.title, a.start, a.end]),
  [
    ['event', 'Session de travail Claude', '2026-09-23T14:00', '2026-09-23T16:00'],
    ['event', 'Session de travail Claude', '2026-09-25T14:00', '2026-09-25T16:00'],
  ]
);
assert.equal(sample[0].label, "Créer l'événement « Session de travail Claude » · mer. 23 sept. 14h–16h");
assert.equal(parisToIso(sample[0].start), '2026-09-23T12:00:00.000Z'); // heure de Paris (UTC+2)
assert.deepEqual(events('Ajoute-moi une Session de travail Claude de 14h à 16h mercredi et vendredi'), events(
  'ajoute moi une session de travail claude de 14 à 16h mercredi et vendredi'
));

// Heures : minutes, passage de minuit, « à 14h » seul (1 h), durée.
assert.deepEqual(events('ajoute une réunion de 9h30 à 11h demain'), [['event', 'Réunion', '2026-09-22T09:30', '2026-09-22T11:00']]);
assert.deepEqual(events('ajoute une veille de 23h à 1h vendredi'), [['event', 'Veille', '2026-09-25T23:00', '2026-09-26T01:00']]);
assert.match(ok('ajoute une veille de 23h à 1h vendredi')[0].label, /23h–1h \(le lendemain\)$/);
assert.deepEqual(events('ajoute une réunion demain à 10h'), [['event', 'Réunion', '2026-09-22T10:00', '2026-09-22T11:00']]);
assert.deepEqual(events('ajoute un atelier mercredi à 14h pendant 2h'), [['event', 'Atelier', '2026-09-23T14:00', '2026-09-23T16:00']]);
assert.deepEqual(events('ajoute un atelier mercredi à 14h30 pendant 45 min'), [['event', 'Atelier', '2026-09-23T14:30', '2026-09-23T15:15']]);
assert.deepEqual(events('ajoute un atelier vendredi à 23h pendant 2h'), [['event', 'Atelier', '2026-09-25T23:00', '2026-09-26T01:00']]);
assert.deepEqual(events('ajoute un point entre 10h et 10h30 demain'), [['event', 'Point', '2026-09-22T10:00', '2026-09-22T10:30']]);
assert.deepEqual(events('ajoute un point 14h-15h30 demain'), [['event', 'Point', '2026-09-22T14:00', '2026-09-22T15:30']]);
assert.deepEqual(events('ajoute un point demain à 10h dans mon agenda'), [['event', 'Point', '2026-09-22T10:00', '2026-09-22T11:00']]);

// Jours : prochaine occurrence (aujourd'hui si l'heure n'est pas passée), « prochain », dates.
const day = (text, at) => events(text, at).map((e) => e[2].slice(0, 10));
assert.deepEqual(day('ajoute un point lundi à 16h'), ['2026-09-21']); // lundi 15h : 16h est à venir
assert.deepEqual(day('ajoute un point lundi à 10h'), ['2026-09-28']); // 10h est passée
assert.deepEqual(day('ajoute un point vendredi à 10h'), ['2026-09-25']); // pas la semaine suivante
assert.deepEqual(day('ajoute un point lundi prochain à 9h'), ['2026-09-28']);
assert.deepEqual(day('ajoute un point vendredi prochain à 9h'), ['2026-10-02']);
assert.deepEqual(day('ajoute un point après-demain à 9h'), ['2026-09-23']);
assert.deepEqual(day("ajoute un point aujourd'hui à 17h"), ['2026-09-21']);
assert.deepEqual(day('ajoute un point le 24 septembre à 14h'), ['2026-09-24']);
assert.deepEqual(day('ajoute un point le 24/09 à 14h'), ['2026-09-24']);
assert.deepEqual(day('ajoute un point le 3 mars 2027 à 14h'), ['2027-03-03']);
assert.deepEqual(day('ajoute un point le 3 septembre à 14h'), ['2027-09-03']); // déjà passé : l'an prochain
assert.deepEqual(day('ajoute un point à 17h'), ['2026-09-21']); // sans jour : la prochaine fois
assert.deepEqual(day('ajoute un point à 10h'), ['2026-09-22']);
assert.deepEqual(day('ajoute une séance de sport de 18h à 19h30 lundi, mardi et jeudi'), ['2026-09-21', '2026-09-22', '2026-09-24']);
assert.deepEqual(day('ajoute un point mercredi et mercredi à 9h'), ['2026-09-23']); // doublon retiré
// 23h30 UTC le 20 = lundi 1h30 à Paris : « lundi à 10h » est aujourd'hui.
assert.deepEqual(day('ajoute un point lundi à 10h', new Date('2026-09-20T23:30:00Z')), ['2026-09-21']);

// Tâches et idées.
assert.deepEqual(ok('tâche : appeler la banque pour vendredi'), [
  { kind: 'task', title: 'Appeler la banque', due_date: '2026-09-25', label: 'Créer la tâche « Appeler la banque » · pour ven. 25 sept.' },
]);
assert.deepEqual(ok('tâche : ranger le bureau').map((a) => [a.title, a.due_date]), [['Ranger le bureau', null]]);
assert.deepEqual(ok('à faire : envoyer le rapport demain').map((a) => [a.title, a.due_date]), [['Envoyer le rapport', '2026-09-22']]);
assert.deepEqual(ok("rappelle-moi de payer le loyer le 25").map((a) => [a.title, a.due_date]), [['Payer le loyer', '2026-09-25']]);
assert.deepEqual(ok("rappelle-moi d'appeler Paul").map((a) => [a.title, a.due_date]), [['Appeler Paul', null]]);
// Jour intercalé avant la liaison : « d' » ne doit pas rester collé au titre.
assert.deepEqual(ok("rappelle moi jeudi d'acheter du lait").map((a) => [a.title, a.due_date]), [['Acheter du lait', '2026-09-24']]);
assert.deepEqual(ok('rappelle-moi vendredi de payer le loyer').map((a) => [a.title, a.due_date]), [['Payer le loyer', '2026-09-25']]);
assert.deepEqual(ok('tâche : rendre le rapport lundi prochain').map((a) => a.due_date), ['2026-09-28']);
assert.deepEqual(ok('ajoute une tâche : relire le contrat avant le 30 septembre').map((a) => [a.title, a.due_date]), [['Relire le contrat', '2026-09-30']]);
assert.deepEqual(ok('idée : refaire la page /brain en Kanban'), [
  { kind: 'idea', content: 'Refaire la page /brain en Kanban', label: "Ajouter l'idée « Refaire la page /brain en Kanban »" },
]);
assert.equal(ok('ajoute une idée : Tester Spircle avec Gmail')[0].content, 'Tester Spircle avec Gmail');

// Tout le reste : message explicite, trois exemples, rien d'interprété.
assert.equal(EXAMPLES.length, 3);
unclear('il fait beau aujourd\'hui');
unclear('bonjour');
unclear('', /Écris/);
unclear('ajoute une réunion mercredi', /heure/);
unclear('demain à 10h', /titre/); // une heure sans titre
unclear('ajoute une réunion de 11h à 9h demain', /fin/); // fin avant le début, pas de minuit valide
unclear('ajoute une réunion de 14h à 14h demain', /fin/);
unclear('ajoute une réunion de 25h à 26h demain', /existe pas/);
unclear('ajoute une réunion le 31 février à 10h', /existe pas/);
unclear('ajoute une réunion chaque lundi à 10h', /récurrent/);
unclear('tâche :', /titre/);
unclear(`idée : ${'x'.repeat(2001)}`, /trop long/);

console.log('check-command : OK');
