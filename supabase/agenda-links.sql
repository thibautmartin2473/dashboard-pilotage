-- Code couleur de l'agenda + lien tâche <-> événement. Idempotent : à exécuter (et
-- ré-exécuter sans risque) dans l'éditeur SQL Supabase.

-- 1. Couleur Google d'origine (colorId), poussée par scripts/push-agenda.mjs : 11 Tomate = cours
-- EDHEC (Aurion), 9 Myrtille = autres événements, 6 Mandarine = tâches / blocs de travail. Colonne
-- absente ou valeur nulle : le site replie sur la couleur "autres événements" (lib/home.js, eventColor).
alter table calendar_events add column if not exists color_id text;

-- 2. Une tâche peut être rattachée à un événement de l'agenda (« pendant quelle session »),
-- affiché au survol de l'événement. Sans clé étrangère : comme brain_notes.event_id, les
-- événements Google (origin = 'google') sont purgés puis réinsérés avec le même id à chaque
-- synchro (scripts/push-agenda.mjs) ; une clé étrangère casserait ce cycle.
alter table tasks add column if not exists event_id text;

-- RLS : ces deux tables sont déjà des données personnelles sans policy anon
-- (supabase/agenda.sql, supabase/tasks.sql) ; rien à changer ici.
