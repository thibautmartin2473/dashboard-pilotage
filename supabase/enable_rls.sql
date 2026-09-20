-- Active RLS sur les 6 tables, avec une politique lecture-seule pour
-- anon/authenticated. Toutes les écritures de l'app passent déjà par la clé
-- service_role (getSupabaseAdmin()) dans les routes API — qui contourne RLS
-- de toute façon — donc ceci ne change aucun comportement légitime, mais
-- retire l'écriture/suppression directe via la clé anon (NEXT_PUBLIC_*),
-- qui est publique par convention et deviendrait exploitable en écriture
-- totale si un appel Supabase côté client était ajouté un jour.
--
-- Idempotent (drop policy if exists) : peut être rejoué sans erreur.
-- Exécuté par Thibaut dans l'éditeur SQL Supabase le 2026-09-20.
-- À exécuter manuellement, après relecture — jamais depuis une session Claude.
--
-- Limite connue : "anon read brain_notes" laisse les idées lisibles avec la
-- clé anon (la page /brain les lit avec ce client). Pour la fermer : lire
-- brain_notes côté serveur (getSupabaseAdmin), puis supprimer cette politique.

alter table projects enable row level security;
alter table project_repos enable row level security;
alter table milestones enable row level security;
alter table sessions enable row level security;
alter table activity_signals enable row level security;
alter table brain_notes enable row level security;

drop policy if exists "anon read projects" on projects;
create policy "anon read projects" on projects
  for select to anon, authenticated using (true);

drop policy if exists "anon read project_repos" on project_repos;
create policy "anon read project_repos" on project_repos
  for select to anon, authenticated using (true);

drop policy if exists "anon read milestones" on milestones;
create policy "anon read milestones" on milestones
  for select to anon, authenticated using (true);

drop policy if exists "anon read sessions" on sessions;
create policy "anon read sessions" on sessions
  for select to anon, authenticated using (true);

drop policy if exists "anon read activity_signals" on activity_signals;
create policy "anon read activity_signals" on activity_signals
  for select to anon, authenticated using (true);

drop policy if exists "anon read brain_notes" on brain_notes;
create policy "anon read brain_notes" on brain_notes
  for select to anon, authenticated using (true);
