// Tests de lib/meeting.js (liens de visio des événements). node scripts/check-meeting.mjs
import assert from 'node:assert/strict';
import { extractMeetingUrl, meetingProvider, meetingUrlOf, mergeMeetingLinks, resolveMeetingLinks } from '../lib/meeting.js';

// Fournisseurs reconnus, pages d'accueil et http refusés.
assert.equal(meetingProvider('https://meet.google.com/abc-defg-hij'), 'Meet');
assert.equal(meetingProvider('https://teams.microsoft.com/l/meetup-join/19%3ameeting_x%40thread.v2/0?context=%7b%7d'), 'Teams');
assert.equal(meetingProvider('https://teams.live.com/meet/9876543210'), 'Teams');
assert.equal(meetingProvider('https://us02web.zoom.us/j/123456789?pwd=abc'), 'Zoom');
assert.equal(meetingProvider('https://edhec.webex.com/meet/jdupont'), 'Webex');
assert.equal(meetingProvider('https://meet.google.com/'), null);
assert.equal(meetingProvider('http://meet.google.com/abc-defg-hij'), null);
assert.equal(meetingProvider('https://evilzoom.us/j/1'), null);
assert.equal(meetingProvider('https://zoom.us.example.com/j/1'), null);
assert.equal(meetingProvider('https://example.com/j/1'), null);
assert.equal(meetingProvider('pas une url'), null);
assert.equal(meetingProvider(undefined), null);

// Extraction dans un texte libre : première visio, ponctuation finale retirée, autres liens ignorés.
assert.equal(extractMeetingUrl('Salle 204 ou https://edhec.fr/plan puis https://meet.google.com/abc-defg-hij.'), 'https://meet.google.com/abc-defg-hij');
assert.equal(extractMeetingUrl('Lien : <https://us02web.zoom.us/j/1234?pwd=x>'), 'https://us02web.zoom.us/j/1234?pwd=x');
assert.equal(extractMeetingUrl('Salle 204'), null);
assert.equal(extractMeetingUrl(null), null);

// Réglage enregistré : entrées invalides ignorées, src par défaut google.
assert.deepEqual(resolveMeetingLinks({ a: { url: 'https://meet.google.com/x-y-z', at: 5 }, b: { url: 'https://example.com/x' }, c: 'nope' }), {
  a: { url: 'https://meet.google.com/x-y-z', src: 'google', at: 5 },
});
assert.deepEqual(resolveMeetingLinks(null), {});
assert.deepEqual(resolveMeetingLinks([1]), {});

// Lien de l'événement : réglage d'abord, sinon le lieu.
const links = { e1: { url: 'https://teams.microsoft.com/l/meetup-join/1', src: 'mail', at: 1 } };
assert.equal(meetingUrlOf({ id: 'e1', location: 'https://meet.google.com/a-b-c' }, links), 'https://teams.microsoft.com/l/meetup-join/1');
assert.equal(meetingUrlOf({ id: 'e2', location: 'Visio https://meet.google.com/a-b-c' }, links), 'https://meet.google.com/a-b-c');
assert.equal(meetingUrlOf({ id: 'e3', location: 'Salle 12' }, links), null);

// Fusion : ajout daté, entrée identique non réécrite, URL invalide ignorée, plafond par ancienneté.
const merged = mergeMeetingLinks(links, { e2: { url: 'https://meet.google.com/a-b-c' }, e3: { url: 'https://x.com/1' } }, 100);
assert.deepEqual(merged, { ...links, e2: { url: 'https://meet.google.com/a-b-c', src: 'google', at: 100 } });
assert.equal(mergeMeetingLinks(merged, { e1: { url: links.e1.url, src: 'mail' } }, 200).e1.at, 1);
const capped = mergeMeetingLinks({ old: { url: 'https://meet.google.com/o-l-d', at: 1 } }, { neu: { url: 'https://meet.google.com/n-e-w' } }, 300, 1);
assert.deepEqual(Object.keys(capped), ['neu']);

console.log('check-meeting : OK');
