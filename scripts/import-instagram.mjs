// Importe les saves Instagram dans la table instagram_saves (Supabase). À lancer
// depuis la racine du repo :
//
//   node --env-file=.env.local scripts/import-instagram.mjs [dossier] [--dry-run]
//
// Source : les notes Obsidian du skill instagram-memoire (frontmatter `source:
// instagram`, `url`, `author`, `saved_at`, `topics`; légende = corps de la note
// avant « ## Transcription »). Par défaut le dossier
// Vault/03 Ressources/Instagram. Idempotent : upsert sur `url`, on peut relancer.
// N'appelle jamais Instagram. --dry-run n'écrit rien et n'exige pas Supabase.

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

  const caption = text
    .slice(end + 5)
    .split('## Transcription')[0]
    .split('\n')
    .filter((l) => !l.startsWith('# @'))
    .join('\n')
    .trim();
  return {
    url: fm.url,
    caption: caption || null,
    author: fm.author || null,
    saved_at: /^\d{4}-\d{2}-\d{2}$/.test(fm.saved_at) ? fm.saved_at : null,
    tags: Array.isArray(fm.topics) ? fm.topics : [],
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
  for (const r of rows.slice(0, 3)) console.log(`  ${r.url} | @${r.author} | ${r.saved_at} | ${r.tags.length} tags | ${(r.caption ?? '').slice(0, 60)}`);
  process.exit(0);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) fail('NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis (--env-file=.env.local).');
const db = createClient(url, key, { auth: { persistSession: false } });

for (let i = 0; i < rows.length; i += 200) {
  const { error } = await db.from('instagram_saves').upsert(rows.slice(i, i + 200), { onConflict: 'url' });
  if (error) {
    fail(
      error.code === 'PGRST205'
        ? 'Table instagram_saves absente : exécuter supabase/instagram.sql dans le SQL Editor de Supabase.'
        : `Supabase : ${error.message}`
    );
  }
}
console.log(`${rows.length} saves upsertées dans instagram_saves.`);
