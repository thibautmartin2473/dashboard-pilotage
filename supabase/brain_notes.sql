-- claude.brain : idées/notes libres ajoutées depuis le dashboard (page /brain),
-- à ranger ensuite vers le bon projet/dossier par une session Claude Code
-- locale (voir CLAUDE.GLOBAL/claude.brain/CLAUDE.md).
--
-- À exécuter une fois manuellement dans l'éditeur SQL Supabase du projet.

create table if not exists brain_notes (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  project_slug text references projects(slug),
  status text not null default 'new' check (status in ('new', 'triaged', 'done')),
  triaged_to text,
  created_at timestamptz not null default now(),
  triaged_at timestamptz
);

create index if not exists brain_notes_status_idx on brain_notes(status);

-- Pas de RLS activée ici : même posture que les tables existantes
-- (projects, milestones, sessions), lues via la clé anon côté dashboard.
