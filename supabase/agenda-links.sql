-- Code couleur de l'agenda + lien tâche <-> événement. Idempotent : à exécuter (et
-- ré-exécuter sans risque) dans l'éditeur SQL Supabase.

-- 1. Couleur Google d'origine (colorId), poussée par scripts/push-agenda.mjs : 11 Tomate, 9
-- Myrtille, 6 Mandarine sont les clés des 3 catégories par défaut (nom et couleur éditables sur le
-- site, dashboard_settings clé agenda_categories, lib/home.js). Colonne absente, valeur nulle ou
-- catégorie supprimée : le site replie sur la clé '9' (categoryOf, OTHER_KEY).
alter table calendar_events add column if not exists color_id text;

-- 2. Une tâche peut être rattachée à un événement de l'agenda (« pendant quelle session »),
-- affiché au survol de l'événement. Sans clé étrangère : comme brain_notes.event_id, les
-- événements Google (origin = 'google') sont purgés puis réinsérés avec le même id à chaque
-- synchro (scripts/push-agenda.mjs) ; une clé étrangère casserait ce cycle.
alter table tasks add column if not exists event_id text;

-- RLS : ces deux tables sont déjà des données personnelles sans policy anon
-- (supabase/agenda.sql, supabase/tasks.sql) ; rien à changer ici.
