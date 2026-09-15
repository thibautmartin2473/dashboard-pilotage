// Insère les 3 projets, leurs dépôts et leurs jalons de départ dans Supabase.
// Usage (après avoir créé le projet Supabase, exécuté le schéma SQL, et
// renseigné .env.local) :
//
//   node --env-file=.env.local scripts/seed.mjs
//
// Peut être relancé sans dupliquer les projets (upsert sur `slug`), mais
// insère de nouveaux jalons à chaque exécution si vous relancez après avoir
// modifié lib/seed-data.js — pensez à vider la table `milestones` d'abord si
// vous voulez repartir de zéro.

import { createClient } from '@supabase/supabase-js';
import { PROJECTS } from '../lib/seed-data.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis (voir .env.local).');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

for (const project of PROJECTS) {
  console.log(`\n=== ${project.name} ===`);

  const { data: upserted, error: projectError } = await supabase
    .from('projects')
    .upsert(
      { slug: project.slug, name: project.name, repo_path_local: project.repo_path_local },
      { onConflict: 'slug' }
    )
    .select()
    .single();

  if (projectError) {
    console.error(`  projet: échec — ${projectError.message}`);
    continue;
  }
  console.log(`  projet: ok (id=${upserted.id})`);

  for (const repo of project.repos) {
    const { error } = await supabase.from('project_repos').insert({
      project_id: upserted.id,
      kind: repo.kind,
      ref: repo.ref,
      label: repo.label,
    });
    if (error && !error.message.includes('duplicate')) {
      console.error(`  dépôt ${repo.label}: échec — ${error.message}`);
    } else {
      console.log(`  dépôt ${repo.label}: ok`);
    }
  }

  const { data: existingMilestones } = await supabase
    .from('milestones')
    .select('id')
    .eq('project_id', upserted.id);

  if (existingMilestones?.length > 0) {
    console.log(`  jalons: ${existingMilestones.length} déjà présents, non réinsérés`);
    continue;
  }

  const rows = project.milestones.map((m, i) => ({
    project_id: upserted.id,
    label: m.label,
    status: m.status,
    position: i,
    updated_by: 'manual',
  }));

  const { error: milestonesError } = await supabase.from('milestones').insert(rows);
  if (milestonesError) {
    console.error(`  jalons: échec — ${milestonesError.message}`);
  } else {
    console.log(`  jalons: ${rows.length} insérés`);
  }
}

console.log('\nTerminé.');
