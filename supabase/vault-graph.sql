-- Constellation : graphe du vault Obsidian, envoyé en direct par le plugin « Constellation vers Cockpit ».
-- Une seule ligne (id = 'vault'). Idempotent. RLS active sans aucune policy anon : lecture et écriture
-- côté serveur seulement (clé service_role), comme les autres tables personnelles.
create table if not exists vault_graph (
  id text primary key,
  nodes jsonb not null default '[]'::jsonb,
  links jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table vault_graph enable row level security;
