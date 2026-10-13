// Pousse des notifications issues des mails dans la table `notifications` (Supabase).
// À lancer depuis la racine du repo :
//
//   node --env-file=.env.local scripts/push-notifications.mjs <fichier.json> [--dry-run]
//
// L'analyse des mails est faite par Claude (tâche planifiée ou session), jamais par le site :
// Claude écrit ce fichier, puis lance ce script. Format (30 entrées au plus) :
//   { "notifications": [{ "kind", "title", "detail", "mail_id", "mail_link",
//                         "starts_at", "ends_at", "due_date", "event_id", "dedupe_key" }] }
// - kind : "event" (starts_at requis), "deadline" (due_date requis), "todo", "info" ou "move".
// - "move" = PROPOSITION DE DÉPLACEMENT d'un événement DÉJÀ dans l'agenda (jamais un "event", qui
//   ferait un doublon) : event_id (calendar_events.id, requis) et starts_at (nouvelle heure de début,
//   requis) ; ends_at facultatif (absent = la durée d'origine est gardée). Rien ne bouge avant que
//   Thibaut clique sur Valider dans « À ranger ». Demande supabase/notifications-move.sql (colonne
//   event_id et type "move") ; sans lui, les autres entrées passent et les "move" sont refusés
//   avec un message clair. title = « <événement> reporté » ; event_id n'est permis que pour "move".
// - title (200 car. au plus) et dedupe_key (200 car. au plus) sont requis ; detail : 500 au plus.
// - starts_at / ends_at : ISO 8601 avec fuseau (ex. 2026-09-23T14:00:00+02:00) ; due_date : AAAA-MM-JJ.
// - mail_id : identifiant du fil ; mail_link : http(s)://. JAMAIS le contenu d'un mail : seuls un
//   titre et un détail courts dérivés (tout autre champ est refusé).
// - dedupe_key : clé stable (fil + objet, ex. "<mail_id>:deadline") ; sert à ne jamais recréer une
//   notification déjà connue, qu'elle soit nouvelle, acceptée, ignorée ou supprimée à la main.
//
// Écriture par insertion qui IGNORE les doublons sur dedupe_key : une ligne existante n'est jamais
// modifiée (statut compris), rien n'est supprimé. --dry-run valide le fichier et n'écrit rien
// (n'exige pas Supabase).

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const file = args.find((a) => !a.startsWith('--'));

function fail(message) {
  console.error(message);
  process.exit(1);
}
if (!file) fail('Usage : node --env-file=.env.local scripts/push-notifications.mjs <fichier.json> [--dry-run]');

let input;
try {
  input = JSON.parse(readFileSync(file, 'utf-8'));
} catch (err) {
  fail(`Fichier illisible ou JSON invalide (${file}) : ${err.message}`);
}
const MAX = 30;
if (!Array.isArray(input?.notifications)) fail('Format invalide : "notifications" doit être un tableau (même vide).');
if (input.notifications.length > MAX) fail(`Trop d'entrées : ${input.notifications.length} (${MAX} au plus).`);

const KINDS = ['event', 'deadline', 'todo', 'info', 'move'];
const FIELDS = ['kind', 'title', 'detail', 'mail_id', 'mail_link', 'starts_at', 'ends_at', 'due_date', 'event_id', 'dedupe_key'];
const TZ_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/;
const errors = [];

function text(where, field, value, { required = false, max = 200 } = {}) {
  if (value == null || value === '') {
    if (required) errors.push(`${where} : "${field}" est requis.`);
    return null;
  }
  if (typeof value !== 'string') {
    errors.push(`${where} : "${field}" doit être un texte.`);
    return null;
  }
  if (value.length > max) {
    errors.push(`${where} : "${field}" est trop long (${max} caractères au plus, ${value.length} reçus).`);
    return null;
  }
  return value;
}

function timestamp(where, field, value) {
  if (value == null || value === '') return null;
  const d = typeof value === 'string' && TZ_DATE.test(value) ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) {
    errors.push(`${where} : "${field}" doit être une date ISO 8601 avec fuseau (ex. 2026-09-23T14:00:00+02:00), reçu ${JSON.stringify(value)}.`);
    return null;
  }
  return d.toISOString();
}

function day(where, field, value) {
  if (value == null || value === '') return null;
  const ok = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(`${value}T12:00:00Z`).toISOString().startsWith(value);
  if (!ok) {
    errors.push(`${where} : "${field}" doit être une date AAAA-MM-JJ valide, reçu ${JSON.stringify(value)}.`);
    return null;
  }
  return value;
}

