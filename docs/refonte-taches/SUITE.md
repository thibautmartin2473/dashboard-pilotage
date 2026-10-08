# Refonte du design de Cadran : où on en est et la suite, session par session

Point de reprise unique. Demande de Thibaut (2026-10-07) : « segmente le travail, on va l'étaler
sur plusieurs sessions, mais ne perds pas ce que tu as fait ». Règle : **une catégorie à la fois**,
il tranche, puis on construit l'étape suivante (CLAUDE.md global, « Propositions de design »).

## Pour reprendre (début de chaque session)

1. `Set-Location C:\Users\thiba\CLAUDE.GLOBAL\Apps\dashboard-pilotage ; git switch demo/v2`
2. Lancer les démos en local (lecture seule de la vraie base, sans mot de passe, ce PC seulement) :
   `npx next dev -p 3100 -H 127.0.0.1`, puis http://127.0.0.1:3100/demo
   (le fichier `.env.development.local`, non suivi par git, coupe le Basic Auth en dev).
3. Lire ce fichier, puis `Vault/02 Domaines/Design/Mes goûts en design.md` (ses goûts, par projet
   et objectif) et la note `Vault/02 Domaines/Design/Recherches/2026-10-07 dashboard-pilotage - Cockpit et studio de vitrines.md`.
4. La branche `demo/v2` ne se merge jamais : on porte seulement ce qu'il choisit dans le vrai code,
   sur une branche propre, avec sa PR.

## Déjà fait et décidé

