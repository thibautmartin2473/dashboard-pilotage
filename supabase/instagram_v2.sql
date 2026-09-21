-- Saves Instagram v2 : champs du moteur local (thème, usage, lieu, résumé, transcription)
-- et recherche plein texte française sans accents, pour le connecteur MCP (/api/mcp).
--
-- À EXÉCUTER PAR THIBAUT dans le SQL Editor de Supabase, APRÈS instagram.sql,
-- JAMAIS depuis une session Claude. Idempotent : peut être relancé sans dégât.
-- Ensuite : node --env-file=.env.local scripts/import-instagram.mjs (remplit les nouvelles colonnes).
-- Ce fichier a été complété (repond_a, recos, attention, media_type) : le relancer est sans risque,
-- même s'il a déjà été exécuté (colonnes ajoutées, déclencheur remplacé, `search` recalculé).
--
-- RLS inchangée : activée et AUCUNE policy, la clé anon ne lit ni n'écrit rien.
-- Les lectures passent par le serveur (service_role), derrière MCP_SECRET.

create extension if not exists unaccent with schema extensions;

-- Configuration de recherche « french + unaccent » : « coréen » trouve « coreen », « vidéos » trouve « vidéo ».
do $$
declare
  dict_schema text;
begin
  if not exists (select 1 from pg_ts_config where cfgname = 'french_unaccent' and cfgnamespace = 'public'::regnamespace) then
    select n.nspname into dict_schema
      from pg_ts_dict d join pg_namespace n on n.oid = d.dictnamespace
      where d.dictname = 'unaccent' limit 1;
    if dict_schema is null then
      raise exception 'dictionnaire unaccent introuvable : l''extension unaccent est-elle installée ?';
    end if;
    create text search configuration public.french_unaccent (copy = pg_catalog.french);
    execute format(
      'alter text search configuration public.french_unaccent alter mapping for hword, hword_part, word with %I.unaccent, french_stem',
      dict_schema
    );
  end if;
end $$;

alter table instagram_saves
  add column if not exists category text,
  add column if not exists kind text,
  add column if not exists ville text,
  add column if not exists arrondissement int,
  add column if not exists arrondissements int[] not null default '{}',
  add column if not exists cuisine text,
  add column if not exists adresse text,
  add column if not exists resume text,
  add column if not exists retenir text,
  add column if not exists transcript text,
  add column if not exists media_type text,
  add column if not exists repond_a text,
  add column if not exists recos text[] not null default '{}',
  add column if not exists attention text,
  add column if not exists search tsvector;

-- Colonne recalculée par un déclencheur (unaccent n'est pas « immutable » : une colonne générée est impossible).
-- Poids : A = compte, thème, usage, sujets, lieu, résumé, question, recommandations ; B = légende, réserves ; C = transcription.
create or replace function instagram_saves_search_update() returns trigger
language plpgsql
set search_path = pg_catalog, public
as $
begin
  new.search :=
    setweight(to_tsvector('public.french_unaccent'::regconfig, concat_ws(' ',
      new.author, new.category, new.kind, array_to_string(new.tags, ' '), new.cuisine, new.adresse, new.resume, new.retenir,
      new.repond_a, array_to_string(new.recos, ' '))), 'A') ||
    setweight(to_tsvector('public.french_unaccent'::regconfig, concat_ws(' ', new.caption, new.attention)), 'B') ||
    setweight(to_tsvector('public.french_unaccent'::regconfig, coalesce(new.transcript, '')), 'C');
  return new;
end $$;

revoke all on function instagram_saves_search_update() from public, anon, authenticated;

drop trigger if exists instagram_saves_search on instagram_saves;
create trigger instagram_saves_search
  before insert or update on instagram_saves
  for each row execute function instagram_saves_search_update();

create index if not exists instagram_saves_search_idx on instagram_saves using gin (search);

-- Recalcule `search` pour toutes les lignes déjà présentes (le déclencheur se déclenche à chaque update).
update instagram_saves set imported_at = imported_at;

-- Rappel de sécurité (idempotent) : données personnelles, aucune policy anon.
alter table instagram_saves enable row level security;
revoke all on table instagram_saves from anon, authenticated;
