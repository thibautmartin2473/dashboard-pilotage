-- Liste « À ranger » et rangement forcé : états « supprimé » et « reporté ».
-- À exécuter par Thibaut dans le SQL Editor de Supabase, jamais depuis une session Claude.
-- Idempotent : peut être rejoué sans erreur. Ne supprime rien.
--
-- Tant que ce fichier n'est pas exécuté, le site fonctionne : « Supprimer » et « Plus tard »
-- sont désactivés (bandeau « Exécuter supabase/ranger.sql ») et les autres gestes marchent.

-- 1. Tâche supprimée : on garde la ligne (historique) avec la date de suppression ; elle n'est
-- plus jamais affichée ni comptée.
alter table tasks add column if not exists dropped_at timestamptz;

-- 2. « Plus tard » : l'élément disparaît de la liste jusqu'à cette date (le dimanche suivant,
-- heure de Paris), puis revient dans le rangement forcé. Une tâche affectée à un jour sans bloc
-- utilise la même colonne (elle revient ce jour-là).
alter table tasks add column if not exists snoozed_until date;
alter table brain_notes add column if not exists snoozed_until date;

-- 3. Idée supprimée : statut « dropped » (en plus de new, triaged, done). La contrainte d'origine
-- (brain_notes.sql) ne le permet pas : on remplace toute contrainte de contrôle qui porte sur status.
do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.brain_notes'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.brain_notes drop constraint %I', c.conname);
  end loop;
  alter table public.brain_notes
    add constraint brain_notes_status_check check (status in ('new', 'triaged', 'done', 'dropped'));
end $$;

-- 4. Ce que la liste lit tous les jours : un index léger sur les tâches encore ouvertes.
create index if not exists tasks_open_idx on tasks (created_at) where done_at is null and dropped_at is null;
