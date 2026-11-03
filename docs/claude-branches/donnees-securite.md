# 1a. Données, sécurité, accès

Périmètre : hébergement, tables Supabase et RLS, Basic Auth, API publique, Claude Brain. Hooks, cron, tâches planifiées et sauvegardes : `D\hooks-routines.md`. SQL : exécutés par Thibaut seulement (racine). (`D\` = `docs\claude-branches\`, voir la racine du projet.)

Site construit et déployé sur Vercel
(`dashboard-pilotage-omega.vercel.app`), données dans Supabase.

- **Claude Brain** : table `brain_notes`, `GET`/`POST /api/brain-notes`,
  `PATCH /api/brain-notes/[id]` (voir `GLOBAL\Systeme\claude.brain\CLAUDE.md`).
- **API publique** `GET /api/public/overview` (CORS ouvert, sans secret) : statut
  agrégé des projets, jalons, dernier résumé de session. Elle ne sert plus à
  aucune page du site ; elle reste ouverte pour l'artifact « Spircle Control ».
  Depuis le 2026-09-21, le site est le seul tableau de bord (voir
  `GLOBAL\Systeme\Branches\agenda-taches.md`, « Une seule surface ») : ne branche pas de nouvelle vue
  dessus.
- **Sécurité** : Basic Auth (`proxy.js`), sauf les routes cron, hooks, public et
  brain-notes. RLS activé sur les 6 tables d'origine (les tables ajoutées depuis l'ont aussi, voir ci-dessous) (`supabase/enable_rls.sql`, exécuté
  par Thibaut le 2026-09-20) : la clé anon ne peut que lire, les écritures
  passent par le client admin. `brain_notes` est lue côté serveur (`lib/brain.js`) ;
  `supabase/ideas.sql` retire sa lecture anon.
- **Données personnelles** : `tasks` (`supabase/tasks.sql`), `instagram_saves` et
  `suggestions` (`supabase/instagram.sql`), `calendar_events` et `mail_items`
  (`supabase/agenda.sql`), `app_links` et `dashboard_settings` (`supabase/dashboard-edit.sql`), `notifications` (`supabase/notifications.sql`) ont RLS **sans aucune policy anon** : lues
  et écrites côté serveur seulement (`lib/home-data.js`, `app/actions.js`, clé
  service_role), derrière le Basic Auth, jamais dans `/api/public/overview`.
