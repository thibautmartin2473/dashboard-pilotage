// Pousse un instantané de l'agenda et des notifications dans les tables de cache
// calendar_events et mail_items (Supabase). À lancer depuis la racine du repo :
//
//   node --env-file=.env.local scripts/push-agenda.mjs <fichier.json> [--dry-run]
//
// Le site ne peut pas lire Google : Claude récupère les données en session, écrit
// ce fichier, puis lance ce script. Format (dates ISO 8601 avec fuseau) :
//   { "events": [{ "id", "title", "start", "end", "all_day", "location", "link", "origin", "colorId" }],
//     "mails":  [{ "id", "from", "subject", "received_at", "source", "unread", "link" }] }
// Un événement « toute la journée » accepte aussi une date seule (AAAA-MM-JJ).
// "origin" (facultatif) : "google" par défaut ; "local" = créé sur le site, jamais purgé.
// "colorId" (facultatif) : colorId Google Agenda de l'événement, pour le code couleur de l'accueil
// (11 Tomate = cours EDHEC, 9 Myrtille = autres événements, 6 Mandarine = tâches/blocs de travail).
// Colonne calendar_events.color_id : supabase/agenda-links.sql.
// Mails : "source" = "gmail" (défaut) ou "edhec" ; "unread" = true par défaut. Règle EDHEC : un mail
// est "edhec" s'il porte le libellé Gmail EDHEC ou si l'expéditeur ou un destinataire est en
// edhec.com ; sinon "gmail". Seuls les 50 mails les plus récents sont gardés.
//
// Ce sont des caches d'un instantané : upsert des lignes reçues, puis suppression des lignes
// absentes du fichier : tous les mails, mais uniquement les événements d'origine "google"
// (les événements créés sur le site, origin = 'local', ne sont jamais touchés).
// --dry-run valide le fichier et n'écrit rien (n'exige pas Supabase).
//
// Déplacements faits sur le site (glisser-déposer, poignées, flèches) : un événement Google déplacé
// porte calendar_events.pending_move = true (supabase/agenda-moves.sql). Tant que c'est le cas, ce
// script ne l'écrase pas et ne le purge pas, même s'il est dans le fichier ou absent de celui-ci.
// Cycle, en session Claude :
//   node --env-file=.env.local scripts/push-agenda.mjs --pending
//     -> JSON [{ "id", "title", "starts_at", "ends_at" }] sur la sortie standard (ISO UTC) ;
//   écrire ces heures dans Google Agenda (même id d'événement), puis acquitter :
//   node --env-file=.env.local scripts/push-agenda.mjs --ack <id1,id2,...>
//     -> remet pending_move = false ; la synchro suivante reprend l'événement tel que dans Google.

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const ackAt = args.indexOf('--ack');
const file = args.find((a, i) => !a.startsWith('--') && (ackAt < 0 || i !== ackAt + 1));

function fail(message) {
  console.error(message);
  process.exit(1);
}

function connect() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) fail('NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis (--env-file=.env.local).');
  return createClient(url, key, { auth: { persistSession: false } });
}

function dbFail(error) {
  fail(
    error.code === 'PGRST205'
      ? 'Table absente : exécuter supabase/agenda.sql dans le SQL Editor de Supabase.'
      : ['PGRST204', '42703'].includes(error.code)
        ? `Colonne absente : exécuter le SQL correspondant de supabase/ (dashboard-edit.sql, agenda-links.sql ou agenda-moves.sql) dans le SQL Editor de Supabase (${error.message}).`
        : `Supabase : ${error.message}`
  );
}

// Événements déplacés sur le site, pas encore renvoyés vers Google. Colonne absente (agenda-moves.sql
// pas exécuté) : aucun déplacement ne peut être en attente, on le dit sur stderr.
async function pendingMoves(db) {
  const { data, error } = await db
    .from('calendar_events')
    .select('id, title, starts_at, ends_at')
    .eq('pending_move', true)
    .order('starts_at');
  if (error && ['PGRST204', '42703'].includes(error.code)) {
    console.error('Colonne pending_move absente (supabase/agenda-moves.sql pas exécuté) : aucun déplacement en attente.');
    return [];
  }
  if (error) dbFail(error);
  return data;
}

