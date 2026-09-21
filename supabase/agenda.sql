-- Caches de l'agenda et des notifications de l'accueil (données personnelles).
-- À exécuter par Thibaut dans le SQL Editor de Supabase, jamais depuis une
-- session Claude. Idempotent : peut être rejoué sans erreur.
--
-- Ce sont des instantanés : Claude (seul à accéder à Google) les remplit avec
-- scripts/push-agenda.mjs, qui remplace tout le contenu à chaque envoi. Aucun
-- corps ni extrait de message : expéditeur, sujet, date seulement.
--
-- RLS activée et AUCUNE policy : la clé anon (publique) ne lit ni n'écrit rien.
-- Le site lit uniquement côté serveur avec la clé service_role
-- (getSupabaseAdmin), derrière le Basic Auth de proxy.js.

create table if not exists calendar_events (
  id text primary key,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  location text,
  link text,
  synced_at timestamptz not null default now()
);

create table if not exists mail_items (
  id text primary key,
  sender text,
  subject text,
  received_at timestamptz,
  important boolean not null default false,
  link text,
  synced_at timestamptz not null default now()
);

alter table calendar_events enable row level security;
alter table mail_items enable row level security;
drop policy if exists "anon read calendar_events" on calendar_events;
drop policy if exists "anon read mail_items" on mail_items;
revoke all on table calendar_events from anon, authenticated;
revoke all on table mail_items from anon, authenticated;
