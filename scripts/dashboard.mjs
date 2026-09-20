// Outil du tableau de bord pour l'agent dashboard-dev. À lancer depuis la racine
// du repo, avec les variables de .env.local :
//
//   node --env-file=.env.local scripts/dashboard.mjs schema
//       Affiche les tables et colonnes réelles de la base (via l'OpenAPI de
//       Supabase). `*` = colonne obligatoire à l'insertion (NOT NULL sans défaut).
//
//   node --env-file=.env.local scripts/dashboard.mjs sync [--dry-run] [--force]
//       Aligne les jalons du projet « dashboard-pilotage » sur roadmap.json
//       (clé = libellé : renommer un libellé crée un nouveau jalon). Ne supprime
//       jamais rien. Un jalon modifié à la main depuis le site (updated_by =
//       'manual') n'est pas écrasé, sauf avec --force. --dry-run n'écrit rien.
//
// Les jalons sont visibles sur /api/public/overview (sans authentification) :
// pas de secret ni de détail de faille dans roadmap.json.

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { MILESTONE_STATUSES } from '../lib/constants.js';

const [command, ...flags] = process.argv.slice(2);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function check(error) {
  if (error) fail(`Supabase : ${error.message}`);
}

async function schema() {
  const res = await fetch(`${url}/rest/v1/`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!res.ok) fail(`OpenAPI Supabase : HTTP ${res.status}`);
  const { definitions } = await res.json();
  for (const [table, { properties, required = [] }] of Object.entries(definitions)) {
    const columns = Object.entries(properties).map(
      ([name, p]) => `${name} ${p.format ?? p.type}${required.includes(name) ? '*' : ''}`
    );
    console.log(`${table}: ${columns.join(', ')}`);
  }
}

async function sync() {
  const dry = flags.includes('--dry-run');
  const force = flags.includes('--force');
  const { project, milestones } = JSON.parse(readFileSync(new URL('../roadmap.json', import.meta.url), 'utf-8'));

  const labels = milestones.map((m) => m.label);
  if (labels.some((l) => !l) || new Set(labels).size !== labels.length) fail('roadmap.json : libellé vide ou en double.');
  for (const m of milestones) {
    if (!MILESTONE_STATUSES.includes(m.status)) fail(`roadmap.json : statut invalide "${m.status}" pour "${m.label}".`);
  }

  const db = createClient(url, key, { auth: { persistSession: false } });

  let { data: row, error } = await db.from('projects').select('id').eq('slug', project.slug).maybeSingle();
  check(error);
  if (!row && !dry) {
    ({ data: row, error } = await db.from('projects').insert(project).select('id').single());
    check(error);
    console.log(`  projet créé : ${project.slug}`);
  }

  let existing = [];
  if (row) {
    const res = await db.from('milestones').select('id,label,status,position,updated_by').eq('project_id', row.id);
    check(res.error);
    existing = res.data;
  }
  const byLabel = new Map(existing.map((m) => [m.label, m]));

  const count = { créés: 0, modifiés: 0, inchangés: 0, ignorés: 0 };
  const now = new Date().toISOString();

  for (const [position, m] of milestones.entries()) {
    const current = byLabel.get(m.label);

    if (!current) {
      count.créés++;
      if (!dry) {
        const res = await db
          .from('milestones')
          .insert({ project_id: row.id, label: m.label, status: m.status, position, updated_by: 'hook', updated_at: now });
        check(res.error);
      }
      continue;
    }

    if (current.status === m.status && current.position === position) {
      count.inchangés++;
      continue;
    }

    if (current.updated_by === 'manual' && current.status !== m.status && !force) {
      count.ignorés++;
      console.log(`  ignoré (modifié à la main, statut "${current.status}") : ${m.label}`);
      continue;
    }

    count.modifiés++;
    if (!dry) {
      const res = await db
        .from('milestones')
        .update({ status: m.status, position, updated_by: 'hook', updated_at: now })
        .eq('id', current.id);
      check(res.error);
    }
  }

  const known = new Set(labels);
  for (const m of existing) {
    if (!known.has(m.label)) console.log(`  absent de roadmap.json (non supprimé) : ${m.label}`);
  }

  console.log(`${dry ? '[dry-run] ' : ''}${project.slug} : ${Object.entries(count).map(([k, v]) => `${v} ${k}`).join(', ')}`);
}

const commands = { schema, sync };
if (!commands[command]) fail('Usage : node --env-file=.env.local scripts/dashboard.mjs schema | sync [--dry-run] [--force]');
if (!url || !key) fail('NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis (--env-file=.env.local).');

await commands[command]();
