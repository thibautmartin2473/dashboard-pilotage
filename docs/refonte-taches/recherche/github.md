# Recherche GitHub : bibliothèques, kits et listes awesome (2026-10-07)

Angle : dépôts GitHub et paquets npm. Contexte lu dans V2.md et DIAGNOSTIC.md : dashboard personnel, Cockpit (rail, agenda 5 jours avec plages et tâches, liste « À ranger », mails), piloté surtout par conversation avec Claude. Pile du projet lue dans package.json : Next 16.3.5, React 19.2.8, Tailwind 4 (dernière version publiée : 4.3.3), Supabase. Aucune des bibliothèques ci-dessous n'est installée aujourd'hui. Ce fichier complète RECHERCHE.md (première passe rapide) et en corrige plusieurs points : voir la section 1.

## 0. Méthode, niveaux de confiance et limites

- **Étoiles et dernière activité** : champs `stargazers_count` et `pushed_at` de l'API GitHub (api.github.com/repos/...), lus le 2026-10-07. Quand l'API a répondu 403 (limite de requêtes atteinte en cours de route), j'ai pris le chiffre de la page github.com du dépôt ou je l'indique « non lu ». `pushed_at` = dernier envoi de code sur n'importe quelle branche, pas forcément une version publiée.
- **Compatibilité** : « peer React » = ce que le paquet déclare dans npm (registry.npmjs.org, version `latest` lue le 2026-10-07). C'est une déclaration de l'auteur, pas un test. La seule preuve d'usage trouvée pour la combinaison exacte Next 16 + React 19 + Tailwind 4 est un gabarit de dashboard (voir 6.4). Aucune bibliothèque n'a été installée ici : tout reste à valider par un `npm install` sur une branche.
- **Poids** : seule la taille « dépaquetée » npm est disponible pour presque tous (`dist.unpackedSize`) ; ce n'est PAS le poids envoyé au navigateur (un paquet d'icônes pèse 35 Mo dépaqueté et quelques ko utilisés). Les poids réels cités (Motion, pragmatic-drag-and-drop) viennent de la documentation des auteurs.
- **Téléchargements npm** : semaine du 2026-09-28 au 2026-10-04 (api.npmjs.org). Le volume mesure l'installation, pas la qualité : Vaul est à 46,6 M par semaine alors que son auteur dit qu'il n'est plus maintenu.
- **Niveaux** utilisés dans le classement :
  - **CONSENSUS** : plus de 10 000 étoiles ou plus de 10 M de téléchargements hebdomadaires, activité récente, et documentation officielle qui le confirme.
  - **SOLIDE** : activité récente et compatibilité déclarée, mais adoption plus étroite ou version 0.x.
  - **ANECDOTIQUE** : un seul usage, une seule source, ou projet jeune ou ralenti.
- **Non couvert** : Reddit (hors de mon angle, déjà signalé inaccessible dans RECHERCHE.md). Les licences de Satoshi et General Sans (Fontshare) n'ont pas pu être lues : à vérifier à la main avant usage. Le prix des modules premium de Schedule-X n'est pas affiché sur la page lue.

## 1. Ce qui change par rapport à RECHERCHE.md

| Point de RECHERCHE.md | Nouvelle information (source) |
|---|---|
| « Base UI par défaut dans shadcn en juillet 2026 : non confirmé » | **Confirmé par la source primaire** : annonce shadcn de juillet 2026, `npx shadcn init` choisit Base UI, Radix reste supporté à parité, pas de migration obligatoire. https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default |
| Sonner = solution de notifications | shadcn a publié en juillet 2026 son propre composant **Toast sur Base UI** (actions, statuts, promesse, empilement, glisser pour fermer). Sonner reste valable (voir 4.2). https://ui.shadcn.com/docs/changelog/2026-07-toast |
| Sonner et dnd-kit : React 19 « non confirmé » | Peer déclaré : Sonner `^18 \|\| ^19`, `@dnd-kit/react` 0.5.0 `^18 \|\| ^19`. Déclaré, pas testé. |
| `react-hotkeys-hook` : « page introuvable, non confirmé » | Existe : 3 505 étoiles, version 5.3.3, dernier envoi 2026-10-05, MIT, peer React 16.8 ou plus. https://github.com/JohannesKlauss/react-hotkeys-hook |
| Vaul « annoncé non maintenu » | Confirmé par le README (« This repo is unmaintained... »), dernier envoi 2025-10-03. https://github.com/emilkowalski/vaul |
| Motion : version non précisée | **14.0.0 publiée le 2026-10-02** (cinq jours), après 13.5.x. https://github.com/motiondivision/motion/blob/main/CHANGELOG.md |
| (absent) | Les `<ViewTransition>` de React sont une alternative sans dépendance, mais la doc Next 16.4 dit qu'elles exigent **React 19.3** ; le projet est en 19.2.8. https://nextjs.org/docs/app/guides/view-transitions |
| Origin UI cité comme kit | Origin UI a été racheté : il vit dans le dépôt `cosscom/coss` (design system de Cal.com, sur Base UI) et sa partie Radix est un « legacy » à maintenance limitée. |
| (absent) | La CLI shadcn propose huit **préréglages de style** (Vega, Nova, Maia, Lyra, Mira, Luma, Rhea, Sera), dont Rhea « compact » : directement utilisable pour la charte (voir 2.1). |

## 2. Classement par valeur pour ce dashboard

Valeur = ce que la bibliothèque change réellement ici, pas sa célébrité.

| Rang | Élément | Étoiles | Dernier envoi | Niveau | Valeur ici |
|---|---|---|---|---|---|
| 1 | shadcn/ui (+ préréglages de style) | 125 243 | 2026-10-07 | CONSENSUS | Boutons, menus, charte par préréglage |
| 2 | Base UI | 11 090 | 2026-10-07 | CONSENSUS | Primitives, tiroir, toast, combobox |
| 3 | Motion | 33 855 | 2026-10-06 | CONSENSUS | Blocs successifs, micro-interactions |
| 4 | Jetons OKLCH (Tailwind 4, Radix Colors) | 1 690 (Radix Colors) | 2025-12-17 | CONSENSUS (méthode) | Charte combinable, mode clair |
| 5 | Lucide | 24 888 | 2026-10-07 | CONSENSUS | Icônes fonctionnelles |
| 6 | pragmatic-drag-and-drop | 12 783 | 2026-10-07 | SOLIDE | Glisser « À ranger » vers l'agenda |
| 7 | cmdk (via `Command` de shadcn) | 13 006 | 2025-10-29 | CONSENSUS | Palette de commande |
| 8 | NumberFlow | 7 733 | 2026-09-20 | SOLIDE | Chiffres animés (temps restant, compteurs) |
| 9 | chrono-node (français) | 5 291 | 2026-10-04 | SOLIDE | Saisie « demain 14h » |
| 10 | react-hotkeys-hook | 3 505 | 2026-10-05 | SOLIDE | Raccourcis clavier |
| 11 | react-day-picker (déjà sous `Calendar` de shadcn) | 6,9 k (page) | non lu | CONSENSUS | Choix de date |
| 12 | Recharts (via `Chart` de shadcn) | 27 615 | 2026-10-07 | CONSENSUS | Bilan hebdo, quotas |
| 13 | Kibo UI (Contribution Graph, Mini Calendar, Status, Relative Time) | 3 958 | 2026-05-04 | ANECDOTIQUE | Pièces à copier |
| 14 | AutoAnimate | 13 926 | 2026-07-10 | SOLIDE | Listes animées sans code |
| 15 | Phosphor, Tabler | 1 767 ; 22 010 | 2026-01-06 ; 2026-10-07 | SOLIDE | Alternatives d'icônes |
| 16 | Polices : Geist (garder), Mona Sans (option) | 3 635 ; 4 168 | 2026-07-14 ; 2026-09-29 | SOLIDE | Typographie, largeur variable |

