# Questionnaire : ton shopping pour le dashboard

Réponds en une ligne, par exemple « 1B 2A 3B 4B+C 5A ... 18 oui ». Sans réponse, je prends
l'option marquée **(reco)**. Les démos sont sur http://localhost:3100/demo (lecture seule de tes
vraies données, rien n'est enregistré). Le Studio (http://localhost:3100/demo/studio) a un panneau
« Composer » en bas à droite pour combiner les trois premiers axes.

## A. Le look et la structure (dans le Studio)

**1. Charte graphique** (couleurs, polices, rayons ; chacune existe en clair et en sombre)
- A. Graphite : l'actuel en plus fin, neutres froids, Geist, un seul bleu, dense et précis **(reco : continuité, beaucoup de lignes à balayer)**
- B. Papier : crème et encre, titres en Fraunces, accent terre cuite, aéré, ton « carnet »
- C. Nuit : bleu nuit et violet, surfaces façon verre, halos, ambiance Linear / Arc
- D. Suisse : blanc, noir et un seul rouge, IBM Plex, angles droits, aucune ombre

**2. Mode** : A. sombre **(reco, comme aujourd'hui)** / B. clair / C. suit le réglage du téléphone ou du PC

**3. Navigation** (comment on passe d'une partie à l'autre)
- A. Rail latéral : barre à gauche repliable, tiroir sur téléphone
- B. Onglets : onglets en haut sur PC, barre d'onglets en bas sur téléphone **(reco : marche pareil sur les deux, que tu utilises tous les deux)**
- C. Palette de commande : aucune barre, Ctrl+K ouvre une recherche des sections
- D. Fil continu : une seule longue page, toutes les sections empilées, ancres collantes

**4. Organisation de l'accueil** (ce que tu vois en ouvrant)
- A. Le Cockpit : l'agenda EST l'accueil, les tâches vivent dans les blocs, un tiroir « À placer » qu'on fait glisser sur la frise
- B. Le Journal du jour : une colonne qui se lit comme la journée (brief, 3 priorités, blocs, repère « maintenant », bilan du soir), pensée téléphone d'abord **(reco : c'est la seule qui se termine chaque soir, comme l'agenda que tu utilises déjà)**
- C. La Console : champ de commande et « boîte à zéro » au clavier (F fait, R recaser, A abandonner, P plus tard)
- D. Le QG Recrutement : une carte par cabinet (Bain, BCG, OW, L.E.K....) avec ses échéances, relances et blocs de préparation, plus une piste Examens

**5. Combiner deux organisations ?**
- A. Non, une seule accueil
- B. Oui : celle du 4 en accueil, et le QG Recrutement en section dédiée jusqu'à la fin de la saison **(reco)**
- C. Oui : Journal sur téléphone, Cockpit sur PC

## B. Les règles de fin de vie (le cœur du problème)

Constat : 60 tâches ouvertes dont 40 en retard, 2 cochées en 7 jours ; 99 notifications en
attente dont 89 « Oublié hier ? » jamais touchées. Rien ne sort sans clic, la routine de midi en
rajoute chaque jour.

**6. « Oublié hier ? »** (étape 4 bis de ta routine de midi)
- A. Remplacée par UNE carte « Bilan d'hier » par jour (un bouton par bloc : fait / en partie / pas fait) **(reco)**
- B. Garder une notification par tâche, mais regroupée et sans répétition (déjà codé dans le socle)
- C. Supprimer complètement le rappel de la veille

**7. Où apparaît ce bilan ?** A. en haut de l'accueil jusqu'à ce qu'il soit traité **(reco : tu ouvres le site pour l'agenda)** / B. dans la carte de la routine de midi, dans le chat (tu réponds « 1 fait, 2 pas fait ») / C. les deux

**8. Une tâche à laquelle tu ne réponds pas** passe seule dans « Plus tard » au bout de : A. 2 jours **(reco)** / B. 7 jours / C. 14 jours / D. jamais

