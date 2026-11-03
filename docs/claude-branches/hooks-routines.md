# 1b. Hooks, routines, tâches planifiées, sauvegarde

Périmètre : tout ce qui écrit dans la base sans clic de Thibaut ou à heure fixe : hook de fin de session, activité du jour, cron Vercel, tâches planifiées Windows, export Supabase. La routine `refresh-dashboard-agenda-mails` (agenda, mails, notifications) est décrite dans `D\agenda-sync.md` et `D\notifications-mails.md`, les calculs d'avancement dans `D\avancement.md` (ce hook relance `push-avancement.mjs` : point Activité du jour ci-dessous). (`D\` = `docs\claude-branches\`, voir la racine du projet.)

- **Suivi des sessions Claude** : hook de fin de session
  (`scripts/claude-hook-session-end.mjs`, à copier dans chaque repo suivi) →
  `POST /api/hooks/session-end`. Actif dans EDHEC AI, Stage et 3 sous-projets
  Spircle ; non installé sur ce repo au 2026-11-03 (aucun hook dans `.claude/settings.local.json`).
- **Activité du jour** (2026-10-19, pour l'artifact « Ma journée » de Thibaut, qui doit être en direct) :
  hook global `GLOBAL/Systeme/Hooks/activite-jour/activite-jour.js` (UserPromptSubmit + Stop, toutes les
  sessions du PC, envoi détaché) → `POST /api/hooks/activite` (HOOK_SECRET) → fonction `activite_noter`,
  tables `activite_sessions` et `activite_evenements` (`supabase/activite-jour.sql`, à exécuter par Thibaut,
  RLS sans policy anon). Lecture : `GET /api/public/activite?cle=&depuis=&vue=sessions|evenements`, clé
  `ACTIVITE_CLE` (variable Vercel, distincte de HOOK_SECRET). L'artifact ne passe PAS par cette route : le
  connecteur Vercel de claude.ai est refusé sur l'équipe « spircle » (403 au contournement de protection,
  2026-10-19) ; il lit les tables par le connecteur Supabase (`execute_sql`, thème recalculé en SQL avec les
  mêmes motifs que `lib/activite.js` : garder les deux alignés). La route reste pour tout autre lecteur.
  L'artifact lit aussi `avancement` (objectifs) et `tasks` ; pour que les niveaux soient en direct, le même hook
  relance `scripts/push-avancement.mjs` (checkout principal) à chaque fin de tour d'une session de travail, au plus
  toutes les 3 minutes, en plus de la tâche planifiée de 20h50.
  Titres de session, thème, heures, nombre de messages ; jamais le contenu. Thème déduit du titre puis du
  dossier (`lib/activite.js`, testé par `scripts/check-activite.mjs`) ; routine = balise `<scheduled-task`.
- **Rafraîchissement** : cron Vercel quotidien `/api/cron/refresh`.

## Sauvegarde et tâches planifiées

1. **Sauvegarde** : `scripts/export-supabase.mjs` exporte TOUTES les tables (découvertes par l'OpenAPI de PostgREST, pagination suivie, 30 s maximum par requête, lecture seule) dans `C:\Users\thiba\GLOBAL\Backups\supabase\AAAA-MM-JJ.partial`, renommé en `AAAA-MM-JJ` à la FIN seulement ; la rotation garde les 8 derniers dossiers qui contiennent `_export.json` (jamais d'autre dossier). Il écrit `_etat.json` (succès ou échec, date, dernier succès) que `push-avancement.mjs` relaie dans la ligne `note:export` : l'onglet dit « Dernier export de la base : il y a N jours » (corail au-delà de 9 jours) ou « échec ... ».
2. **Tâches planifiées Windows** : `scripts/install-taches.ps1` (à lancer par Thibaut depuis le checkout principal, après le merge ; refuse de partir d'un worktree ; sans droits admin, tâches visibles dans le Planificateur, 3 nouvelles tentatives à 10 minutes d'écart, fenêtre masquée via `scripts/lancer-masque.vbs`, rattrapage au démarrage, idempotent) enregistre « CLAUDE.GLOBAL - Avancement Cadran » (tous les jours à 20h50) et « CLAUDE.GLOBAL - Export Supabase » (dimanche à 20h40). Journal : `%LOCALAPPDATA%\Cadran\taches.log` (500 dernières lignes gardées).
