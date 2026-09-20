@AGENTS.md

# dashboard-pilotage

Outil de pilotage cross-projets de Thibaut : il suit les "feeds" de code/chat
Claude (Spircle, Stage, EDHEC AI...) et montre quelles tâches sont terminées et
lesquelles restent à faire, en un seul endroit.

Statut au 2026-09-20 : construit et déployé sur Vercel
(`dashboard-pilotage-omega.vercel.app`), données dans Supabase. Ce qui existe :

- **UI** : vue d'ensemble (`/`), détail projet avec jalons éditables
  (`/projects/[slug]`), carte des interactions (`/map`), boîte à idées (`/brain`).
- **Suivi des sessions Claude** : hook de fin de session
  (`scripts/claude-hook-session-end.mjs`, à copier dans chaque repo suivi) →
  `POST /api/hooks/session-end`. Actif dans EDHEC AI, Stage et 3 sous-projets
  Spircle ; pas encore installé sur ce repo.
- **Claude Brain** : table `brain_notes`, `GET`/`POST /api/brain-notes`,
  `PATCH /api/brain-notes/[id]` (voir `../../claude.brain/CLAUDE.md`).
- **API publique** `GET /api/public/overview` (CORS ouvert), lue par l'artifact
  Tour de Contrôle.
- **Rafraîchissement** : cron Vercel quotidien `/api/cron/refresh`.
- **Sécurité** : Basic Auth (`proxy.js`), sauf les routes cron, hooks, public et
  brain-notes. `supabase/enable_rls.sql` est à exécuter à la main dans Supabase
  (exécution non confirmée).

Un push sur `main` redéploie en production : ne jamais pousser sans accord explicite.

Contexte ajouté lors de la mise en place de l'architecture CLAUDE.GLOBAL —
historique complet dans `../../ARCHITECTURE.md`.

## Contexte détaillé (vault Obsidian)

Note de reprise (état réel du projet, décisions, points « À vérifier ») :
`C:\Users\thiba\CLAUDE.GLOBAL\Vault\01 Projets\dashboard-pilotage\dashboard-pilotage.md` — à lire
avant de fouiller le dossier. Le vault résume ; `../../ARCHITECTURE.md` et le code font foi.
