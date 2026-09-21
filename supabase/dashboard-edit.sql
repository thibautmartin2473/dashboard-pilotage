-- Accueil éditable : tout ce qui s'affiche s'ajoute, se modifie et se supprime depuis le site.
-- À exécuter par Thibaut dans le SQL Editor de Supabase, APRÈS tasks.sql, agenda.sql et
-- brain_notes.sql, jamais depuis une session Claude. Idempotent : peut être rejoué sans erreur.
--
-- Données personnelles : RLS activée et AUCUNE policy anon, `revoke all` pour anon et
-- authenticated. Lecture et écriture uniquement côté serveur (service_role, getSupabaseAdmin),
-- derrière le Basic Auth de proxy.js.

-- Mails : source (règle EDHEC : libellé Gmail EDHEC, ou expéditeur / destinataire en edhec.com)
-- et pastille « non lu ». Instantané poussé par scripts/push-agenda.mjs.
alter table mail_items add column if not exists source text not null default 'gmail' check (source in ('gmail', 'edhec'));
alter table mail_items add column if not exists unread boolean not null default true;

-- Événements : 'google' = instantané poussé par Claude (purgé à la synchro), 'local' = créé sur le site.
alter table calendar_events add column if not exists origin text not null default 'google' check (origin in ('google', 'local'));

-- Priorité des tâches à l'intérieur d'une section (croissant, puis date de création).
alter table tasks add column if not exists position integer not null default 0;

-- Tuiles de « Mes apps ».
create table if not exists app_links (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  project_slug text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

-- Réglages de l'accueil : clé texte, valeur json (home_layout, mail_filter).
create table if not exists dashboard_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table app_links enable row level security;
alter table dashboard_settings enable row level security;
drop policy if exists "anon read app_links" on app_links;
drop policy if exists "anon read dashboard_settings" on dashboard_settings;
revoke all on table app_links from anon, authenticated;
revoke all on table dashboard_settings from anon, authenticated;

-- Amorce des tuiles à partir des projets existants (une seule fois : seulement si la table est vide).
-- Le lien de Spircle est l'artifact Claude ; les autres tuiles mènent à la page du projet.
insert into app_links (name, url, project_slug, position)
select p.name,
       case p.slug when 'spircle' then 'https://claude.ai/artifact/XA5w4hJxrrnfypkJ1Ro5bg' else '/projects/' || p.slug end,
       p.slug,
       (row_number() over (order by p.name))::integer
from projects p
where not exists (select 1 from app_links);