// Map par dedupe_key : deux entrées identiques du fichier n'en font qu'une (la première gagne).
const rows = new Map();
let repeated = 0;
input.notifications.forEach((n, i) => {
  const where = `notifications[${i}]`;
  if (n === null || typeof n !== 'object' || Array.isArray(n)) {
    errors.push(`${where} : doit être un objet.`);
    return;
  }
  for (const key of Object.keys(n)) {
    if (!FIELDS.includes(key)) {
      errors.push(`${where} : champ inconnu "${key}" (champs permis : ${FIELDS.join(', ')} ; le contenu d'un mail ne se stocke pas).`);
    }
  }
  const kind = KINDS.includes(n.kind) ? n.kind : null;
  if (!kind) errors.push(`${where} : "kind" doit valoir ${KINDS.join(', ')}, reçu ${JSON.stringify(n.kind)}.`);
  const row = {
    kind,
    title: text(where, 'title', n.title, { required: true }),
    detail: text(where, 'detail', n.detail, { max: 500 }),
    mail_id: text(where, 'mail_id', n.mail_id),
    mail_link: text(where, 'mail_link', n.mail_link, { max: 1000 }),
    starts_at: timestamp(where, 'starts_at', n.starts_at),
    ends_at: timestamp(where, 'ends_at', n.ends_at),
    due_date: day(where, 'due_date', n.due_date),
    event_id: text(where, 'event_id', n.event_id, { max: 300 }),
    dedupe_key: text(where, 'dedupe_key', n.dedupe_key, { required: true }),
  };
  if (row.mail_link && !/^https?:\/\//i.test(row.mail_link)) errors.push(`${where} : "mail_link" doit commencer par http(s)://.`);
  if (kind === 'event' && !row.starts_at) errors.push(`${where} : un événement exige "starts_at".`);
  if (kind === 'move' && !row.event_id) errors.push(`${where} : un déplacement exige "event_id" (id de l'événement dans calendar_events).`);
  if (kind === 'move' && !row.starts_at) errors.push(`${where} : un déplacement exige "starts_at" (nouvelle heure de début).`);
  if (kind !== 'move' && row.event_id) errors.push(`${where} : "event_id" n'est permis que pour kind "move".`);
  if (kind === 'deadline' && !row.due_date) errors.push(`${where} : une échéance exige "due_date".`);
  if (row.starts_at && row.ends_at && row.ends_at < row.starts_at) errors.push(`${where} : "ends_at" est avant "starts_at".`);
  if (row.dedupe_key) {
    if (rows.has(row.dedupe_key)) repeated += 1;
    else rows.set(row.dedupe_key, row);
  }
});

if (errors.length) fail(`Fichier invalide (${errors.length} erreur(s)) :\n- ${errors.slice(0, 20).join('\n- ')}`);

const list = [...rows.values()];
console.log(`notifications : ${list.length} entrée(s) dans le fichier${repeated ? ` (${repeated} doublon(s) du fichier ignoré(s))` : ''}.`);

if (dry) {
  console.log('[dry-run] fichier valide, rien écrit.');
  process.exit(0);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) fail('NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis (--env-file=.env.local).');
const db = createClient(url, key, { auth: { persistSession: false } });

if (list.length === 0) {
  console.log('notifications : rien à envoyer.');
  process.exit(0);
}

// ON CONFLICT (dedupe_key) DO NOTHING : la réponse ne contient que les lignes réellement insérées.
// `status` n'est jamais envoyé : une nouvelle ligne est « new » (défaut), une ligne existante n'est pas touchée.
// Les déplacements partent à part, sans `event_id` dans les autres lignes : avant l'exécution de
// supabase/notifications-move.sql (colonne absente, type refusé), le reste du lot passe quand même.
const MOVE_SQL = 'les propositions de déplacement demandent supabase/notifications-move.sql (à exécuter dans le SQL Editor de Supabase)';
async function send(rowsToSend, { move }) {
  if (rowsToSend.length === 0) return 0;
  const payload = move ? rowsToSend : rowsToSend.map(({ event_id, ...rest }) => rest);
  const { data, error } = await db.from('notifications').upsert(payload, { onConflict: 'dedupe_key', ignoreDuplicates: true }).select('dedupe_key');
  if (error) {
    if (error.code === 'PGRST205') fail('Table absente : exécuter supabase/notifications.sql dans le SQL Editor de Supabase.');
    if (move && ['PGRST204', '42703', '23514'].includes(error.code)) fail(`Déplacements non écrits : ${MOVE_SQL} (${error.message}).`);
    fail(`Supabase : ${error.message}`);
  }
  return data.length;
}
const moves = list.filter((r) => r.kind === 'move');
const others = list.filter((r) => r.kind !== 'move');
const inserted = (await send(others, { move: false })) + (await send(moves, { move: true }));
console.log(`notifications : ${inserted} nouvelle(s), ${list.length - inserted} déjà connue(s) (laissée(s) telle(s) quelle(s)).`);