if (args.includes('--pending')) {
  console.log(JSON.stringify(await pendingMoves(connect()), null, 2));
  process.exit(0);
}

if (ackAt >= 0) {
  const ids = String(args[ackAt + 1] ?? '').split(',').map((id) => id.trim()).filter(Boolean);
  if (!ids.length) fail('Usage : node --env-file=.env.local scripts/push-agenda.mjs --ack <id1,id2,...>');
  const { data, error } = await connect()
    .from('calendar_events')
    .update({ pending_move: false })
    .in('id', ids)
    .eq('pending_move', true)
    .select('id');
  if (error) dbFail(error);
  const done = new Set(data.map((r) => r.id));
  console.log(`${done.size} déplacement(s) acquitté(s).`);
  const unknown = ids.filter((id) => !done.has(id));
  if (unknown.length) console.error(`Pas en attente (ou introuvable) : ${unknown.join(', ')}`);
  process.exit(0);
}

if (!file) {
  fail(
    'Usage : node --env-file=.env.local scripts/push-agenda.mjs <fichier.json> [--dry-run]\n' +
      '        node --env-file=.env.local scripts/push-agenda.mjs --pending\n' +
      '        node --env-file=.env.local scripts/push-agenda.mjs --ack <id1,id2,...>'
  );
}

let input;
try {
  input = JSON.parse(readFileSync(file, 'utf-8'));
} catch (err) {
  fail(`Fichier illisible ou JSON invalide (${file}) : ${err.message}`);
}
if (!Array.isArray(input?.events) || !Array.isArray(input?.mails)) {
  fail('Format invalide : "events" et "mails" doivent être deux tableaux (même vides).');
}

const TZ_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/;
const errors = [];

// Renvoie l'ISO UTC, ou null (et une erreur) si la date est absente/invalide.
function date(where, field, value, { required = false, dayOk = false } = {}) {
  if (value == null || value === '') {
    if (required) errors.push(`${where} : "${field}" est requis.`);
    return null;
  }
  // Date seule d'un événement « toute la journée » : midi UTC = même jour à Paris.
  if (dayOk && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) value += 'T12:00:00Z';
  const d = typeof value === 'string' && TZ_DATE.test(value) ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) {
    errors.push(`${where} : "${field}" doit être une date ISO 8601 avec fuseau (ex. 2026-09-21T14:30:00+02:00), reçu ${JSON.stringify(value)}.`);
    return null;
  }
  return d.toISOString();
}

function text(where, field, value, { required = false } = {}) {
  if (value == null || value === '') {
    if (required) errors.push(`${where} : "${field}" est requis.`);
    return null;
  }
  if (typeof value !== 'string') {
    errors.push(`${where} : "${field}" doit être un texte.`);
    return null;
  }
  return value;
}