| Étape | État | Où |
|---|---|---|
| Cockpit (organisation, rail, Graphite sombre équilibré, liste À ranger, rangement forcé, mails côte à côte) | En production le 2026-10-07 (PR #26, #27, #28) | `docs/refonte-taches/DECISIONS.md` |
| Logos des apps (Spircle, EDHEC AI) | PR #29 ouverte, à merger | branche `feat/app-logos` |
| Agenda : plages et tâches en blocs successifs | Règle dans le skill `planifier` | `~/.claude/skills/planifier/SKILL.md` |
| Recherche (saves Instagram, GitHub, forums, apps de référence, design) | Faite | `RECHERCHE-PROFONDE.md` (synthèse et grille), `recherche/*.md` |
| **Étape 1 : nom** | **Choisi : Cadran** | `/demo/identite` (6 noms comparés) |
| **Étape 2 : logo** | **Choisi : l'anneau horaire** (proposition 5), à affiner | `/demo/logo`, SVG `public/demo/logos/cadran-anneau-*` |

## Les sessions suivantes (une catégorie par session)

1. **Session A, affiner le logo choisi (l'anneau horaire)** : sa faille est le 16 px (il ne reste
   qu'une couronne coupée) et il se vide les jours sans événement. Proposer 3 variantes de
   simplification pour le favicon et l'icône, la version vivante (calculée sur la vraie journée)
   et la piste de couleur (bleu Martini, vert Aston éclairci ou giallo, proposées sur la page).
   Il tranche, puis on passe à la charte.
**État au 2026-10-08** : moodboard fait (`/demo/references`, `MOODBOARD.md`) ; votes « J'aime » 1, 3, 6, 7,
13, 18, 19, 20 ; « Pas pour moi » 2, 4, 5, 8 à 12, 14 à 17. **Charte choisie : Cuir et bordeaux**
(`/demo/chartes-cadran`, id `cadran-cuir`), **en un seul mode équilibré, ni clair ni sombre**.
Niveau d'équilibre choisi : **2, brun cuir** (id `cadran-cuir`). **Organisation choisie (2026-10-08) : « tout sur un écran » + bandeau « Maintenant »** (esquisse 2 : rail avec apps en icônes, agenda 5 jours pleine hauteur, colonne droite partagée À ranger en haut et mails Gmail | EDHEC compacts en bas, sans défilement ; bandeau fin au-dessus de l'agenda : tâche en cours, temps restant, prochain bloc, nombre à ranger). En cours et 3 systèmes de boutons dessinés dans cette charte (`/demo/composants-cuir` : Sellerie,
Planche de bord, Édition). **Fonctionnalités choisies (2026-10-08)** : 2 budget de temps, 3 journée à plafond, 4 Claude propose et
tu valides, 5 date de début, 7 traçabilité, 8 glisser et report groupé, 12 habitudes à fenêtre
flexible, 13 saisie naturelle et durée (numéros de `FONCTIONNALITES.md`) ; écartées 1, 6, 9, 10, 11.
**Boutons** : Sellerie rejetée (« des pointillés partout j'aime pas »). Nouveau cap : « un dashboard
pro financier qui fait tech », le plus efficace et instinctif, pas le plus original, appuyé sur la
recherche académique en interfaces (`recherche/papiers-ui.md`, en cours). **Choix finaux (2026-10-08)** : charte appliquée en « cadre cuir, contenu crème » (rail, bandeau
et en-têtes en brun cuir niveau 2 ; agenda, À ranger et mails en texte sombre sur crème) ; boutons
« touche de terminal » (lettre encadrée devant, fond tinté, trait d'état de 2 px, 32 px de haut) ; les
15 règles de `recherche/papiers-ui.md` s'appliquent. **Tous les choix de design sont faits : reste la
mise en vrai (session E), en lots avec une PR chacun.**

**Mise en vrai** : lot 1 « nouveau look » (nom, logo, charte cuir et crème, tout sur un écran, bandeau
Maintenant, boutons touche de terminal) = PR #30 (branche feat/cadran-look), 793k tokens pour 0,8 M
estimés. Reste : lot 2 (fonctions 5, 13, 7, environ 0,5 M), lot 3 (2, 3, 8, environ 0,8 M), lot 4 (4, 12,
environ 0,6 M). Défaut connu à traiter d'abord : dans l'agenda, plage et tâches successives côte à
côte en colonnes étroites, au lieu de tâches posées sur la plage.

2. **Session B, charte** : **Graphite est rejetée** (« je n'aime pas du tout la charte graphique
   Graphite », 2026-10-07 au soir, alors qu'elle est en production). On repart d'un moodboard de
   références réelles plébiscitées (`/demo/references`, `MOODBOARD.md`) : il marque « J'aime » /
   « Pas pour moi » et colle le récapitulatif ; on en tire 3 à 4 chartes nouvelles (pas des
   variantes de Graphite), avec le logo anneau horaire et l'audit de contraste APCA de
   `recherche/design.md`. Les 4 chartes « graphite-* » de `/demo/chartes` sont caduques.
3. **Session C, boutons et micro-interactions** : la première série (Relief, Verre, Trait) a été
   jugée « pas très innovante ». La refonte audacieuse a été arrêtée avant d'écrire (fenêtre de
   tokens à 20 %) : son brief est prêt (3 concepts d'objet : planche de bord des années 70 avec
   interrupteurs à capot, molette crantée, voyants et compteurs à rouleaux ; objet industriel Braun
   / Teenage Engineering ; un troisième au choix), à relancer APRÈS le choix de la charte pour
   qu'ils parlent la même langue.
4. **Session D, fonctionnalités** : `FONCTIONNALITES.md` (paniers indispensables, fortes, bonus)
   et 4 maquettes sur `/demo/fonctionnalites` (fin de vie par défaut, la tâche comme budget de
   temps, plafond de la journée, Claude propose et tu valides). Il choisit son panier.
5. **Session E, mise en vrai** : porter nom, logo, charte, composants et fonctionnalités choisis
   dans le vrai code (branche propre, PR, SQL éventuel exécuté par lui), avec estimation de tokens
   annoncée avant de lancer.

## Ce qui n'a pas été fait (à savoir)

- Les juges et l'amélioration automatique des 4 axes ont été arrêtés (passage au pas à pas) :
  les premières versions de chartes et de fonctionnalités n'ont pas été relues par un juge.
- Reddit était inaccessible aux outils de recherche : remplacé par Hacker News et des forums.
- Le test vocal du nom (dicter « ouvre Cadran ») n'a pas été fait.

## Coût en tokens de cette phase (entrée comprise)

| Lot | Tokens |
|---|---|
| Recherche rapide et designers coupés par le réseau | 0,69 M |
| Recherche profonde (7 agents) | 1,48 M |
| Première version des 4 axes (arrêtée avant juges) | voir journal du workflow wf_1adecdd0-dda |
| Logo Cadran (5 propositions) | 0,23 M |
| Refonte des boutons | voir bilan de fin de session |
