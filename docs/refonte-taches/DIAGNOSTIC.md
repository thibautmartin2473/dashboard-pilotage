# Diagnostic : tâches, idées et notifications du dashboard (2026-10-06)

Demande de Thibaut : « À part l'agenda que j'utilise au quotidien, le reste (tâches, choses en attente,
to-do) est mal configuré : ça s'allonge en dessous et perd de la valeur. Fais-moi plusieurs
propositions pour que ces outils m'aident au quotidien. »

## Chiffres de la base de prod (lecture seule, 2026-10-06)

- **Tâches** : 80 lignes, 60 ouvertes, dont environ 40 en retard (la plus ancienne due le 24/09).
  20 faites en 30 jours, **2 sur les 7 derniers jours**, 1 seule depuis le 29/09. 8 des 20 faites
  l'ont été le 24/09, le jour où il a collé la liste des retards dans le chat.
- Sources : 66 `claude` (skill `planifier`), 12 `notification` acceptée, 1 `command`, 1 `suggestion`.
  Presque toutes les tâches portent `event_id` (posées dans un bloc orange `[bloc planifié]` de
  Google Agenda, colorId 6) : **la tâche est une copie de ce que l'agenda montre déjà**.
- Doublons et séries : « Drill arborescences MECE » x3, « Case Coach n°1..4 », « Payer le loyer /
  l'EDHEC » d'octobre à décembre (6 lignes pour 2 paiements récurrents), deux tâches « dépriorisé »
  qui regroupent d'autres tâches encore ouvertes.
- Nature des tâches ouvertes, à peu près : préparation conseil (cas, drills, fit, Boost) ~25,
  networking / relances de personnes ~10, candidatures à date (Bain 02/11, OW 26/10, BNP 26/10,
  L.E.K. janvier, Boost CV 16/10) ~6, administratif et paiements ~8, projets Claude / Spircle ~8.
- **Notifications** : 121 lignes, **99 `new`**. 95 sont des « Oublié hier ? » fabriquées chaque jour
  par l'étape 4 bis de la routine `refresh-dashboard-agenda-mails` (une par tâche d'un bloc orange
  d'hier ou par tâche échue hier). 0 acceptée, 6 ignorées, 89 intactes. La même tâche revient
  plusieurs jours de suite (dedupe_key par date) et parfois deux fois le même jour.
  « Ignorer = c'était fait » ne coche pas la tâche correspondante ; « Accepter » crée une nouvelle
  tâche : **la boucle fabrique des doublons au lieu de les résorber**.
- **Idées** (`brain_notes`) : 6 `new`, toutes du 21/09, toutes tirées des saves Instagram, jamais
  traitées. Rien ne déclenche leur tri.

## Comment il travaille (929 messages du 22/09 au 06/10)

- Tous les jours, 9h-12h puis 14h-19h, souvent jusqu'à 22h. 6 à 22 sessions Claude par jour, surtout
  depuis l'appli desktop. **Il pilote par la conversation avec Claude**, pas en cliquant sur le site :
  14 messages sur 929 parlent du dashboard, 23 de l'agenda. Il demande à Claude de modifier le
  dashboard (« remplace tous les cas de mon agenda par des drills », « mets le dashboard à jour en ne
  visant que les stages »).
- Sujets : préparation conseil (fit, cas, drills, fiches cabinet, networking, lettres), puis
  dashboard / vault, Spircle, compta (ACC 812).
- Échéances proches : 07/10 exam Research Methodology ; 12, 14, 16, 25/10 tests en ligne Oliver
  Wyman / Gorilla ; 18-20/10 révisions ; 21-23/10 Final Exams ; 26-30/10 tests Gorilla Bain.
- Règles déjà posées : pas de notification push (seulement de l'affichage au bon endroit le jour
  venu) ; une seule surface (le site) ; agenda Google = source de vérité de son temps.

## Le problème en une phrase

L'agenda marche parce qu'il est **borné par le temps** (une journée se termine). Les tâches, idées et
notifications n'ont **aucune fin de vie** : rien ne sort sans clic, la routine en rajoute chaque jour,
et la liste devient un cimetière qu'il ne regarde plus.

## Principes pour les propositions

1. L'agenda est la surface principale : une tâche vit dans un bloc, pas dans une liste à part.
2. Tout élément a une fin de vie (fait, recasé, abandonné, expiré) ; ne rien faire ne doit pas
   accumuler.
3. Un rappel de la veille = une seule carte de bilan, pas N notifications.
4. Séparer les vraies échéances (candidatures, paiements, tests) des to-do de travail.
5. Peu de choses visibles à la fois (3 priorités du jour), le reste replié.
6. Il pilote par Claude : chaque geste doit aussi être faisable par une phrase dans une session.
