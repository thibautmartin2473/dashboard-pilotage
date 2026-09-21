-- Saves Instagram importées (scripts/import-instagram.mjs) et suggestions de
-- next steps (données personnelles). À exécuter par Thibaut dans le SQL Editor
-- de Supabase, APRÈS tasks.sql, jamais depuis une session Claude. Idempotent.
--
-- RLS activée et AUCUNE policy : la clé anon ne lit ni n'écrit rien. Lecture et
-- écriture uniquement côté serveur (service_role). Aucun appel à Instagram : les
-- saves viennent de l'export officiel, rangé en notes locales.

create table if not exists instagram_saves (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,
  caption text,
  author text,
  saved_at date,
  tags text[] not null default '{}',
  imported_at timestamptz not null default now()
);

create table if not exists suggestions (
  id uuid primary key default gen_random_uuid(),
  project_slug text,
  text text not null,
  source_save_id uuid references instagram_saves (id) on delete set null,
  status text not null default 'new' check (status in ('new', 'accepted', 'dismissed')),
  created_at timestamptz not null default now()
);

alter table instagram_saves enable row level security;
alter table suggestions enable row level security;
revoke all on table instagram_saves from anon, authenticated;
revoke all on table suggestions from anon, authenticated;
