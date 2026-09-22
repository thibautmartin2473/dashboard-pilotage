-- Notifications issues des mails, proposées par Claude (données personnelles).
-- À exécuter par Thibaut dans le SQL Editor de Supabase, jamais depuis une
-- session Claude. Idempotent : peut être rejoué sans erreur.
--
-- Claude analyse les mails (tâche planifiée ou session) et pousse ses propositions avec
-- scripts/push-notifications.mjs : insertion qui ignore les doublons sur dedupe_key, donc une
-- notification acceptée ou ignorée ne revient jamais. Aucun contenu de mail n'est stocké :
-- un titre et un détail courts, l'identifiant du fil (mail_id) et le lien (mail_link).
--
-- RLS activée et AUCUNE policy : la clé anon (publique) ne lit ni n'écrit rien.
-- Le site lit et écrit uniquement côté serveur avec la clé service_role
-- (getSupabaseAdmin), derrière le Basic Auth de proxy.js.

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('event', 'deadline', 'todo', 'info')),
  title text not null,
  detail text,
  mail_id text,
  mail_link text,
  starts_at timestamptz,
  ends_at timestamptz,
  due_date date,
  status text not null default 'new' check (status in ('new', 'accepted', 'dismissed')),
  dedupe_key text not null unique,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;
drop policy if exists "anon read notifications" on notifications;
revoke all on table notifications from anon, authenticated;
