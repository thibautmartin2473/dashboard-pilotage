// Importe les saves Instagram dans la table instagram_saves (Supabase). À lancer
// depuis la racine du repo :
//
//   node --env-file=.env.local scripts/import-instagram.mjs [dossier] [--dry-run]
//
// Source : les notes Obsidian du skill instagram-memoire (frontmatter `source:
// instagram`, `url`, `author`, `saved_at`, `topics`, `category`, `kind`, lieu,
// `resume`, `retenir`, `repond_a`, `recos`, `attention`, `type` ; légende = corps de la note avant « ## Transcription »,
// transcription = texte après). Par défaut le dossier Vault/03 Ressources/Instagram.
// Idempotent : upsert sur `url`, on peut relancer. Les colonnes viennent de
// supabase/instagram_v2.sql (à exécuter d'abord). N'appelle jamais Instagram.
// --dry-run n'écrit rien et n'exige pas Supabase.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const dry = args.includes('--dry-run');
const dir =
  args.find((a) => !a.startsWith('--')) ?? fileURLToPath(new URL('../../../Vault/03 Ressources/Instagram', import.meta.url));

function fail(message) {
  console.error(message);
  process.exit(1);
}

function markdownFiles(folder) {
  return readdirSync(folder, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? markdownFiles(join(folder, e.name)) : e.name.endsWith('.md') ? [join(folder, e.name)] : []
  );
}

// Une note -> une ligne de instagram_saves, ou null si ce n'est pas une save.
function parseNote(text) {
  text = text.replace(/\r\n/g, '\n');
  const end = text.indexOf('\n---\n', 4);
  if (!text.startsWith('---\n') || end < 0) return null;

  const fm = {};
  for (const line of text.slice(4, end).split('\n')) {
    const i = line.indexOf(': ');
    if (i < 0) continue;
    const raw = line.slice(i + 2);
    try {
      fm[line.slice(0, i)] = JSON.parse(raw);
    } catch {
      fm[line.slice(0, i)] = raw;
    }
  }
  if (fm.source !== 'instagram' || !fm.url) return null;

  const body = text.slice(end + 5);
  const caption = body
    .split('## Transcription')[0]
    .split('\n')
    .filter((l) => !l.startsWith('# @'))
    .join('\n')
    .trim();
  // Le champ `transcript` du frontmatter n'est qu'un statut (done, pending...) : le texte est dans le corps.
  const transcript = body.includes('## Transcription') ? body.split('## Transcription').slice(1).join('## Transcription').trim() : '';
  const isArr = (n) => Number.isInteger(n) && n >= 1 && n <= 20;
  const arrs = (Array.isArray(fm.arrondissements) ? fm.arrondissements : [fm.arrondissement]).filter(isArr);
  const text1 = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  return {
    url: fm.url,
    caption: caption || null,
    author: fm.author || null,
    saved_at: /^\d{4}-\d{2}-\d{2}$/.test(fm.saved_at) ? fm.saved_at : null,
    tags: Array.isArray(fm.topics) ? fm.topics : [],
    category: text1(fm.category),
    kind: text1(fm.kind),
    ville: text1(fm.ville),
    arrondissement: isArr(fm.arrondissement) ? fm.arrondissement : null,
    arrondissements: arrs,
    cuisine: text1(fm.cuisine),
    adresse: text1(fm.adresse),
    resume: text1(fm.resume),
    retenir: text1(fm.retenir),
    transcript: transcript || null,
    media_type: fm.type === 'reel' || fm.type === 'post' ? fm.type : null,
    repond_a: text1(fm.repond_a),
    recos: Array.isArray(fm.recos) ? fm.recos.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()) : [],
    attention: text1(fm.attention),
  };
}

let files;
try {
  files = markdownFiles(dir);
} catch (err) {
  fail(`Dossier illisible (${dir}) : ${err.message}`);
}

// Map par url : deux notes pour la même save ne doivent pas se heurter dans un même upsert.
const saves = new Map();
for (const file of files) {
  const row = parseNote(readFileSync(file, 'utf-8'));
  if (row) saves.set(row.url, row);
}
const rows = [...saves.values()];
console.log(`${files.length} notes lues dans ${dir} : ${rows.length} saves, ${files.length - rows.length} ignorées (pas des saves).`);

if (dry) {
  console.log('[dry-run] rien écrit. Exemples :');
  const n = (f) => rows.filter(f).length;
  console.log(`  ${n((r) => r.category)} thèmes, ${n((r) => r.kind)} usages, ${n((r) => r.arrondissements.length)} avec arrondissement, ${n((r) => r.cuisine)} avec cuisine, ${n((r) => r.resume)} résumés, ${n((r) => r.retenir)} à retenir, ${n((r) => r.transcript)} transcriptions, ${n((r) => r.repond_a)} « répond à », ${n((r) => r.recos.length)} avec recommandations, ${n((r) => r.attention)} avec réserves.`);
  for (const r of rows.slice(0, 3)) console.log(`  ${r.url} | @${r.author} | ${r.saved_at} | ${r.category}/${r.kind} | ${r.tags.length} tags | ${(r.caption ?? '').slice(0, 60).replace(/\s+/g, ' ')}`);
  process.exit(0);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) fail('NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis (--env-file=.env.local).');
const db = createClient(url, key, { auth: { persistSession: false } });

for (let i = 0; i < rows.length; i += 100) {
  const { error } = await db.from('instagram_saves').upsert(rows.slice(i, i + 100), { onConflict: 'url' });
  if (error) {
    fail(
      error.code === 'PGRST205'
        ? 'Table instagram_saves absente : exécuter supabase/instagram.sql puis instagram_v2.sql dans le SQL Editor de Supabase.'
        : error.code === '42703' || error.code === 'PGRST204'
          ? 'Colonnes absentes : exécuter supabase/instagram_v2.sql dans le SQL Editor de Supabase.'
          : `Supabase : ${error.message}`
    );
  }
}
console.log(`${rows.length} saves upsertées dans instagram_saves.`);
