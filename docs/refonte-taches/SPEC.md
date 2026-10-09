# Cadran : spécification complète (validée par Thibaut le 2026-10-08)

Fichier unique à lire par la session qui construit. Tout ce qui suit a été choisi par Thibaut, en
visuel, une question à la fois. Historique et raisons : `SUITE.md` (même dossier) et le vault
(`Vault/02 Domaines/Design/Mes goûts en design.md`, note de recherche « Cockpit et studio de vitrines »).

## 0. Vision et méthode

- **Vision** : « rendre Obsidian obsolète, car on le vibecode nous-mêmes pour le remplacer ». Constellation
  (le graphe du vault) est la première brique ; lecture, recherche et édition des notes viendront ensuite.
- **Méthode** : reprendre la PR #30 (branche `feat/cadran-look`, non mergée) dans le nouveau cap, sur la même
  branche. Garder : nom Cadran, logo, bandeau « Maintenant » (`nowState`), organisation sur un écran,
  page `/apps`, proxy des icônes, tests. Refaire : charte, boutons, blocs d'agenda, épuration. Annoncer
  l'estimation de tokens avant de lancer (repère : environ 0,6 à 0,7 M), attendre son « go ».
- Règles de forme : français, aucun emoji, aucun tiret cadratin ni demi-cadratin, base Supabase de production
  (aucune écriture de test), un push sur `main` = production (jamais sans son accord).

## 1. Organisation (inchangée, à épurer)

Tout sur un écran à partir de 1280 px : rail à gauche ; bandeau « Maintenant » en haut ; agenda 5 jours
pleine hauteur ; colonne droite avec « À ranger » en haut et les mails en bas ; chaque zone défile à
l'intérieur. Sur téléphone : le même Cockpit empilé (choix 16A).

## 2. Couleurs (un seul mode, ni clair ni sombre)

| Rôle | Valeur |
|---|---|
| Fond de page | bleu gris moyen `#8E9CB4`, avec Constellation en fond (section 7) |
| Barres (rail, bandeau) | verre translucide (blanc environ 30 %, filet blanc 50 %, flou), **texte sombre** (le blanc sur ce verre est illisible) |
| Cartes (agenda, À ranger, mails) | blanc à **75 % d'opacité** (laisse voir Constellation), texte `#1B1F2A`, secondaire `#6B7385` |
| Accent et tâches | bleu acier `#3B6A9A` (texte blanc, environ 5,6:1) |
| Retard et conflit | corail doux `#C0664A` |
| Fait | barré gris |
| Interdit | violet ; multiplication des couleurs hors agenda |

## 3. Blocs de l'agenda

Présentation façon Calendrier d'Apple : fond pâle teinté, filet de 3 px à gauche, texte de la même teinte.
- **Plages** : cours et sport en olive Mini `#6E7B45` (fond `#E7EBDD`, texte `#3F4A22`) ; examens et tests en
  **bordeaux plein** `#7A1E2C`, texte blanc ; rendez-vous en cuir `#A0714A` (fond `#EFE2D3`, texte `#6A4426`) ;
  prépa encadrée (Strategy Boost, cas en binôme) en gris bleu `#8E9CB4` (fond `#EEF0F3`) ; journée entière en
  bandeau gris.
- **Tâches** : bleu acier ; travail de fond en bloc plein ; tâche courte en pastille à contour ; urgent
  signalé par une icône seulement. Les tâches sont **posées dans leur plage** (pas côte à côte en colonnes
  étroites : défaut actuel à corriger).
- **Icône au trait par type** (cours, examen, rendez-vous, prépa, sport, travail, courte, urgent), masquée
  sous 30 minutes.
- **États** : en cours (double anneau), passé (transparent), fait (barré gris), retard (filet corail),
  à confirmer (bloc vide), déplacé (flèche « à renvoyer vers Google »), conflit (anneau corail).
- **Reclassement automatique** d'après le titre (examen, test, partiel ; call ou prénom ; Strategy Boost,
  case), corrigeable d'un clic ; les catégories manuelles restent.
- **« Maintenant »** : une bande teintée sur l'heure en cours (pas de trait).
- **Jours** : 5 jours glissants depuis aujourd'hui. **Heures** : 8 h à 22 h.
- **Navigation** façon Calendrier : « Aujourd'hui », deux flèches, un bouton « + » (ajouter un événement et
  catégories) ; plus de légende, plus de ligne « Fait », plus de « Mis à jour il y a ».

## 4. Rail, bandeau, Zone Commande

- **Rail** : icônes seules (Cockpit, À ranger, Agenda, Mails, Idées), qui **s'élargit avec les libellés au
  survol de la souris** ; apps en petites icônes en bas ; la liste des projets quitte le rail (page `/apps`).
