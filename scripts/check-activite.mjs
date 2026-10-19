// Vérification de la logique pure de l'activité du jour : node scripts/check-activite.mjs (aucun accès base).
import assert from 'node:assert/strict';
import { dossierCourt, lignesEvenements, lignesSessions, lireDepuis, lirePayload, themeOf } from '../lib/activite.js';

// Thème : le titre prime sur le dossier, « Système » par défaut.
assert.equal(themeOf({ titre: 'Révision AFA : entraînement', dossier: 'C:\\x\\tests-conseil' }), 'Cours EDHEC');
assert.equal(themeOf({ titre: 'Bilan tests-conseil 2026-10-19', dossier: 'C:\\x\\tests-conseil' }), 'Carrière');
assert.equal(themeOf({ titre: 'Activité et progression quotidienne', dossier: 'C:\\x\\tests-conseil' }), 'Système');
assert.equal(themeOf({ titre: 'Veille offres stage et premier CDI' }), 'Carrière');
assert.equal(themeOf({ titre: 'Cadran persistance', dossier: 'C:\\GLOBAL\\Projets\\bureau-cadran' }), 'Dashboard');
assert.equal(themeOf({ titre: 'Veille design : nouveaux concepts' }), 'Design');
assert.equal(themeOf({ titre: 'Accès sessions tâches planifiées', dossier: 'C:\\x\\scratch-2026-10-07-050da8' }), 'Système');
assert.equal(themeOf({ titre: null, dossier: 'C:\\GLOBAL\\Projets\\Spircle\\core' }), 'Spircle');
assert.equal(themeOf({}), 'Système');
assert.equal(themeOf({ titre: 'Recasser le site' }), 'Système'); // « cas » en mot entier seulement

// Dossier : jamais le chemin complet ; espace de travail temporaire = « sans dossier ».
assert.equal(dossierCourt('C:\\Users\\thiba\\GLOBAL\\Projets\\bureau-cadran'), 'bureau-cadran');
assert.equal(dossierCourt('C:\\Users\\thiba\\AppData\\Roaming\\Claude\\scratch-workspaces\\a\\b\\scratch-2026-10-07-050da8'), 'sans dossier');
assert.equal(dossierCourt('/home/x/projet/'), 'projet');
assert.equal(dossierCourt(null), null);

// Corps du hook.
const now = new Date('2026-10-19T10:00:00Z');
const ok = lirePayload({ session_id: 'a9c82b43-e715-4c58', evenement: 'prompt', titre: 'Ma journée', dossier: 'C:\\x', routine: true, at: '2026-10-19T09:59:00Z' }, now);
assert.equal(ok.ok, true);
assert.equal(ok.valeur.p_at, '2026-10-19T09:59:00.000Z');
assert.equal(ok.valeur.p_routine, true);
assert.equal(lirePayload({ session_id: 'abc def ghi', evenement: 'prompt' }, now).ok, false);
assert.equal(lirePayload({ session_id: 'a9c82b43', evenement: 'autre' }, now).ok, false);
assert.equal(lirePayload(null, now).ok, false);
// Heure absurde ou trop décalée : heure du serveur.
assert.equal(lirePayload({ session_id: 'a9c82b43', evenement: 'stop', at: '2020-01-01T00:00:00Z' }, now).valeur.p_at, now.toISOString());
assert.equal(lirePayload({ session_id: 'a9c82b43', evenement: 'stop', at: 'n/importe' }, now).valeur.p_at, now.toISOString());
assert.equal(lirePayload({ session_id: 'a9c82b43', evenement: 'stop', routine: 'oui' }, now).valeur.p_routine, false);
assert.equal(lirePayload({ session_id: 'a9c82b43', evenement: 'stop', titre: 'x'.repeat(500) }, now).valeur.p_titre.length, 200);

// « depuis » borné à 3 jours, défaut 24 h.
assert.equal(lireDepuis('2026-10-19T02:00:00Z', now).toISOString(), '2026-10-19T02:00:00.000Z');
assert.equal(lireDepuis('2026-10-19T04:00:00+02:00', now).toISOString(), '2026-10-19T02:00:00.000Z');
assert.equal(lireDepuis('2026-01-01T00:00:00Z', now).toISOString(), '2026-10-16T10:00:00.000Z');
assert.equal(lireDepuis('2027-01-01T00:00:00Z', now).toISOString(), now.toISOString());
assert.equal(lireDepuis(null, now).toISOString(), '2026-10-18T10:00:00.000Z');
assert.equal(lireDepuis('abc', now).toISOString(), '2026-10-18T10:00:00.000Z');

// Lignes.
const sessions = [
  { session_id: 's1', titre: 'Révision AFA', dossier: 'C:\\x\\tests-conseil', routine: false },
  { session_id: 's2', titre: 'Ranger les sessions de la veille (5h)', dossier: 'C:\\y\\scratch-2026-10-07-050da8', routine: true },
];
const evs = [
  { session_id: 's1', at: '2026-10-19T07:30:00Z', evenement: 'prompt' },
  { session_id: 's2', at: '2026-10-19T03:00:00Z', evenement: 'prompt' },
  { session_id: 's1', at: '2026-10-19T07:45:00Z', evenement: 'stop' },
  { session_id: 's1', at: '2026-10-19T07:50:00Z', evenement: 'prompt' },
  { session_id: 's3', at: '2026-10-19T08:00:00Z', evenement: 'stop' }, // session inconnue : gardée, sans titre
];
const ls = lignesSessions(sessions, evs);
assert.deepEqual(ls.map((r) => r.id), ['s1', 's2']); // s3 sans titre : écartée
assert.deepEqual(ls[0], {
  id: 's1', titre: 'Révision AFA', theme: 'Cours EDHEC', type: 'travail', dossier: 'tests-conseil',
  debut: '2026-10-19T07:30:00.000Z', derniere: '2026-10-19T07:50:00.000Z', messages: 2,
});
assert.equal(ls[1].type, 'routine');
assert.equal(ls[1].dossier, 'sans dossier');
assert.deepEqual(lignesSessions([], []), []);

const le = lignesEvenements(sessions, evs);
assert.equal(le.length, 4);
assert.equal(le[0].session_id, 's2');
assert.equal(le[0].type, 'routine');
assert.ok(le.every((e) => e.session_id !== 's3'));

console.log('check-activite : OK');
