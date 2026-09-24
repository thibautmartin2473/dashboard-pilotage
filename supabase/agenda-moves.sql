-- Glisser-déposer de l'agenda : un événement Google déplacé ou redimensionné sur le site attend
-- d'être renvoyé vers Google Agenda. Idempotent : à exécuter (et ré-exécuter sans risque) dans
-- l'éditeur SQL Supabase.
--
-- pending_move = true : posé par la Server Action moveEvent (app/edit-actions.js) sur un événement
-- origin = 'google'. Tant qu'il vaut true, scripts/push-agenda.mjs n'écrase ni ne purge la ligne ;
-- Claude liste ces déplacements (--pending), les écrit dans Google, puis les acquitte (--ack),
-- ce qui remet false.
alter table calendar_events add column if not exists pending_move boolean not null default false;

-- RLS : calendar_events est déjà une donnée personnelle sans policy anon (supabase/agenda.sql) ;
-- rien à changer ici.