function link(where, value) {
  const v = text(where, 'link', value);
  if (v && !/^https?:\/\//i.test(v)) errors.push(`${where} : "link" doit commencer par http(s)://.`);
  return v;
}

function bool(where, field, value, fallback = false) {
  if (value == null) return fallback;
  if (typeof value !== 'boolean') errors.push(`${where} : "${field}" doit être true ou false.`);
  return value === true;
}

function oneOf(where, field, value, allowed, fallback) {
  if (value == null || value === '') return fallback;
  if (!allowed.includes(value)) {
    errors.push(`${where} : "${field}" doit valoir ${allowed.join(' ou ')}, reçu ${JSON.stringify(value)}.`);
    return fallback;
  }
  return value;
}

const syncedAt = new Date().toISOString();
// Map par id : deux entrées identiques ne doivent pas se heurter dans un même upsert.
const events = new Map();
input.events.forEach((e, i) => {
  const where = `events[${i}]`;
  const all_day = bool(where, 'all_day', e?.all_day);
  const id = text(where, 'id', e?.id, { required: true });
  const row = {
    id,
    title: text(where, 'title', e?.title, { required: true }),
    starts_at: date(where, 'start', e?.start, { required: true, dayOk: all_day }),
    ends_at: date(where, 'end', e?.end, { dayOk: all_day }),
    all_day,
    location: text(where, 'location', e?.location),
    link: link(where, e?.link),
    origin: oneOf(where, 'origin', e?.origin, ['google', 'local'], 'google'),
    color_id: text(where, 'colorId', e?.colorId),
    synced_at: syncedAt,
  };
  if (row.ends_at && row.starts_at && row.ends_at < row.starts_at) errors.push(`${where} : "end" est avant "start".`);
  if (id) events.set(id, row);
});

const mails = new Map();
input.mails.forEach((m, i) => {
  const where = `mails[${i}]`;
  const id = text(where, 'id', m?.id, { required: true });
  const row = {
    id,
    sender: text(where, 'from', m?.from),
    subject: text(where, 'subject', m?.subject),
    received_at: date(where, 'received_at', m?.received_at),
    source: oneOf(where, 'source', m?.source, ['gmail', 'edhec'], 'gmail'),
    unread: bool(where, 'unread', m?.unread, true),
    link: link(where, m?.link),
    synced_at: syncedAt,
  };
  if (id) mails.set(id, row);
});

if (errors.length) fail(`Fichier invalide (${errors.length} erreur(s)) :\n- ${errors.slice(0, 20).join('\n- ')}`);

// Les 50 mails les plus récents (les sans-date en dernier).
const MAIL_LIMIT = 50;
const recent = [...mails.values()].sort((a, b) => (b.received_at ?? '').localeCompare(a.received_at ?? ''));
if (recent.length > MAIL_LIMIT) console.log(`mails : ${recent.length} reçus, seuls les ${MAIL_LIMIT} plus récents sont gardés.`);

// `purge` : filtre des lignes que ce script a le droit de supprimer.
const tables = [
  { name: 'calendar_events', rows: [...events.values()], purge: (q) => q.eq('origin', 'google') },
  { name: 'mail_items', rows: recent.slice(0, MAIL_LIMIT), purge: (q) => q },
];
for (const t of tables) console.log(`${t.name} : ${t.rows.length} ligne(s) dans le fichier.`);

if (dry) {
  console.log('[dry-run] fichier valide, rien écrit.');
  process.exit(0);
}

const db = connect();

// Déplacés sur le site et pas encore renvoyés vers Google : ni écrasés, ni purgés.
const held = new Set((await pendingMoves(db)).map((e) => e.id));
if (held.size) {
  tables[0].rows = tables[0].rows.filter((r) => !held.has(r.id));
  console.log(`calendar_events : ${held.size} déplacement(s) en attente conservé(s) (voir --pending).`);
}

for (const { name, rows, purge } of tables) {
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await db.from(name).upsert(rows.slice(i, i + 200), { onConflict: 'id' });
    if (error) dbFail(error);
  }
  // Instantané : on retire ce qui n'est plus dans le fichier (cache), dans le périmètre de `purge`.
  const { data: existing, error } = await purge(db.from(name).select('id'));
  if (error) dbFail(error);
  const keep = new Set([...rows.map((r) => r.id), ...(name === 'calendar_events' ? held : [])]);
  const stale = existing.map((r) => r.id).filter((id) => !keep.has(id));
  for (let i = 0; i < stale.length; i += 100) {
    const { error: delError } = await db.from(name).delete().in('id', stale.slice(i, i + 100));
    if (delError) dbFail(delError);
  }
  console.log(`${name} : ${rows.length} upsertée(s), ${stale.length} supprimée(s).`);
}
