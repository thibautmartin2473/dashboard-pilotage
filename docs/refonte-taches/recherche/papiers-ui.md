# Ce que dit la recherche sur les interfaces efficaces et appréciées, appliqué à Cadran

Date : 2026-10-08. Demande de Thibaut : un dashboard "pro financier qui fait tech", le plus efficace plutôt que le plus original, instinctif. Cette revue sert de base aux choix de boutons, de densité et de retours de Cadran.

## Comment lire ce document

Niveau de preuve de chaque énoncé :

- **Prouvé** : plusieurs études indépendantes convergent.
- **Probable** : une étude solide, ou plusieurs études avec des réserves de méthode.
- **Avis d'expert** : consensus de praticiens, norme ou livre de référence, sans test contrôlé direct.

Statut de la source :

- **[V]** : la référence (auteurs, année, revue, chiffres cités) a été retrouvée par recherche pendant cette session.
- **[M]** : référence classique citée de mémoire (revue, volume, pages) ; les chiffres éventuels ne sont pas rouverts. À revérifier avant toute citation officielle.
- **2e rang** : étude empirique sérieuse mais hors revue à comité de lecture (Nielsen Norman Group, NN/g).

Baymard Institute n'est pas retenu : ses études portent sur le commerce en ligne (formulaires, paniers), pas sur un outil de travail dense. Rien d'inventé : quand un chiffre n'a pas été retrouvé, c'est écrit.

## Réserve générale, à garder en tête

Presque toutes les études ci-dessous portent sur des sites web, des distributeurs de billets ou des téléphones simulés, avec des étudiants, en séance courte. Aucune ne suit un professionnel qui utilise le même tableau de bord huit heures par jour pendant des mois. L'effet de l'esthétique est le plus fort à la première vue et diminue à l'usage (voir 1.2). Pour un outil quotidien comme Cadran, la première impression compte pour l'adoption, mais ce sont la lisibilité, la constance et la rapidité des gestes qui font l'efficacité durable.

---

## 1. Esthétique, utilisabilité perçue, première impression

### 1.1 Ce qui est beau est jugé utilisable

