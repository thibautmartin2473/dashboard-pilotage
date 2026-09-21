-- Tâches de la page d'accueil (données personnelles).
-- À exécuter par Thibaut dans le SQL Editor de Supabase, jamais depuis une
-- session Claude. Idempotent : peut être rejoué sans erreur.
--
-- RLS activée et AUCUNE policy : la clé anon (publique) ne lit ni n'écrit rien.
-- Le site lit et écrit uniquement côté serveur avec la clé service_role
-- (getSupabaseAdmin), derrière le Basic Auth de proxy.js.

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  project_slug text,
  bucket text not null default 'inbox' check (bucket in ('inbox', 'today', 'next_session')),
  due_date date,
  done_at timestamptz,
  source text not null default 'manual',
  created_at timestamptz not null default now()
);

alter table tasks enable row level security;
drop policy if exists "anon read tasks" on tasks;
revoke all on table tasks from anon, authenticated;
