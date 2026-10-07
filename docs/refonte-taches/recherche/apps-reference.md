# Décortiquer les apps de référence (recherche du 2026-10-07)

Angle : ce que font réellement Sunsama, Akiflow, Motion, Amie, Notion Calendar (ex-Cron), Linear, Reclaim, Things 3, Height, Raycast, Arc, Superhuman, Todoist et TickTick, et ce qu'il faut en tirer pour le Cockpit de Thibaut (agenda 5 jours avec plages et tâches, liste « À ranger », rangement forcé, mails côte à côte, pilotage par conversation avec Claude). Ce fichier ne recopie pas RECHERCHE.md (qui traite des bibliothèques : Motion.dev, shadcn, cmdk, Sonner, etc.).

## 0. Fiabilité : à lire d'abord

1. **Méthode** : pages officielles lues par WebFetch (un petit modèle résume la page, donc les détails fins sont ceux du résumé, pas du texte brut) et recherches web. Tout ce qui est marqué **[Primaire]** vient d'une page officielle de l'éditeur lue ce jour. **[Secondaire]** = blog, comparatif, avis. **[Dérivé]** = reconstitué par un tiers à partir du CSS public (dépôt `awesome-design-md`, sites de « design systems »). Les couleurs [Dérivé] décrivent le site marketing, pas forcément l'application.
2. **Pas de Reddit, pas de GitHub Issues dépouillés** : le domaine reddit.com reste inaccessible à l'outil. Les avis d'usage viennent de comparatifs (Morgen, Saner, Carly, Efficient, Asian Efficiency, DEV Community). Beaucoup de ces comparatifs sont des sites d'affiliation ou de concurrents (Morgen vend un concurrent d'Akiflow et Motion) : ils servent à repérer des plaintes récurrentes, pas à mesurer.
3. **Consensus** (noté **[Consensus]**) = au moins une page officielle plus deux sources indépendantes qui concordent. **[Anecdotique]** = une seule source, ou un avis d'utilisateur. Rien n'est noté consensuel sans ces deux conditions.
4. **Non trouvé** : palette et typographie d'Akiflow, Reclaim, TickTick, Arc et Amie (pages de marque en 403 ou absentes). Je ne les invente pas. Les sons de validation de tâche : aucune source solide, seulement des avis épars (voir 3.9).
5. Dates : les pages d'aide n'affichent pas toujours de date. Je donne la date quand la page en porte une, sinon « lu le 2026-10-07 ».

## 1. Les 8 enseignements qui comptent pour Thibaut

Classés par utilité pour son problème (diagnostic du 2026-10-06 : 60 tâches ouvertes dont ~40 en retard, 95 notifications « Oublié hier ? » intactes, listes sans fin de vie).

