-- Bloc « Avancement » du Cockpit : où en est Thibaut sur chaque chantier (méthode de cas, tests en ligne,
-- lettres, networking, fit, partiels, Master Project, projets), face à ce qu'il devrait avoir aujourd'hui.
-- À exécuter par Thibaut dans le SQL Editor de Supabase, jamais depuis une session Claude. Idempotent.
--
-- Une ligne par élément (et non un document JSON daté) : une ligne qui ne se calcule plus (source absente) ne
-- casse pas les autres, la page trie et regroupe sans décoder un blob, et un `select` montre tout de suite
-- l'état d'un chantier. C'est un CACHE : scripts/push-avancement.mjs (tâche planifiée quotidienne, 0 token)
-- relit les notes du vault, calcule et remplace tout le contenu ; les lignes qui ne sont plus produites sont
-- supprimées. Tous les textes affichés (valeur, attendu, statut) sont déjà calculés : le site ne fait que les
-- montrer.
--
-- RLS activée et AUCUNE policy : la clé anon (publique) ne lit ni n'écrit rien. Le site lit côté serveur avec la
-- clé service_role (getSupabaseAdmin), derrière le Basic Auth de proxy.js.

create table if not exists avancement (
  cle text primary key,                -- ex. sb:etape:synthese, sb:lettres, cours:afa, autre:spircle, note:strategy-boost
  groupe text not null,                -- strategy-boost | carriere | cours | autre | general (notes d'en-tête : avertissements, export)
  ordre integer not null default 0,    -- rang dans le groupe : du plus en retard au plus en avance, sans mesure à la fin
  type_label text,                     -- étiquette courte de la ligne (Méthode de cas, Test en ligne, Réseau...)
  libelle text not null,
  explication text,
  kind text not null,                  -- niveau | compteur | pourcentage | jalons | sans_mesure | note
  valeur numeric,                      -- null = pas de mesure (jamais de chiffre inventé)
  max numeric,                         -- échelle : 5 pour un niveau, objectif pour un compteur, 100 pour un pourcentage
  attendu numeric,                     -- le trait : où il devrait être aujourd'hui (interpolation linéaire)
  ecart_rel numeric,                   -- (valeur - attendu) / max ; sert au tri et au statut
  statut text check (statut in ('en_avance', 'dans_les_temps', 'en_retard')),
  valeur_texte text,
  attendu_texte text,
  statut_texte text,
  echeance date,
  detail text,
  extra jsonb,
  maj timestamptz not null default now()
);

alter table avancement enable row level security;

-- Réglage d'affichage (aucun SQL à ajouter) : la clé `avancement_afficher_masques` de la table existante
-- `dashboard_settings` (supabase/dashboard-edit.sql), valeur json true/false. Absente ou false : le groupe « Autre »
-- (Spircle, EDHEC AI) et la ligne Master Project sont masqués dans l'onglet Avancement ; true : ils sont affichés.
-- Le bouton de l'onglet l'écrit (Server Action), les lignes restent calculées et stockées dans tous les cas.
