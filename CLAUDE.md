@AGENTS.md

# dashboard-pilotage : racine toujours chargée

Outil de pilotage cross-projets de Thibaut : il suit les "feeds" de code/chat
Claude (Spircle, Stage, EDHEC AI...) et montre quelles tâches sont terminées et
lesquelles restent à faire, en un seul endroit.

Règles générales (français, rien ne part tout seul, pas de tiret cadratin, etc.) : `C:\Users\thiba\.claude\CLAUDE.md` et `C:\Users\thiba\GLOBAL\CLAUDE.md`, chargés avant ce fichier. Historique complet des décisions : `C:\Users\thiba\GLOBAL\ARCHITECTURE.md`.

Feuilles de ce projet : `docs\claude-branches\` (noté `D\`). **Lecture des feuilles (même décision de Thibaut que la racine de GLOBAL, 2026-11-03 : « ne jamais rater d'info »)** : avant d'agir, lis TOUTE feuille dont le sujet touche la demande (une demande en touche souvent plusieurs : un changement de l'agenda lit 2a et 2b, toute modification visuelle lit aussi 3b) ; dans le doute entre deux feuilles, lis les deux. Tout brief de subagent ou de session fille nomme les feuilles à lire et recopie les règles ci-dessous (ils ne reçoivent pas les feuilles d'office).

## Règles du projet (toujours)
1. Un push sur `main` redéploie en production : ne jamais pousser sans accord explicite. Une branche et une PR par tâche (règle déjà portée par `B\projets.md` et par l'agent `dashboard-dev`, rappelée ici parce qu'elle conditionne tout changement).
2. **Idées d'amélioration de Thibaut** : les noter dans `BACKLOG.md`, sans coder ni ouvrir de PR à chaque idée ; une PR groupée seulement quand il y en a assez ou qu'il le demande.
3. Les fichiers `supabase/*.sql` sont exécutés par Thibaut (base de production), jamais par Claude ; le code doit continuer de marcher avant leur exécution (repli sans erreur, message qui renvoie au fichier). Le détail de chaque table est dans sa feuille.
4. Next.js de ce projet : lire `AGENTS.md` (chargé en tête) avant d'écrire du code ; ce n'est pas le Next.js que tu connais.
5. Reprise : lis la note hub du vault avant de fouiller le dossier : `C:\Users\thiba\GLOBAL\Vault\02 Projets\Fiches projets\dashboard-pilotage\dashboard-pilotage.md` (état réel du projet, décisions, points « À vérifier »). Le vault résume ; `GLOBAL\ARCHITECTURE.md` et le code font foi.

## Quelle demande ? (un choix, puis la feuille ; `D\` = `docs\claude-branches\`)
1. Données, sécurité, hooks
   - 1a. Tables Supabase et RLS, Basic Auth, API publique, Claude Brain, URL de production : `D\donnees-securite.md`
   - 1b. Hook de fin de session, activité du jour, cron Vercel, tâches planifiées Windows, export et sauvegarde Supabase : `D\hooks-routines.md`
2. Agenda
   - 2a. Synchro Google et Gmail (`push-agenda.mjs`), mails, renvoi vers Google, Aurion, Outlook, liens de visio, catégories : `D\agenda-sync.md`
   - 2b. Affichage : frise glissante, blocs façon Calendrier, types, couches, glisser-déposer : `D\agenda-affichage.md`
3. Cockpit et rangement
   - 3a. Disposition de `/` et des vues plein écran, bandeau « Maintenant », rail, navigation fluide, raccourcis `g`, boutons : `D\cockpit-ui.md`
   - 3b. Charte Cadran, jetons de `globals.css`, contraste, police : `D\charte-jetons.md`
   - 3c. « À ranger » : liste, suggestion, cinq gestes V A C S P, rangement forcé, `ranger.sql` : `D\a-ranger.md`
4. Saisie et édition
   - 4a. Édition sur le site (Server Actions), tâches, apps et projets (`/apps`, `/projects/[slug]`), idées (boucle Instagram, affectation), Zone Commande : `D\edition-saisie.md`
   - 4b. Notifications issues des mails (`push-notifications.mjs`, type `move`) : `D\notifications-mails.md`
5. Avancement (`/avancement`, résumé sous le Cockpit, `push-avancement.mjs`) : `D\avancement.md`
6. Constellation (graphe du vault, fond animé, plugin Obsidian) : `D\constellation.md`

Une demande hors de ces six sujets : lire `README.md` et le code, puis proposer à Thibaut la feuille qui manque (une règle apprise en session s'écrit dans sa feuille, jamais seulement en mémoire de session). `CLAUDE.md` (racines et feuilles) et `GLOBAL\ARCHITECTURE.md` se mettent à jour ensemble.
