# Recherche forums : Hacker News, Mac Power Users, forum Obsidian (et Reddit, inaccessible)

Date de la recherche : 2026-10-07. Angle : ce que les gens recommandent vraiment, et où ils se disputent, pour un dashboard personnel qui reste utilisé.

## 0. Limites à lire d'abord

1. **Reddit n'a pas pu être lu.** WebSearch refuse le domaine reddit.com, WebFetch bloque www.reddit.com et old.reddit.com, et l'archive tierce pullpush a répondu une seule fois puis a refusé (erreur 429, message : pas de scraping gratuit pour les agents). Je ne l'ai pas contourné. Il ne reste de Reddit que des **titres, scores et aperçus de 10 fils** (annexe B), sans les commentaires. Ce fichier ne dit donc jamais « Reddit pense que ». r/ADHD, r/getdisciplined, r/ObsidianMD, r/UI_Design, r/reactjs, r/nextjs, r/webdev ne sont pas couverts.
2. **Ce qui remplace Reddit** : Hacker News (texte des commentaires lu via l'API publique Algolia, une trentaine de fils), le forum Mac Power Users Talk (Discourse, 165 messages lus en entier sur 2 fils) et le forum Obsidian. Biais assumé : HN est peuplé de développeurs, méfiants envers le marketing et les abonnements ; MPU est peuplé d'utilisateurs Apple avancés (OmniFocus, Things). Peu d'étudiants, rien sur le conseil ou la finance.
3. **Fiabilité des citations.** Je marque **[lu]** ce dont j'ai lu le texte exact du message, **[résumé]** ce qui vient d'un résumé automatique que je n'ai pas revérifié. J'ai trouvé une erreur dans un résumé (une idée attribuée au mauvais utilisateur), donc **aucun nom n'est donné sans [lu]**. Les « points » et « commentaires » sont ceux de HN à la date de lecture.
4. Tout est paraphrasé, sauf quelques fragments courts entre guillemets.

## 1. Verdict en une page

**Consensus fort** (plusieurs fils indépendants, chiffres élevés) :
- Une liste qui n'a pas de fin de vie devient un cimetière et la culpabilité fait abandonner l'outil. Les remèdes qui reviennent : remise à zéro quotidienne ou hebdomadaire, expiration, plafond, tri par étapes (section 3).
- Le rituel (réécrire, trier, jeter) pèse plus que l'outil.
- La friction de saisie et la densité d'information tuent l'usage, surtout pour les gens avec TDAH.
- Une animation d'interface doit être très courte et ne jamais bloquer le clic.
- Un design « fait par IA » se reconnaît à quelques marqueurs précis, et les modèles convergent vers la moyenne.

**Désaccords réels** : calendrier contre liste ; planification automatique contre planification choisie ; texte brut contre application ; chat contre tableau de bord ; icônes fines ; mode sombre.

**Anecdotique** : rappels insistants façon application Due, changer d'outil tous les mois, tout sur papier, un fichier todo.txt dans git.

## 2. Pourquoi les to-do meurent (ce que disent les fils)

| Cause | Preuve | Lien avec ton diagnostic |
|---|---|---|
| La liste est **aspirationnelle** : on y met ce qu'on voudrait faire, pas ce qu'on fera | stavros [lu] dans « Todo apps are meant for robots » (2021-08-01, 272 pts, 199 com.). Il imaginait une appli où les tâches « expirent » vers une section permanente | 40 tâches en retard, 2 faites sur 7 jours |
| Une tâche qui reste trop longtemps devrait **tomber toute seule** (« leaky bucket ») | jerf [lu], même fil. spec-obs [lu] : les petites choses finissent par disparaître et ça enlève la culpabilité. lmm [lu] contredit : pour lui les petites choses sont un poids permanent | Aucune fin de vie dans ta base |
| Les listes de focus **démarrent petites et finissent énormes** | jmayhugh [lu] et OogieM [lu], MPU « ADHD et logiciels de tâches » (2022-02-19, 76 messages tous lus) | La suggestion « À ranger » grossit |
| **Changer d'outil est une procrastination** | jmayhugh [lu] : il change pour « tromper son cerveau » ; tf2 [lu] : aucun système ne dure indéfiniment, accepter d'en changer | Risque quand tu refais le dashboard toutes les semaines |
| **Sur-construire** : formater et lier donne l'impression de travailler | Forum Obsidian, fil « productivity porn » (2021-04-04, 21 messages sur 39) [résumé] | Les vitrines v2 doivent servir l'agenda, pas le remplacer |
| La liste **se reconstruit à la main** | Igrom [lu] dans « I tried every todo app and ended up with a .txt file » (2025-08-11, **1402 pts, 799 com.**) : ceux qui jurent par le fichier texte finissent par recoder alertes, étiquettes, calendrier, priorités, récurrence, recherche | Preuve que ces besoins sont réels, pas des caprices |

Le fil à 1402 points est la meilleure source de la recherche pour une raison : il montre à la fois le rejet des applis lourdes (jasode [lu]) et l'impossibilité de s'en passer (don_neufeld [lu] garde plus de 100 actions récurrentes dans Things). Conclusion utile : **le texte brut gagne sur la friction, perd sur la boucle d'alerte**. Chez toi, la conversation avec Claude joue le rôle du fichier texte, et le dashboard doit jouer celui de la boucle qui prévient.

## 3. Ce qui marche, par ordre de solidité

1. **Remise à zéro régulière, pas de report automatique.** Izkata [lu] écrit chaque matin la liste du jour à partir d'un fichier vide, sans rien recopier de la veille (« Who Uses To-Do Lists? », 2022-01-15, 217 pts, 200 com.). kepano [lu] (« Just use fucking paper, man », 2024-08-27, 169 pts) écrit une note de semaine, reporte ou abandonne, et la réécrit de mémoire : ce qu'il ne retrouve pas n'était pas important. C'est la version la plus nette de « fin de vie ».
2. **Plafond.** geoffaire [lu] (MPU) : maximum 3 choses sur la liste du jour. butz [lu] (« How can I stop my inbox... from growing? », 2022-05-22, 190 pts) : une limite dure, ajouter oblige à retirer. ergonaught [lu] : purge par étapes, tout ce qui dépasse une durée passe dans un « purgatoire » puis est jeté. elamje [lu] : archiver tout ce qui a plus de un à deux mois, c'est probablement déjà mort.
3. **Sortir le « un jour peut-être » du système actif** (OogieM [lu], MPU) : les projets futurs vivent dans un fichier à part.
4. **Date de début distincte de l'échéance.** kstrauser [lu] (utilisateur OmniFocus, fil Godspeed, 2024-03-19, 328 pts) refuse tout outil sans date de début : ce qui est dû dans trois ans et qu'on ne peut pas traiter aujourd'hui n'est qu'une distraction. Le Show HN « do et due » (2024-10-23, 160 pts) est construit sur cette distinction.
5. **Le bloc de temps est une suggestion, pas un contrat.** krono [lu] (fil Taskable, 2022-01-19, 86 pts) : bloquer le temps ne marche pas parce que le monde ne s'adapte pas au plan de dimanche ; des blocs de temps marchent comme estimation de la journée et rappel visuel qu'une échéance approche. TheSocialAndrew [lu] dans le même fil cite la fonction qu'il juge la plus importante : décaler tous les blocs de +30 minutes ou +1 heure d'un geste.
6. **Un petit rituel quotidien guidé** : Terretta [lu] recommande Sunsama surtout pour son rituel guidé, qui aide à prendre l'habitude (fil de 2024-10-24). Mais le Launch HN de Sunsama (2020-11-04, 107 pts) montre l'envers : jbverschoor [lu] trouve le questionnaire d'accueil trop long. **Le rituel doit être court.**
7. **Garder une seule surface où tout converge** : koliber [lu] (fil « do et due ») refait chaque matin à la main un agenda du jour qui fusionne calendrier et tâches dans Notion et le défait le soir ; il cherche une appli qui le fasse. C'est ton Cockpit.

**Anecdotique mais récurrent chez les TDAH (MPU)** : l'application Due, qui relance de façon insistante une tâche impérative jusqu'à ce qu'elle soit faite, est citée par dealtek, jmayhugh, geoffaire et wvp [lu] pour les choses qui DOIVENT être faites (médicaments, factures). Elle contredit ta règle « pas de push ». Version compatible : bandeau d'échéance dure dans le Cockpit (section 7, P13).

## 4. Applications préférées et pourquoi

| Appli | Ce qu'on en loue | Ce qu'on lui reproche | Source |
|---|---|---|---|
| **Things** | Design très soigné, simplicité (mj4e [lu] : « polished », regrette qu'aucun calendrier n'ait cette qualité) | La liste du jour s'allonge (jmayhugh [lu]) ; dates choisies à la souris (kareemm [lu]) | HN 40627395 (2024-06-09), MPU 27823, HN 39756325 |
| **OmniFocus** | Puissance, perspectives sur mesure, recherche de ce qui est utilisable aujourd'hui | Hiérarchie infinie : on passe son temps à gérer l'outil (jmayhugh [lu]) | MPU 27823 |
| **Todoist** | Utilisable en mode minimal ; refreeze654 [lu] s'en sert comme d'un fichier texte, avec en plus la récurrence et les notes sur récurrence | Rien de saillant dans les fils lus | HN 44864134 |
| **Sunsama** | Rituel guidé, glisser vers le calendrier (Terretta [lu]) | Prix et questionnaire (Launch HN 2020) ; un message MPU de 2021 le juge cher pour ce qu'il fait (hqlmmst, [résumé]) | HN 24990238, MPU 24484 |
| **Akiflow** | Rapide, capture au clavier [résumé] | Pas de support Outlook au lancement ; le fil compare surtout Motion, Sunsama et d'autres (satvikpendem, pj_mukh [lu]) | HN 33451584 |
| **Motion** | Remplit le calendrier tout seul | Voir section 5, point 2 | MPU 39511 |
| **Godspeed** | Vitesse et raccourcis ; kareemm [lu] dresse la liste de ce qu'il attend d'un gestionnaire (boîte de réception, report vers le futur, mode focus) | 150 dollars en une fois : plusieurs commentaires hostiles | HN 39756325 |
| **Obsidian + Tasks** | Local, requêtes « aujourd'hui / en retard / cette semaine » | Dépend de plugins communautaires : certains utilisateurs hésitent à en dépendre [résumé] | Forum Obsidian 35118 (2022-04-02), MPU 29342 |

Lecture : les applis que les gens gardent sont soit **très simples** (Todoist léger, texte), soit **très belles** (Things). Personne ne loue une appli pour ses fonctions seules.

## 5. Les désaccords, avec la position de chaque camp

1. **Calendrier ou liste** (« Calendar, Not Todos », 2024-05-12, 76 pts, 57 com.).
   - Pour le calendrier : anyonecancode, Brajeshwar [résumé].
   - Contre : stared [lu] (une tâche qui déborde crée un effet domino), andycowley [lu] (neuroatypique : mettre une tâche dans le calendrier le fait l'ignorer, il lui faut une liste à deux niveaux, maintenant et réserve).
   - Camp intermédiaire : nunodonato [lu] réserve le calendrier aux contraintes dures de date et d'heure, le reste va dans une liste d'actions suivantes.
   - **Ce que ça change pour toi** : ton agenda marche parce qu'il est borné par le temps, donc le camp 1 a raison pour toi. Mais les blocs orange doivent rester des intentions déplaçables (krono), avec un geste de report groupé.
2. **Planification automatique** (Motion). Matt_Lockett [lu] (MPU, 2025-06-04) a tenu six semaines : l'idée est bonne mais ne tient pas compte des jours où il veut décider lui-même, ou ne rien faire. Matt_L [lu] (probablement la même personne, 2025-01-20) avait au début l'attitude inverse : il a juste besoin qu'on lui dise quoi faire. Nick_tea [lu] trouve la courbe d'apprentissage raide et l'ajout d'une tâche trop complexe. Confirme la recommandation 20 de RECHERCHE.md (proposition à valider) et ajoute un argument : l'option « rien aujourd'hui » doit exister.
3. **Texte brut ou application** : voir section 2, c'est le fil à 1402 points.
4. **Chat ou tableau de bord.** « Enough AI copilots, we need AI HUDs » (2025-07-27, **979 pts**) défend l'affichage ambiant plutôt que la fenêtre de discussion. ravila4 [lu] : les écrans sont mauvais pour l'information périphérique sans être intrusifs. afro88 [lu] pose la bonne question : qu'est-ce qu'un tableau de bord qui hallucine, y a-t-il un bouton de source sur chaque élément ? Côté assistants personnels, le fil Clawdbot (2026-01-26, 405 pts, 261 com.) est partagé : blainstorming [lu] y voit du « théâtre de productivité » du même genre que Notion et Obsidian ; hexsprite [lu] a fait filtrer des messages et caler des visites dans son agenda avec une réussite de 9 sur 10, en validant les brouillons.
5. **Icônes fines et petites.** Le billet « The AI Aesthetic » (2026-07-30, 378 pts) les range parmi les marqueurs d'IA ; anon373839 [lu] et aetherspawn [lu] disent aimer cette tendance (plus d'information par écran). Pas de consensus.
6. **Mode sombre.** « Dark Mode Sucks » (2025-11-23, 110 pts) : hombre_fatal [lu] préfère un grand écran sombre, m463 [lu] lit mieux en sombre avec l'âge. Pure préférence : proposer clair et sombre selon le système (une demande équivalente existe sur le dépôt Glance, discussion 914, 8 votes).

## 6. Détails de design qui font « premium » (ce que les fils confirment)

1. **Animations quasi imperceptibles.** Fil « Purposeful animations » (billet d'Emil Kowalski, 2025-09-05, **546 pts**). prisenco [lu] : 300 ms est déjà trop long, il préfère des animations qu'on ne remarque que si on les retire. mholt [lu] : attendre la fin d'une animation avant de pouvoir toucher est le pire défaut. mrob [lu] : l'animation n'a de valeur que pour clarifier un changement d'état. stack_framer [lu] : une animation jolie sur un écran peut être saccadée sur un autre. **À retenir : durée courte, interruptible, jamais bloquante.**
2. **Vitesse perçue par mise à jour optimiste.** « How's Linear so fast? » (2026-06-07, 497 pts, 236 com.) : syspec [lu] résume le principe, on modifie côté client et on enregistre en arrière-plan. Garde-fous soulevés : hamandcheese [lu] et wasmperson [lu] craignent qu'on oublie le chemin d'échec (conflit, erreur de synchronisation) et qu'on mente à l'utilisateur. Et ricardobeat [lu] comme HoyaSaxa [lu] trouvent Linear pas si rapide et parfois confus : la vitesse ne remplace pas la clarté.
3. **Squelettes de chargement : méfiance.** Fil de 2023-08-28 : hombre_fatal [lu] défend les placeholders, wildrhythms [lu] les déteste parce que le serveur ne sait pas combien d'éléments arrivent et que la mise en page saute. Si tes pages sont rendues côté serveur, réserver la hauteur des blocs vaut mieux qu'animer un squelette.
4. **Palette de commandes.** Fil « Command palettes » (2021-11-28, 321 pts, 267 com.) : underwater [lu] dit qu'elle est découvrable (recherche floue) et montre l'effet avant exécution. arusahni [lu] demande que le raccourci soit configurable (Ctrl+K est pris par la barre d'adresse de certains navigateurs). thrower123 [lu] déteste la tendance et veut ses menus. **À retenir : aperçu de l'effet, raccourci configurable, jamais la seule voie d'accès.**
5. **Saisie rapide de dates** : thornjm [lu] suggère les abréviations relatives (t+1 pour demain, w+2 pour dans deux semaines) ; kareemm [lu] reproche à Things ses sélecteurs de date à la souris. Renforce la recommandation 19 (langage naturel).
6. **Ne pas ressembler à une page générée.** « The AI Aesthetic » : étincelles, texte qui scintille pendant la réflexion, icônes fines, beige et crème avec accent orange, polices à empattements. jjcm [lu] (ancien de Figma) explique que les modèles écrivent du code cohérent donc des designs cohérents, qui convergent vers une moyenne ; il conseille de partir d'une image. blfr [lu] : définir l'esthétique d'abord dans Claude Design, puis la faire suivre par Claude Code. Le fil sur le passage de shadcn/ui à Base UI (2026-07-05, 282 pts) montre la même crainte : ricardobeat [lu] relève que le ton du billet sonne comme du Claude. **Pour toi** : ton accent bleu #7aa2ff est loin du cliché, mais les blocs de tâches orange sur fond graphite se rapprochent du couple orange et neutre signalé ; à surveiller, pas à changer d'office.
7. **Lisibilité avant esthétique pour le TDAH.** thenaturalist [lu] (fil « do et due ») : commandes trop petites, trop d'étapes d'accueil, trop d'informations sur l'écran de tâche ; l'outil a augmenté son dysfonctionnement exécutif au lieu de le réduire. Il cite Due comme contre-exemple : une seule chose, bien faite.

## 7. Propositions pour le dashboard de Thibaut

Classées par solidité de la preuve. Chacune est combinable ; aucune ne remplace les recommandations de RECHERCHE.md, elles les complètent.

| N° | Proposition | Preuve | Confiance |
|---|---|---|---|
| P1 | **Fin de vie visible** : une tâche sans date non touchée depuis N jours passe seule dans une « réserve » repliée, puis disparaît ; un compteur discret dit combien ont expiré | jerf, stavros, ergonaught, elamje, butz [lu] | Forte |
| P2 | **Trois priorités du jour au maximum**, le reste replié | geoffaire, Izkata [lu] ; limite aussi dans le fil 31471127 | Forte |
| P3 | **Séparer « quand je le fais » et « quand c'est dû »**, et masquer les échéances lointaines jusqu'à une date de début | kstrauser, koliber [lu] ; Show HN 41925644 (160 pts) | Forte |
| P4 | **Bilan du dimanche réécrit de mémoire** : Claude affiche une page vide de la semaine, tu redictes ce qui compte, le reste est abandonné | kepano, Izkata [lu] ; coût faible, tu pilotes déjà par la conversation | Moyenne à forte |
| P5 | **Report groupé** d'un geste : tout décaler de 30 minutes ou à demain | TheSocialAndrew, krono [lu] ; objection de stared [lu] sur l'effet domino | Moyenne |
| P6 | **Planification proposée, jamais imposée**, avec une option « journée libre » | Matt_Lockett, Nick_tea [lu] ; renforce la recommandation 20 | Forte |
| P7 | **Chaque élément posé par Claude porte « pourquoi » et sa source, et un journal « ce que Claude a changé »** | afro88 [lu] ; fil HUD 979 pts ; ton mode de pilotage par la conversation | Moyenne |
| P8 | **Mises à jour optimistes avec Annuler et un état d'échec explicite** | syspec [lu] ; hamandcheese, wasmperson [lu] | Forte pour l'optimiste, moyenne pour l'ensemble |
| P9 | **Animations de 150 à 250 ms, interruptibles, respect de « réduire les animations »** | prisenco, mholt, mrob [lu] | Forte |
| P10 | **Palette de commandes avec aperçu de l'effet et raccourci configurable** | underwater, arusahni [lu] | Forte |
| P11 | **Saisie en langage naturel et par abréviations, dictée vocale** : Todoist a lancé un mode « Ramble » qui transforme la parole en liste en direct (raybb [lu], 2025-11-04) ; tu dictes déjà beaucoup | raybb, thornjm [lu] | Moyenne |
| P12 | **Vérification anti-« look IA »** de chaque vitrine : pas d'étincelles, pas de texte qui scintille, pas de crème et orange ; partir d'une charte écrite plutôt que de laisser le modèle improviser | jjcm, blfr [lu] | Moyenne |
| P13 | **Bandeau d'échéance dure** dans le Cockpit pour les tests Gorilla, les candidatures et les paiements, avec compte à rebours, sans push | Retour des utilisateurs de Due (dealtek, jmayhugh, geoffaire, wvp [lu]) | Faible à moyenne |
| P14 | **Rituel du matin de moins de deux minutes**, en une carte | Terretta [lu] (rituel utile) contre jbverschoor [lu] (accueil trop long) ; ton diagnostic : une carte de bilan au lieu de N notifications | Moyenne |

## 8. Erreurs à éviter (confirmées par au moins deux fils)

1. Reporter automatiquement les retards (la liste redevient un cimetière).
2. Un questionnaire ou un tour guidé long à l'ouverture.
3. Des commandes petites et une fiche de tâche dense.
4. Une animation qui retarde le clic.
5. Imposer un planning sans « non » possible.
6. Refaire l'outil à chaque semaine (procrastination déguisée).
7. Une palette Ctrl+K non configurable.
8. Un assistant ou une vue qui affirme sans montrer d'où vient l'information.

## 9. Questions pour trancher (réponds « 1 oui 2 non 3 bof »)

1. P1 : une tâche sans date, intacte depuis 14 jours, passe seule en réserve repliée puis disparaît après 30 jours ?
2. P2 : maximum trois priorités du jour affichées, le reste replié ?
3. P4 : un bilan du dimanche où tu redictes la semaine depuis une page vide ?
4. P6 : toute planification automatique reste une proposition, avec « journée libre » ?
5. P13 : un bandeau d'échéance dure avec compte à rebours, sans notification push ?

## Annexe A. Sources lues (date, points, commentaires)

Hacker News (adresse : https://news.ycombinator.com/item?id=NUMERO) :
- 44864134, 2025-08-11, 1402 pts, 799 com., « I tried every todo app and ended up with a .txt file »
- 28029809, 2021-08-01, 272 pts, 199 com., « Todo apps are meant for robots »
- 29948616, 2022-01-15, 217 pts, 200 com., « Who Uses To-Do Lists? »
- 31471127, 2022-05-22, 190 pts, 122 com., « How can I stop my inbox/wishlist/bookmarks/tabs/todos from growing? »
- 40332546, 2024-05-12, 76 pts, 57 com., « Calendar, Not Todos »
- 41370673, 2024-08-27, 169 pts, « Just use fucking paper, man »
- 41925644, 2024-10-23, 160 pts, Show HN « do et due »
- 39756325, 2024-03-19, 328 pts, Show HN Godspeed
- 29996218, 2022-01-19, 86 pts, 75 com., Show HN Taskable
- 24990238, 2020-11-04, 107 pts, 62 com., Launch HN Sunsama
- 33451584, 2022-11-03, 105 pts, 70 com., Launch HN Akiflow
- 49528506, 2026-09-01, 118 pts, 67 com., Show HN OwnTime (drcongo [lu] : des éléments de to-do minutés, avec « voici la suivante », est la seule chose qui marche pour lui)
- 45139088, 2025-09-05, 546 pts, « Purposeful animations » (billet : https://emilkowal.ski/ui/you-dont-need-animations)
- 49117099, 2026-07-30, 378 pts, 176 com., « The AI Aesthetic » (billet : https://blog.jim-nielsen.com/2026/ai-aesthetic/)
- 48437609, 2026-06-07, 497 pts, 236 com., « How's Linear so fast? »
- 48791328, 2026-07-05, 282 pts, 165 com., shadcn/ui passe à Base UI
- 29373536, 2021-11-28, 321 pts, 267 com., « Command palettes »
- 37291686, 2023-08-28, fil sur les squelettes de chargement (message de départ, sans compteur)
- 44705445, 2025-07-27, 979 pts, « Enough AI copilots, we need AI HUDs »
- 46760237, 2026-01-26, 405 pts, 261 com., Clawdbot
- 45810856, 2025-11-04, 88 pts, 81 com., Show HN planificateur local iOS
- 46024894, 2025-11-23, 110 pts, « Dark Mode Sucks »
- 40627395, 2024-06-09, 183 pts, applis macOS recommandées

Mac Power Users Talk :
- https://talk.macpowerusers.com/t/39511 (2025-01-05, 89 messages, tous lus)
- https://talk.macpowerusers.com/t/27823 (2022-02-19, 76 messages, tous lus)
- https://talk.macpowerusers.com/t/29342 (2022, 291 messages, 155 visibles, **[résumé]**)
- https://talk.macpowerusers.com/t/29548 (2022-06-18, 20 messages sur 121, **[résumé]**)
- https://talk.macpowerusers.com/t/24484 (2021-07-30, 2 messages)

Forum Obsidian : https://forum.obsidian.md/t/35118 (2022-04-02, [résumé] : jsliang relit ses retards chaque matin, comme la « migration » du bullet journal, pour décider quoi garder) ; https://forum.obsidian.md/t/15906 (2021-04-04, 21 messages sur 39, [résumé]).

GitHub : https://github.com/glanceapp/glance (37 374 étoiles au 2026-10-07 ; discussion 914, 8 votes, demande de mode sombre automatique).

## Annexe B. Reddit : métadonnées seules (commentaires non lus)

Ces 10 fils sont sortis d'un seul appel à l'archive pullpush, avec titre, sous-forum, score, nombre de commentaires et début du message. Je n'ai lu aucune réponse, donc ils ne servent qu'à repérer où chercher si tu me donnes un accès (par exemple en collant les fils que tu veux faire analyser).

| Date | Sous-forum | Score / com. | Titre | Lien |
|---|---|---|---|---|
| 2025-06-07 | r/ProductManagement | 128 / 78 | Quels outils pour gérer le chaos d'un directeur produit | https://www.reddit.com/r/ProductManagement/comments/1l5w9qr/ |
| 2026-08-16 | r/macapps | 75 / 143 | What Calendar App Are You Using | https://www.reddit.com/r/macapps/comments/1vqce0k/ |
| 2026-03-04 | r/ProductivityApps | 51 / 50 | To-do list et gestionnaire de projet avec planification IA, auteur avec TDAH sévère | https://www.reddit.com/r/ProductivityApps/comments/1rkdpkg/ |
| 2025-09-09 | r/productivity | 33 / 3 | J'ai testé plus de 20 applis de gestion du temps | https://www.reddit.com/r/productivity/comments/1nctxdo/ |
| 2026-05-15 | r/ProductivityApps | 27 / 47 | Une appli de productivité qui fait tout ? | https://www.reddit.com/r/ProductivityApps/comments/1tdvir0/ |
| 2026-03-18 | r/UseMotion | 24 / 20 | Top 6 des alternatives à Motion (aperçu : Motion devenu entreprise et plus complexe) | https://www.reddit.com/r/UseMotion/comments/1rwz328/ |
| 2025-09-13 | r/UseMotion | 12 / 17 | Top 5 des alternatives à Motion (même aperçu) | https://www.reddit.com/r/UseMotion/comments/1ng042a/ |
| 2025-12-14 | r/ticktick | 12 / 13 | TickTick pour les notes | https://www.reddit.com/r/ticktick/comments/1pm0hn4/ |
| 2026-01-10 | r/ProductivityApps | 14 / 11 | Top 20 des applis de gestion de projet perso (aperçu : pas de revue hebdo, pas d'agenda, trop d'outils) | https://www.reddit.com/r/ProductivityApps/comments/1q8pn1w/ |
| 2025-10-02 | r/NextGenAITool | 15 / 4 | 10 outils IA contre la surcharge | https://www.reddit.com/r/NextGenAITool/comments/1nw3obu/ |