Les kits « animés » (Magic UI, React Bits, Aceternity, Animate UI, Motion Primitives) sont traités en 5 : source d'idées à copier, jamais fondation.

### 2.1 shadcn/ui et ses préréglages de style (rang 1)

- **Chiffres** : 125 243 étoiles, MIT, créé en 2023, dernier envoi le 2026-10-07 (jour de la lecture). CLI `shadcn` version 4.21.4.
- **Compatibilité** : le dépôt `next-shadcn-dashboard-starter` (7,1 k étoiles) fait tourner shadcn sur Base UI avec Next 16, React 19 et Tailwind 4 (README lu). Le changelog officiel documente le support de Tailwind 4 et de React 19 (2025) ; le changelog 2026 ajoute Base UI par défaut (juillet), React Aria comme troisième base (juillet), un composant Toast (juillet), un paquet `cn` qui remplace `twMerge(clsx(...))` (septembre).
- **Ce qui est nouveau et utile ici** (changelog lu entrée par entrée) :
  - **Huit préréglages de style** applicables avec `shadcn create` / `shadcn apply` / `shadcn preset` (titres d'entrées du changelog ; syntaxe exacte non lue) : Vega, Nova, Maia, Lyra, Mira, **Luma** (« arrondis, élévation douce, mise en page aérée », inspiré de macOS Tahoe, mars 2026), **Sera** (éditorial et typographique : titres à empattement, angles droits, soulignés, avril 2026), **Rhea** (« un Luma plus compact, espacements réduits, surfaces plus denses, pensé pour les interfaces produit », mai 2026). Vega, Nova, Maia, Lyra, Mira : descriptions non lues.
  - **Nouveaux composants d'octobre 2025** : Spinner, **Kbd** (afficher une touche : infobulles de raccourcis), Button Group (les 5 gestes de « À ranger »), Input Group, Field, **Item** (ligne de liste, carte), **Empty** (état vide : « rien à ranger »).
  - **Registres** : tout dépôt GitHub public devient un registre installable (`shadcn add utilisateur/dépôt/élément`, juin 2026) ; un annuaire officiel de registres existe (octobre 2025), https://ui.shadcn.com/r/registries.json liste des centaines d'entrées (dont @aceternity, @animate-ui, @coss, @diceui, @evilcharts, @dashboardblocks).
  - **Composition** : la doc montre la hiérarchie des sous-composants et `shadcn docs <composant>` donne ce texte à l'agent (avril 2026) : directement utile puisqu'il pilote par Claude.
- **Ce qu'il apporterait ICI** : boutons, menus, popovers, dialogues, onglets déjà accessibles ; un préréglage donne un point de départ de charte en une commande. **Rhea** est le seul préréglage cohérent avec l'agenda dense ; **Luma** va à l'encontre de la densité (aéré) ; **Sera** est un pari d'identité (titres à empattement) à réserver à une page de bilan ou au logotype, pas au cockpit.
- **Critique** : le README de tweakcn reconnaît que « les sites faits avec shadcn/ui se ressemblent tous » ; le skill officiel `frontend-design` d'Anthropic met aussi en garde contre les cartes arrondies identiques à ombre douce. Un préréglage non retouché donnera un rendu générique. Il faut retoucher les jetons (couleurs, rayons, ombres).
- **Poids / risque** : code copié dans le dépôt, donc modifiable mais mises à jour manuelles. Le projet n'a pas de `components.json` : `shadcn init` modifiera `globals.css` et ajoutera des dépendances, à faire sur une branche et à relire dans le diff (l'ajout de `tw-animate-css`, 806 étoiles, 50 M de téléchargements hebdomadaires, est habituel avec Tailwind 4, à vérifier dans le diff).
- **Sources** : https://github.com/shadcn-ui/ui ; https://ui.shadcn.com/docs/changelog ; https://ui.shadcn.com/docs/changelog/2026-03-luma ; https://ui.shadcn.com/docs/changelog/2026-04-sera ; https://ui.shadcn.com/docs/changelog/2026-05-rhea ; https://ui.shadcn.com/docs/changelog/2025-10-new-components ; https://ui.shadcn.com/docs/changelog/2026-06-github-registries ; https://ui.shadcn.com/docs/changelog/2026-04-component-composition

### 2.2 Base UI, avec Radix en réserve (rang 2)

