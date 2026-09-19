-- Active RLS sur les 6 tables, avec une politique lecture-seule pour
-- anon/authenticated. Toutes les écritures de l'app passent déjà par la clé
-- service_role (getSupabaseAdmin()) dans les routes API — qui contourne RLS
-- de toute façon — donc ceci ne change aucun comportement légitime, mais
-- retire l'écriture/suppression directe via la clé anon (NEXT_PUBLIC_*),
-- qui est publique par convention et deviendrait exploitable en écriture
-- totale si un appel Supabase côté client était ajouté un jour.
--
-- À exécuter manuellement dans l'éditeur SQL Supabase du projet, après
-- relecture — pas exécuté automatiquement depuis cette session.

alter table projects enable row level security;
alter table project_repos enable row level security;
alter table milestones enable row level security;
alter table sessions enable row level security;
alter table activity_signals enable row level security;
alter table brain_notes enable row level security;

create policy "anon read projects" on projects
  for select to anon, authenticated using (true);

create policy "anon read project_repos" on project_repos
  for select to anon, authenticated using (true);

create policy "anon read milestones" on milestones
  for select to anon, authenticated using (true);

create policy "anon read sessions" on sessions
  for select to anon, authenticated using (true);

create policy "anon read activity_signals" on activity_signals
  for select to anon, authenticated using (true);

create policy "anon read brain_notes" on brain_notes
  for select to anon, authenticated using (true);
