-- Propositions de déplacement : un mail annonce qu'un événement DÉJÀ dans l'agenda change de date ou d'heure.
-- À exécuter par Thibaut dans le SQL Editor de Supabase, jamais depuis une session Claude.
-- Idempotent : peut être rejoué sans erreur. Ne supprime aucune donnée.
--
-- Claude pousse une notification de type `move` (scripts/push-notifications.mjs) avec l'id de
-- l'événement visé (calendar_events.id) et les nouvelles heures (starts_at / ends_at). Elle
-- apparaît dans « À ranger » ; l'événement n'est déplacé que lorsque Thibaut clique sur Valider.
--
-- Tant que ce fichier n'est pas exécuté, le site fonctionne (aucune proposition de déplacement
-- ne peut exister) et push-notifications.mjs refuse une entrée `move` avec un message qui renvoie ici.
-- Pour un événement Google, Valider pose aussi calendar_events.pending_move : exécuter
-- supabase/agenda-moves.sql si ce n'est pas déjà fait.

-- 1. Événement visé (texte : les ids de calendar_events sont des ids Google ou « local-<uuid> »).
alter table notifications add column if not exists event_id text;

-- 2. Nouveau type `move` : on remplace la contrainte d'origine (notifications.sql) sur `kind`.
do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.notifications'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%kind%'
  loop
    execute format('alter table public.notifications drop constraint %I', c.conname);
  end loop;
  alter table public.notifications
    add constraint notifications_kind_check check (kind in ('event', 'deadline', 'todo', 'info', 'move'));
end $$;

-- 3. Une proposition de déplacement doit nommer l'événement et la nouvelle heure de début.
alter table notifications drop constraint if exists notifications_move_check;
alter table notifications
  add constraint notifications_move_check check (kind <> 'move' or (event_id is not null and starts_at is not null));

-- RLS : inchangée (notifications.sql : aucune policy anon, lecture et écriture côté serveur).
