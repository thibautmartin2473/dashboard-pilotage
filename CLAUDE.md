@AGENTS.md

# dashboard-pilotage (démo : refonte Cadran)

Outil de pilotage cross-projets de Thibaut : il suit les "feeds" de code/chat
Claude (Spircle, Stage, EDHEC AI...) et montre quelles tâches sont terminées et
lesquelles restent à faire, en un seul endroit.

Ce dossier est le worktree de la branche `demo/v2` (refonte Cadran, jamais mergée) du projet `Projets/dashboard-pilotage`. Point de reprise : `docs/refonte-taches/SUITE.md` ; décisions : `docs/refonte-taches/DECISIONS.md`. Le CLAUDE.md du projet de production est `Projets\dashboard-pilotage\CLAUDE.md` (déjà en arbre).

Règles générales : `C:\Users\thiba\.claude\CLAUDE.md` et `C:\Users\thiba\GLOBAL\CLAUDE.md`. Historique complet des décisions : `C:\Users\thiba\GLOBAL\ARCHITECTURE.md`.

Feuilles de ce dossier : `docs\claude-branches\` (noté `D\`). Avant d'agir, lis TOUTE feuille dont le sujet touche la demande (décision de Thibaut, 2026-11-03 : « ne jamais rater d'info ») ; dans le doute entre deux, lis les deux. Tout brief de subagent ou de session fille nomme les feuilles à lire.

## Quelle demande ?
1. État du site, tables Supabase, sécurité, API publique, hook de session, activité du jour, Brain, cron : `D\etat-site.md`
2. Agenda (synchro Google et Gmail, frise, blocs, glisser-déposer, catégories, visio, Aurion, Outlook) : `D\agenda.md`
3. Édition sur le site, idées (boucle Instagram, affectation), tâches, apps et projets, Zone Commande : `D\edition-idees.md`
4. Cockpit, rail, vues plein écran, charte et jetons, « À ranger », cinq gestes, rangement forcé : `D\cockpit.md`
5. Notifications issues des mails : `D\notifications-mails.md`

Reprise : lis la note hub du vault avant de fouiller le dossier : `C:\Users\thiba\GLOBAL\Vault\02 Projets\Fiches projets\dashboard-pilotage\dashboard-pilotage.md` (état réel, décisions, points « À vérifier »). Le vault résume ; `GLOBAL\ARCHITECTURE.md` et le code font foi.