- **Logo** : anneau horaire **blanc sur bleu acier** ; mot « Cadran » dans la police de l'interface.
- **Bandeau « Maintenant »** : une ligne avec le bloc en cours, le temps restant et **le prochain bloc visible**.
- **Zone Commande** : retirée de l'écran, ouverte par Cmd+K ou Ctrl+K (façon Spotlight).

## 5. À ranger, mails, boutons, police

- **À ranger** : une ligne par élément (titre, suggestion) ; les 5 gestes (Valider, Affecter ailleurs, Fait,
  Supprimer, Plus tard) **toujours visibles sur l'élément sélectionné** ; touches V A C S P actives au clavier.
- **Rangement forcé** à l'ouverture : gardé, présenté comme une **feuille iOS** qui monte du bas.
- **Mails** : une seule liste triée par date, étiquette « EDHEC » ; une ligne par mail (expéditeur, objet),
  la ligne entière ouvre Gmail ; EDHEC sans faux non-lus.
- **Boutons** : façon Apple, arrondis, une seule couleur pour l'action principale (bleu acier), gris clair
  pour les autres ; raccourcis indiqués au survol (plus de lettres encadrées).
- **Police** : celle d'Apple (`-apple-system`, SF Pro), Segoe UI sur Windows.

## 6. Recherche à respecter

`recherche/papiers-ui.md` (« Règles pour Cadran ») : cibles de 32 px à la souris et 44 px au toucher,
contrastes 4,5:1 pour le texte, retours en moins de 100 ms, au plus 3 niveaux de boutons, aucune texture
confondue avec un bouton.

## 7. Constellation (graphe du vault en fond)

- **Emplacement** : en fond d'écran derrière tout le Cockpit, cartes à 75 % ; un clic sur le fond (ou une
  icône du rail) ouvre la vue plein écran pour naviguer (zoom, glisser, survol qui allume les voisins,
  clic qui ouvre la note).
- **Rendu** : façon Obsidian (forces : répulsion, ressorts sur les liens, rappel au centre), recadré sur
  toute la page ; points **colorés** par dossier, jamais blancs (projets, EDHEC et carrière en bleu acier,
  finance en bordeaux, design en cuir, perso en olive, ressources et Instagram en gris bleu foncé) ; liens
  gris bleu `#4E5C78` à faible opacité. Rendu de référence : `rendus/constellation-v4-*.png` et
  `rendus/build.py` (mise en page calculée sur le vrai vault).
- **Kit à intégrer** (préparé par la session « Mods sur Claude ») :
  `C:/Users/thiba/CLAUDE.GLOBAL/Tools/claude-mods/constellation/dashboard-kit/` (README) :
  `supabase/vault-graph.sql` (à exécuter par Thibaut), `app/api/hooks/vault-graph/route.js`,
  `lib/vault-graph.js`, `components/Constellation.js` ; remplacer ses couleurs provisoires « Nuit niçoise »
  par celles ci-dessus. **Prévenir la session « Mods sur Claude » par message** quand la route est en ligne et
  la table créée (le plugin Obsidian `constellation-cockpit` est prêt mais désactivé).

**Mise à jour du 2026-10-08 (validée par Thibaut avec la session « Mods sur Claude », prime sur les couleurs
ci-dessus pour le graphe)** : chaque noeud porte un champ `type` (Hub, Fiche, Cours et cas, Outil Claude, Note, PDF,
Image, Save Instagram), calculé par le plugin et conservé par la route. **Couleurs du graphe : uniquement des
dégradés de bleu et de gris, pas de vert** ; couleur du point = type, couleur du lien = thème (dossier déduit de
`path`) ; olive, cuir et bordeaux exclus du graphe. Le composant du kit est déjà dans ces couleurs : **ne pas les
remplacer**. Vue plein écran sur `#1E2433` ; en fond derrière le Cockpit, garder la page `#8E9CB4` et poser le graphe
du kit par-dessus avec ses couleurs (vérifier au rendu la lisibilité sous les cartes à 75 %). Même charte « cadran »
appliquée au graphe Obsidian.

## 8. Après le look : fonctionnalités, en lots

Ordre : lot 2 = 5 (date de début), 13 (saisie naturelle et durée), 7 (traçabilité de ce que Claude pose) ;
lot 3 = 2 (la tâche est un budget de temps), 3 (journée à plafond), 8 (glisser et report groupé) ;
lot 4 = 4 (Claude propose, tu valides), 12 (habitudes à fenêtre flexible). Détail : `FONCTIONNALITES.md`.
Puis, dans une session dédiée : la source du vault sans Obsidian (vision, section 0).