- **Kurosu, M. et Kashimura, K. (1995).** Apparent usability vs. inherent usability: experimental analysis on the determinants of the apparent usability. *CHI '95 Conference Companion*, ACM. [V] Sur 26 dispositions de distributeur de billets, l'esthétique jugée et la facilité d'usage apparente corrèlent à r = 0,59, alors que la corrélation entre facilité apparente et facteurs d'utilisabilité "réelle" est faible. Limite : jugement avant usage, culture japonaise, un seul type d'appareil.
- **Tractinsky, N., Katz, A. S. et Ikar, D. (2000).** What is beautiful is usable. *Interacting with Computers*, 13(2), 127-145. DOI 10.1016/S0953-5438(00)00031-X. [V] 132 étudiants, 9 dispositions de distributeur de billets (3 niveaux d'esthétique). Corrélation esthétique perçue et utilisabilité perçue : r = 0,66 avant l'usage, r = 0,71 après. L'esthétique du système a influencé l'utilisabilité perçue après usage, le niveau d'utilisabilité réelle non. Les interfaces peu belles ont été mieux notées après usage, les très belles un peu moins bien. Limite : un seul scénario, étudiants, effet de halo qui s'érode.
- **Sonderegger, A. et Sauer, J. (2010).** The influence of design aesthetics in usability testing: effects on user performance and perceived usability. *Applied Ergonomics*, 41(3), 403-410. DOI 10.1016/j.apergo.2009.09.002. [V] 60 adolescents, deux téléphones simulés fonctionnellement identiques (attrayant contre peu attrayant). Le téléphone attrayant est jugé plus utilisable et les temps de tâche sont plus courts. Limite : adolescents, simulation, un seul produit.

Niveau : **prouvé** pour l'effet de halo à court terme (trois études, trois produits, des mesures subjectives et une mesure de performance).

### 1.2 La limite : à l'usage, l'utilisabilité reprend la main

- **Tuch, A. N., Roth, S. P., Hornbæk, K., Opwis, K. et Bargas-Avila, J. A. (2012).** Is beautiful really usable? Toward understanding the relation between usability, aesthetics, and affect in HCI. *Computers in Human Behavior*, 28(5), 1596-1607. [V] 80 participants, quatre versions d'une boutique en ligne (esthétique faible ou forte, utilisabilité faible ou forte). L'esthétique n'a pas modifié l'utilisabilité perçue ; c'est l'utilisabilité qui a modifié l'esthétique perçue après usage (la frustration abaisse les notes de beauté). Limite : une boutique, session unique.

Lecture : "beau donc utilisable" est vrai à la première vue, réversible à l'usage. Niveau : **probable** (une étude solide, cohérente avec la baisse post-usage de Tractinsky 2000).

### 1.3 La première impression se forme en 50 ms et pèse longtemps

- **Lindgaard, G., Fernandes, G., Dudek, C. et Brown, J. (2006).** Attention web designers: you have 50 milliseconds to make a good first impression! *Behaviour & Information Technology*, 25(2), 115-126. DOI 10.1080/01449290500330448. [V] Des pages vues 50 ms puis 500 ms reçoivent des notes d'attrait très cohérentes entre les deux durées. Je n'ai pas retrouvé ici le nombre exact de participants ni la valeur de la corrélation (de mémoire, de l'ordre de 0,9 : non vérifié). Limite : jugement d'attrait, pas de tâche.
- **Lindgaard, G., Dudek, C., Sen, D., Sumegi, L. et Noonan, P. (2011).** An exploration of relations between visual appeal, trustworthiness and perceived usability of homepages. *ACM Transactions on Computer-Human Interaction*, 18(1), art. 1. [M] Le même groupe relie l'attrait immédiat à la confiance et à l'utilisabilité perçue.
- **Tuch, A. N., Presslaber, E. E., Stöcklin, M., Opwis, K. et Bargas-Avila, J. A. (2012).** The role of visual complexity and prototypicality regarding first impression of websites. *International Journal of Human-Computer Studies*, 70(11), 794-811. [V] 119 captures de sites réels, complexité visuelle (faible, moyenne, forte) et prototypicalité (faible, forte), présentées 50, 500 ou 1000 ms ; une seconde étude à 17-50 ms. Les deux facteurs influencent le jugement dès 50 ms ; **faible complexité et forte prototypicalité = jugés les plus attrayants**. Limite : captures statiques de sites grand public ; je n'ai pas retrouvé les tailles d'échantillon par expérience.
- **Reinecke, K., Yeh, T., Miratrix, L., Mardiko, R., Zhao, Y., Liu, J. et Gajos, K. Z. (2013).** Predicting users' first impressions of website aesthetics with a quantification of perceived visual complexity and colorfulness. *CHI 2013*, 2049-2058. [V] 450 sites, 548 volontaires, jugement après 500 ms ; un modèle de complexité perçue et de coloration, avec des variables démographiques, explique environ la moitié de la variance des notes d'attrait. Limite : sites web grand public, corrélationnel.
- **Reinecke, K. et Gajos, K. Z. (2014).** Quantifying visual preferences around the world. *CHI 2014*, 11-20. [V] 2,4 millions de notes, près de 40 000 participants. Le niveau de complexité et de coloration préféré varie selon l'âge, le sexe, le pays ; un niveau d'études élevé abaisse en moyenne la préférence pour la coloration forte. Lecture pour Thibaut (études supérieures) : palette retenue, peu saturée, plutôt bien alignée. Limite : sites web, goûts moyens, pas des outils de travail.
- **Moshagen, M. et Thielsch, M. T. (2010).** Facets of visual aesthetics. *International Journal of Human-Computer Studies*, 68(10), 689-709. [V] Sept études ; quatre facettes de l'esthétique perçue : simplicité, diversité, couleurs, soin d'exécution (craftsmanship). Je n'ai pas rouvert les poids relatifs des facettes.
- **Thielsch, M. T., Blotenberg, I. et Jaron, R. (2014).** User evaluation of websites: from first impression to recommendation. *Interacting with Computers*, 26(1), 89-102. [V, résultats non rouverts] Chaîne première impression, contenu, utilisabilité, recommandation.

Niveau : **prouvé** pour "le jugement se forme très vite" et "faible complexité + forme familière plaît" (plusieurs équipes, plusieurs protocoles). **Probable** pour les ordres de grandeur.

Applications à Cadran : l'écran d'ouverture doit être lisible en un coup d'oeil (peu de masses visuelles distinctes) et ressembler à un outil professionnel connu (tableau, liste, barre d'état), pas à un objet décoratif.

---

## 2. Boutons, cibles, nombre de choix

### 2.1 Signifier le bouton : le "flat" coûte du temps de repérage

- **Moran, K. (2017).** Flat UI Elements Attract Less Attention and Cause Uncertainty. Nielsen Norman Group, 3 septembre 2017. **2e rang** [V]. Expérience oculométrique inter-sujets, 71 internautes, 9 pages transformées en 18 versions (signifiants forts contre faibles), 6 domaines. Sur les versions à signifiants faibles : en moyenne **22 % de temps en plus** et **25 % de fixations en plus** (significatif, p < 0,05) ; 6 paires de pages sur 9 montrent des parcours de regard différents. Limite déclarée par NN/g : tâches courtes sur une seule page, mesure de la repérabilité, pas de la découverte. Pas de revue à comité de lecture ; protocole décrit mais données brutes non publiées.

Niveau : **probable** (une étude solide de 2e rang, cohérente avec la théorie des signifiants de Norman 2013, *The Design of Everyday Things*, MIT Press, [M] et avec Tuch 2012 sur la prototypicalité : un bouton reconnaissable est un bouton conforme à l'attente). Je n'ai pas trouvé d'étude à comité de lecture équivalente avec chiffres sur le temps de repérage des cibles cliquables plates ; je le dis plutôt que d'en inventer une.

### 2.2 Taille et distance des cibles (Fitts)

- **Fitts, P. M. (1954).** The information capacity of the human motor system in controlling the amplitude of movement. *Journal of Experimental Psychology*, 47(6), 381-391. [M] Le temps de pointage croît avec le log2 du rapport distance sur largeur.
- **MacKenzie, I. S. (1992).** Fitts' law as a research and design tool in human-computer interaction. *Human-Computer Interaction*, 7(1), 91-139. [M] Mise en forme pour la souris ; on retient que doubler la largeur d'une cible fait gagner une fraction de bit, soit une centaine de ms, et qu'une cible au bord d'écran ou grande est nettement plus rapide.
- **W3C (2023).** Web Content Accessibility Guidelines 2.2, critère 2.5.8 Target Size (Minimum), niveau AA : cible d'au moins **24 sur 24 pixels CSS**, ou espacement tel qu'un cercle de 24 px centré sur la cible ne touche aucune autre cible ; le critère 2.5.5 (AAA) demande **44 sur 44**. [V] Avis normatif, pas expérimental.
- **Parhi, P., Karlson, A. K. et Bederson, B. B. (2006).** Target size study for one-handed thumb use on small touchscreen devices. *MobileHCI '06*. [M] Ordre de grandeur de 9 à 10 mm pour les cibles tactiles au pouce (non revérifié).

Niveau : **prouvé** (loi de Fitts, plusieurs décennies) pour "plus grand et plus proche = plus rapide" ; le seuil exact (24, 32 ou 44 px) est un **avis d'expert/norme**.

### 2.3 Nombre de choix (Hick-Hyman)

- **Hick, W. E. (1952).** On the rate of gain of information. *Quarterly Journal of Experimental Psychology*, 4(1), 11-26. [M]
- **Hyman, R. (1953).** Stimulus information as a determinant of reaction time. *Journal of Experimental Psychology*, 45(3), 188-196. [M]
- **Seow, S. C. (2005).** Information theoretic models of HCI: a comparison of the Hick-Hyman law and Fitts' law. *Human-Computer Interaction*, 20(3), 315-352. DOI 10.1207/s15327051hci2003_3. [V] Discussion des conditions d'application : le temps de choix croît avec le log2 du nombre d'options équiprobables, mais la pente chute avec la pratique et quand les options sont toujours à la même place.

Lecture pour les 5 gestes de "À ranger" : 5 options coûtent environ 2,6 bits, soit de l'ordre d'une demi-seconde de décision au premier usage (ordre de grandeur de mémoire, pente environ 150 ms par bit : non vérifié), et bien moins avec la pratique si l'ordre ne change jamais. Argument pour garder les cinq visibles en permanence, dans le même ordre, avec un raccourci clavier affiché, plutôt qu'un menu "..." qui ajoute une étape.

Niveau : **prouvé** (Hick-Hyman, nuancé par Seow).

### 2.4 Clavier contre souris (modèle de tâche)

- **Card, S. K., Moran, T. P. et Newell, A. (1980).** The keystroke-level model for user performance time with interactive systems. *Communications of the ACM*, 23(7), 396-410. [M] Une frappe de touche environ 0,2 s, un pointage à la souris environ 1,1 s (ordre de grandeur, non rouvert). Donc un raccourci à une lettre sur un geste répétitif est environ 5 fois plus rapide que viser un bouton. Niveau : **prouvé** pour l'ordre de grandeur.

---

## 3. Lisibilité, densité, couleur

### 3.1 Taille de texte

- **Legge, G. E. et Bigelow, C. A. (2011).** Does print size matter for reading? A review of findings from vision science and typography. *Journal of Vision*, 11(5):8, 1-22. DOI 10.1167/11.5.8. [V] La vitesse de lecture maximale est atteinte sur une plage de tailles d'environ 0,2° à 2° de hauteur de x (facteur 10) ; à 40 cm cela correspond à environ 1,4 mm à 14 mm. Sous la borne basse, la lecture ralentit.
- Calcul personnel (hypothèses : pixel CSS de 0,26 mm, écran à 60 cm, hauteur de x d'environ 0,53 em, valeurs typiques des polices sans empattement d'écran) : 0,2° vaut environ 2,1 mm, soit 8 px de hauteur de x, soit une police de **15 px**. Donc 13 px de texte courant est sous la plage fluide ; 14 px est limite ; 16 px est confortable. Ce calcul est le mien, pas celui de l'article, et dépend de la distance réelle.

Niveau : **prouvé** pour la plage fluide (revue de synthèse), **avis d'expert** pour la conversion en pixels.

### 3.2 Contraste et polarité (clair ou sombre)

- **WCAG 2.2** critère 1.4.3 : contraste texte d'au moins 4,5 à 1 (3 à 1 pour le texte large), critère 1.4.11 : 3 à 1 pour les composants d'interface et leurs états. [M, norme]. APCA (modèle de contraste candidat à WCAG 3) : brouillon, non normatif ; je ne reprends pas ses seuils.
- **Piepenbrock, C., Mayr, S., Mund, I. et Buchner, A. (2013).** Positive display polarity is advantageous for both younger and older adults. *Ergonomics*, 56(7). [V] Un avantage de la polarité positive (sombre sur clair) sur l'acuité visuelle et la relecture, pour les deux classes d'âge ; je n'ai pas rouvert les tailles d'effet. Limite : acuité et relecture, pas fatigue sur une journée.
- **Dobres, J., Chahine, N., Reimer, B., Gould, D., Mehler, B. et Coughlin, J. F. (2016).** Utilising psychophysical techniques to investigate the effects of age, typeface design, size and display polarity on glance legibility. *Ergonomics*. DOI 10.1080/00140139.2015.1137637. [V] Étude I : 48 participants ; le texte clair sur fond sombre exige un temps de présentation plus long : seuils **38,6 % plus bas** en polarité positive, quel que soit le caractère (F(1,46) = 55,3, p < 0,001). Limite : lecture d'un coup d'oeil (glance, très courtes présentations), participants d'âge moyen 46 ans ; le contexte exact d'application n'a pas été rouvert.
- **Dobres, J., Chahine, N. et Reimer, B. (2017).** Effects of ambient illumination, contrast polarity, and letter size on text legibility under glance-like reading. *Applied Ergonomics*, 60, 68-73. [V, détail non rouvert] Seuils les plus défavorables en polarité négative dans l'obscurité.
- **Buchner, A. et Baumgartner, N. (2007).** Text-background polarity affects performance irrespective of ambient illumination and colour contrast. *Ergonomics*, 50(7), 1036-1063. [M]

Niveau : **prouvé** pour le gain de lisibilité du texte sombre sur fond clair en lecture rapide ; **non prouvé** que le mode sombre fatigue davantage ou moins sur une journée entière (je n'ai pas trouvé d'étude de ce type à comité de lecture). Le noir des terminaux de salle de marché est une convention d'usage et de contexte lumineux, pas un résultat de laboratoire.

Application : Cadran, mode unique crème : la polarité positive est le bon choix de lecture. Le brun cuir est à réserver au cadre (navigation, en-têtes) et aux grandes surfaces sans texte long.

### 3.3 Densité et charge cognitive

- **Tullis, T. S. (1983).** The formatting of alphanumeric displays: a review and analysis. *Human Factors*, 25(6), 657-682. [V] Quatre caractéristiques : densité globale, densité locale, groupement, complexité de mise en page. Un modèle à six variables prédit les temps de recherche (corrélation multiple 0,71) et les préférences subjectives (0,90). Pour les temps de recherche, les prédicteurs principaux sont **le nombre et la taille des groupes** (corrélation 0,65). Limite : écrans alphanumériques des années 1980, mais résultat repris depuis.
- **Sweller, J. (1988).** Cognitive load during problem solving: effects on learning. *Cognitive Science*, 12(2), 257-285. [M] Charge extrinsèque : tout ce qui n'aide pas la tâche consomme de la mémoire de travail. **Harp, S. F. et Mayer, R. E. (1998).** How seductive details do more harm than good. *Journal of Educational Psychology*, 90(3), 414-434. [M] Les ajouts décoratifs "intéressants" réduisent la rétention. Limite : contexte d'apprentissage, pas de pilotage.
- **Cowan, N. (2001).** The magical number 4 in short-term memory. *Behavioral and Brain Sciences*, 24(1), 87-114. [M] Capacité de l'ordre de quatre unités ; justifie de limiter le nombre de zones de premier niveau.
- **Few, S. (2013).** *Information Dashboard Design: Displaying Data for At-a-Glance Monitoring* (2e éd.). Analytics Press. [M] **Avis d'expert** : tout tenir sur un écran sans défilement, supprimer le décor, regrouper, limiter les couleurs, aligner. Chiffres tabulaires et alignement à droite des nombres : pratique typographique établie, pas d'étude contrôlée retrouvée.
- **Yigitbasioglu, O. M. et Velcu, O. (2012).** A review of dashboards in performance management: implications for design and research. *International Journal of Accounting Information Systems*, 13(1), 41-59. [V] Revue : les tableaux de bord réussissent quand le rapport données/encre est élevé et que le détail à la demande (drill down) existe ; recommandent la possibilité de changer de format. Niveau : revue de synthèse, **probable**.
- **Sarikaya, A., Correll, M., Bartram, L., Tory, M. et Fisher, D. (2019).** What do we talk about when we talk about dashboards? *IEEE Transactions on Visualization and Computer Graphics*, 25(1). [V] Analyse de la littérature et de cas pratiques : construit un espace de conception (objectifs, niveau d'interaction) et montre que la notion de tableau de bord n'a pas de définition stable. Je n'y ai pas trouvé de chiffre sur la densité optimale (non rouvert en détail).
- **Bateman, S., Mandryk, R. L., Gutwin, C., Genest, A., McDine, D. et Brooks, C. (2010).** Useful junk? The effects of visual embellishment on comprehension and memorability of charts. *CHI 2010*. [V] Des graphiques ornés ne sont pas moins bien compris que des graphiques épurés, et mieux retenus après deux à trois semaines. **Contre-point utile** : le minimalisme extrême n'est pas prouvé supérieur ; limite : graphiques de présentation, mémorisation, pas tableaux de bord de travail.

Niveau : **prouvé** que le groupement et la mise en page prédisent le temps de recherche ; **probable** que l'ornement non fonctionnel coûte en pilotage ; **avis d'expert** pour tout chiffre de densité (nombre de cartes par écran, etc.). Aucune étude à comité de lecture trouvée qui fixe un nombre idéal d'éléments sur un écran de travail.

### 3.4 Pré-attention et couleur

- **Healey, C. G. et Enns, J. T. (2012).** Attention and visual memory in visualization and computer graphics. *IEEE Transactions on Visualization and Computer Graphics*, 18(7), 1170-1188. DOI 10.1109/TVCG.2011.127. [V] Synthèse : certaines propriétés (teinte, luminosité, orientation, mouvement) sont détectées en un seul regard, avant l'attention focalisée.
- **Treisman, A. M. et Gelade, G. (1980).** A feature-integration theory of attention. *Cognitive Psychology*, 12(1), 97-136. [M] Un élément qui diffère par une propriété simple ressort quel que soit le nombre d'éléments autour (recherche "en parallèle") ; ne marche que s'il est unique : dix éléments rouges et le rouge ne signale plus rien.
- **Ware, C. (2012).** *Information Visualization: Perception for Design* (3e éd.). Morgan Kaufmann. [M] Limite pratique du codage par couleur nominale : de l'ordre de 6 à 12 catégories identifiables au maximum, moins pour une lecture rapide. **Christ, R. E. (1975).** Review and analysis of color coding research for visual displays. *Human Factors*, 17(6), 542-570. [M]

Niveau : **prouvé** pour "une alerte unique dans un champ neutre ressort" ; **probable** pour la limite de 3 à 4 statuts à lire d'un coup d'oeil ; **avis d'expert** pour le chiffre exact.

Point d'attention pour la charte de Cadran : bordeaux (rouge sombre) et olive (vert sombre) ont une luminosité voisine et sont facilement confondus par les personnes atteintes de deutéranomalie (de l'ordre de 5 à 8 % des hommes, chiffre de culture générale non revérifié ici). WCAG 1.4.1 interdit de véhiculer une information par la couleur seule. Il faut donc doubler chaque statut d'une icône ou d'un mot, et différencier les teintes par la luminosité autant que par la teinte.

---

## 4. Mouvement et retour d'information

- **Miller, R. B. (1968).** Response time in man-computer conversational transactions. *Proceedings of the AFIPS Fall Joint Computer Conference*, 33, 267-277. [V pour l'origine des seuils, via Nielsen ; détail non rouvert]
- **Card, S. K., Moran, T. P. et Newell, A. (1983).** *The Psychology of Human-Computer Interaction.* Lawrence Erlbaum. [M] Processeur perceptif d'un cycle d'environ 100 ms (plage 50 à 200 ms).
- **Nielsen, J. (1993).** *Usability Engineering.* Academic Press, chap. 5 ; repris dans l'article "Response Times: The 3 Important Limits", NN/g. **2e rang** [V]. Trois seuils : **0,1 s** (le système semble instantané), **1 s** (le fil de la pensée n'est pas interrompu, mais le délai se remarque), **10 s** (limite d'attention).
- **Bederson, B. B. et Boltman, A. (1999).** Does animation help users build mental maps of spatial information? *IEEE InfoVis 1999*. [V] Une transition animée aide à reconstruire l'espace d'information, sans pénalité de temps. Limite : peu de participants, tâche de cartographie mentale.
- **Chevalier, F., Henry Riche, N., Plaisant, C., Chalbi, A. et Hurter, C. (2016).** Animations 25 years later: new roles and opportunities. *Proceedings of AVI 2016* (Advanced Visual Interfaces), Bari. [V] Revue : l'animation sert à relier deux états (suivre ce qui a changé), non à décorer ; les bénéfices dépendent de la durée, de la complexité et de la tâche.
- **Harrison, C., Yeo, Z. et Hudson, S. E. (2010).** Faster progress bars: manipulating perceived duration with visual augmentation. *CHI 2010*. [M] La durée perçue d'une attente dépend du motif visuel de la barre, à durée égale.
- **Saffer, D. (2013).** *Microinteractions: Designing with Details.* O'Reilly. [M] **Avis d'expert**. Je n'ai pas trouvé d'étude à comité de lecture qui mesure l'effet des micro-interactions sur la satisfaction avec un effet chiffré robuste ; ne pas s'appuyer sur un chiffre.

Niveau : **prouvé** pour les seuils de perception de la réponse (100 ms, 1 s), **probable** pour l'utilité des transitions courtes qui relient deux états, **avis d'expert** pour les durées d'animation (150 à 250 ms sont une convention de pratique).

---

## 5. Interfaces financières, "pro", crédibilité

- **Fogg, B. J., Soohoo, C., Danielson, D. R., Marable, L., Stanford, J. et Tauber, E. R. (2003).** How do users evaluate the credibility of Web sites? A study with over 2,500 participants. *Proceedings of DUX 2003* (Designing for User Experiences). [V] 2 684 participants, deux sites chacun parmi 10 catégories ; **46,1 % des commentaires** sur la crédibilité portent sur l'aspect général et la mise en page. Limite : sites grand public évalués à la va-vite, commentaires libres codés, conférence et non revue ; fort effet de la première vue, pas de la confiance durable.
- **Robins, D. et Holmes, J. (2008).** Aesthetics and credibility in web site design. *Information Processing & Management*, 44(1), 386-399. DOI 10.1016/j.ipm.2007.02.003. [V] À contenu identique, les versions à traitement esthétique plus soigné sont jugées plus crédibles. Limite : je n'ai pas rouvert la taille d'échantillon ; sites web, jugement rapide.
- **Kim, J. et Moon, J. Y. (1998).** Designing towards emotional usability in customer interfaces: trustworthiness of cyber-banking system interfaces. *Interacting with Computers*, 10(1), 1-29. [V pour la référence et le protocole : quatre expériences sur l'interface de banque en ligne ; les facteurs de conception précis qui font la confiance ne sont pas rouverts ici]. Limite : 1998, distributeur et banque en ligne de l'époque.
- **Reinecke 2014 et Tuch 2012** (voir 1.3) : la préférence des personnes à haut niveau d'études va vers des interfaces moins colorées ; les mises en page prototypiques et simples plaisent.
- **Tullis 1983** (voir 3.3) : la complexité de mise en page, c'est-à-dire la prévisibilité de l'arrangement (alignement sur quelques colonnes et lignes), fait partie des variables qui prédisent le temps de recherche.

Ce que la recherche permet de dire : un aspect soigné, simple, conforme à ce qu'on attend d'un outil sérieux augmente la confiance perçue ; la confiance durable dépend de l'exactitude et de la constance. Elle ne permet pas de dire quelle palette ou quelle police fait "finance", et je n'ai pas trouvé d'étude à comité de lecture sur les terminaux de salle de marché (Bloomberg, Refinitiv) eux-mêmes. Les codes visuels des outils tech et finance actuels (grille stricte, chiffres tabulaires, accent unique, états discrets) relèvent de l'**avis d'expert** et de la prototypicalité : on les imite parce que l'oeil du public professionnel les attend (Tuch 2012).

---

## Règles pour Cadran

Chaque règle porte son niveau de preuve ; les chiffres marqués "choix" sont des valeurs de conception que je propose en m'appuyant sur les sources, pas des constantes démontrées.

1. **Un seul mode, texte sombre sur fond crème.** Le brun cuir sert au cadre (barre latérale, en-têtes, bandeau "Maintenant") et aux grandes surfaces sans texte long ; tout texte de lecture est sombre sur crème. Sources : Piepenbrock 2013, Dobres 2016 (seuils 38,6 % plus bas en polarité positive). Niveau : prouvé en lecture rapide ; fatigue sur journée entière non prouvée.

2. **Texte courant 15 à 16 px, jamais sous 14 px, texte secondaire 12 px minimum pour une information facultative.** Hauteur de x d'au moins 0,2°. Interligne 1,4 à 1,5 (WCAG 1.4.12 impose de tolérer 1,5). Sources : Legge et Bigelow 2011 plus mon calcul de conversion. Niveau : prouvé pour la plage, choix pour les pixels.

3. **Un seul gabarit de chiffres : police à chiffres tabulaires, nombres et heures alignés à droite ou sur la même colonne.** Cinq tailles de texte au plus pour tout l'écran (par exemple 12, 14, 16, 20, 28 px) et deux graisses. Sources : Few 2013, Tullis 1983 (complexité de mise en page). Niveau : avis d'expert.

4. **Contraste : 4,5 à 1 pour tout texte, 7 à 1 visé pour le texte de 12 à 13 px, 3 à 1 pour le contour des boutons, champs et icônes utiles.** Sources : WCAG 1.4.3 et 1.4.11. Niveau : norme.

5. **Taille des boutons : 32 px de haut en usage souris (jamais sous 24 par 24), 44 px de haut en usage tactile ; au moins 8 px d'écart entre deux boutons voisins.** Sources : WCAG 2.5.8 et 2.5.5, Fitts 1954, MacKenzie 1992, Parhi 2006. Niveau : prouvé (Fitts), norme et choix (valeurs).

6. **Un bouton doit montrer cinq choses pour être reconnu sans hésiter : une forme fermée (fond plein ou contour franc), un contraste d'au moins 3 à 1 avec le fond, un libellé verbe à l'infinitif ou à l'impératif, une icône facultative mais cohérente, et quatre états visibles (repos, survol, appui, désactivé) plus un anneau de focus clavier.** Pas de texte nu ou de bouton "fantôme" pour une action courante. Sources : Moran/NN/g 2017 (22 % de temps, 25 % de fixations en plus pour les signifiants faibles), Norman 2013, Tuch 2012 (prototypicalité). Niveau : probable.

7. **Hiérarchie de boutons à trois niveaux, pas plus : un primaire par zone (fond plein), des secondaires (contour), des tertiaires (texte et icône, soulignés au survol).** Dans "À ranger", les cinq gestes restent visibles en permanence, dans le même ordre, avec leur raccourci clavier affiché sur le bouton. Sources : Hick-Hyman, Seow 2005 (la pente chute si les positions sont stables), Card Moran Newell 1980. Niveau : prouvé.

8. **Trois niveaux d'élévation au plus : fond, surface (cartes), surcouche (menus, fenêtres).** Séparer les zones par des filets de 1 px et un écart de teinte plus que par des ombres ; une seule ombre douce, réservée à la surcouche. Sources : Tuch 2012 (faible complexité), Sweller 1988, Few 2013. Niveau : avis d'expert, chiffre choisi.

9. **Couleurs de statut : trois au plus, chacune avec un rôle exclusif, et toujours doublées d'une icône ou d'un mot.** Proposition : bordeaux = retard ou conflit, laiton = à traiter ou en cours, olive = fait. L'accent d'action des boutons ne réutilise aucune de ces teintes d'état (par exemple brun foncé), sinon un bouton ressemble à un statut. Différencier bordeaux et olive par la luminosité, pas seulement par la teinte. Sources : Healey et Enns 2012, Treisman et Gelade 1980, Ware 2012, WCAG 1.4.1. Niveau : prouvé pour l'effet de saillance, probable pour le chiffre 3.

10. **Au plus cinq zones de premier niveau sur l'écran principal, la plus importante en haut à gauche.** Pour Cadran : Maintenant, Agenda, À ranger, Mails ; Apps est un niveau inférieur (replié ou en pied). Sources : Cowan 2001, Few 2013, Tullis 1983 (le nombre et la taille des groupes prédisent le temps de recherche). Niveau : probable.

11. **Grille et alignement : une unité de base de 4 px, espacements multiples de 4 et 8, tous les blocs alignés sur les mêmes colonnes ; l'écart entre groupes vaut au moins deux fois l'écart à l'intérieur d'un groupe.** Le groupement se fait par la proximité et un filet fin, pas par des cadres autour de chaque élément. Sources : Tullis 1983 (groupement et complexité de mise en page), Moshagen et Thielsch 2010 (simplicité, soin d'exécution). Niveau : probable ; les valeurs en pixels sont un choix.

12. **Retour d'information : tout geste montre un changement d'état en moins de 100 ms (appui visible, mise à jour optimiste) ; au-delà de 1 s, un indicateur ; toute action destructive ou groupée se défait (annuler).** Transitions entre deux états de 120 à 200 ms, sans rebond, utilisées pour montrer ce qui a changé (une carte qui part, un bloc qui se déplace), jamais pour décorer ; respecter la préférence "réduire les animations" du système. Sources : Miller 1968, Card Moran Newell 1983, Nielsen 1993, Bederson et Boltman 1999, Chevalier 2016. Niveau : prouvé pour 100 ms et 1 s, avis d'expert pour 120 à 200 ms.

13. **Raccourcis clavier à une touche pour chaque geste répété (valider, affecter, cocher, supprimer, plus tard), affichés dans une pastille sur le bouton.** Sources : Card, Moran et Newell 1980 (frappe environ 0,2 s contre pointage environ 1,1 s, ordre de grandeur de mémoire). Niveau : prouvé pour l'ordre de grandeur.

14. **Ornement : aucun élément décoratif ne peut être confondu avec un signifiant (pas de couture, de pointillé ou de texture qui ressemble à un bouton ou à une séparation interactive), aucune texture sous du texte.** Si le cuir reste une identité, il vit dans la teinte et dans la typographie, pas dans des motifs. Sources : Sweller 1988, Harp et Mayer 1998 (le décor intéressant nuit à la rétention), Moran/NN/g 2017. Contre-point : Bateman 2010 (l'ornement peut aider la mémorisation de graphiques), donc la règle vise l'interface d'action, pas une illustration. Niveau : probable.

15. **Ressembler à un outil sérieux connu : mise en page prototypique (barre latérale ou en-tête fixe, listes et tableaux denses, états sobres), une seule famille de caractères sans empattement pour l'interface, une teinte d'accent, aucun effet de lueur ou de dégradé sur les contrôles.** À vérifier sur l'écran d'ouverture : lisible et ordonné en un coup d'oeil (50 ms), car le jugement de confiance et de qualité se forme à ce moment et s'estompe à l'usage. Sources : Lindgaard 2006, Tuch 2012 (faible complexité plus forte prototypicalité), Fogg 2003 (46,1 %), Robins et Holmes 2008, Reinecke 2014. Niveau : prouvé pour la rapidité du jugement, probable pour les effets sur la confiance.

## Trois directions de boutons "pro financier tech"

1. **Plaque pleine à filet (sobre, très reconnaissable).** Rectangle de 32 px de haut au rayon de 6 px, primaire plein en brun foncé avec texte crème, secondaire à contour de 1 px, libellé verbe, une pastille de raccourci en police tabulaire à droite ; passe par la règle 6 sans ambiguïté.
2. **Barre segmentée de gestes (dense, type outil de trading).** Les cinq gestes de "À ranger" forment une seule barre collée, chaque segment avec icône, mot et touche (V, A, C, S, P), séparés par des filets de 1 px, avec le segment par défaut en fond plein : une zone d'appui unique, un ordre fixe, un minimum d'éléments à lire.
3. **Touche de fonction (clavier de terminal).** Chaque bouton est une petite touche à fond tinté, dont la lettre de raccourci est encadrée à gauche et le libellé à droite, sans ombre portée, un trait de couleur de 2 px en bas pour l'état (olive, laiton, bordeaux) ; l'esprit des terminaux de salle de marché, avec la lettre qui sert à la fois de signifiant et de raccourci.

## Ce que je n'ai pas trouvé

- Une étude à comité de lecture avec chiffres sur le temps de repérage de boutons plats contre boutons signifiés (seule NN/g 2017, de 2e rang).
- Une étude contrôlée de la fatigue visuelle du mode sombre contre clair sur une journée de travail.
- Une étude comparant la densité d'information optimale d'un écran de travail professionnel.
- Une étude à comité de lecture sur l'interface des terminaux financiers (Bloomberg ou équivalent).
- L'effet chiffré, robuste, des micro-interactions sur la satisfaction.
- Les tailles d'échantillon de Lindgaard 2006 et de Tuch et al. IJHCS 2012, et les valeurs de corrélation de Lindgaard 2006 (non rouvertes).

Références marquées [M] : à rouvrir avant toute citation formelle (DOI non vérifiés).
