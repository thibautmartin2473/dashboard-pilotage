@AGENTS.md

# dashboard-pilotage

Outil de pilotage cross-projets de Thibaut : il suit les "feeds" de code/chat
Claude (Spircle, Stage, EDHEC AI...) et montre quelles tâches sont terminées et
lesquelles restent à faire, en un seul endroit.

Statut au 2026-09-20 : construit et déployé sur Vercel
(`dashboard-pilotage-omega.vercel.app`), données dans Supabase. Ce qui existe :

- **UI** : accueil (`/`) = synthèse du jour puis, dans l'ordre par défaut, agenda visuel (J à J+7),
  idées et suggestions, actions à faire, mails, apps (tuiles `app_links`) ; détail projet
  (`/projects/[slug]`) avec jalons éditables, carte des interactions (`/map`), boîte à idées
  (`/brain`). Manifest : installable sur mobile.
- **Suivi des sessions Claude** : hook de fin de session
  (`scripts/claude-hook-session-end.mjs`, à copier dans chaque repo suivi) →
  `POST /api/hooks/session-end`. Actif dans EDHEC AI, Stage et 3 sous-projets
  Spircle ; pas encore installé sur ce repo.
- **Claude Brain** : table `brain_notes`, `GET`/`POST /api/brain-notes`,
  `PATCH /api/brain-notes/[id]` (voir `../../claude.brain/CLAUDE.md`).
- **API publique** `GET /api/public/overview` (CORS ouvert). Un artifact ne
  pouvant pas l'appeler (règle de la plateforme), Claude en copie l'instantané dans
  la base de l'artifact Tour de Contrôle au wrap-up (`../../Tools/artifact-sync/`).
- **Rafraîchissement** : cron Vercel quotidien `/api/cron/refresh`.
- **Sécurité** : Basic Auth (`proxy.js`), sauf les routes cron, hooks, public et
  brain-notes. RLS activé sur les 6 tables (`supabase/enable_rls.sql`, exécuté
  par Thibaut le 2026-09-20) : la clé anon ne peut que lire, les écritures
  passent par le client admin. Limite : `brain_notes` reste lisible avec la clé
  anon (la page `/brain` la lit avec).
- **Données personnelles** : `tasks` (`supabase/tasks.sql`), `instagram_saves` et
  `suggestions` (`supabase/instagram.sql`), `calendar_events` et `mail_items`
  (`supabase/agenda.sql`), `app_links` et `dashboard_settings` (`supabase/dashboard-edit.sql`) ont RLS **sans aucune policy anon** : lues
  et écrites côté serveur seulement (`lib/home-data.js`, `app/actions.js`, clé
  service_role), derrière le Basic Auth, jamais dans `/api/public/overview`.

## Suggestions de next steps (boucle Claude, sans modèle côté site)

1. `node --env-file=.env.local scripts/import-instagram.mjs` copie les notes du skill `instagram-memoire` dans `instagram_saves` (idempotent, `--dry-run`).
2. En session, Claude lit `instagram_saves` (récentes) et les projets, et insère dans `suggestions` des lignes `{ project_slug, text, source_save_id, status: 'new' }` via `getSupabaseAdmin()`.
3. L'accueil les affiche : « Ajouter à la prochaine session » crée une tâche `next_session`, « Ignorer » passe la suggestion à `dismissed`.
4. Aucun appel à Instagram ni à un modèle depuis le site : rien de plus à configurer.

## Agenda et notifications de l'accueil (instantané poussé par Claude)

1. Le site n'a aucun accès direct à Google (pas d'OAuth, pas d'appel réseau) : les connecteurs Agenda/Gmail n'existent que dans les sessions Claude.
2. En session, Claude lit l'agenda (aujourd'hui + 7 jours) et les non lus, écrit un JSON `{ events, mails }` (format en tête de `scripts/push-agenda.mjs`) et lance `node --env-file=.env.local scripts/push-agenda.mjs <fichier.json> [--dry-run]`.
3. Le script upsert dans `calendar_events` et `mail_items` (RLS sans policy anon, expéditeur/sujet/date seulement) puis supprime les lignes absentes du fichier : ce sont des caches. Seuls les événements `origin = 'google'` sont purgés (ceux créés sur le site, `origin = 'local'`, jamais) ; 50 mails au plus. Chaque mail porte `source` (`gmail` ou `edhec`) et `unread`. Règle EDHEC : libellé Gmail EDHEC, ou expéditeur / destinataire en `edhec.com` ; sinon `gmail`.
4. L'accueil les affiche (`components/AgendaPanel.js`, `components/MailsPanel.js`, logique dans `lib/home.js`, testée par `scripts/check-home.mjs`) avec « Mis à jour il y a X » = max de `synced_at` : rien n'est en direct. Mails : tri strict par date décroissante, lecture seule (on les traite dans Gmail).

## Tout est éditable sur le site (Server Actions, pas de realtime)

1. Tout ce que l'accueil affiche se crée, se modifie et se supprime depuis le site (Server Actions de `app/edit-actions.js` et `app/actions.js`, clé service_role, derrière le Basic Auth ; suppression avec confirmation en ligne). Les briques d'interface sont toutes dans `components/ui.js` : un relooking se fait là.
2. L'agenda vient de `calendar_events` : `origin` = `google` (instantané poussé par Claude) ou `local` (créé sur le site). Les mails de `mail_items` sont un instantané en lecture seule ; le filtre Tous / Gmail / EDHEC est mémorisé dans `dashboard_settings` (clé `mail_filter`).
3. Tâches : sections en retard / aujourd'hui / prochaine session / sans échéance, ordre par `tasks.position` (monter / descendre). Les événements du jour comptent dans « Aujourd'hui ».
4. Apps (`app_links`), projets et jalons (création, renommage, statut, ordre, suppression) : supprimer un projet supprime d'abord ses lignes enfants (`lib/db-ops.js`).
5. « Organiser la page » (masquer, réafficher, réordonner les panneaux) s'enregistre dans `dashboard_settings` (clé `home_layout`).
6. `components/AutoRefresh.js` relit le serveur au retour sur l'onglet et toutes les 60 s (`router.refresh()`), pour garder téléphone et PC synchrones ; ces tables n'ont pas de realtime. SQL à exécuter : `supabase/dashboard-edit.sql`.

Un push sur `main` redéploie en production : ne jamais pousser sans accord explicite.

Contexte ajouté lors de la mise en place de l'architecture CLAUDE.GLOBAL —
historique complet dans `../../ARCHITECTURE.md`.

## Contexte détaillé (vault Obsidian)

Note de reprise (état réel du projet, décisions, points « À vérifier ») :
`C:\Users\thiba\CLAUDE.GLOBAL\Vault\01 Projets\dashboard-pilotage\dashboard-pilotage.md` — à lire
avant de fouiller le dossier. Le vault résume ; `../../ARCHITECTURE.md` et le code font foi.