1. **Une tâche est un budget de durée, le bloc d'agenda en est la consommation** [Primaire : Reclaim]. Chez Reclaim, la tâche porte une durée totale, due date, priorité ; l'agenda reçoit des « événements de tâche » ; on peut démarrer, arrêter, ajouter du temps, **consigner du travail fait hors bloc** (ce qui décrémente le reste), snoozer toute la tâche d'un coup, ou la marquer faite. Réglage clé : une tâche « fin de planification » peut être **rouverte ou clôturée automatiquement** après un délai choisi. C'est exactement la correction de son diagnostic (« la tâche est une copie de ce que l'agenda montre déjà » : ici, la tâche n'est pas une copie, c'est le stock de temps restant). Inférence de ma part : on peut reprendre ce modèle sans adopter Reclaim.
2. **Prévisualiser avant d'appliquer** [Primaire : Reclaim 2.0, aide + billet Dropbox]. Reclaim 2.0 met chaque changement proposé par l'assistant IA dans un « mode aperçu » (un calendrier bac à sable, rien n'est envoyé aux invités), puis un bouton unique de revue et d'application valide l'ensemble. Le billet d'ingénierie conclut qu'une IA utile a besoin du contexte, d'un moyen d'agir contrôlé et **d'une étape de revue avant que le résultat avance**. Thibaut pilote par Claude : c'est le geste manquant entre « Claude a replanifié » et « c'est écrit dans Google Agenda ».
3. **Un triage à quatre verbes et une touche** [Primaire : Linear]. Accepter (1), refuser (2), doublon (3), reporter (H), avec un report qui revient à l'heure choisie **ou dès qu'il y a une nouvelle activité**. C'est le modèle direct de « À ranger » + rangement forcé : l'élément ne reste pas, il sort par un verbe.
4. **Chaque chose a une fin de vie par défaut** [Consensus]. Linear : les tickets ouverts passent automatiquement au cycle suivant, mais ceux remis en backlog ou annulés ne reviennent pas, et la méthode dit d'oser jeter le backlog de faible priorité parce que l'important revient seul. Arc : les onglets non épinglés s'archivent seuls (12 h par défaut, 7 jours chez l'auteur d'un avis qui passe de 87 à 14 onglets, DEV Community, 2026-05-28). Things : « Someday » parque ce qui n'est pas clair. Reclaim : fermeture automatique. Todoist : reporter les retards en bloc. Aucune de ces apps ne laisse l'inaction accumuler.
5. **Limiter la charge du jour, pas l'ambition** [Consensus : Sunsama + Akiflow + Motion]. Sunsama : on règle sa charge cible par jour, avertissement à l'approche et au dépassement ; conseil officiel de n'engager que 5 à 6 heures sur 8. Akiflow : 2 à 3 objectifs du jour. À l'inverse, la plainte récurrente contre Motion est qu'il **tasse trop les journées** et laisse zéro marge (Saner, Morgen, deux sources indépendantes mais intéressées).
6. **Un rituel du soir qui ferme la journée** [Consensus]. Sunsama (arrêt à l'heure choisie, revue, réflexion, report des non faits), Akiflow (tâches faites, note de la journée, option de préparer demain). C'est la version « une seule carte de bilan » du principe 3 du diagnostic, à la place de 95 notifications.
7. **La rapidité perçue est un critère de design à part entière** [Consensus]. Superhuman vise moins de 50 ms (page officielle lue ; certains comparatifs disent 100 ms) et met en file les frappes tapées plus vite que la machine ; Things ouvre sa saisie rapide en moins d'une seconde ; Linear a bâti un moteur de synchronisation maison pour que l'interface réponde sans attendre le serveur. Conséquence côté Next : mises à jour optimistes sur chaque geste (ranger, reporter, valider).
8. **Il faut laisser la main à l'utilisateur sur le placement** [Consensus mitigé]. Motion (auto-planification totale) est critiqué pour l'opacité (« l'IA déplace des blocs sans expliquer »), le tassement et le prix ; Akiflow (placement manuel assisté) est loué pour le contrôle et critiqué pour le travail manuel quand la semaine déraille. Le juste milieu récent : l'IA propose et déplace sous aperçu (Reclaim 2.0, Aki qui demande confirmation pour les événements avec invités).

## 2. Fiches par application

Chaque fiche : ce qu'elle fait de plus fort, détails d'interface, charte, nom, limite, ce qu'on en retient.

### 2.1 Sunsama (planificateur quotidien guidé)
- **Rituels** [Primaire] : planification guidée du matin en cinq temps (traiter hier, planifier, prioriser ce qui peut attendre, préparer, publier le plan sur Slack), colonnes Aujourd'hui / Demain / Semaine suivante où l'on glisse le non urgent, estimation de durée par tâche, arrêt de journée à l'heure choisie (notification dans l'app qui ouvre le rituel, sans effet pour ceux qui planifient la veille), revue hebdomadaire (temps par « canal », report des tâches et objectifs, objectifs de la semaine suivante, réflexion avec une option « Automate » qui préremplit avec les tâches liées aux objectifs). Réglage : fusionner revue et planification de la semaine en un seul flux ; passer définitivement l'étape de journal.
- **Interface** : tâches en cartes, barre latérale gauche, calendrier vertical à côté, minuterie de focus avec pauses (Pomodoro), analyse du temps réel contre estimé avec rappel doux quand on dépasse.
- **Charte** : le site officiel parle de tons chauds (crème, beige) et d'accents verts pour les validations [Secondaire, résumé de page]. Une étude d'identité par agence donne orange Jaffa #F59549, mauve #B491FF, gris foncé #202228 et la police Outfit [Secondaire, snippet de recherche, page Behance en 403 : à ne pas citer sans vérification]. Les deux descriptions ne se recoupent pas parfaitement : retenir « chaud, calme, orange en marque ».
- **Nom** : « Sun » + « sama » ; je n'ai pas trouvé d'explication de l'éditeur, ne pas lui en prêter. Signal de ton : une promesse de calme (« commencer calme, finir serein », page d'accueil) plus qu'un nom de puissance.
- **Limites** : prix 22 dollars par mois (17 en annuel) ; plutôt solo ; l'API MCP est récente (statut « terminé » le 2026-08-27 sur leur feuille de route : placer une tâche dans le calendrier, créer dans un canal, chercher, minuteur ; manques déclarés : lister les canaux, récupérer par plage de dates).
- **On en retient** : la charge cible du jour, le rituel en cinq temps (version courte), le report assumé vers demain/semaine.

### 2.2 Akiflow (vitesse, saisie, bloc horaire)
- **Fonctions** [Primaire] : barre de commandes (Cmd+K dans l'app, Cmd+E global) avec jetons : `#` projet, `*` étiquette, `!` priorité, `<` échéance, `=` durée, `>` créneau ; **Time Slots** (un bloc contient plusieurs tâches, couleur, verrou, bouton « magique » qui replanifie les tâches non faites) ; boîte de réception universelle ; mode focus ; quatre rituels (planification du jour : récap d'hier, boîte d'entrée / semaine / mois, choix du jour, ajout d'un rappel d'arrêt ; arrêt du jour : tâches faites, note de la journée, préparation de demain ; équivalents hebdomadaires) accessibles en bas à gauche ; assistant Aki.
- **Aki** [Primaire] : crée et déplace tâches et créneaux, répond à « qu'est-ce qu'il me reste », **demande confirmation avant d'ajouter un événement avec invités**. Exemple de commande sur leur page : vider l'après-midi et repousser à demain tout ce qui n'est pas urgent. Serveur MCP pour Claude / ChatGPT (2026, [Secondaire : comparatif Akiflow vs Sunsama, publié par Akiflow lui-même, donc intéressé]).
- **Charte** : non retrouvée. Mentions « conçu en Italie », financé par Y Combinator.
- **Nom** : mot inventé, deux syllabes + « flow » (le flux promis). Fonctionne par la sonorité, mais sans sens propre : ce type de nom dépend entièrement du produit pour exister.
- **Limites** [Secondaire, Morgen, intéressé] : support lent, mobile instable avec doublons, travail manuel quand la semaine déraille, IA jugée immature.
- **On en retient** : les Time Slots (un bloc orange qui porte N tâches, c'est son modèle actuel), la note de la journée, le bouton de replanification des non faits, la syntaxe à jetons si Thibaut tape au clavier.

### 2.3 Motion (auto-planification)
- **Fonctions** [Primaire, aide officielle] : l'IA place les tâches selon disponibilité, durée (avec découpage en morceaux), échéance dure ou souple, priorité ; ordre de décision : ASAP, puis échéances dures, puis souples, puis priorité, puis durée ; replanification automatique quand la journée bouge ; heures flexibles d'un jour.
- **États de tâche** [Primaire, page officielle des états] : à l'heure (gris, trait plein et anneau d'état), en cours, **en retard** (point d'exclamation rouge), **ne rentre pas** (aucun créneau trouvé sous 31 jours : épinglée en haut), **fantôme** (prévue mais pas encore placée : bordure pointillée, plus claire), **verrouillée** (cadenas). Types : récurrente, découpée (fraction), rappel (4 minutes ou moins, épinglé en haut), créée par Siri/e-mail. Le vocabulaire visuel est riche et lisible : c'est la meilleure grammaire d'états de tâche trouvée.
- **Positionnement 2026** [Primaire] : « super-app de travail IA » (tâches, projets, calendrier, notes de réunion, documents, chat, workflows) ; palette bleu dégradé #849BE5 vers #3D61DD, #CAD4F4, #F6F9FF (lu sur leur site, résumé de page). Les « employés IA » (Alfred, Millie) sont vendus à part (49 à 299 dollars par mois) et la page dédiée redirige désormais vers l'accueil [Secondaire].
- **Nom** : mot anglais commun, une syllabe, le mouvement. Facile à retenir, pas distinctif (cherchable difficilement, collision avec la bibliothèque d'animation du même nom).
- **Limites** [Secondaire, plusieurs sources] : prix (essai qui se convertit, 19 à 49 dollars), réglage initial lourd, journées tassées, interface jugée chargée, mobile faible, pas de serveur MCP officiel.
- **On en retient** : la grammaire des états (fantôme, ne-rentre-pas, verrouillé), pas l'auto-planification totale (incompatible avec son besoin de contrôle).

### 2.4 Amie (le design comme argument)
- **À l'origine** [Primaire : TechCrunch 2022-03-17] : semaine de calendrier soignée, liste de tâches en colonne à côté que l'on glisse sur un créneau, avatars de l'équipe à gauche (survol = leur agenda), profils avec anniversaires et morceau Spotify en cours, raccourcis, liens de disponibilité. Fondateur Dennis Müller (ex-N26).
- **Perception** [Secondaire] : « une des plus belles apps de calendrier », animations voulues, retour haptique sur mobile, couleur partout. Prix de design Product Hunt (Golden Kitty). Aucune source solide sur des sons ou confettis : ne pas en promettre.
- **Évolution** [Primaire : changelog amie.so] : l'app s'est recentrée en 2025 sur la prise de notes de réunion par IA sans robot (lien : chronique du pivot, 2025-01-21, 8,3 millions levés) ; calendrier et tâches passent au second plan. Mises à jour n°128 (2026-07-14) à n°132 (2026-09-03) : serveur MCP pour Claude et ChatGPT, tâches et e-mails exposés comme outils, synchro Outlook, liens de réservation, enregistreur en « encoche » à l'écran.
- **Charte** : non retrouvée en chiffres. **Nom** : prénom féminin français (« amie »), chaleur et proximité ; seule app du lot dont le nom est un mot relationnel plutôt qu'un mot d'outil.
- **Leçon** [Secondaire, la chronique] : le design a fait adopter l'app, il n'a pas suffi à garder le calendrier comme produit principal. Pour Thibaut : l'élégance ne remplace pas la fonction, mais le fait que **l'app la plus « jolie » expose elle-même ses outils à Claude** confirme son mode de pilotage.

### 2.5 Notion Calendar (ex-Cron)
- **Fonctions** [Primaire : changelog Cron 2021 à 2024, billet Notion] : palette de commandes Cmd+K (créer, chercher, changer de fuseau), **raccourcis à une lettre** (S partager ses disponibilités en surlignant des créneaux, F rencontre rapide, C nouvel événement, T aujourd'hui, W semaine, M mois), multi-sélection au clavier, clic droit, superposition de l'agenda des collègues, blocage automatique entre agendas, base Notion affichée comme événements, barre de menu macOS.
- **Détails d'interface** [Primaire] : **chaque couleur de calendrier génère une famille de teintes** (ruban, fond, titre, heure, version estompée) pour les puces d'événement, ce qui rend lisibles passé, à venir et sélection ; fondu des notifications ajusté pour pouvoir les attraper avec le curseur ; mode sombre calculé dans l'espace colorimétrique CIECAM02 ; **icône du Dock qui affiche la date du jour** (et « 31 » quand l'app est fermée) ; logo en blocs qui épellent « cron » sur une grille de calendrier. Démarche : l'auteur a validé le besoin par une extension Chrome (plus de 10 000 installations, [Secondaire : Dive Club]) avant de construire.
- **Nom** : « Cron », du grec chronos (temps) et du planificateur Unix : un mot court, technique, métaphore directe. Racheté par Notion, rebaptisé en janvier 2024 en un nom descriptif sans magie : le nom d'origine était meilleur, le rebaptême le montre.
- **Charte** (Notion, [Dérivé]) : gris chauds (#37352f), violet #5645d4, pastels, boutons rectangulaires de 8 px, pas des pilules.
- **On en retient** : la **famille de teintes par couleur** pour distinguer plages (cours, tennis) et tâches sans recourir à 12 couleurs ; le favicon/icône vivants avec la date ; les raccourcis à une lettre.

### 2.6 Linear (qualité, vitesse, grammaire)
- **Doctrine** [Primaire : méthode Linear, billets] : outil opinioné, cycles de n semaines avec **report automatique** des éléments ouverts, backlog que l'on ose purger, spécifications courtes, « dire non au travail administratif ». Triage : inbox spéciale avec accepter / refuser / doublon / reporter à touche unique ; accès au clavier par séquences (G puis T).
- **Charte** : refonte officielle (LCH, **trois variables** base, accent, contraste à la place de 98 variables de thème ; Inter Display pour les titres ; plus de contraste, moins de « chrome », visée « neutre et intemporelle », [Primaire]). Valeurs précises : fond #010102, accent lavande #5e6ad2, Inter variable avec poids 510, rayon de 8 px, police à chasse fixe Berkeley Mono [Dérivé].
- **Interface** : synchronisation locale, interactions instantanées, clavier partout. Zéro bug corrigé sous 7 jours, équipes de 3 à 5 personnes de goût [Primaire : « Why is quality so rare »].
- **Nom** : « Linear » (linéaire), mot commun, adjectif de rigueur et de progression. La marque exige « Linear » seul, jamais « Linear app » [Secondaire]. Mot de qualité abstrait, très imitable (voir 3).
- **MCP** : serveur officiel hébergé (`mcp.linear.app/mcp`, lecture-écriture ou lecture seule) pour Claude, Cursor, VS Code et d'autres [Primaire, docs].
- **On en retient** : le triage à quatre verbes, le report automatique, la charte à trois variables (compatible avec son système `data-charte`), le principe de moins de bordures.

### 2.7 Reclaim (agenda comme système vivant)
- **Fonctions** [Primaire] : Focus Time avec objectif d'heures par semaine, **Habitudes** (fenêtre de jours et d'heures + heure idéale + priorité, se bascule libre/occupé selon la pression de l'agenda), tampons et trajets, liens de planification, tâches (voir 1.1). Actions sur un bloc de tâche : démarrer (déplace le bloc à l'instant, arrondi à 5 minutes), arrêter (scinde le reste), reporter la tâche entière, « en priorité » (passe devant même les critiques), ajouter du temps, consigner du travail, verrouiller (empêche le déplacement automatique). Réglage de démarrage manuel : si l'on n'a pas cliqué sur démarrer avant la fin du bloc, il se replace plus tard dans la journée.
- **Reclaim 2.0** [Primaire + [Secondaire] : en bêta privée selon Carly, aide « mise à jour cette semaine »] : assistant en conversation dans le panneau de droite, mode aperçu, cartes d'agents (focus, habitudes, tampons, réunions, qualité de réunion), serveur MCP pour Claude, ChatGPT, Copilot et Gemini. Propriété de Dropbox depuis août 2024 (40,2 millions de dollars, [Secondaire]).
- **Charte / nom** : non retrouvées. Nom = verbe d'action (« récupérer »), promesse de reprise de contrôle : l'un des meilleurs rapports sens/brièveté du lot.
- **Limites** [Secondaire, Carly] : surtout Google Agenda, pas d'app mobile native, et un avis : des centaines d'événements créés par l'outil qu'on ne peut plus supprimer. Ressemble à son problème (blocs qui se multiplient) : preuve qu'un modèle sans fin de vie fabrique des cimetières.
- **On en retient** : tâche = budget de durée, démarrage manuel optionnel, aperçu avant application, habitudes à fenêtre flexible pour tennis, drills et relances.

### 2.8 Things 3 (la référence de finition)
- **Structure** [Primaire : aide Cultured Code] : Aujourd'hui (avec section « Ce soir »), À venir, Quand vous voulez, Un jour. Distinction date de début (la tâche **hiberne** dans À venir et passe seule dans Aujourd'hui) / échéance (date limite). Aujourd'hui et À venir affichent aussi les événements du calendrier, dans leur couleur.
- **Détails** [Primaire + [Secondaire] : MacStories, MacRumors 2025-09-16] : bouton plus « magique » que l'on **glisse pour déposer** une tâche à l'endroit voulu (projet, date dans À venir, entre deux éléments), qui se déforme comme un liquide ; « frappe pour chercher » sans ouvrir de recherche ; saisie rapide flottante en moins d'une seconde ; retour haptique ; animation des éléments qui s'envolent en groupe quand on en réordonne plusieurs ; version 3.22 (2025-09-16) : courbes plus rondes, espaces plus larges, barre latérale vitrée laissant voir un peu de couleur, quatre variantes d'icône (défaut, sombre, teinté, transparent), commandes Centre de contrôle.
- **Charte** : fond blanc cassé, police système, un seul bleu cobalt [Secondaire, shadcn.io, tiers]. Icône : coche bleue sur carré arrondi.
- **Nom** : « Things », le mot le plus générique possible (les choses) : modeste, universel, sans promesse. Tient grâce au produit.
- **Limites** : pas de blocs horaires, pas d'IA, Apple seulement (80 dollars une fois, avis Asian Efficiency mis à jour 2026-09-18).
- **On en retient** : date de début contre échéance (une tâche cachée jusqu'à son jour, sans bruit), « Ce soir », et surtout le **geste de dépôt** : faire glisser un bouton unique pour poser une tâche exactement sur l'agenda.

### 2.9 Height (le contre-exemple)
- Annoncé comme premier outil de « collaboration de projet autonome » en octobre 2024 (Height 2.0), fermeture annoncée le 2025-03-22, service éteint le 2025-09-24 [Secondaire : AlternativeTo, Rundown]. Les causes ne sont pas publiées : je ne conclus rien sur le pourquoi. Utile seulement comme avertissement de prudence : une automatisation maximale ne garantit pas un usage. Pas de matière de design à reprendre.

### 2.10 Raycast (la palette de commande comme produit)
- **Fonctions** [Primaire : manuel Raycast] : panneau d'actions (Cmd+K) sur l'élément sélectionné : Entrée exécute l'action principale, filtre flou dans le panneau, sections (favoris, configurer, lien profond), alias et raccourcis réglables sur place, actions destructrices en rouge, sous-menus.
- **Charte** [Dérivé] : fond presque noir #07080a, **aucune ombre** (la profondeur vient d'une échelle de quatre gris), bordures de 1 px #242728, texte Inter avec la variante `ss03`, un seul bouton blanc d'action, accents saturés (corail #ff6363, bleu, vert, jaune) réservés aux illustrations, bande rouge en diagonale une fois par page.
- **Nom** : composé « Ray » + « cast » : lancer un rayon, rapidité et précision. Logo : forme géométrique dérivée du curseur, rouge sur noir.
- **On en retient** : l'Entrée = action principale, le menu d'actions contextuel, le rouge réservé au destructif, **la profondeur par échelle de gris sans ombre** (compatible avec Graphite).

### 2.11 Arc (contextes et nettoyage automatique)
- **Fonctions** [Secondaire, DEV Community 2026-05-28 + autres] : barre latérale verticale, **Spaces** (profils légers avec leur couleur de thème, bascule en moins de 400 ms), barre de commande (Cmd+T), onglets non épinglés auto-archivés (12 h par défaut), mini-fenêtre « Little Arc ». Statut : Arc est en mode maintenance depuis mai 2025, The Browser Company rachetée par Atlassian (annonce du 2025-09-04, 610 millions de dollars, finalisée le 2025-10-21) pour se concentrer sur Dia [Secondaire : TidBITS, CNBC, supasidebar].
- **Charte / nom** : non retrouvés. Nom = forme géométrique, un mot court sans sens d'outil.
- **On en retient** : des **Spaces** pour ses contextes (Conseil, Finance, EDHEC, Spircle) avec une couleur chacun, et l'archivage automatique. Ne pas dépendre d'Arc : ses idées sont reprises ailleurs.

### 2.12 Superhuman (vitesse, mails, relances)
- **Fonctions** [Primaire : blog Superhuman] : E = fait, B = reporter à une date, J/K = naviguer, Cmd+K = commande qui apprend le raccourci à côté, **boîtes divisées** (Important / Autre par défaut, divisions personnalisées par personne, outil ou calendrier pour traiter par lots), **relances automatiques** (le fil réapparaît s'il n'y a pas eu de réponse), brouillons automatiques, archivage automatique, écran de boîte vide avec image apaisante. Philosophie lue : la boîte à zéro signifie vider ce qui est fini, planifier ce qui attend, déplacer les gros engagements vers l'agenda ou les tâches.
- **Méthode produit** [Primaire : billet « engine to find product-market fit »] : moins de 50 ms, raccourcis plus complets que Gmail, **centaines de petites attentions** (ex. « --> » devient une flèche), feuille de route coupée 50 / 50 entre ce que les fans adorent et ce qui retient les tièdes.
- **Charte du site** [Dérivé] : indigo #1b1938, violet doux #c9b4fa, bande finale vert sombre, police propriétaire Super Sans avec des graisses atypiques (460, 540), interlignage serré de 0,96 sur les gros titres, texte gris chaud #292827, un seul appel à l'action par bande.
- **Nom** : revendication (« surhumain »), affirmation de statut plus que description. Risqué (promesse à tenir), mais marque très mémorisable. Sans équivalent crédible pour un outil personnel.
- **On en retient** : boîtes divisées (cabinets, EDHEC, candidatures, personnes à relancer), relance automatique si pas de réponse (networking, recruteurs), écran « zéro ».

### 2.13 Todoist
- **Fonctions** [Primaire : aide Todoist] : saisie rapide (touche Q) avec dates en langage naturel (« tout autre mardi », « fin de mois »), `#projet`, `p1` à `p3`, `!` rappel, `/` section, échéance entre accolades ; vue Aujourd'hui avec section de retards où l'on **reporte en bloc** à demain ou plus tard (glisser tout en bas = demain) ; mise en page calendrier avec panneau « Plan » (retards, journée entière, blocs horaires, glisser sur une heure). Couleurs de date : rouge en retard, vert aujourd'hui.
- **Karma** [Primaire] : points, huit niveaux de Débutant à Illuminé, séries quotidiennes et hebdomadaires, **perte de points pour les tâches en retard de 5 jours ou plus**. Pour Thibaut (40 retards) c'est un piège : un compteur qui punit l'arriéré démotive quand le stock est déjà élevé. Inférence de ma part, non testée.
- **IA** [Secondaire] : Ramble (saisie vocale), assistant de découpage, serveur MCP officiel hébergé (`ai.todoist.net/mcp`).
- **Charte** : rouge ≈ #E44332 (sources discordantes : #E34432, #DE483A), noir chaud #25221E, crème #FFF9EB [Secondaire]. Dernière refonte de logo vers 2017-2018.
- **Nom** : « to-do » + « -ist » (le praticien) : descriptif, clair, ancien. Logo : coche stylisée sur rouge.
- **On en retient** : report en bloc des retards, dates naturelles, couleur de date. Pas le Karma punitif.

### 2.14 TickTick
- **Fonctions** [Secondaire : TidBITS 2025-08-14, aide] : liste Aujourd'hui (tâches et événements triés), « Plan » (ordre sans heure), calendrier (jour, 3 jours, semaine, mois), habitudes avec séries, minuteur Pomodoro ou chronomètre avec 17 bruits blancs, **matrice d'Eisenhower** (urgent / important), saisie en langage naturel, rappels persistants chaque minute.
- **Limites** : synchro partielle entre appareils, vues calendrier réservées à l'abonnement (35,99 dollars par an). Fonctions masquées par défaut (à activer).
- **Charte / nom** : non retrouvées. Nom = onomatopée de l'horloge + « tick » (cocher) : double sens malin, entre le temps et la coche.
- **On en retient** : la matrice comme **vue** à la demande (pas une page de plus), le minuteur dans un bloc de tâche.

## 3. Détails d'interface et d'interaction qui font la réputation

### 3.1 Consensus (≥ 3 sources)
- **Palette de commande Cmd+K partout** : Akiflow, Linear, Raycast, Superhuman, Notion Calendar. Les trois points communs : une seule combinaison de touches, filtre flou, l'action affiche son raccourci à côté pour apprendre.
- **Une touche = un verbe** sur la liste (Linear, Superhuman, Akiflow).
- **Aperçu avant écriture** : Reclaim 2.0 ; Aki demande confirmation pour les actions avec effet externe.
- **Fin de vie par défaut** (voir 1.4).
- **Fond très sombre, accent unique, profondeur par échelle de gris** : Linear, Raycast (page produit). Cohérent avec sa charte Graphite.

### 3.2 Anecdotique ou à tester
- Sons de validation de tâche : un avis réclame un « ding » comme signal de réussite, mais aucune source solide ne dit que cela améliore l'usage. À éviter par défaut (il n'y a pas de notification sonore dans ses règles).
- Haptique et déformation « liquide » (Things, Amie) : mobile surtout ; sur un site, cela se traduit par un léger ressort (échelle 0,98 à 1) sur les boutons, à tester au ressenti.
- Dégradés de marque (Motion, Raycast) : effet de signature unique ; hors sujet pour un outil quotidien personnel.

## 4. Noms et logos : ce qui marche (lecture de ma part sur les 14 noms)

Aucune étude sérieuse ne sépare les noms qui « marchent » ; ce qui suit est un constat sur ces 14 cas, pas une loi.

| Famille | Exemples | Ce qui fonctionne | Risque |
|---|---|---|---|
| Mot commun abstrait | Linear, Things, Arc, Motion, Height | Court, sobre, crédible, ne promet rien de précis | Peu distinctif, difficile à chercher, dépend de la qualité du produit |
| Métaphore du temps ou de la mesure | Cron (chronos), Reclaim (reprendre), TickTick (horloge et coche) | Dit le métier en un mot, mémorisable | Cron a dû changer de nom ; « Reclaim » est un verbe pris |
| Composé ou mot inventé de la vitesse ou du flux | Raycast, Akiflow, Sunsama | Sonorité forte, marque libre | Aucun sens propre, le nom n'explique pas |
| Affirmation de statut | Superhuman | Mémorable, très affirmé | Promesse à tenir, ton prétentieux pour un outil perso |
| Mot relationnel | Amie | Chaleur, proximité | Rare, mal adapté à un outil de travail pur |

Logos : cinq approches observées. (1) **Coche ou carré arrondi** (Todoist, Things) : lisible à 16 px, banal. (2) **Grille ou blocs qui épellent le nom** (Cron) : lié au calendrier, mémorable. (3) **Forme géométrique abstraite** (Raycast, Linear, Arc) : tient en monochrome. (4) **Icône qui change** (Cron affiche la date dans le Dock) : la seule qui donne une raison d'être regardée. (5) **Lettre dans un cadre** : générique. Pour un outil à un seul utilisateur, la voie 4 est la plus rentable : un favicon et une icône d'application qui portent **une information vivante** (la date, le nombre de choses à ranger) plutôt qu'un symbole.

Règle de Thibaut (aucun pictogramme décoratif) : un logo informatif (la date) n'est pas décoratif.

## 5. Chartes comparées (pour « faire son shopping »)

| App | Ambiance | Accent | Typo | Boutons | Fiabilité |
|---|---|---|---|---|---|
| Linear | Noir bleuté, neutre | Lavande #5e6ad2 | Inter variable, titres Inter Display, mono Berkeley | Rayon 8 px | Officiel (principes) + dérivé (valeurs) |
| Raycast | Presque noir, sans ombre | Blanc + coral réservé | Inter ss03 | Pilule blanche, rayon 8 px | Dérivé |
| Superhuman (site) | Indigo / blanc / vert sombre | Violet doux #c9b4fa | Super Sans, graisses 460 / 540 | Rectangle 8 px, pilule en en-tête | Dérivé |
| Notion | Gris chauds, pastels | Violet #5645d4 | Notion Sans (base Inter) | Rectangle 8 px | Dérivé |
| Motion | Bleu clair dégradé | #849BE5 vers #3D61DD | Non relevée | Non relevés | Site, résumé |
| Todoist | Rouge chaud, crème | ≈ #E44332 | Non relevée | Non relevés | Secondaire |
| Things | Blanc cassé, système | Un bleu cobalt | Police système | Non relevés | Secondaire |
| Cron / Notion Calendar | Famille de teintes par calendrier, sombre CIECAM02 | Couleur de l'utilisateur | Non relevée | Non relevés | Officiel (changelog) |
| Sunsama | Chaud, calme, orange en marque | Jaffa #F59549 (à vérifier) | Outfit (à vérifier) | Non relevés | Secondaire, divergent |

Conclusions utilisables : (a) les outils « rapides » sont sombres, monochromes, avec **un seul accent** et une profondeur sans ombre ; les outils « calmes » (Sunsama, Todoist, Notion) sont **chauds** (crème, gris chauds, jamais de noir pur) ; (b) les boutons de ces marques sont des **rectangles à 8 px**, la pilule étant réservée à un seul bouton d'en-tête ; (c) personne ne multiplie les accents : la couleur sert à l'information (états, calendriers).

## 6. Tableau : fonctionnalité, qui la fait le mieux, valeur, difficulté

Valeur pour Thibaut : critique (règle un problème du diagnostic), haute, moyenne, faible. Difficulté : facile (composant ou CSS), moyen (logique + données), difficile (algorithme, nouveau back-end).

| Fonctionnalité | Qui la fait le mieux | Valeur | Difficulté |
|---|---|---|---|
| Aperçu des changements proposés par Claude, puis validation en un clic | Reclaim 2.0 | critique | moyen |
| Triage de « À ranger » en 4 verbes à touche unique (ranger, refuser, doublon, reporter) | Linear | critique | facile |
| Report avec retour « à l'heure choisie ou à la prochaine activité » | Linear | haute | moyen |
| Tâche = budget de durée consommé par des blocs, avec « consigner du travail » | Reclaim | critique | moyen |
| Fin de vie automatique (rouvrir ou clôturer après N jours, archivage, cycle suivant) | Reclaim, Linear, Arc | critique | facile |
| Carte unique de bilan du soir (faits, reportés, abandonnés) et note de la journée | Sunsama, Akiflow | critique | moyen |
| Charge cible du jour avec alerte d'approche et de dépassement | Sunsama | haute | facile |
| Rituel du matin en peu d'étapes (hier, aujourd'hui, ce qui attend) | Sunsama | haute | moyen |
| Revue hebdomadaire (temps par catégorie, report, objectifs de la semaine) | Sunsama | haute | moyen |
| Report en bloc des retards | Todoist | haute | facile |
| Bouton « replanifier les non faits » | Akiflow | haute | facile |
| Dépôt par glisser d'une tâche sur un créneau, via un seul bouton glissable | Things (bouton), Amie, Akiflow | haute | moyen |
| Un bloc qui contient plusieurs tâches (Time Slot) | Akiflow | haute | moyen |
| Date de début contre échéance (la tâche dort jusqu'à son jour) | Things | haute | moyen |
| Rubrique « Ce soir » dans Aujourd'hui | Things | moyenne | facile |
| Grammaire d'états de tâche (à l'heure, en retard, ne rentre pas, fantôme, verrouillé) | Motion | haute | facile |
| Famille de teintes par couleur (plage contre tâche contre passé) | Cron | haute | facile |
| Palette Cmd+K avec action principale à Entrée, destructif en rouge | Raycast | haute | moyen |
| Saisie à jetons et dates naturelles | Akiflow, Todoist | moyenne | moyen |
| Mails en boîtes divisées (cabinets, EDHEC, candidatures, à relancer) | Superhuman | haute | moyen |
| Relance automatique si pas de réponse | Superhuman | critique (networking et recruteurs) | moyen |
| Écran « zéro » apaisant | Superhuman | moyenne | facile |
| Contextes colorés (Conseil, Finance, EDHEC, Spircle) | Arc (Spaces) | moyenne | moyen |
| Habitudes à fenêtre flexible (tennis, drills) qui se replacent | Reclaim | moyenne | difficile |
| Mises à jour optimistes et réponse sous 100 ms | Superhuman, Linear | haute | moyen |
| Icône ou favicon vivants (date, nombre à ranger) | Cron | faible à moyenne | facile |
| Actions exposées à Claude comme outils (déjà le mode de pilotage) | Sunsama, Akiflow, Linear, Todoist, Reclaim, Amie | critique | moyen |
| Matrice d'Eisenhower en vue à la demande | TickTick, Akiflow | moyenne | facile |
| Minuteur dans un bloc | TickTick, Sunsama | faible | facile |
| Auto-planification totale | Motion | faible (opacité, tassement) | difficile |
| Points et séries qui punissent les retards | Todoist (Karma) | négative | facile |

## 7. Ce que je ne recommande pas (critique)

1. **L'auto-planification à la Motion** : il dit lui-même vouloir piloter, et la plainte récurrente est le tassement et l'opacité. Une IA qui propose sous aperçu (Reclaim 2.0) est la version compatible.
2. **Un compteur de points** : le Karma punit l'arriéré ; avec ~40 retards, il fabriquerait de la culpabilité. Si un compteur existe, il ne compte que les jours où la journée a été fermée (rituel du soir), jamais l'arriéré.
3. **Imiter Amie sur la décoration seule** : l'app est belle, mais son calendrier est devenu secondaire. Le design ne règle pas le tri.
4. **Copier le site marketing d'une marque** : les palettes ci-dessus sont celles des vitrines (Superhuman, Notion, Raycast), pas des outils. Les valeurs sont [Dérivées] et devraient être testées en contraste réel.
5. **Dépendre d'un produit en perte de vitesse** (Arc en maintenance, Height éteint) : on reprend l'idée, pas l'outil.
6. **Les sons** : sans preuve d'effet, et contraires à sa règle de pas de notification.

## 8. Ce que les designers peuvent en tirer, par axe

- **Identité** : visée de nom court (une à trois syllabes), de préférence sens du temps ou de l'action ; un logo informatif (date du jour) plutôt qu'un symbole. Éviter le mot commun abstrait seul.
- **Charte** : trois propositions réalistes : (a) sombre neutre à un accent et profondeur sans ombre (Linear / Raycast) ; (b) chaude et calme (Sunsama / Todoist / Notion : crème, gris chauds, orange ou rouge terreux, jamais de noir pur) ; (c) lumineuse éditoriale à graisses atypiques (Superhuman). Rayon de 8 px, un seul bouton plein par zone, famille de teintes par couleur de calendrier.
- **Composants** : menu d'actions Cmd+K sur l'élément, touches à un verbe, bouton glissable de dépôt, états de tâche à la Motion, toasts d'annulation, aperçu avant application.
- **Fonctionnalités** : priorités ci-dessus (tableau 6, lignes « critique »).

## 9. Sources (lues le 2026-10-07 sauf mention)

Officielles (primaires) :
- Sunsama : https://www.sunsama.com ; https://www.sunsama.com/features/daily-planning-and-shutdown ; https://www.sunsama.com/blog/the-official-daily-planning-guide ; https://help.sunsama.com/docs/weekly-review ; https://roadmap.sunsama.com/changelog/daily-shutdown ; https://roadmap.sunsama.com/integrations/p/mcp-server (statut terminé au 2026-08-27)
- Akiflow : https://akiflow.com/features ; https://akiflow.com/method ; https://akiflow.com/features/rituals ; https://product.akiflow.com/help/articles/0805246-rituals ; https://product.akiflow.com/help/articles/5330825-what-can-aki-do ; https://product.akiflow.com/help/articles/6483573-command-bar (syntaxe vue en résultat de recherche)
- Motion : https://www.usemotion.com ; https://www.usemotion.com/help/time-management/auto-scheduling ; https://www.usemotion.com/help/project-management/task/reference-tasks/task-states-and-task-types
- Reclaim : https://reclaim.ai/features/focus-time ; https://reclaim.ai/features/habits ; https://help.reclaim.ai/en/articles/4453312-managing-tasks-and-task-events-on-your-calendar ; https://help.reclaim.ai/en/articles/6937489-auto-rescheduling-settings-for-tasks-and-habits ; https://help.reclaim.ai/en/articles/14846468-reclaim-ai-2-0-overview ; https://dropbox.tech/machine-learning/evolving-calendar-assistant-reclaim-to-be-ai-native
- Linear : https://linear.app/method/introduction ; https://linear.app/docs/triage ; https://linear.app/docs/use-cycles ; https://linear.app/docs/mcp ; https://linear.app/now/how-we-redesigned-the-linear-ui ; https://linear.app/now/why-is-quality-so-rare
- Notion Calendar / Cron : https://www.notion.com/blog/introducing-notion-calendar ; https://www.cron.com/changelog ; https://www.cron.com/changelog/2021-01-04-design-and-performance ; https://www.cron.com/changelog/2021-04-26-dock-icon
- Things : https://culturedcode.com/things/features/ ; https://culturedcode.com/things/support/articles/2803579/
- Raycast : https://manual.raycast.com/action-panel
- Superhuman : https://superhuman.com/learn/email/inbox-zero-method ; https://blog.superhuman.com/how-to-split-your-inbox-in-superhuman/ ; https://blog.superhuman.com/how-superhuman-built-an-engine-to-find-product-market-fit/
- Todoist : https://todoist.com/help/articles/introduction-to-dates-and-time-q7VobO ; https://www.todoist.com/help/articles/plan-your-day-with-the-today-view-UVUXaiSs ; https://www.todoist.com/help/todoist/features/introduction-to-karma-OgWkWy (via recherche)
- Amie : https://amie.so ; https://amie.so/changelog (n°128 du 2026-07-14 à n°132 du 2026-09-03) ; https://techcrunch.com/2022/03/17/amie-is-a-new-calendar-app-with-a-social-twist

Secondaires et dérivées :
- https://www.macrumors.com/2025/09/16/things-3-22-refreshed-interface-and-more/ ; https://www.macstories.net/reviews/things-3-beauty-and-delight-in-a-task-manager/ ; https://www.asianefficiency.com/task-management/things-3-review/ (mis à jour 2026-09-18)
- https://dev.to/pickuma/arc-browser-review-18-months-with-a-browser-that-thinks-differently-26o1 (2026-05-28) ; https://tidbits.com/2025/09/04/atlassian-acquires-the-browser-company-for-610-million/ ; https://www.cnbc.com/2025/09/04/atlassian-the-browser-company-deal.html
- https://tidbits.com/2025/08/14/ticktick-provides-a-focused-daily-task-list-and-more/
- https://www.morgen.so/blog-posts/akiflow-vs-motion ; https://www.saner.ai/blogs/motion-reviews ; https://akiflow.com/blog/akiflow-vs-sunsama-comparison (publié par Akiflow) ; https://www.usecarly.com/blog/reclaim-ai-review/ ; https://productivewithchris.com/app-reviews/amie-review-2025/ (2025-01-21) ; https://ellieplanner.com/comparisons/amie-calendar-review
- https://www.dive.club/ideas/cron-journey ; https://sequoiacap.com/article/linear-spotlight ; https://newsletter.pragmaticengineer.com/p/linear
- Dérivés (valeurs de charte) : https://github.com/VoltAgent/awesome-design-md (Raycast, Superhuman, Notion, Linear) ; https://www.shadcn.io/design/things ; recherches sur les couleurs de Sunsama, Todoist (Mobbin, logotyp.us)
- Fermeture de Height : https://alternativeto.net/news/2025/3/height-project-management-tool-to-shut-down-by-september-2025/ ; https://www.therundown.ai/tools/height
