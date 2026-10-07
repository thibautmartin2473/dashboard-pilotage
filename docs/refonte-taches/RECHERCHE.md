# Recherche pour la refonte design v2 (2026-10-07)

Destinataires : les 4 designers (identité, charte, composants, fonctionnalités). Contexte lu dans V2.md. Projet : Next 16.3.5, React 19.2.8, Tailwind 4, Supabase (versions lues dans package.json). Aucune des dépendances ci-dessous n'est installée aujourd'hui (seul supabase-js l'est).

## Limites de cette recherche (à lire d'abord)

1. **Reddit n'a pas pu être consulté** : l'outil de recherche refuse le domaine reddit.com. Les « recommandations des forums » viennent de comparatifs publiés ailleurs (blogs, DEV Community, Substack) et des pages GitHub. Ne pas écrire « plébiscité sur Reddit » dans une proposition.
2. **Instagram** : seules les légendes et transcriptions existent. Beaucoup de vidéos sont des partenariats payés Manus (`#manuspartner`), donc à traiter comme de la publicité, pas comme un avis.
3. **Compatibilité React 19 / Next 16** : vérifiée sur la page du projet quand elle le dit explicitement (marqué « confirmé »), sinon marquée « non confirmé » : à tester par un `npm install` sur une branche avant de s'engager. Aucune version n'a été installée ici.
4. Chiffres d'étoiles GitHub lus le 2026-10-07 par un résumeur de page : ordre de grandeur fiable, pas au dixième près.

## Ce que ses saves Instagram disent (11 notes utiles sur 149 de type skill)

Un seul sujet revient vraiment : **rendre un site généré par IA moins « générique »** avec trois ingrédients répétés dans quatre vidéos : une bibliothèque d'animation, une banque de composants, un skill de direction artistique.

| Note source | Ce qu'elle apporte |
|---|---|
| [[2026-09-22-kingarms.ai-DX7lWqFx9I9]] | Framer Motion + skill design + banque de composants (noms non donnés). « Remplace un site à 10 000 € » = accroche. |
| [[2026-09-22-antoineblanco99-Dbdpp0lFfAn]] | Skill qui encode typo, couleurs, espacements + **21st.dev**. Dépôt du skill non nommé. |
| [[2026-09-22-eli_buildz_-DdXvT9ZDocg]] | Spline (3D), Manus, 21st Dev, Motion Sites, Recent Design. Pub Manus. |
| [[2026-09-22-vibecode.rob-DdgxxPNRAVP]] | **motion.dev** (survol, glisser, transitions de layout), deux bibliothèques de composants aux noms douteux. Pub Manus. |
| [[2026-09-22-buildwaleesh-DbqYVjazc5Q]] | **Motion Primitives** (animations à copier), Haikei (fonds SVG), Watermelon UI. Pub Manus. |
| [[2026-09-22-buildwithnico-DanT1aqMKNM]] | **Primitives** (Radix/Base UI probablement) + shadcn/ui : ne pas laisser l'IA réinventer menus et modales. Noms non transcrits. |
| [[2026-09-22-nocode.joshua-DcE150pz_Rj]] | **Life dashboard** : agenda, mails, tâches, briefing du matin ; agent de revue du soir et synthèse hebdo. Recoupe exactement le projet. |
| [[2026-03-03-dryxio.us-DVbZ06TDCGo]] | Outil gratuit de design qui donne le prompt exact (nom non cité). |
| [[2025-06-24-lemondedumarketing-DLR2jXxCvwS]] | Google Stitch : maquette d'interface à partir d'un prompt, export Figma. |
| [[2023-07-24-waveindex-CvFVH7_NFYq]] | Polices d'affiches : aucune nommée dans la légende. Inexploitable. |
| [[2026-09-22-nateherkai-Dcn_65hFXOg]] | Vault Obsidian raw/wiki/output : déjà en place chez lui, rien à ajouter au design. |

Aucun save ne cite une app de planification (Sunsama, Akiflow, Motion...) ni une police ou une palette précise : cette partie vient uniquement du web.

---

# Recommandations classées (22)

Légende : **[Save]** = recoupe un de ses saves ; **Poids** et **Risque** sur 3 niveaux.

## A. Fondations (à décider en premier, les autres en dépendent)

### 1. Motion (paquet `motion`, import `motion/react`) - priorité absolue
- **Quoi** : animation déclarative, transitions de layout (un bloc qui change de taille ou de place glisse au lieu de sauter), glisser, gestes.
- **Pourquoi pour lui** : c'est le moteur des « blocs indépendants qui se succèdent » dans l'agenda (apparition en cascade, réordonnancement fluide) et de toutes les micro-interactions de boutons.
- **Compatibilité** : exige React 18.2 ou plus ; Next App Router : `"use client"` ou import depuis `motion/react-client` (confirmé par la doc). React 19 : la page ne le dit pas explicitement, mais la contrainte « 18.2 ou plus » l'inclut.
- **Poids / risque** : moyen (réductible avec le composant `m` + chargement paresseux, chiffre non vérifié) / faible. Prévoir `prefers-reduced-motion`.
- **Sources** : https://motion.dev/docs/react-installation , https://motion.dev/docs/react
- **Recoupe** : [Save] kingarms.ai (Framer Motion, ancien nom du même projet), vibecode.rob.

### 2. shadcn/ui comme socle de composants, avec Base UI comme couche de primitives
- **Quoi** : composants copiés dans le dépôt (donc modifiables à volonté), stylés Tailwind, accessibles. Les primitives (menus, modales, popovers, onglets) viennent de Base UI, Radix ou React Aria au choix.
- **Pourquoi pour lui** : il veut des boutons et composants « beaucoup plus avancés » sans écrire à la main focus, clavier, collisions. C'est précisément l'argument de la vidéo [Save] buildwithnico.
- **Compatibilité** : shadcn : Tailwind v4 depuis février 2025, React 19 depuis octobre 2024 (changelog). Base UI : v1.0 stable le 2025-12-11, v1.8.0 le 2026-09-04, 35 composants dont Toast et Drawer, supporte les Server Components (page des releases). Un blog 2026 indique que shadcn a fait de Base UI son défaut en juillet 2026 : **non confirmé par une seconde source, à vérifier avec `npx shadcn init`**. Radix reste possible.
- **Poids / risque** : faible (code copié, tree-shaké) / faible à moyen : le code devient à lui, donc les mises à jour sont manuelles.
- **Sources** : https://ui.shadcn.com/docs/changelog , https://base-ui.com/react/overview/releases , https://github.com/mui/base-ui , https://www.untitledui.com/blog/react-component-libraries
- **Recoupe** : [Save] buildwithnico (primitives + bibliothèque construite dessus), kingarms.ai (banque de composants).

### 3. Jetons de couleur en OKLCH, échelle de 12 étapes (Radix Colors) et thème généré par 3 variables
- **Quoi** : une échelle de 12 étapes par couleur (1-2 fonds, 3-5 composants, 6-8 bordures, 9-10 aplats, 11-12 texte), claire et sombre, mappée dans `@theme` de Tailwind 4. Inspiration Linear : au lieu de dizaines de variables, trois entrées (couleur de base, accent, contraste) génèrent tout le thème dans un espace perceptuel (LCH, OKLCH est le cousin utilisé par Tailwind 4).
- **Pourquoi pour lui** : il y a déjà un système de chartes (`data-charte`, `chartes.css`). Passer à « base + accent + contraste » rend les 3 à 5 chartes proposées combinables et cohérentes, et le mode clair vient presque gratuitement.
- **Compatibilité** : Tailwind 4 est nativement en OKLCH ; variables CSS + `@theme inline` documentés. Radix Colors : CSS pur, classes `.dark` / `.light`, pas de dépendance à React.
- **Poids / risque** : nul (CSS) / faible. Attention au contraste réel du texte secondaire sur fond sombre : à mesurer.
- **Sources** : https://www.radix-ui.com/colors/docs/overview/usage , https://notesofdev.com/blog/using-radix-colors-with-tailwind-css/ , https://linear.app/now/how-we-redesigned-the-linear-ui
- **Recoupe** : aucun save (aucune palette citée).

### 4. Typographie : garder Geist, ajouter une police d'affichage pour le nom
- **Quoi** : Geist Sans et Geist Mono (déjà utilisés) restent la police de travail. Pour les titres et le logotype, deux pistes : Inter Display (le choix de Linear pour les titres) ou General Sans / Satoshi (Fontshare, gratuites en usage commercial, auto-hébergement permis).
- **Pourquoi pour lui** : une seule famille donne un rendu « outil » propre mais sans signature ; une police d'affichage distincte donne au nom et au logo une personnalité sans alourdir l'interface.
- **Compatibilité** : Geist : licence SIL OFL, paquet `geist` avec intégration `next/font`. Geist existe aussi en variante pixel (Geist Pixel, 5 styles) : utile pour un logo « cadran ». Satoshi : tient un peu plus serré qu'Inter, à tester sur les petits libellés de l'agenda.
- **Poids / risque** : 20 à 60 ko par graisse / faible.
- **Sources** : https://github.com/vercel/geist-font , https://www.fontshare.com/fonts/general-sans , https://diversekit.com/blog/geist-vs-inter
- **Recoupe** : [Save] waveindex (polices, mais non nommées) : aucune information réutilisable.

### 5. Icônes : Lucide par défaut, Phosphor (poids duotone) pour l'identité
- **Quoi** : Lucide = 1600+ icônes au trait homogène, ISC, tree-shaking, React 19 confirmé. Phosphor = 6 poids (thin à duotone), React 19 et Server Components confirmés, MIT.
- **Pourquoi pour lui** : Lucide est déjà la norme de shadcn ; Phosphor permet de varier le poids selon l'état (trait au repos, plein quand actif) pour les boutons du rail.
- **Poids / risque** : faible si imports individuels / faible. Ne pas mélanger les deux sur un même écran (règle de cohérence). Règle de Thibaut : aucun pictogramme décoratif, donc icônes fonctionnelles uniquement.
- **Sources** : https://github.com/lucide-icons/lucide , https://github.com/phosphor-icons/react

## B. Composants et micro-interactions

### 6. cmdk : palette de commande (Ctrl+K)
- **Quoi** : menu de commandes filtré au clavier ; recherche de tâche, « créer un bloc », « aller à demain », « changer de charte ».
- **Pourquoi** : c'est le geste « pro » le plus visible (Linear, Raycast, Akiflow) et il remplace plusieurs boutons.
- **Compatibilité** : React 18+ (confirmé), MIT, environ 13 000 étoiles, 2 000 à 3 000 éléments sans virtualisation. shadcn en fournit un composant `Command` construit dessus.
- **Poids / risque** : faible / faible. Elle s'appuie sur la boîte de dialogue Radix : si le socle choisi est Base UI, vérifier que le composant shadcn correspondant est bien basculé.
- **Source** : https://github.com/dip/cmdk

### 7. Sonner : notifications avec « Annuler »
- **Quoi** : toasts empilés, animés, avec action. Après « ranger » ou « déplacer », un toast « Rangé dans Demain 14h : Annuler ».
- **Pourquoi** : le dashboard fait des écritures rapides (rangement forcé) ; l'annulation en un clic rassure et évite les confirmations.
- **Compatibilité** : MIT, environ 13 000 étoiles, `<Toaster />` à placer une fois ; support React 19 non lu explicitement sur la page, mais bibliothèque très répandue avec shadcn 2025-2026 : **non confirmé**.
- **Poids / risque** : faible / faible.
- **Source** : https://github.com/emilkowalski/sonner

### 8. Tiroir latéral : Drawer de Base UI, pas Vaul
- **Quoi** : panneau coulissant pour le détail d'une tâche ou d'un mail, sans quitter l'agenda.
- **Pourquoi** : détail et édition sans changer de page, usage mobile compris.
- **Compatibilité / risque** : **Vaul est annoncé « non maintenu » par son auteur** sur sa page GitHub (8,6 k étoiles) : à éviter pour un nouveau code. Base UI propose un Drawer marqué stable dans ses releases récentes.
- **Sources** : https://github.com/emilkowalski/vaul (statut), https://base-ui.com/react/overview/releases

### 9. Glisser-déposer : pragmatic-drag-and-drop en premier choix, dnd-kit en second
- **Quoi** : tirer une tâche de « À ranger » vers un créneau de l'agenda, réordonner des blocs.
- **Pourquoi** : le timeboxing par glisser est le geste central des apps de planification (voir 15).
- **Comparaison** :
  - pragmatic-drag-and-drop (Atlassian, Trello/Jira) : 12,8 k étoiles, noyau d'environ 4,7 ko, indépendant du framework, utilise le glisser natif du navigateur. Risque : le glisser natif est limité sur écran tactile, **à tester sur téléphone**. Compatibilité React 19 non confirmée (indépendant de React, donc probable).
  - dnd-kit : 17,7 k étoiles, accessibilité clavier et tactile soignée, mais la nouvelle version `@dnd-kit/react` reste en 0.x (une page de releases lue indique 0.5.0 sans mention de React 19, donnée peu fiable) : **à tester**.
- **Recommandation** : prototyper le glisser dans la grille horaire avec les événements pointeur de Motion (gestes `drag`) avant d'ajouter une bibliothèque : la grille horaire est un cas particulier (pas de liste triable), et ça économise une dépendance.
- **Sources** : https://github.com/atlassian/pragmatic-drag-and-drop , https://github.com/clauderic/dnd-kit

### 10. AutoAnimate : transitions de liste sans code
- **Quoi** : un hook `useAutoAnimate` qui anime l'apparition, la disparition et le déplacement des éléments d'une liste.
- **Pourquoi** : pour les listes « À ranger », mails, apps : effet fini pour une ligne de code, sans toucher aux composants.
- **Compatibilité** : MIT, 13,9 k étoiles, hook React ; version React 19 non confirmée sur la page. Doublon partiel avec Motion : à choisir l'un ou l'autre pour les listes simples (AutoAnimate pour les listes, Motion pour l'agenda).
- **Poids / risque** : très faible / faible.
- **Source** : https://github.com/formkit/auto-animate

### 11. Motion Primitives : animations prêtes à copier
- **Quoi** : kit de composants animés (texte, transitions, carrousels) bâti sur Motion + Tailwind, installable via le registre shadcn.
- **Pourquoi** : source d'idées et de code pour les boutons « avancés » (survol, remplissage, apparition de texte).
- **Risque** : le projet se déclare en beta, « changements significatifs » attendus : copier le code puis ne plus dépendre du dépôt. MIT, 6,5 k étoiles.
- **Source** : https://github.com/ibelick/motion-primitives
- **Recoupe** : [Save] buildwaleesh.

### 12. 21st.dev : catalogue de composants (usage ponctuel)
- **Quoi** : plus de 12 000 composants de la communauté, installés par la CLI du registre shadcn ou par un prompt à coller dans Claude Code.
- **Risque** : **2 copies gratuites par jour**, abonnement au-delà ; licence des composants non précisée sur la page : vérifier composant par composant avant de les garder. Utile pour s'inspirer, pas comme fondation.
- **Source** : https://21st.dev
- **Recoupe** : [Save] antoineblanco99, eli_buildz_ (deux saves).

### 13. Skill de direction artistique pour Claude Code : utiliser l'existant d'abord
- **Quoi** : les saves recommandent d'installer un skill qui encode typo, couleurs, espacements. Les noms ne sont jamais donnés (dépôts derrière un « commente pour recevoir »).
- **Pourquoi pour lui** : il a déjà dans cette session les skills `ecc:frontend-design-direction`, `ecc:design-system`, `ecc:make-interfaces-feel-better` (espacements, ombres, zones de clic, mouvement), `ecc:motion-foundations` / `motion-patterns`, `ecc:taste`. Ils couvrent la recommandation des saves sans rien télécharger de source inconnue.
- **Risque** : installer un dépôt anonyme annoncé en DM est un risque de sécurité (le même compte, kingarms.ai, publie justement une vidéo sur la sécurité) : ne pas le faire.
- **Recoupe** : [Save] kingarms.ai, antoineblanco99.

## C. Fonctionnalités et rituels (ce que les apps de référence font le mieux)

Sources communes de cette partie : https://temporal.day/blog/akiflow-vs-sunsama , https://www.morgen.so/blog-posts/sunsama-vs-motion . Les avis viennent de comparatifs publiés, pas de Reddit.

### 14. Rituel du matin guidé (Sunsama)
- **Quoi** : une séquence de 3 à 4 écrans à l'ouverture : tâches en retard, ce qui est calé aujourd'hui, estimation de durée, comparaison « temps estimé contre temps disponible ».
- **Pourquoi pour lui** : le rangement forcé existe déjà ; ce rituel en est la suite logique (ranger, puis estimer, puis voir si ça rentre). C'est ce que les utilisateurs de Sunsama disent le plus apprécier : « un rituel qui change le comportement ».
- **Poids / risque** : aucun côté bibliothèque ; coût produit : 15 à 20 minutes par jour chez Sunsama, donc **le garder à 2 minutes** pour ne pas devenir une corvée.
- **Recoupe** : [Save] nocode.joshua (« briefing du jour chaque matin »).

### 15. Timeboxing par glisser avec durée par la poignée (cœur de la demande « blocs successifs »)
- **Quoi** : tirer une tâche dans la grille, étirer le bas pour la durée ; les tâches posées pendant un cours (ex. « networking » puis « révision Financial Modeling » pendant le cours de 14h-17h) s'empilent en blocs indépendants successifs, chacun avec sa durée, au sein de la plage.
- **Variante Akiflow** : des « slots » qui regroupent plusieurs tâches dans un seul bloc ; à proposer comme option, mais ce qu'il demande est l'inverse (blocs séparés).
- **Compatibilité** : Motion (layout + drag) ou pragmatic-drag-and-drop (voir 9).

### 16. Rituel de fin de journée et revue hebdomadaire
- **Quoi** : le soir, un écran « fait / reporté / abandonné » avec un seul bouton pour reporter le reste à demain ; le dimanche, une synthèse de la semaine (quotas tenus, heures par catégorie).
- **Pourquoi** : bouclage de la boucle planifier, faire, reporter ; l'idée est aussi dans la vidéo [Save] nocode.joshua (agent de revue du soir et synthèse hebdomadaire).
- **Risque** : écrire des données (tâches reportées) : voir si c'est dans le périmètre « lecture seule » des démos.

### 17. Mode focus avec minuteur
- **Quoi** : une vue plein écran sur UNE tâche, minuteur, et sortie en un geste. Chez Sunsama, le minuteur de focus continue de tourner quand on change d'application.
- **Pourquoi** : pour les créneaux de révision (ACC 812, Financial Modeling).
- **Poids** : nul côté bibliothèque ; attention au minuteur en arrière-plan (onglet inactif ralenti par le navigateur) : s'appuyer sur l'heure de début, pas sur un compteur.

### 18. Raccourcis clavier partout
- **Quoi** : `C` créer, `T` aller à aujourd'hui, `J/K` descendre/monter, `Ctrl+K` palette, `Echap` fermer. La « vitesse clavier » est le trait n°1 cité pour Akiflow.
- **Mise en œuvre** : `react-hotkeys-hook` (page GitHub introuvable lors de la vérification : **non confirmé**, à contrôler) ou un petit hook maison (30 lignes) pour éviter une dépendance. Afficher les raccourcis dans les infobulles.

### 19. Saisie en langage naturel en français (chrono-node)
- **Quoi** : taper « réviser FM demain 14h pendant 1h » et obtenir une tâche datée avec durée.
- **Compatibilité** : chrono-node est en TypeScript, MIT, plus de 5 300 étoiles, **français pris en charge** (confirmé), indépendant de React. Les durées (« 1h ») et la catégorie sont à ajouter par un analyseur maison.
- **Poids / risque** : faible / moyen (ambiguïtés de date).

### 20. Proposition de planning à valider, jamais imposée
- **Quoi** : Motion et Reclaim replacent tout automatiquement (beaucoup d'utilisateurs trouvent cela envahissant, d'après le comparatif Morgen) ; Morgen propose un planning que l'on approuve avant. Il a déjà une « suggestion de bloc » : la faire évoluer vers « 3 blocs proposés pour la journée, accepter tout ou un par un ».
- **Source** : https://www.morgen.so/blog-posts/sunsama-vs-motion

## D. Identité et inspiration

### 21. Aide à la conception visuelle : Google Stitch et Haikei, à titre d'inspiration seulement
- **Quoi** : Stitch génère une maquette à partir d'un prompt, export Figma ; Haikei génère des fonds SVG (blobs, vagues, dégradés), gratuit à l'inscription.
- **Pourquoi** : utile pour tester 3 logos ou fonds en quelques minutes ; mais un logo généré n'est pas un logo : le tracer ensuite à la main en SVG.
- **Risque** : la mention de gratuité vient d'une vidéo, pas d'une page officielle : à vérifier. Fonds SVG décoratifs : respecter la règle « aucun pictogramme décoratif » de Thibaut.
- **Recoupe** : [Save] lemondedumarketing, buildwaleesh.

### 22. Esthétique de référence : Linear et sa retenue
- **Quoi** : couleur utilisée avec parcimonie (accent réservé aux états interactifs et statuts), pas de second ton chromatique, hiérarchie portée par la surface et des bordures de un pixel plutôt que par des ombres ou dégradés.
- **Pourquoi pour lui** : son accent actuel #7aa2ff sur Graphite est déjà dans cette famille ; la v2 doit chercher la précision (alignement, rythme, états) plus que l'effet. Critique : les propositions « plus avancées » risquent de rajouter de l'effet là où la valeur est dans la densité lisible de l'agenda.
- **Sources** : https://linear.app/now/how-we-redesigned-the-linear-ui , https://github.com/VoltAgent/awesome-design-md (fiches de style prêtes à donner à Claude, dont Linear)

---

## Écartés, avec raison

- **Manus** : cité dans 4 saves, mais toutes sont des publicités payées ; produit de génération de sites, hors sujet pour un dashboard déjà codé.
- **Spline (3D)** : lourd (runtime 3D) pour un gain visuel sans rapport avec la tâche.
- **Freebuff, Omniroute, Ruflo, Graphify** : outils de développement, pas de design ; Freebuff envoie code et données à un tiers financé par la pub.
- **Vaul** : non maintenu (voir 8).
- **FullCalendar et bibliothèques de calendrier complètes** : l'agenda 5 jours est déjà fait sur mesure et c'est la pièce la plus personnelle du produit ; remplacer par une bibliothèque ferait perdre la distinction plage / tâche.
- **Sunsama, Akiflow, Motion, Reclaim, Amie, Notion Calendar, Cron, Things, Height** : non consultés directement (pages produit ou fonctionnalités introuvables ou refusées) ; seuls Sunsama, Akiflow, Motion et Morgen sont décrits, via deux comparatifs. Les rituels de 14 à 20 viennent de là, pas de Linear, Things ou Height, non vérifiés.

## Ordre d'adoption conseillé

1. Jetons OKLCH (3) + Motion (1) + shadcn avec primitives (2) : tout le reste s'appuie dessus.
2. Palette de commande (6), Sonner (7), tiroir (8) : gain visible immédiat.
3. Timeboxing en blocs successifs (15) avec Motion, avant tout ajout de bibliothèque de glisser.
4. Rituels matin/soir (14, 16) et mode focus (17), puis langage naturel (19).