- **Chiffres** : `mui/base-ui` 11 090 étoiles, MIT, créé en février 2024, dernier envoi 2026-10-07. Paquet `@base-ui/react` **1.8.0** (2026-09-04), peer React `^17 || ^18 || ^19`, 5 dépendances dont Floating UI. Rythme mensuel : 1.4.0 (13 avril), 1.5.0 (19 mai), 1.6.0 (18 juin), 1.7.0 (4 août), 1.8.0 (4 septembre).
- **Contenu** : plus de 45 composants (page de démarrage rapide), dont Toast, Drawer (stable depuis la 1.3.0, mars 2026), Dialog, Popover, Combobox et Autocomplete (depuis septembre 2025), Tabs, Menu, Context Menu, Tooltip, Number Field, Slider, Progress, Meter. Pas de Calendar ni de Command dans la doc lue.
- **Radix** : `radix-ui/primitives` 19 365 étoiles, dernier envoi 2026-10-06, paquet unifié `radix-ui` 1.7.0, peer React 16.8 à 19. shadcn indique que Radix reste maintenu à parité. Des comptes rendus de blogs parlent d'un ralentissement depuis le rachat par WorkOS (https://www.pkgpulse.com/guides/shadcn-ui-vs-base-ui-vs-radix-components-2026, https://dev.to/mashuktamim/is-your-shadcn-ui-project-at-risk-a-deep-dive-into-radixs-future-45ei) : à traiter comme opinion ; le fait vérifié est l'annonce shadcn (adoption de Base UI deux fois plus que Radix parmi les projets créés avec shadcn/create).
- **Autres bases** : React Aria (`adobe/react-spectrum`, 15 920 étoiles, Apache-2.0, `react-aria-components` 1.21.1, 5,9 M par semaine), désormais troisième base officielle de shadcn ; Ark UI (`chakra-ui/ark`, 5 408 étoiles, MIT, 5.39.3, peer React 18 ou plus). Aucun besoin de les ajouter ici.
- **Ce qu'il apporterait ICI** : le tiroir de détail d'une tâche ou d'un mail (Drawer), le Toast avec action « Annuler », le Combobox de rangement (choisir un créneau), tous accessibles au clavier. Pour du code neuf : Base UI. Pas de migration d'un existant Radix (il n'y en a pas ici).
- **Poids / risque** : 9,6 Mo dépaqueté (le tree-shaking limite l'envoi réel, non mesuré). Risque faible. Attention iOS Safari 26 : la doc exige `position: relative` sur le `body` et `isolation: isolate` sur la racine pour les popups.
- **Sources** : https://github.com/mui/base-ui ; https://base-ui.com/react/overview/releases ; https://base-ui.com/react/overview/quick-start ; https://www.npmjs.com/package/@base-ui/react

### 2.3 Motion (rang 3)

- **Chiffres** : `motiondivision/motion` 33 855 étoiles, MIT, depuis 2018, dernier envoi 2026-10-06. Paquet `motion` **14.0.0** (2026-10-02, supprime des API internes et fige les versions internes), peer React `^18 || ^19` (optionnel). 28,3 M de téléchargements hebdomadaires pour `motion` et 58,5 M pour l'ancien nom `framer-motion`. Journal des dernières versions : 13.5.0 (2026-10-01) réduit le composant de 20 %, 13.4.5 (2026-09-28) améliore les interruptions de layout et d'`AnimatePresence`.
- **Poids** (documentation Motion) : composant `motion` 34 ko, composant `m` 4,6 ko, `useAnimate` mini 2,3 ko, hybride 17 ko ; `LazyMotion` ajoute 15 ko (`domAnimation`) ou 25 ko (`domMax`, nécessaire au glisser et aux transitions de layout). Chiffres Rollup, Webpack un peu plus gros ; le correctif de 20 % de la 13.5.0 n'est pas répercuté sur la page lue.
- **Fonctions utiles** : `layout` et `layoutId` (transitions de position et de taille, éléments partagés), `AnimatePresence`, gestes `drag`. **Limites documentées** : conteneur qui défile → prop `layoutScroll` obligatoire (l'agenda défile : à prévoir) ; éléments `fixed` → `layoutRoot` ; la mise à l'échelle déforme `border-radius` et `box-shadow` (corrigé si définis via `style`) ; SVG non supporté en layout ; les animations de layout se mettent en pause pendant un redimensionnement horizontal de fenêtre.
- **`Reorder`** : une seule liste, pas de glisser entre listes, pas de gestion de durée : inadapté à une grille horaire (doc officielle).
- **Compatibilité Next 16** : un ticket ouvert (motion #3772, 2026-07-26) concerne **seulement** `unstable_animateLayout` du paquet payant motion-plus en build de production Turbopack (Next 16.2.7) ; les composants `layout`, `drag` et `AnimatePresence` ne sont pas touchés selon le ticket. Sans conséquence si on n'achète pas Motion+.
- **Motion+** : 399 dollars en paiement unique (licence solo) : Carousel, AnimateNumber, Ticker, Cursor, Typewriter... À ne pas acheter : le gratuit couvre le besoin, NumberFlow couvre les chiffres animés.
- **Ce qu'il apporterait ICI** : le glissement des blocs de tâches successifs dans une plage, l'apparition en cascade, les boutons à état (survol, appui, succès). Précaution : 14.0.0 a cinq jours ; épingler la version et regarder le journal avant de passer de la 13.5.x à la 14.
- **Alternatives écartées** : `react-spring` (`pmndrs/react-spring`, 29 166 étoiles, 10.1.2, MIT, peer React 16.8 à 19, 1,3 M par semaine, actif) : sain mais fait doublon avec Motion, qui est la référence de layout. AutoAnimate : voir 3.4.
- **Sources** : https://github.com/motiondivision/motion ; https://motion.dev/docs/react-reduce-bundle-size ; https://motion.dev/docs/react-layout-animations ; https://motion.dev/docs/react-reorder ; https://github.com/motiondivision/motion/issues/3772 ; https://motion.dev/plus

### 2.4 Jetons de couleur : Tailwind 4 en OKLCH et Radix Colors (rang 4)

- **Tailwind 4** : la documentation des variables de thème confirme que les couleurs par défaut sont en OKLCH et qu'une palette se définit dans `@theme` avec le préfixe `--color-*` (exemple officiel : `--color-mint-500: oklch(0.72 0.11 178)`) ; `--color-*: initial` vide la palette par défaut. https://tailwindcss.com/docs/theme
- **Radix Colors** : `radix-ui/colors` 1 690 étoiles, MIT, `@radix-ui/colors` 3.0.0, dernier envoi 2025-12-17 (pas de « releases » listées sur GitHub). Échelle de 12 étapes lue sur la doc : 1-2 fonds d'application, 3-5 composants (normal, survol, appui), 6-8 bordures (6 discrète, 7 interactive, 8 anneau de focus), 9-10 aplats pleins, 11-12 texte (11 contraste doux, 12 fort). La page lue ne dit pas dans quel espace colorimétrique les échelles sont définies : ne pas écrire « OKLCH » à propos de Radix Colors sans vérifier.
- **tweakcn** : `jnsahaj/tweakcn` 10 439 étoiles, Apache-2.0, dernier envoi 2026-09-03, « éditeur visuel de thèmes sans code pour shadcn/ui ». Le README lu ne détaille ni l'export OKLCH ni la commande d'application : à tester sur tweakcn.com avant de s'y fier.
- **Ce qu'il apporterait ICI** : traduire la charte Graphite (fond #202429, surface #2c313a, accent #7aa2ff) en jetons OKLCH à 12 étapes, ce qui rend les 3 à 5 chartes combinables et donne le mode clair presque gratuit. Le contraste réel du texte secondaire sur fond sombre est à mesurer (non vérifié ici).
- **Poids / risque** : nul (CSS), risque faible.

### 2.5 Icônes (rang 5)

| Paquet | Étoiles | Dernier envoi | Version npm | Licence | Peer React | Remarque |
|---|---|---|---|---|---|---|
| Lucide (`lucide-react`) | 24 888 | 2026-10-07 | 1.52.0 | ISC | 16.5.1 à 19 | 134,6 M par semaine, norme de shadcn |
| Tabler (`@tabler/icons-react`) | 22 010 | 2026-10-07 | 3.49.0 | MIT | 16 ou plus | Très actif ; 17,5 Mo dépaqueté |
| Phosphor (`@phosphor-icons/react`) | 1 767 | 2026-01-06 | 2.1.10 | MIT | 16.8 ou plus | 9 000+ icônes, 6 graisses dont duotone ; sous-module `/dist/ssr` pour les Server Components |
| Hugeicons (`@hugeicons/react`) | ancien dépôt archivé | n.a. | 1.1.10 | MIT | 16 ou plus | Dépôt `hugeicons/hugeicons-react` archivé en juin 2026 : tout est regroupé dans `hugeicons/hugeicons`. 4 600+ icônes gratuites (`@hugeicons/core-free-icons`) |

- **Recommandation** : Lucide par défaut (consensus). Phosphor seulement si on veut faire varier la graisse selon l'état (trait au repos, plein quand actif) pour le rail ; son rythme de publication est plus lent (dernier envoi il y a neuf mois) mais le paquet est stable. Ne pas mélanger deux familles sur un même écran. Hugeicons : écarté (réorganisation récente, mélange gratuit et payant).
- **Règle de Thibaut** : aucun pictogramme décoratif ; icônes strictement fonctionnelles.
- **Sources** : https://github.com/lucide-icons/lucide ; https://github.com/phosphor-icons/react ; https://github.com/tabler/tabler-icons ; https://github.com/hugeicons/hugeicons-react

## 3. Composants et interactions ciblés

### 3.1 Glisser-déposer (rang 6)

| Candidat | Étoiles | Dernier envoi | Version | Licence | Peer React | Poids | Verdict |
|---|---|---|---|---|---|---|---|
| pragmatic-drag-and-drop (Atlassian) | 12 783 | 2026-10-07 | 4.0.0 | Apache-2.0 (npm ; GitHub affiche « non déterminée ») | aucun (indépendant du framework) | noyau annoncé 4,7 ko ; 486 ko dépaqueté | Premier choix pour « À ranger » vers l'agenda |
| dnd-kit | 17 703 | 2026-09-12 | `@dnd-kit/react` 0.5.0 ; `@dnd-kit/core` 6.3.1 (ancien) | MIT | 18 ou 19 ; 16.8 ou plus | 240 ko ; 1,07 Mo | Second choix, encore en 0.x pour la nouvelle API |
| @hello-pangea/dnd | 4 033 | 2026-10-07 | 18.0.1 | Apache-2.0 | 18 ou 19 | 1,26 Mo | Listes seulement, pas de grille : écarté |
| Motion `Reorder` | (voir Motion) | | | | | | Une seule liste : écarté pour la grille |

- **Pourquoi pragmatic-drag-and-drop** : le README affirme un fonctionnement complet sur Firefox, Safari, Chrome, iOS et Android (la limite tactile soulevée dans RECHERCHE.md est donc au moins contestée par l'auteur ; à tester sur son téléphone) ; il alimente Trello, Jira et Confluence selon son README. Il fournit des briques (zones de dépôt, calcul de position) sans imposer de rendu, ce qui convient à une grille horaire sur mesure.
- **Pourquoi dnd-kit reste candidat** : le README de la nouvelle API annonce pointeur, souris, tactile et clavier, listes, grilles, contextes imbriqués ; le gabarit de dashboard Next 16 l'utilise déjà pour un kanban. Mais `@dnd-kit/react` est 0.5.0 : l'API peut encore bouger.
- **Aucun des deux ne gère la durée par poignée** : le redimensionnement du bas d'un bloc reste à faire avec des événements pointeur (ou le `drag` de Motion, qui contraint à un axe). C'est la partie la plus difficile et il n'existe pas ici de preuve qu'une bibliothèque la résolve.
- **Sources** : https://github.com/atlassian/pragmatic-drag-and-drop ; https://raw.githubusercontent.com/atlassian/pragmatic-drag-and-drop/main/README.md ; https://github.com/clauderic/dnd-kit ; https://github.com/hello-pangea/dnd

### 3.2 Palette de commande et raccourcis (rangs 7 et 10)

- **cmdk** : `dip/cmdk` 13 006 étoiles, MIT, 1.1.1, dernier envoi **2025-10-29** (un an, mais les trois tickets « React 19 / Next 15 » sont fermés : #266 le 2025-07-04, #332 le 2025-06-23, #324 le 2024-10-31 ; aucun ticket Next 16 trouvé), peer React `^18 || ^19`, 4 dépendances Radix (Dialog, Id, Primitive, Compose-refs), 82 ko dépaqueté, 54,8 M par semaine. README : 2 000 à 3 000 éléments sans virtualisation, `shouldFilter={false}` pour son propre filtrage, motif de pages imbriquées. C'est le composant `Command` de shadcn.
- **kbar** : `timc1/kbar` 5 257 étoiles, MIT, **1.0.0**, dernier envoi 2026-08-10, peer React 17 à 19, dépend de fuse.js, `@tanstack/react-virtual` et d'un portail Radix, 353 000 par semaine. Il enregistre des actions avec raccourcis et hiérarchie, et le gabarit Next 16 l'utilise. À préférer à cmdk si on veut déclarer des actions (« Aller à demain », « Changer de charte ») avec leurs raccourcis dans un seul registre.
- **Raccourcis clavier** : `react-hotkeys-hook` (3 505 étoiles, 5.3.3, 31 ko, 5,9 M par semaine). `TanStack/hotkeys` (738 étoiles, créé le 2026-01-21, `@tanstack/react-hotkeys` 0.13.0) est trop jeune. Un hook maison de 30 lignes reste une option sans dépendance.
- **Limite honnête** : il pilote surtout par la conversation avec Claude (DIAGNOSTIC.md : 14 messages sur 929 parlent du dashboard). La palette et les raccourcis améliorent le clic, pas son mode de travail principal : valeur moyenne, pas haute.
- **Sources** : https://github.com/dip/cmdk ; https://github.com/timc1/kbar ; https://github.com/JohannesKlauss/react-hotkeys-hook ; https://github.com/TanStack/hotkeys

### 3.3 Notifications, tiroir (rang 2, à rattacher à Base UI)

- **Sonner** : `emilkowalski/sonner` 13 025 étoiles, MIT, 2.0.8, dernier envoi 2026-08-10, peer `^18 || ^19`, 174 ko dépaqueté, 63,5 M par semaine.
- **Toast shadcn sur Base UI** (juillet 2026) : actions, statuts, promesse, empilement, glisser pour fermer ; installation `shadcn add toast` (annonce lue). Base UI avait déjà un Toast depuis avril 2025 (alpha) et la 1.4.0 permet de mettre à jour une notification par identifiant.
- **Choix** : si le socle est shadcn sur Base UI, utiliser le Toast officiel (une dépendance de moins, même style) ; sinon Sonner. Les deux conviennent pour « Rangé dans Demain 14h : Annuler ».
- **Vaul** : non maintenu (README), 8 631 étoiles, version 1.1.2, dernier envoi 2025-10-03, 46,6 M par semaine (héritage des installations shadcn). Ne pas l'utiliser pour du code neuf ; le Drawer de Base UI le remplace.

### 3.4 Animation de liste et chiffres (rangs 8 et 14)

- **NumberFlow** : `barvian/number-flow` 7 733 étoiles, MIT, `@number-flow/react` **0.6.2** (0.x), peer React `^18 || ^19`, 25 ko dépaqueté, dernier envoi 2026-09-20. Anime les chiffres (props citées au README : `format`, `trend`, `transformTiming`) ; support SSR et accessibilité non lus. Usage : compteur « 12 à ranger » qui décroît, « 3 h 20 libres contre 4 h estimées » du rituel du matin. Motion+ propose `AnimateNumber` (payant) : inutile.
- **AutoAnimate** : `formkit/auto-animate` 13 926 étoiles, MIT, 0.10.0 (0.x), 59 ko dépaqueté, **dernier envoi 2026-07-10** (trois mois, ralentissement), aucune peer React déclarée. Anime l'ajout, le retrait et le déplacement dans une liste en une ligne. Fait doublon avec les transitions de layout de Motion : choisir l'un ou l'autre par zone (AutoAnimate pour « À ranger » et les mails, Motion pour l'agenda), ou n'utiliser que Motion pour limiter les dépendances.

### 3.5 Dates : saisie naturelle et sélecteur (rangs 9 et 11)

- **chrono-node** : `wanasit/chrono` 5 291 étoiles, MIT, 2.10.2, dernier envoi 2026-10-04, aucune dépendance ni peer, 2,5 M par semaine, **2,8 Mo dépaqueté** (toutes les langues ; n'importer que le français). **Le français est pris en charge** (README : `chrono.fr.parseDate('demain à 14h')`) ; option `forwardDate` pour que « vendredi » désigne le prochain ; analyseurs et raffineurs personnalisables. Il ne lit ni durées ni catégories (« pendant 1h », « révision FM ») : à ajouter par un analyseur maison. Piège : ambiguïtés (« vendredi » un samedi, heures sans « h »).
- **react-day-picker** : la page GitHub affiche 6,9 k étoiles, MIT, « compatible React 16.8 et plus » ; 55,8 M par semaine ; le composant `Calendar` de shadcn est construit dessus (changelog de juin 2025). Dernier envoi non lu (API refusée). Suffisant pour un sélecteur de date ; ne remplace pas l'agenda.

### 3.6 Graphiques (rang 12)

- **Recharts** : `recharts/recharts` 27 615 étoiles, MIT, **3.10.1**, dernier envoi 2026-10-07, peer React 16.8 à 19 et `react-is`, 11 dépendances, 7,5 Mo dépaqueté, 71,3 M par semaine. Le composant `Chart` de shadcn est passé à Recharts 3 : la doc demande `var(--chart-1)` au lieu de `hsl(var(--chart-1))`, une hauteur explicite sur `ChartContainer`, et pour React 19 un remplacement (`override`) de la dépendance `react-is` (note de la doc shadcn « Next.js 15 + React 19 », à relire pour la version actuelle).
- **visx** : `airbnb/visx` 21 075 étoiles, MIT, `@visx/shape` 4.0.0, peer React 18 ou 19, dernier envoi 2026-06-22. Briques bas niveau : utile pour une pièce sur mesure (mini-courbes, carte de chaleur de la semaine) sans le poids de Recharts.
- **Tremor** : écarté. `tremorlabs/tremor` 3 650 étoiles, Apache-2.0, dernier envoi 2025-10-10 ; le paquet `@tremor/react` 3.18.7 déclare une peer React **18 seulement**, donc en conflit avec React 19 ; Vercel l'a racheté en janvier 2025 et une version de nouvelle génération (React 19, Tailwind 4) était annoncée en bêta en décembre 2024, mais je n'ai pas trouvé de preuve qu'elle soit sortie sur npm. https://vercel.com/blog/vercel-acquires-tremor
- **Kibo UI Contribution Graph** : carte de chaleur à la GitHub (tâches faites par jour), à copier (voir 5.6).
- **Valeur ici** : un seul écran de bilan hebdomadaire (quotas tenus, heures par catégorie) justifie un graphique ; sinon des barres en CSS suffisent. Pas de graphique sur le cockpit.

### 3.7 Calendriers : à ne pas installer, à regarder

| Candidat | Étoiles | Dernier envoi | Version | Licence | Peer React | Remarque |
|---|---|---|---|---|---|---|
| Schedule-X | 2 596 | 2026-10-07 | `@schedule-x/react` 4.1.0 | MIT (cœur) | 16.7 à 19 | Glisser, redimensionner, mode sombre ; **payant** : Resource Scheduler, Gantt, glisser pour créer, modale d'événement interactive (prix non lu) |
| FullCalendar | 20 670 | 2026-10-06 | `@fullcalendar/react` 7.1.1 | MIT | 17 à 19 + `temporal-polyfill` | 1 138 tickets ouverts ; 1,2 Mo ; les modules d'agenda de ressources sont payants dans les versions précédentes (v7 non vérifiée) |
| react-big-calendar | 8 760 | 2026-06-01 | 1.20.0 | MIT | 16.14 à 19 | 1,77 Mo ; dernier envoi il y a quatre mois |
| Planby | 1,7 k (page) | non lu | 2.1.0 | « Custom License, tous droits réservés » | 19 ou plus | Glisser-déposer, redimensionnement et vues semaine/mois réservés à la version PRO ; 4 672 téléchargements par semaine : écarté |

- **Conclusion identique à RECHERCHE.md** : l'agenda 5 jours sur mesure distingue plages et tâches ; aucune de ces bibliothèques ne modélise « blocs de tâches successifs dans une plage ». Les installer ferait perdre la pièce la plus personnelle. Les regarder comme références de rendu (états des blocs, mode sombre, chevauchements) seulement.
- **Sources** : https://github.com/schedule-x/schedule-x ; https://schedule-x.dev/ ; https://github.com/fullcalendar/fullcalendar ; https://github.com/bigcalendar/react-big-calendar ; https://github.com/karolkozer/planby

## 4. Typographie

- **Geist** (à garder) : `vercel/geist-font` 3 635 étoiles, OFL-1.1, dernier envoi 2026-07-14. Trois familles : Geist Sans, Geist Mono, **Geist Pixel** (affichage pixel, cinq variantes de style). Paquet npm `geist` 1.7.2 (peer `next >= 13.2`, 8 Mo dépaqueté), 3,1 M par semaine ; alternative `@fontsource-variable/geist` 5.3.0 (OFL-1.1). Axes variables et fonctions OpenType (chiffres tabulaires) : non lus sur la page, à vérifier avant de les promettre.
- **Mona Sans** (option) : `github/mona-sans` 4 168 étoiles, OFL-1.1, dernier envoi 2026-09-29. Police variable à **quatre axes** : graisse 200 à 900, **largeur 75 à 125 %**, italique, taille optique ; 10 jeux stylistiques ; compagnon Hubot Sans. Idée à tester : jouer sur l'axe de largeur pour les libellés denses de l'agenda (étroit) et le logotype (large). Aucun avis d'usage trouvé : ANECDOTIQUE.
- **Inter** : `rsms/inter` 19 953 étoiles, OFL-1.1, **dernier envoi 2024-11-19** ; le README lu annonce Inter Display « en préparation » (bêta). Choix de Linear pour les titres selon RECHERCHE.md ; projet au ralenti, à ne pas recommander pour un nouveau projet sans vérifier la version.
- **Satoshi / General Sans** (Fontshare) : hors GitHub ; licence et droits d'auto-hébergement **non vérifiés** (pages inaccessibles à la lecture). Ne pas les adopter avant d'avoir lu la licence.
- **shadcn/typeset** (juillet 2026) : un fichier CSS de typographie pour le HTML et le markdown rendu (taille, interligne, flux par propriétés CSS) : utile pour afficher les mails ou le bilan.

## 5. Kits de composants animés : pour copier une idée, jamais comme fondation

| Kit | Étoiles | Dernier envoi | Licence | Constat |
|---|---|---|---|---|
| Magic UI | 22 486 | 2026-10-05 | MIT | 80+ composants ; compatibilité React 19, Tailwind 4, Next 16 non indiquée sur la page lue |
| React Bits | 48 614 | 2026-10-07 | MIT + Commons Clause | 200+ éléments surtout textes animés, fonds et micro-interactions ; la clause interdit de revendre le logiciel tel quel, licence non OSI |
| Aceternity UI | environ 3,2 k (source secondaire) | non lu | MIT (gratuit), tarif Pro payant | 100+ composants gratuits, inscrit à l'annuaire shadcn (@aceternity) ; effets marketing |
| Animate UI | 4 367 | 2025-12-31 | MIT (page du dépôt) | Basé sur Radix ; dernier envoi il y a neuf mois |
| Motion Primitives | 6 478 | 2026-09-28 | MIT | « Beta » d'après RECHERCHE.md (non relu ici) |
| coss UI (ex Origin UI) | 10 669 | 2026-10-07 | mixte : `apps/ui` et `apps/origin` en MIT, **le reste en AGPL-3.0** | Design system de Cal.com sur Base UI ; Origin UI conservé comme instantané « legacy » |
| DiceUI | 2 084 | 2026-10-02 | MIT | « Composants shadcn accessibles » ; contenu non lu |
| Kibo UI | 3 958 | 2026-05-04 | MIT | Voir 5.1 |

### 5.1 Ce qui vaut vraiment d'être copié

- **Magic UI** parmi 80+ composants, quatre ou cinq ont un sens ici : Animated List (apparition d'éléments successifs), Number Ticker (chiffres), Blur Fade (entrée), Animated Circular Progress Bar (quota), Interactive Hover Button et Shimmer Button (états de bouton). La plupart (Meteors, Globe, Particles, Marquee, Warp Background) sont des effets de page d'accueil sans usage dans un outil de travail et heurtent la règle « aucun pictogramme décoratif ».
- **React Bits** : même constat, avec en plus une licence qui n'est pas du MIT pur.
- **coss UI** : à regarder pour des composants Base UI déjà stylés ; avant de copier, vérifier dans quel dossier se trouve le code (MIT ou AGPL-3.0). Un fichier AGPL copié dans un projet privé pose un problème de licence si le service est exposé en ligne.
- **Kibo UI** (site : www.kibo-ui.com/components) : Calendar, **Gantt**, **Kanban**, List, Table (gestion de projet) ; Mini Calendar, Combobox, Choicebox, Tags (formulaires) ; **Contribution Graph**, Status, **Relative Time**, Pill, Theme Switcher, Tree, Dialog Stack, Color Picker. Le README précise que les composants enveloppent des bibliothèques headless existantes : lire le code pour voir lesquelles avant d'ajouter. Dernier envoi en mai (cinq mois), compatibilité non lue.
- **Règle d'usage** (cohérente avec RECHERCHE.md, 11 et 12) : copier le code d'un composant, le relire, supprimer ce qui sert l'effet, ne pas dépendre du dépôt.

## 6. Listes awesome, gabarits et modèles de fonctionnalités

### 6.1 Listes à lire (et ce qu'elles valent)

| Dépôt | Étoiles | Dernier envoi | Licence | Valeur ici |
|---|---|---|---|---|
| VoltAgent/awesome-design-md | 119 899 (créé le 2026-03-31) | 2026-10-05 | MIT | **Forte** : 73+ fichiers DESIGN.md (analyses de chartes de marques) |
| birobirobiro/awesome-shadcn-ui | 20 620 | 2026-10-05 | MIT | Forte : écosystème shadcn trié (registres, kits) |
| enaqx/awesome-react | 74 810 | 2026-09-04 | aucune | Faible : trop généraliste |
| brillout/awesome-react-components | 48 558 | 2026-01-26 | CC0-1.0 | Faible : huit mois sans envoi |
| anthropics/skills | 180 021 | 2026-10-05 | non déclarée | Moyenne : contient le skill `frontend-design` |
| nextlevelbuilder/ui-ux-pro-max-skill | 133 766 (créé le 2025-11-30) | 2026-10-03 | MIT | Moyenne, à risque (voir 6.2) |
| vercel-labs/agent-skills | 32 036 | 2026-08-28 | non déclarée | Moyenne : skill de transitions de vue |
| wilwaldon/Claude-Code-Frontend-Design-Toolkit | 1 173 | 2026-04-11 | non déclarée | Index utile, petit |

- **awesome-design-md** : chaque fichier DESIGN.md a neuf sections (atmosphère, rôles des couleurs, typographie, composants avec états, mise en page, profondeur, à faire et à ne pas faire, comportement responsive, guide de prompt), à poser à la racine du projet et à référencer dans un prompt. Marques notables lues : Linear, Vercel, Raycast, Cal.com, Notion, Superhuman, Arc, Stripe, Supabase. **Critique** : la description du dépôt parle d'analyses de chartes de marques, donc non officielles ; la popularité (120 000 étoiles en six mois) est celle d'un phénomène de mode. Utile comme matière à prompts pour la section « charte », pas comme autorité, et on ne reproduit pas la charte d'une marque pour l'identité de Thibaut.
- **awesome-shadcn-ui** et l'annuaire officiel (https://ui.shadcn.com/r/registries.json) : pour trouver un registre précis (graphiques : @evilcharts, @axicharts, @bklit ; tableaux de bord : @dashboardblocks, @dashboardcn ; animation : @animate-ui, @aceternity, @easeui ; sélecteurs de date : @dsikeres1). Je n'ai pas évalué chaque registre.

### 6.2 Skills de design pour Claude Code (lien avec ses saves Instagram)

- Les saves parlent d'« un skill de direction artistique ». Trois candidats réels sur GitHub : `frontend-design` d'Anthropic (dans `anthropics/skills`), `ui-ux-pro-max-skill` (133 766 étoiles) et le skill de transitions de vue de Vercel.
- **Lecture du skill `frontend-design`** (fichier SKILL.md lu) : 1 à 2 familles de polices choisies avec intention, 4 à 6 couleurs nommées ancrées dans le sujet, mouvement réservé à quelques moments orchestrés (pas de fondu glissé partout), éviter les cartes arrondies identiques à ombre douce, les libellés espacés en majuscules et le « chrome SaaS générique », laisser un seul élément mémorable. C'est cohérent avec la retenue de Linear et avec ses critiques (« très basique »).
- **ui-ux-pro-max-skill** : livre 79 styles de recherche (dont glassmorphism, claymorphism, neumorphism), 192 palettes, 74 couplages de polices, 22 piles techniques ; s'installe par un paquet npm global (`ui-ux-pro-max-cli`) puis `uipro init`, et exécute des scripts Python locaux (le README dit : bibliothèque standard seule, sans appel réseau). **Critique** : popularité massive mais jeune (sept mois), et son catalogue de styles pousse vers des esthétiques à la mode qui contredisent la sobriété visée. Ne pas l'installer sans lire le SKILL.md et les scripts ; il a déjà dans cette installation `ecc:frontend-design-direction`, `ecc:design-system`, `ecc:make-interfaces-feel-better`, `ecc:motion-foundations`, `ecc:taste` (liste des skills du système) : le gain marginal est faible.
- **Prudence** (reprise de RECHERCHE.md, 13) : ne pas installer un dépôt reçu en message privé après un « commente pour recevoir ».
- **Sources** : https://github.com/anthropics/skills ; https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md ; https://github.com/nextlevelbuilder/ui-ux-pro-max-skill ; https://github.com/wilwaldon/Claude-Code-Frontend-Design-Toolkit ; https://github.com/vercel-labs/agent-skills

### 6.3 Modèles de fonctionnalités : applications de planification ouvertes

- **Super Productivity** (`super-productivity/super-productivity`) : 22 603 étoiles, MIT, dernier envoi 2026-10-07, 1 508 tickets ouverts. « Liste de tâches avancée avec timeboxing et suivi du temps » ; vue Schedule (frise de la journée avec les événements de calendrier) ; modes focus Pomodoro, Flowtime et compte à rebours ; sous-tâches, projets, étiquettes. Code lisible comme référence de comportement (comment une tâche s'intègre à une plage), sous licence MIT. Source : https://github.com/super-productivity/super-productivity
- **Open Sunsama** (`ShadowWalker2014/open-sunsama`) : **84 étoiles seulement**, créé le 2026-01-29, dernier envoi 2026-09-30, licence personnalisée non commerciale (usage personnel permis, entreprises à contrat). Intérêt : il fait exactement ce que fait Thibaut, piloter un planificateur par Claude. Fonctions : kanban des jours, blocs de temps par glisser, mode focus avec minuteur, report automatique du non terminé, palette ⌘K, estimations ; pile React 19, Vite, TanStack, Tailwind, Radix, Hono, Postgres ; **24 outils MCP** (tâches, blocs, événements, sous-tâches, profil), authentification OAuth 2.1 avec PKCE. À lire comme modèle de **conception des outils côté Claude** (quels verbes exposer : lister, créer, prioriser, bloquer, clore), pas comme dépendance ni comme source de code à copier (licence). ANECDOTIQUE comme popularité, SOLIDE comme idée.
- **Lecture croisée avec DIAGNOSTIC.md** : le report automatique du non terminé (Open Sunsama) et la vue Schedule (Super Productivity) correspondent aux principes « tout élément a une fin de vie » et « l'agenda est la surface principale ».

### 6.4 Gabarits de tableau de bord (preuve d'usage de la pile)

- **Kiranism/next-shadcn-dashboard-starter** : 7,1 k étoiles (page GitHub, API refusée), MIT, dernier envoi non lu. README : **Next 16, React 19, Tailwind 4**, shadcn sur **Base UI**, palette `kbar`, plus de six thèmes avec sélecteur, kanban glisser-déposer (**dnd-kit** et Zustand), tableaux, TanStack Query, `nuqs` pour l'état dans l'URL, fichiers `AGENTS.md` et `CLAUDE.md`. C'est la preuve la plus proche d'une compatibilité réelle de la combinaison visée ; il montre aussi que dnd-kit et kbar y tournent. Il embarque Clerk (authentification, facturation) qui n'a rien à faire ici. https://github.com/Kiranism/next-shadcn-dashboard-starter
- **satnaing/shadcn-admin** : 15,6 k étoiles (page), MIT ; Vite, TanStack Router, Radix, Lucide et Tabler, barre latérale, recherche globale, RTL. Pile différente (pas Next), utile pour le rendu du rail et de la palette. https://github.com/satnaing/shadcn-admin
- **Cal.com** (via coss) : design system d'un produit d'agenda, référence de rendu pour les créneaux.

## 7. Transitions de vue React : alternative à surveiller, pas à prendre

- La doc Next 16.4 (mise à jour le 2026-09-10) présente `<ViewTransition>` de React (morphing d'éléments partagés, révélations Suspense, glissements directionnels, fondus dans une même route) sans configuration dans l'App Router, mais précise que le composant et `addTransitionType` sont livrés avec **React 19.3**. Le projet est en 19.2.8 : il faudrait mettre React à niveau.
- Un ticket du dépôt React (#37614, 2026-09-12, non confirmé) signale que les animations d'entrée et de sortie par classe ne s'activent pas pendant la navigation Next 16 (seul le mode « name » fonctionne). Fonctionnalité donc encore fragile.
- Les `<ViewTransition>` ne s'activent que par Transition, Suspense ou `useDeferredValue` (pas par un simple `setState`) : l'animation d'un bloc qui change de taille par glissement reste le travail de Motion. Les deux ne s'excluent pas.
- Source : https://nextjs.org/docs/app/guides/view-transitions ; https://github.com/react/react/issues/37614

## 8. Matrice de compatibilité (pile du projet : React 19.2.8, Next 16.3.5, Tailwind 4)

| Paquet | Version npm | Peer React déclaré | Preuve pour Next 16 / Tailwind 4 | Dépaqueté |
|---|---|---|---|---|
| motion | 14.0.0 | ^18 \|\| ^19 | ticket Turbopack limité à motion-plus ; reste non testé ici | 751 ko |
| @base-ui/react | 1.8.0 | ^17 \|\| ^18 \|\| ^19 | utilisé par le gabarit Next 16 | 9,6 Mo |
| radix-ui | 1.7.0 | 16.8 à 19 | maintenu à parité par shadcn | 106 ko (43 dépendances) |
| sonner | 2.0.8 | ^18 \|\| ^19 | non lue | 174 ko |
| cmdk | 1.1.1 | ^18 \|\| ^19 | tickets React 19 fermés | 82 ko |
| kbar | 1.0.0 | 17 à 19 | utilisé par le gabarit Next 16 | 613 ko |
| @dnd-kit/react | 0.5.0 | ^18 \|\| ^19 | gabarit Next 16 utilise @dnd-kit/core 6.3.1 (ancien) | 240 ko |
| @atlaskit/pragmatic-drag-and-drop | 4.0.0 | aucune | indépendant de React | 486 ko |
| @formkit/auto-animate | 0.10.0 | non déclarée | non lue | 59 ko |
| @number-flow/react | 0.6.2 | ^18 \|\| ^19 | non lue | 25 ko |
| react-hotkeys-hook | 5.3.3 | >=16.8 | non lue | 31 ko |
| chrono-node | 2.10.2 | aucune | indépendant de React | 2,8 Mo |
| recharts | 3.10.1 | 16.8 à 19 (+ react-is) | shadcn : remplacer react-is pour React 19 | 7,5 Mo |
| lucide-react | 1.52.0 | 16.5.1 à 19 | non lue | 35,6 Mo |
| @tremor/react | 3.18.7 | ^18 seulement | **conflit React 19** | 494 ko |
| planby | 2.1.0 | >=19 | licence propriétaire | 602 ko |

Tailwind 4 : les bibliothèques sans style (Base UI, Motion, cmdk, dnd) n'en dépendent pas ; seuls shadcn et les kits copiés produisent des classes. Déclaré = non testé ici.

## 9. Ce que je recommanderais, dans l'ordre

Noyau très recommandé (consensus, un seul effort d'intégration) :
1. **shadcn avec Base UI** sur une branche, préréglage **Rhea** comme point de départ (densité), puis retouche des jetons. Ne rien garder du préréglage sans l'avoir confronté à la charte Graphite.
2. **Jetons OKLCH** dans `@theme` (échelle de 12 étapes inspirée de Radix Colors) : prérequis des chartes combinables.
3. **Motion** (`m` + `LazyMotion`, épinglé) pour les blocs successifs et les états de bouton ; `prefers-reduced-motion` respecté.
4. **Lucide** pour les icônes fonctionnelles.
5. **Toast et Drawer de Base UI** (ou Sonner) pour « Annuler » et le détail sans quitter l'agenda.

Ajouts ciblés (solides, dans cet ordre) :
6. **pragmatic-drag-and-drop** pour glisser « À ranger » vers l'agenda ; prototyper d'abord avec le `drag` de Motion si l'on veut zéro dépendance, en sachant que la durée par poignée reste à écrire.
7. **cmdk** (`Command` de shadcn) ou **kbar** ; **react-hotkeys-hook**.
8. **NumberFlow** pour le rituel du matin ; **chrono-node (fr)** plus un analyseur de durée maison pour la saisie.
9. **Recharts** via `Chart` de shadcn, un seul écran de bilan hebdo.

À lire, pas à installer : awesome-design-md (matière de charte), Super Productivity (comportements), Open Sunsama (conception des outils pour Claude), Kibo UI (Contribution Graph, Mini Calendar, Gantt, Relative Time), Magic UI (quatre composants).

À écarter : Tremor (conflit React 19, projet ralenti), Planby (licence propriétaire), Vaul (non maintenu), @hello-pangea/dnd (listes seulement), react-spring (doublon de Motion), react-big-calendar, FullCalendar et Schedule-X (perte de la distinction plage / tâche), Hugeicons (réorganisation), React Bits et Aceternity en fondation, Motion+ (payant, couvert par le gratuit), Inter pour un nouveau choix (dernier envoi fin 2024), l'installation de ui-ux-pro-max-skill sans lecture préalable.

## 10. Critique : où cette recherche peut tromper

- **Popularité contre pertinence** : 120 000 étoiles pour une liste de fichiers de style ou 48 000 pour un kit d'effets ne disent rien de leur utilité dans un outil de travail dense. Le critère retenu est l'effet sur l'agenda et « À ranger ».
- **Risque d'effet** : presque tous les kits listés produisent des effets visuels ; la valeur de ce dashboard est la densité lisible (RECHERCHE.md, 22). Les propositions « beaucoup plus avancées » devraient se faire sur la précision (états, alignement, rythme) avant l'effet.
- **Pile jeune** : Motion 14.0.0 a cinq jours, Base UI est en 1.x depuis décembre 2025, `@dnd-kit/react` et NumberFlow sont en 0.x, kbar en 1.0.0. Tout cela demande une branche d'essai et des versions épinglées.
- **Chiffres relus par un résumeur de page** (WebFetch) : valeurs exactes recopiées depuis le JSON de l'API quand elle répondait, mais une erreur de lecture reste possible ; à vérifier avant de citer dans un document externe.
- **Ce qui n'a pas pu être lu** : prix de Schedule-X, licences Fontshare, détail de Vega, Nova, Maia, Lyra et Mira, support SSR et accessibilité de NumberFlow, axes variables de Geist, compatibilité de Magic UI et de Kibo UI avec React 19 et Tailwind 4, dernière activité de react-day-picker et des deux gabarits de dashboard.
