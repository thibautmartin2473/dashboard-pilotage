@AGENTS.md

# dashboard-pilotage

Outil de pilotage cross-projets de Thibaut : il suit les "feeds" de code/chat
Claude (Spircle, Stage, EDHEC AI...) et montre quelles tâches sont terminées et
lesquelles restent à faire, en un seul endroit.

Statut au 2026-09-20 : construit et déployé sur Vercel
(`dashboard-pilotage-omega.vercel.app`), données dans Supabase. Ce qui existe :

- **UI** : accueil (`/`) = synthèse du jour, panneaux tâches / idées / suggestions et
  grille d'apps (une app externe par projet dans `lib/apps.js`, sinon
  `/projects/[slug]`) ; détail projet avec jalons éditables, carte des
  interactions (`/map`), boîte à idées (`/brain`). Manifest : installable sur mobile.
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
  `suggestions` (`supabase/instagram.sql`) ont RLS **sans aucune policy anon** : lues
  et écrites côté serveur seulement (`lib/home-data.js`, `app/actions.js`, clé
  service_role), derrière le Basic Auth, jamais dans `/api/public/overview`.

## Suggestions de next steps (boucle Claude, sans modèle côté site)

1. `node --env-file=.env.local scripts/import-instagram.mjs` copie les notes du skill `instagram-memoire` dans `instagram_saves` (idempotent, `--dry-run`).
2. En session, Claude lit `instagram_saves` (récentes) et les projets, et insère dans `suggestions` des lignes `{ project_slug, text, source_save_id, status: 'new' }` via `getSupabaseAdmin()`.
3. L'accueil les affiche : « Ajouter à la prochaine session » crée une tâche `next_session`, « Ignorer » passe la suggestion à `dismissed`.
4. Aucun appel à Instagram ni à un modèle depuis le site : rien de plus à configurer.

Un push sur `main` redéploie en production : ne jamais pousser sans accord explicite.

Contexte ajouté lors de la mise en place de l'architecture CLAUDE.GLOBAL —
historique complet dans `../../ARCHITECTURE.md`.

## Contexte détaillé (vault Obsidian)

Note de reprise (état réel du projet, décisions, points « À vérifier ») :
`C:\Users\thiba\CLAUDE.GLOBAL\Vault\01 Projets\dashboard-pilotage\dashboard-pilotage.md` — à lire
avant de fouiller le dossier. Le vault résume ; `../../ARCHITECTURE.md` et le code font foi.
