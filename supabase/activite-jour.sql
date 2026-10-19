-- Activité du jour : chaque message et chaque fin de tour des sessions Claude Code, envoyés en direct par le
-- hook global Systeme/Hooks/activite-jour (UserPromptSubmit + Stop) vers POST /api/hooks/activite.
-- Lu par l'artifact « Ma journée » via GET /api/public/activite (clé ACTIVITE_CLE).
-- Idempotent. RLS active sans aucune policy anon : lecture et écriture côté serveur seulement (service_role).

create table if not exists activite_sessions (
  session_id text primary key,
  titre text,
  dossier text,
  routine boolean not null default false,
  premiere timestamptz not null default now(),
  derniere timestamptz not null default now()
);

create table if not exists activite_evenements (
  id bigserial primary key,
  session_id text not null references activite_sessions (session_id) on delete cascade,
  at timestamptz not null default now(),
  evenement text not null check (evenement in ('prompt', 'stop'))
);

create index if not exists activite_evenements_at on activite_evenements (at);

alter table activite_sessions enable row level security;
alter table activite_evenements enable row level security;

-- Une écriture = une ligne de session mise à jour (titre gardé s'il n'arrive pas) + un événement, d'un bloc.
create or replace function activite_noter(
  p_session text, p_titre text, p_dossier text, p_routine boolean, p_evenement text, p_at timestamptz
) returns void language sql security invoker as $$
  insert into activite_sessions as s (session_id, titre, dossier, routine, premiere, derniere)
  values (p_session, p_titre, p_dossier, p_routine, p_at, p_at)
  on conflict (session_id) do update set
    titre = coalesce(excluded.titre, s.titre),
    dossier = coalesce(excluded.dossier, s.dossier),
    routine = s.routine or excluded.routine,
    derniere = greatest(s.derniere, excluded.derniere);
  insert into activite_evenements (session_id, at, evenement) values (p_session, p_at, p_evenement);
$$;

revoke all on function activite_noter(text, text, text, boolean, text, timestamptz) from public, anon, authenticated;
grant execute on function activite_noter(text, text, text, boolean, text, timestamptz) to service_role;

-- Ménage : on ne garde que 60 jours d'événements (à relancer à la main si besoin).
-- delete from activite_evenements where at < now() - interval '60 days';