**9. « Abandonner » une tâche** : A. statut abandonné, invisible partout, historique gardé **(reco)** / B. suppression pure

**10. « Plus tard » revient** : A. dans la revue du dimanche **(reco)** / B. à une date choisie à chaque fois / C. seulement quand je le demande

**11. Priorités** : A. 3 priorités du jour épinglées à la main, Claude en suggère 3 le matin **(reco)** / B. 5 priorités de la semaine, le jour pioche dedans / C. pas de priorités

**12. Revue du dimanche** (5 min : chiffres de la semaine, « Plus tard » à trier, idées, priorités) : A. carte sur l'accueil le dimanche / B. message de la routine du dimanche dans le chat / C. les deux / D. non **(reco : A, couplée au créneau voix-evaluer de 14h30)**

## C. Les modules à mettre dans le panier (plusieurs choix possibles)

**13.** Coche ceux que tu veux (ex. « 13 A C D ») :
- A. Ma journée : tâches dans les blocs, « À recaser (N) » replié au lieu de la liste rouge (/demo/aujourdhui) **(reco)**
- B. Grand ménage : tri des 60 tâches au clavier, séries regroupées (/demo/tri) **(reco, une fois puis dans la revue du dimanche)**
- C. Bilan d'hier et revue du dimanche (/demo/bilan) **(reco)**
- D. Échéances : compte à rebours des candidatures, tests, examens, avec alerte « aucune préparation prévue » (/demo/echeances) **(reco)**
- E. Relances de personnes : pipeline à faire / en attente / clos, relance à J+7
- F. Récurrences : loyer et EDHEC en une ligne mensuelle au lieu de 6 tâches **(reco)**

**14. La date d'une échéance** vient : A. d'une colonne « date limite » posée par le skill planifier **(reco, fiable)** / B. de la date écrite dans le titre / C. les deux, la colonne l'emporte

**15. Recaser une tâche dans un bloc** : A. seulement sur le site, la routine recopie la liste dans la description du bloc Google ensuite **(reco)** / B. aussi dans Google tout de suite / C. jamais dans Google

## D. Ce que je peux faire dès ton retour (oui / non)

**16.** Ouvrir la PR du socle `feat/taches-socle` (déjà codée, relue deux fois, build vert) : « Oublié hier ? » regroupés par tâche, « Tout ignorer », « Ignorer » qui coche vraiment la tâche, script de nettoyage. **(reco : oui)**

**17.** Lancer le nettoyage sur ta base : 46 « Oublié hier ? » périmés depuis plus de 3 jours passent en « ignorés » (rien n'est supprimé ; test à blanc fait). **(reco : oui)**

**18.** Remplacer l'étape 4 bis de la routine de midi par la version proposée (`docs/refonte-taches/routine-4bis-proposee.md` sur la branche socle), ou par le bilan unique si tu choisis 6A. **(reco : oui)**

**19.** Anomalie trouvée : 33 des 36 tâches rattachées à un bloc pointent vers un bloc qui n'existe plus (blocs passés effacés par l'ancienne synchro, avant la correction du 06/10). Je les passe dans « À recaser » au premier bilan, sans rien supprimer. **(reco : oui)**

**20.** Faire le grand ménage avec toi dans le chat maintenant (10 minutes, je te les présente par série) plutôt que d'attendre le module. **(reco : oui, le site repart propre)**

## Après tes réponses

Ordre de livraison prévu (une PR par lot, rien sur `main` sans ton accord) :
1. Socle et nettoyage (16 à 19) : immédiat.
2. Règles de fin de vie (6 à 12) : colonnes SQL `status`, `dropped_at`, `snoozed_until`, `priority_day` (un fichier SQL à exécuter par toi), Server Actions, mise à jour du skill planifier et de la routine.
3. Charte, navigation et organisation choisies (1 à 5) : portage du Studio dans le vrai site, modules choisis (13) branchés.
4. Échéances, relances, récurrences selon 13 à 15.
