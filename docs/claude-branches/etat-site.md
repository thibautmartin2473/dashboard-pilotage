# 1. État du site, tables, sécurité, hooks

Périmètre : ce que le site expose (accueil, API, hook de session, activité du jour, Brain, cron, sécurité, données personnelles). (`D\` = `docs\claude-branches\`, voir la racine du projet.)

Statut au 2026-09-20 : construit et déployé sur Vercel
(`dashboard-pilotage-omega.vercel.app`), données dans Supabase. Ce qui existe :

- **UI** : accueil (`/`) = le **Cockpit**, pleine largeur (voir `D\cockpit.md`) : Zone Commande en une
  ligne, agenda 5 jours d'un coup (frise glissante à la main ou aux flèches) à gauche, colonne
  « À ranger » (tâches, idées et propositions des mails regroupées) à droite, mails des deux boîtes côte à
  côte, « Mes apps » (grille de carrés fusionnant `app_links` et projets, édition derrière un bouton « Modifier ») ; détail projet
  (`/projects/[slug]`) avec jalons éditables, boîte à idées
  (`/brain` : Zone Commande + notes). Manifest : installable sur mobile.
- **Suivi des sessions Claude** : hook de fin de session
  (`scripts/claude-hook-session-end.mjs`, à copier dans chaque repo suivi) →
  `POST /api/hooks/session-end`. Actif dans EDHEC AI, Stage et 3 sous-projets
  Spircle ; pas encore installé sur ce repo.
- **Claude Brain** : table `brain_notes`, `GET`/`POST /api/brain-notes`,
  `PATCH /api/brain-notes/[id]` (voir `../../Systeme/claude.brain/CLAUDE.md`).
- **API publique** `GET /api/public/overview` (CORS ouvert, sans secret) : statut
  agrégé des projets, jalons, dernier résumé de session. Elle ne sert plus à
  aucune page du site ; elle reste ouverte pour l'artifact « Spircle Control ».
  Depuis le 2026-09-21, le site est le seul tableau de bord (voir
  `../../CLAUDE.md`, « Une seule surface ») : ne branche pas de nouvelle vue
  dessus.
- **Rafraîchissement** : cron Vercel quotidien `/api/cron/refresh`.
- **Sécurité** : Basic Auth (`proxy.js`), sauf les routes cron, hooks, public et
  brain-notes. RLS activé sur les 6 tables (`supabase/enable_rls.sql`, exécuté
  par Thibaut le 2026-09-20) : la clé anon ne peut que lire, les écritures
  passent par le client admin. `brain_notes` est lue côté serveur (`lib/brain.js`) ;
  `supabase/ideas.sql` retire sa lecture anon.
- **Données personnelles** : `tasks` (`supabase/tasks.sql`), `instagram_saves` et
  `suggestions` (`supabase/instagram.sql`), `calendar_events` et `mail_items`
  (`supabase/agenda.sql`), `app_links` et `dashboard_settings` (`supabase/dashboard-edit.sql`), `notifications` (`supabase/notifications.sql`) ont RLS **sans aucune policy anon** : lues
  et écrites côté serveur seulement (`lib/home-data.js`, `app/actions.js`, clé
  service_role), derrière le Basic Auth, jamais dans `/api/public/overview`.
