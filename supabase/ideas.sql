-- Idées : une seule table (brain_notes) pour les idées et les anciennes
-- « suggestions de next steps », affectables à une tâche OU à un événement.
-- Idempotent : à exécuter (et ré-exécuter sans risque) dans l'éditeur SQL Supabase.
-- Ne supprime rien : la table suggestions reste en place (ménage manuel plus tard).

-- 1. Affectation à une tâche ou à un événement de l'agenda.
-- task_id : clé étrangère, une tâche supprimée détache l'idée (on delete set null).
-- event_id : sans clé étrangère, car les événements Google (calendar_events,
-- origin = 'google') sont purgés puis réinsérés à chaque synchro avec le même id :
-- le lien survit à la synchro.
alter table brain_notes add column if not exists task_id uuid references tasks(id) on delete set null;
alter table brain_notes add column if not exists event_id text;
alter table brain_notes drop constraint if exists brain_notes_one_target;
alter table brain_notes add constraint brain_notes_one_target check (task_id is null or event_id is null);

-- 2. Trace de la provenance : save Instagram d'origine, suggestion d'origine.
alter table brain_notes add column if not exists source_save_id uuid references instagram_saves(id) on delete set null;
alter table brain_notes add column if not exists source_suggestion_id uuid;
create unique index if not exists brain_notes_source_suggestion_idx on brain_notes(source_suggestion_id);

-- 3. Copie des suggestions encore actives (status = 'new') ; une suggestion
-- déjà copiée n'est jamais recopiée. Projet inconnu de `projects` -> sans projet
-- (brain_notes.project_slug référence projects.slug).
insert into brain_notes (content, project_slug, status, created_at, source_save_id, source_suggestion_id)
select s.text,
       (select p.slug from projects p where p.slug = s.project_slug),
       'new', s.created_at, s.source_save_id, s.id
from suggestions s
where s.status = 'new'
on conflict (source_suggestion_id) do nothing;

-- 4. Les idées contiennent désormais des données personnelles (suggestions tirées
-- des saves Instagram) : plus de lecture avec la clé anon. Le site les lit côté
-- serveur (lib/brain.js, clé service_role), derrière le Basic Auth.
drop policy if exists "anon read brain_notes" on brain_notes;
revoke all on table brain_notes from anon, authenticated;
