# Recherche design haut de gamme pour interfaces sombres de productivité (2026-10-07)

Angle : règles chiffrées et exemples à imiter pour le dashboard de Thibaut (Cockpit sombre, agenda 5 jours, « À ranger »). Ce document complète `RECHERCHE.md` (qui couvre les bibliothèques : Motion, shadcn, cmdk, Sonner, dnd) et ne le recopie pas. Les pages ont été lues le 2026-10-07 ; les dates sont celles des pages quand elles en affichent une.

## 0. Limites et niveau de preuve (à lire d'abord)

- **Illisibles par l'outil** (pages rendues en JavaScript) : Apple HIG (motion, app icons), Material 3 (pages de specs), Material 2 (sound). Je ne cite donc **aucun chiffre Apple HIG** ; pour Material j'ai pris les jetons dans le dépôt officiel `material-components-android` (GitHub), qui est lisible.
- **Le texte de Rauno Freiberg** (« Invisible details of interaction design ») est volontairement sans chiffres : il donne des principes (interruptibilité, continuité spatiale, entrée implicite), pas des durées. Je l'utilise comme principe, pas comme source de valeurs.
- **Les « DESIGN.md » de Raycast et de Vercel** (dépôts `awesome-design-md`, `design-bites`) sont des descriptions **rétro-ingéniérées par des tiers**, pas des documents officiels. Je les marque « tiers ». Ils valent comme ordre de grandeur, pas comme vérité.
- **Les blogs « tendances 2026 »** (bento, grain, mesh gradients, dark mode par défaut) sont des articles de studios et d'agences : opinions et marketing, aucune mesure. Je les classe anecdotiques.
- Les chiffres de contraste des sections 3.2 et 3.3 sont **calculés par moi** (script local, formules WCAG 2 et APCA 0.0.98G, vérifié sur des valeurs connues : blanc sur noir Lc -107,9, noir sur blanc Lc 106,0). Ce sont des mesures, pas des opinions.
- Niveaux : **[consensus]** = plusieurs sources indépendantes ou une source normative ; **[source unique]** = une source sérieuse ; **[anecdotique]** = opinion ou marketing.

## 1. Le verdict en 9 règles (ce que je ferais)

1. **L'élévation en sombre se fait par la luminosité des surfaces, pas par les ombres** [consensus]. Échelle de 4 à 5 surfaces espacées d'environ 0,035 à 0,055 en luminosité OKLCH (L), plus des filets d'un pixel.
2. **Le texte secondaire de la charte actuelle est trop pâle** [mesure] : `--text-muted` `#9aa2af` sur `#15181d` donne WCAG 6,9 (réussi) mais **APCA Lc 50**, sous le Lc 60 recommandé pour du texte de contenu et le Lc 75 minimum pour du corps de texte. À relever (sections 3.2 et 3.3).
3. **Une couleur d'accent, utilisée avec parcimonie ; les catégories de l'agenda en palette sûre pour le daltonisme, avec un second codage par la forme** [consensus].
4. **Couleurs définies en OKLCH par rôle** (échelle de 12 rôles à la Radix, thème généré par 3 variables à la Linear) [consensus] ; Tailwind 4, déjà utilisé, a sa palette en OKLCH depuis le 2025-01-22.
5. **Mouvement : moins de 300 ms, ease-out, et zéro animation pour les gestes répétés des dizaines de fois par jour** (ranger, cocher, déplacer un bloc) [consensus]. Les ressorts sont réservés au glisser et aux éléments qui apparaissent rarement.
6. **Rayons concentriques** : rayon extérieur = rayon intérieur + marge. Échelle proposée 6 / 10 / 16 px avec marges de 4 et 6 px (section 5).
7. **Verre (backdrop-filter) uniquement sur les couches flottantes** (palette Ctrl+K, popovers, toasts), jamais sur l'agenda ni les cartes [source unique + critiques solides].
8. **Pas de grain, pas de rayon de lumière animé, pas de sons, pas d'haptique** sur un tableau de bord utilisé 10 heures par jour : bénéfice non démontré, coût réel (CPU, fatigue) [anecdotique].
9. **Offrir un thème clair pour la lecture longue (mails)** : l'étude NN/g (2020) trouve de meilleures performances de lecture en mode clair pour la majorité des vues normales, et l'écart grandit quand le texte est petit [source unique].

## 2. Profondeur, élévation, verre, grain, dégradés, filets

### 2.1 Élévation sombre [consensus]

- Principe : une ombre ne peut pas être plus sombre qu'un fond déjà presque noir ; on exprime la hauteur en éclaircissant la surface. Revue de plusieurs guides 2025-2026 (uxmagic, muz.li, eleken) : surfaces de `#121212` à `#1E1E1E`, pas de noir pur, texte pas blanc pur. Le chiffre « +5 à +8 % par couche » vient de ces blogs [anecdotique pour le chiffre, consensus pour le principe].
- Ce que fait Raycast (description tiers, https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/raycast/DESIGN.md) : canevas `#07080a`, surfaces `#0d0d0d`, `#101111`, `#121212`, **aucune ombre portée**, filets `rgba(255,255,255,0.08)` (discret) et `rgba(255,255,255,0.16)` (fort), accent unique bleu `#57c1ff`, hauteur des boutons 36 px, rayon 8 px.
- Ce que fait Linear : borders arrondies et contraste adouci, moins de séparateurs, barre latérale plus sombre que la zone de contenu, gris plus chauds qu'avant (refonte du 2026-03-12, https://linear.app/now/behind-the-latest-design-refresh).
- Ta charte Graphite actuelle : fond L 0,258, surface L 0,312 (donc un saut de 0,054, dans la bonne zone). La version Studio `graphite` sombre (`#0e1013`, `#15181d`, `#1d2128`) a des sauts de 0,036 puis 0,035.
- Recette pour les couches flottantes (là où une ombre reste visible, ex. palette, popover) : au moins **deux couches d'ombre** (Vercel Web Interface Guidelines, https://github.com/vercel-labs/web-interface-guidelines) ; la méthode de Josh Comeau (https://www.joshwcomeau.com/css/designing-shadows/) : 5 couches dont décalage et flou doublent à chaque couche (1, 2, 4, 8, 16 px), opacité répartie (environ 0,33 par couche en élévation moyenne, 0,2 en haute), ombre teintée de la teinte du fond au lieu de noir pur, décalage vertical = 2 fois l'horizontal. Pour une interface sombre, ajoute un filet de lumière en haut (voir 2.5).

### 2.2 Verre

- Apple WWDC25 « Meet Liquid Glass » (https://developer.apple.com/videos/play/wwdc2025/219/ , 2025) : verre réservé à la **couche de navigation flottante**, jamais sur le contenu ; **pas de verre sur du verre** ; ne pas mélanger les variantes Regular et Clear ; teinter seulement l'action principale. Le système respecte « Réduire la transparence », « Augmenter le contraste », « Réduire les animations ».
- Critiques de lisibilité du verre : plusieurs analyses de designers (Medium design-bootcamp, uxdesign.cc, 2025) [anecdotique mais convergent] : flou, translucidité et frontières subtiles réduisent le contraste.
- Recette web (Josh Comeau, https://www.joshwcomeau.com/css/backdrop-filter/) : `backdrop-filter: blur(16px)` en principal, `saturate()` entre 120 et 140 % pour éviter l'effet boueux, `brightness()` entre 90 et 110 % pour le contraste du texte ; support `backdrop-filter` 97 %+ ; pièges : bords qui « fuient » (le flou ne voit que les pixels derrière l'élément), scintillement en haut au défilement, `mask-image` cassé avec `border-radius`.
- Recommandation : verre sur la palette de commande, les popovers et les toasts, avec un repli opaque (`@supports not (backdrop-filter: blur(1px))`). Jamais sur les blocs de l'agenda.

### 2.3 Grain [anecdotique]

- Technique : SVG `feTurbulence`, `baseFrequency` 0,65, `numOctaves` 3, `fractalNoise`, mélange `multiply` (Jimmy Chion, CSS-Tricks, 2021-09-13, https://css-tricks.com/grainy-gradients/). Plus bas (0,3 à 0,5) : grain gros ; plus haut (0,7 à 1) : fin.
- Coût : calcul par pixel, lourd sur grandes surfaces et mobiles ; la méthode « contrast(170 %) brightness(1000 %) » écrase une large part des couleurs (remarque dans les commentaires de l'article).
- Avis : si tu en veux, une **tuile PNG de 128 px à 2-4 % d'opacité, fixe, sous le fond uniquement**, jamais sur du texte. Sur un outil ouvert 10 h par jour, je m'en passerais.

### 2.4 Dégradés [anecdotique]

- Raycast : un seul dégradé de marque en bandeau d'accueil (description tiers : `#ff5757` vers `#a1131a`). Linear : accent bleu utilisé avec retenue, apparence « plus neutre et intemporelle » (2024-03).
- Ta charte `nuit` a déjà deux `radial-gradient` en haut de page (violet 0,22 et cyan 0,12 d'opacité). C'est le bon dosage : **un halo statique, en haut, jamais derrière du texte dense**.

### 2.5 Filets de lumière

- Bord supérieur plus clair sur les éléments « en relief » (Refactoring UI, https://www.refactoringui.com/ ; Adam Wathan et Steve Schoger) : un `inset 0 1px 0 rgb(255 255 255 / 0.06)`. Ta charte `nuit` l'a déjà (0.06). Valeur raisonnable.
- « Border beam » (faisceau qui court sur la bordure ; Magic UI, https://magicui.design/docs/components/border-beam) : durée par défaut 6 s, taille 50. **À réserver à un seul objet** (ex. la tâche en cours, pendant un minuteur) sinon c'est du bruit. Mouvement perpétuel : à couper avec `prefers-reduced-motion`.
- Refactoring UI : « utiliser moins de bordures » ; les remplacer par un fond différent, une ombre ou plus d'espace.

## 3. Couleur sémantique et accessibilité

### 3.1 OKLCH et échelles par rôle [consensus]

- OKLCH : L de 0 à 1 (luminosité perçue stable d'une teinte à l'autre), C (chroma), H (0 à 360 ; rouge environ 20, jaune 90, vert 140, bleu 220, violet 320). Support dans tous les navigateurs récents en septembre 2025 (Evil Martians, https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl). Raison : changer la teinte ne casse plus le contraste, contrairement à HSL.
- Tailwind 4 (2025-01-22, https://tailwindcss.com/blog/tailwindcss-v4) : palette par défaut en OKLCH/P3, `@theme` dans le CSS, `color-mix(in oklab, ...)` pour les opacités, `@starting-style` pour animer l'apparition sans JavaScript.
- Radix Colors, 12 étapes par rôle (https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale) : 1-2 fonds d'application, 3-5 fonds de composant (normal, survol, pressé), 6-8 filets (discret, interactif, fort/anneau de focus), 9-10 fonds pleins, 11-12 texte ; les étapes 11 et 12 sont **garanties à APCA Lc 60 et Lc 90** sur le fond de l'étape 2. Radix prévient aussi : ne pas modifier ces échelles (on casse les garanties) ; ajouter ses propres échelles à côté.
- Vercel Geist (https://vercel.com/geist/colors) : 10 étapes par rôle, 1-3 fonds de composant (défaut, survol, actif), 4-6 bordures, 7-8 fonds à fort contraste, 9-10 texte et icônes (secondaire, primaire) ; deux fonds de page.
- Linear (2024-03-28, https://linear.app/now/how-we-redesigned-the-linear-ui) : passage de HSL à LCH ; **98 variables de thème ramenées à 3** (couleur de base, accent, contraste) ; la variable de contraste (de 30 à 100) génère aussi les thèmes à contraste élevé. Chantier de 6 semaines. Polices : Inter Display pour les titres, Inter pour le corps.
- Stripe (2019-10-15, https://stripe.com/blog/accessible-color-systems) : même logique en CIELAB ; deux couleurs séparées de 5 niveaux passent WCAG pour le petit texte, 4 niveaux pour les grands textes et icônes.
- Application : **12 jetons par rôle générés depuis 3 variables (teinte de base, accent, contraste)** = un seul curseur « contraste » pour tout le site, et le Studio peut basculer de charte en changeant 2 nombres.

### 3.2 Audit chiffré de tes jetons (calcul de ma part)

| Paire (charte Graphite) | WCAG 2 | APCA Lc | Lecture |
|---|---|---|---|
| texte `#e8ebf0` sur fond prod `#202429` | 13,06 | 92 | très bon |
| accent `#7aa2ff` sur fond prod `#202429` | 6,27 | 51 | passe WCAG AA ; faible en APCA pour du texte |
| `--text-muted` `#9aa2af` sur `#15181d` | 6,91 | 50 | passe WCAG, sous Lc 60 (contenu) et Lc 75 (corps) |
| `--text-faint` `#7f8896` sur `#15181d` | 4,97 | 37 | limite WCAG (4,5), nettement sous APCA |
| `--border` `#272c34` sur `#0e1013` | 1,36 | 0 | décoratif seulement |
| `--border-strong` `#3a414d` sur `#0e1013` | 1,85 | 8 | **échoue 3:1** si c'est la seule frontière d'un champ ou d'un bouton |

Réserve honnête : APCA est la méthode **candidate** pour WCAG 3 (brouillon), pas la norme en vigueur ; la norme est WCAG 2.2 (texte 4,5:1 ; composants d'interface et objets graphiques 3:1, critère 1.4.11, https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html). Mais les auteurs d'APCA indiquent que le ratio WCAG 2 « surestime » le contraste des couleurs sombres, au point qu'un 4,5:1 peut être illisible près du noir (https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell.html). Seuils APCA : corps de texte Lc 90 préféré et Lc 75 minimum ; texte de contenu Lc 60 ; gros titres Lc 45 ; éléments non textuels Lc 30.

### 3.3 Échelle proposée (OKLCH, teinte 262, vérifiée par calcul)

| Rôle | OKLCH (L C) | hex calculé | Contraste mesuré |
|---|---|---|---|
| fond | 0,190 0,008 | `#121417` | |
| surface | 0,225 0,010 | `#191c21` | |
| surface 2 | 0,260 0,012 | `#21242a` | |
| filet discret | 0,300 0,014 | `#2a2e35` | 1,25 (décoratif) |
| filet de contrôle | 0,520 0,020 | `#636975` | 3,10 sur surface (passe 1.4.11) |
| texte discret | 0,720 0,018 | `#9ea5b0` | WCAG 6,9 ; Lc 52 : métadonnées, jamais du corps |
| texte secondaire | 0,790 0,018 | `#b4bbc6` | WCAG 8,8 ; Lc 64 |
| texte | 0,940 0,007 | `#e9ebf0` | WCAG 14,3 ; Lc 93 |
| accent (texte, liens) | 0,800 0,110, teinte 270 | `#a2baff` | WCAG 8,9 ; Lc 65 |

Écart de luminosité entre étages de surface : 0,035 (même ordre que ta Studio graphite). À rescaler si tu gardes le fond actuel à L 0,258 (il est nettement plus clair que ces valeurs). Mon avis : le fond actuel est un gris moyen-sombre ; avec une échelle de surfaces plus serrée et des textes relevés, il paraîtra plus « premium » sans changer de teinte.

### 3.4 Catégories de l'agenda (plages, tâches, autre)

- Palette Okabe-Ito, conçue pour tous les types de daltonisme (2002 ; page de référence de Jfly, https://jfly.uni-koeln.de/color/). Valeurs usuelles publiées : orange `#E69F00`, bleu ciel `#56B4E9`, vert bleuté `#009E73`, jaune `#F0E442`, bleu `#0072B2`, vermillon `#D55E00`, violet rougeâtre `#CC79A7` (valeurs relevées sur des pages de synthèse, pas sur la page de Jfly qui donne les noms). Pour 2 catégories : orange + bleu ; 3 : ajouter le vert bleuté.
- Règle de la même page : **codage redondant** (couleur + forme, trait, motif), étiquettes dans le graphique plutôt qu'une légende, éviter rouge/vert. Les Web Interface Guidelines de Vercel disent la même chose (ne jamais se fier à la couleur seule).
- Ton agenda a rose (cours), orange (tâches), bleu (autre) : le rose et l'orange sont confondables en vision deutan à faible luminosité. Proposition : **plages = bloc plein avec trait vertical de 3 px à gauche ; tâches = bloc à fond translucide avec contour en pointillés fins** ; la couleur devient un renfort, pas le seul signal.

### 3.5 Mouvement réduit

- `prefers-reduced-motion` : surtout gênants pour les troubles vestibulaires, les **zooms** et les **déplacements de grands objets** ; la règle MDN est « réduire, ne pas supprimer » : remplacer par une dissolution douce (https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion). Support depuis janvier 2020.
- Emil Kowalski : en mouvement réduit, **garder opacité et couleur, retirer les déplacements**.
- Animations en boucle de plus de 5 s : contrôle pause obligatoire (Vercel guidelines ; critère WCAG 2.2.2, norme connue mais page non relue aujourd'hui).

### 3.6 Cibles et focus

- WCAG 2.2 critère 2.5.8 : cible d'au moins **24 x 24 px CSS** ou espacement suffisant (https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). Vercel : 24 px visuel minimum, 44 px sur mobile ; entrée de formulaire mobile à 16 px minimum (sinon zoom iOS). Raycast (tiers) : boutons de 36 px.
- Anneau de focus visible sur tout élément focalisable, avec `:focus-visible`.

## 4. Typographie d'interface

- Linear : Inter Display (titres) + Inter (corps), 2024 [source unique mais vérifiée à la source].
- Échelle Raycast (tiers) : 12 px (graisse 400, interlettrage +0,4 px), 13 px (+0,1), 14, 16, 18, 20, 22, 24 px avec graisses 400 pour le corps et **500** pour les titres, interlignes 1,4 à 1,6 ; Inter avec `calt, kern, liga, ss03`.
- Ratio d'échelle pour un outil dense : 1,125 (seconde majeure) ou 1,2 (tierce mineure) ; entre 14 et 15 px côte à côte les niveaux ne se distinguent pas (guides de design systems : fourzerothree, Tessl ; **anecdotique pour le chiffre**, bon sens pour le principe).
- **Chiffres tabulaires** (`font-variant-numeric: tabular-nums`) sur les heures de l'agenda, les compteurs et les durées pour que les colonnes ne dansent pas [consensus, Vercel guidelines]. Espaces insécables dans « 10 min ». Points de suspension typographiques « … ».
- Alignement optique : corriger de ±1 px quand l'œil contredit la géométrie (Vercel).
- Mon avis : deux familles et une mono, pas plus. Pour le nom du produit, une police d'affichage (déjà traité dans `RECHERCHE.md`, recommandation 4).

## 5. Rayons et densité

- Règle concentrique : rayon extérieur = rayon intérieur + marge (guides Frontend Masters, PV21, ui-skills ; **consensus**). Apple en parle aussi côté Liquid Glass (« contrôles concentriques » dans la session WWDC25).
- Échelle Raycast (tiers) : 4, 6, 8, 10, 16 px. Pas de spacing : 2, 4, 8, 12, 16, 24, 32 px.
- **Proposition 6 / 10 / 16** : contrôle (6) + marge 4 = 10 pour la carte ; carte (10) + marge 6 = 16 pour le panneau. Les trois valeurs s'emboîtent sans calcul.
- `corner-shape: squircle` (courbe « iOS » ; se combine avec `border-radius`, qui garde la taille) : **Chromium 139+ confirmé** ; l'état Firefox et Safari est contradictoire dans les sources trouvées (une page parle de Firefox 160, version qui n'existe pas encore à la date d'aujourd'hui, donc non fiable). À vérifier sur caniuse avant usage ; sinon amélioration progressive avec `@supports (corner-shape: squircle)` (Smashing Magazine, 2026-03, https://www.smashingmagazine.com/2026/03/beyond-border-radius-css-corner-shape-property-ui/).
- Densité : Linear 2026 réduit icônes, supprime les fonds colorés d'icônes, **augmente la hiérarchie et la densité** de la navigation. Pour toi : icônes de rail plus petites, texte inactif atténué, un séparateur de moins par zone.

## 6. Mouvement : règles chiffrées

### 6.1 Durées et courbes (Emil Kowalski, skill officiel https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md ; articles https://emilkowal.ski/ui/you-dont-need-animations et https://emilkowal.ski/ui/great-animations) [consensus]

| Élément | Durée |
|---|---|
| Retour de bouton (pression) | 100 à 160 ms, `scale(0.97)` |
| Info-bulles, petits popovers | 125 à 200 ms |
| Menus déroulants, sélecteurs | 150 à 250 ms |
| Modales, tiroirs | 200 à 500 ms |
| Limite générale d'une animation d'interface | moins de 300 ms |

- Courbes : ease-out fort `cubic-bezier(0.23, 1, 0.32, 1)` pour entrées et interactions ; ease-in-out fort `cubic-bezier(0.77, 0, 0.175, 1)` pour déplacements à l'écran ; tiroir à la iOS `cubic-bezier(0.32, 0.72, 0, 1)`. **Jamais d'ease-in** (démarrage lent, sensation de lenteur). Les courbes CSS natives sont jugées trop faibles.
- Entrée : ne pas partir de `scale(0)` ; partir de 0,95 ou plus avec l'opacité. Origine de la transformation sur le déclencheur pour les popovers, au centre pour les modales.
- Cascade : 30 à 80 ms entre éléments d'une liste, décorative et non bloquante.
- Seuil de glissement : vélocité d'environ 0,11 px/ms pour fermer d'un geste.
- Animer seulement `transform` et `opacity` (60 fps, compositeur) ; éviter `height`, `width`, `margin`, `padding`.
- Survol : `@media (hover: hover) and (pointer: fine)`.

### 6.2 Règle de fréquence (la plus utile pour toi)

Emil Kowalski : plus de 100 fois par jour (raccourcis clavier, bascules) = **aucune animation** ; des dizaines de fois (survol, navigation) = supprimer ou réduire fortement ; occasionnel (modales, toasts) = animation normale ; rare (première utilisation, célébration) = on peut ajouter du plaisir. Raycast est cité comme exemple d'outil volontairement sans animation à l'ouverture.

- Pour ton site : **ranger une tâche, cocher, déplacer un bloc de l'agenda = geste très fréquent, donc 0 à 120 ms, sans rebond.** Rituel du matin, bilan du soir, première ouverture de la semaine = rares, donc on peut y mettre du soin.
- Nielsen (1993, https://www.nngroup.com/articles/response-times-3-important-limits/) : 0,1 s est perçu comme instantané ; 1 s est la limite de continuité de la pensée ; 10 s la limite d'attention. Vercel : afficher un indicateur de chargement après 150 à 300 ms, le garder au moins 300 à 500 ms pour éviter le clignotement ; écritures sous 500 ms.
- Superhuman vise 50 à 60 ms par interaction selon une étude tierce (blakecrosley.com) [anecdotique, non vérifié à la source Superhuman].

### 6.3 Ressorts

- **Jetons Material 3 Expressive** (dépôt officiel, https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md ; lancé en mai 2025 à Google I/O) :
  - ressorts **spatiaux** (position, taille, forme, rayon ; peuvent dépasser) : rapide amortissement 0,9 raideur 1400 ; défaut 0,9 et 700 ; lent 0,9 et 300 ;
  - ressorts **d'effets** (couleur, opacité ; jamais de dépassement) : rapide 1 et 3800 ; défaut 1 et 1600 ; lent 1 et 800.
  - Idée à retenir : un rebond sur la position, **jamais sur l'opacité ni la couleur** ; trois vitesses selon la taille de l'objet.
  - Les courbes classiques du même dépôt : standard `cubic-bezier(0.2, 0, 0, 1)`, accéléré `(0.3, 0, 1, 1)`, décéléré `(0, 0, 0, 1)` ; durées de 50 à 1000 ms par pas de 50.
  - Réserve : « 46 études, 18 000 participants, éléments repérés jusqu'à 4 fois plus vite » est une affirmation de Google rapportée par la presse, pas une mesure indépendante.
- Emil Kowalski, ressort style Apple : durée d'environ 0,5 s, rebond 0,1 à 0,3 (garder subtil), pour le glisser, l'élan et l'interruption.
- **CSS `linear()`** produit des ressorts en CSS pur (Josh Comeau, https://www.joshwcomeau.com/animation/linear-timing-function/) : support environ 88 % en octobre 2025, tous navigateurs majeurs depuis décembre 2023 ; 50 points rendent un ressort crédible ; 3 ressorts précis ajoutent environ 1,3 ko ; **limite** : une transition CSS interrompue raccourcit sa durée, ce qui détruit l'effet. Pour du glisser interruptible, garder une bibliothèque (Motion).
- **View Transitions** (même document) : « Baseline newly available » depuis Firefox 144 du 2025-10-14 (Chrome 111, Safari 18) ; utile pour le passage liste vers détail sans bibliothèque.

### 6.4 Exemple de réglage : le toast de Sonner

D'après son auteur (https://emilkowal.ski/ui/building-a-toast-component) : entrée **400 ms** en `ease`, décalage de 14 px par toast empilé, réduction d'échelle de 0,05 par rang, disparition automatique à 4 s, minuteur en pause quand l'onglet est caché, fermeture au glissement si distance suffisante ou vélocité supérieure à 0,11. Remarque critique : Emil recommande moins de 300 ms en général et fait ici une exception assumée (un toast est occasionnel) ; la règle de fréquence prime sur la règle de durée.

## 7. Sons et haptique : ce que disent les sources

- Sons [anecdotique, guides génériques] : désactivés par défaut dans un outil de productivité ; plus un son est fréquent, plus il doit être court, doux, discret ; la plupart des sons d'interface durent entre 80 et 300 ms, les confirmations 50 à 200 ms ; niveau « qu'on sente plutôt qu'on entende » ; commande de coupure toujours disponible. `use-sound` de Josh Comeau (https://www.joshwcomeau.com/react/announcing-use-sound-react-hook/) pèse moins de 1 ko.
- Family (Benji Taylor, 2024-07-08, https://benji.org/family-values) : sons et haptique réservés aux gestes rares ou significatifs (suppression), et « les moments de plaisir se concentrent dans les fonctions rarement utilisées ». Même logique que la règle de fréquence.
- Haptique web : Safari iOS n'a pas d'API de vibration ; une astuce avec `<input type="checkbox" switch>` (Safari 17.4+) fonctionne de iOS 17.4 à 26.4 ; **Apple l'a corrigée en iOS 26.5** (une seule impulsion possible) ; Firefox Android a retiré l'API (v129) ; aucun effet sur ordinateur (https://haptics-web.vercel.app/). Proposition WICG « Web Haptics » : **incubation précoce**, six effets prédéfinis (`hint`, `edge`, `tick`, `align`, `success`, `error`) (https://github.com/WICG/web-haptics).
- **Mon avis : à écarter.** Il pilote surtout depuis l'ordinateur et par la conversation. Son sur « jour terminé » en option si tu veux jouer, par défaut coupé.

## 8. Dix exemples précis à imiter

1. **Linear, refonte de mars 2026** (https://linear.app/now/behind-the-latest-design-refresh). À imiter : barre latérale **moins lumineuse** que le contenu, onglets compacts en pastilles à icône, icônes plus petites, texte inactif atténué, plus d'espace vertical entre éléments, bordures arrondies adoucies, gris plus chauds. Leçon de méthode : « si la plupart des gens ne remarquent pas ce qui a changé, c'est bon signe ». Un sélecteur de couleurs intégré (fait avec Claude Code) a servi à itérer sans passer par Figma : tu peux faire pareil avec ton Studio.
2. **Linear, thème généré par 3 variables** (https://linear.app/now/how-we-redesigned-the-linear-ui, 2024-03-28). À imiter : base, accent, contraste (30 à 100) ; un curseur de contraste pour l'accessibilité.
3. **Raycast** (description tiers : https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/raycast/DESIGN.md). À imiter : échelle de surfaces sans ombre, filets à 8 % et 16 % de blanc, un accent par thème, touches de clavier (`kbd`) en relief avec dégradé `#121212` vers `#0d0d0d` pour afficher les raccourcis. Mise en garde : description non officielle.
4. **Vercel Geist + Web Interface Guidelines** (https://vercel.com/geist/colors , https://github.com/vercel-labs/web-interface-guidelines). À imiter : chaque étape de couleur a un rôle ; liste de règles vérifiables (cible 24 px, `tabular-nums`, `color-scheme: dark`, délais de chargement 150-300 ms, 2 couches d'ombre minimum). C'est une checklist de revue, applicable telle quelle à ton code.
5. **Radix Colors** (https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale). À imiter : 12 rôles, contraste garanti à Lc 60 et Lc 90 pour les textes 11 et 12 sur fond 2 ; appariement « gris teinté » proche de la teinte d'accent pour la cohésion.
6. **Material 3 Expressive** (https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md). À imiter : séparation ressorts spatiaux / effets, trois vitesses, jetons nommés plutôt que valeurs éparpillées.
7. **Sonner** (https://emilkowal.ski/ui/building-a-toast-component). À imiter : empilement avec échelle et décalage, pause du minuteur, fermeture par geste à vélocité ; en pratique : le toast « Annuler » après chaque rangement.
8. **Things 3** (https://culturedcode.com/things/features/). À imiter : bouton « + » magique qui crée une tâche à l'endroit où on le dépose, liste « Aujourd'hui » qui fusionne événements du calendrier et tâches, section « Ce soir », recherche instantanée, animations « conçues avec une boîte à outils maison » ; Apple Design Award. C'est la référence du « beau sans surcharge ».
9. **Family** (https://benji.org/family-values). À imiter : tiroirs dont la hauteur varie pour signaler la progression, boutons dont le libellé se transforme (« Continuer » vers « Confirmer »), mouvement directionnel cohérent (balayage à gauche anime vers la gauche), plaisir concentré sur les fonctions rares. Plutôt inspirant que copiable : c'est une app mobile.
10. **Sunsama, rituel de fin de journée** (https://roadmap.sunsama.com/changelog/daily-shutdown). À imiter : heure d'arrêt choisie le matin, notification **dans l'application** à cette heure, parcours « ce que j'ai fait, ce qui reste, je range, je ferme » ; le point fort de Sunsama est l'effet de calme. Correspond à ta règle « pas de push, une seule surface ».

À ne **pas** copier : Apple Liquid Glass sur du contenu dense (Apple lui-même le réserve à la navigation) ; mesh gradients et « tactile brutalism » des blogs de tendances (aucune preuve d'utilité dans un outil quotidien).

Bibliothèques d'inspiration visuelle (pour chercher, pas à imiter) : **Mobbin** (https://mobbin.com/ : 621 500 écrans d'applications réelles, mobile et web, parcours complets, formule gratuite limitée, relevé le 2026-10-07) ; **Recent** (https://recent.design/ : galerie curatée, sites, icônes d'app, micro-interactions ; l'adresse godly.website redirige désormais vers ce site, constaté aujourd'hui, donc Godly semble absorbé ou renommé : à vérifier) ; **Land-book** (https://land-book.com/ : renvoie une erreur 403 à la lecture automatique, non vérifié).

## 9. Nom et logo d'un outil personnel

### 9.1 Ce que disent les sources

- **Fluidité de prononciation** : une étude publiée dans PNAS (Alter et Oppenheimer, 2006-06-13, https://pages.stern.nyu.edu/~aalter/fluctuations.pdf) montre que des actions aux noms faciles à prononcer surperforment à court terme ; les noms simples sont jugés plus favorablement. Pour un outil personnel : un nom qu'on prononce sans effort à voix haute, puisque tu en parleras beaucoup à Claude et à voix dictée (dictée vocale : un nom rare sera mal transcrit).
- Critères courants des guides de nommage logiciel (fabrikbrands, zappi, growigami ; **anecdotique** mais convergent) : court (idéalement deux syllabes), facile à épeler, unique, domaine disponible, sens évocateur. Pour un outil personnel, le critère de marque déposée compte moins que la **dictée sans ambiguïté** et l'absence de collision dans ton propre environnement (Spircle, Stage, EDHEC AI).
- Exemples de noms d'outils de référence (noms seuls, sans étymologie affirmée sauf sourcée) : Linear, Raycast, Arc, Things, Sunsama, Superhuman, Slack. Mots courts, une idée, pas de jargon. Raycast : le nom de code de la version Windows était « X-Ray » pour « cross-platform Raycast » (résultat de recherche vers le blog de Raycast, non relu en entier : à vérifier) ; Slack est l'acronyme « Searchable Log of All Communication and Knowledge » (selon un guide de nommage, à vérifier).
- Logo : Paul Rand, « un logo tire son sens de la qualité de ce qu'il symbolise, et non l'inverse » ; seul impératif : distinctif, mémorable, clair (synthèse 99designs, https://99designs.com/blog/famous-design/4-principles-by-paul-rand-that-may-surprise-you/ ; propos rapportés). Test du plissement des yeux et lisibilité à 16 px (guides d'icônes d'application ; **anecdotique** mais constant). **Pas de lettres dans l'icône** (recommandation Apple rapportée par des guides, la page Apple n'étant pas lisible ; vérifier). Linear : logotype et symbole, usage monochrome préféré, couleurs de marque `#F4F5F8` et `#222326` (https://linear.app/brand).
- Raisonnement de ma part (non sourcé) : un outil personnel a besoin d'**un seul signe** qui marche en 16 px (onglet) et en 180 px (icône d'application), en monochrome d'abord, puis une couleur : l'accent de la charte.

### 9.2 Candidats de noms (idées de Claude, aucune vérification de disponibilité)

Critère : français ou international, 1 à 2 syllabes, évite le vocabulaire déjà pris par un outil connu, évoque piloter, temps ou bord de navire (ton dossier s'appelle `dashboard-pilotage`).

1. **Cap** : direction tenue ; 3 lettres, prononçable dans les deux langues ; mais très courant, donc collisions de recherche.
2. **Quart** : « prendre le quart » = tour de veille à bord ; aussi le quart d'heure, l'unité de ton agenda. Court, distinctif, un peu abrupt.
3. **Vigie** : poste d'observation en haut du mât ; évoque surveiller sans alerter. Deux syllabes, doux.
4. **Timon** : la barre du navire ; piloter littéralement. Mot rare, donc unique ; risque de mauvaise transcription vocale.
5. **Ardoise** : on écrit, on efface, la journée repart propre ; évoque la fin de vie des tâches. Trois syllabes, plus long.
6. **Sillage** : trace que laisse le travail fait ; évoque le bilan. Deux syllabes.
7. **Repère** : point de référence ; sobre ; accent à gérer pour la saisie.
8. **Boussole** : trop explicite et déjà usé par beaucoup d'outils de pilotage.

Mon classement par critère « dictée + unicité + sens » : Vigie, Quart, Cap. Je recommande de **dire chaque nom à voix haute dans une phrase à Claude** (« ouvre Vigie ») avant de décider.

### 9.3 Trois pistes de logo (construction concrète)

1. **Quart** : un quart de disque (quatre-vingt-dix degrés) dans un carré aux coins concentriques ; évoque le quart d'heure, le cadran, une part de journée. Un seul aplat, rayon extérieur = rayon intérieur + marge.
2. **Vigie** : un trait vertical (le mât) coiffé d'un petit rectangle (la vigie) ; ou l'initiale V coupée en deux plans de luminosité différente. Test à 16 px : la forme du V doit tenir sans détail.
3. **Cap** : une flèche courte inscrite dans un cercle, ou deux traits formant un angle, hérités de la grille 4 px de ton interface ; en monochrome blanc sur fond graphite, accent en variante.

Règles de construction : grille 4 px ; épaisseur de trait unique ; version monochrome d'abord ; export 16, 32, 180 et 512 px ; variante pour mode clair ; vérifier sur le fond réel de l'onglet.

## 10. Plan de mise en oeuvre (par ordre de rapport utilité/effort, critique)

1. **Relever les textes** : `--text-muted` vers L 0,79, `--text-faint` vers L 0,72 (jamais pour du corps), accent de texte vers L 0,80. Gain immédiat de lisibilité, effort : 5 lignes de CSS. Recommandé par la mesure.
2. **Filets de contrôle** à 3:1 (L environ 0,52) pour champs, cases, boutons secondaires ; filets décoratifs à 1,2 à 1,4. Effort faible.
3. **Règle de fréquence** inscrite dans le code : variable `--dur-instant: 0ms` pour ranger/cocher/déplacer, `--dur-fast: 150ms`, `--dur-base: 220ms`, `--dur-slow: 400ms` (rare seulement) ; courbe unique `cubic-bezier(0.23, 1, 0.32, 1)` ; `prefers-reduced-motion` global. Effort moyen, gain d'impression de vitesse.
4. **Échelle de rayons 6 / 10 / 16** et marges 4 / 6 : refaire les cartes et le rail pour qu'ils emboîtent. Effort moyen.
5. **Codage double de l'agenda** (couleur + trait / pointillés) et palette Okabe-Ito pour les catégories : accessibilité et lisibilité des deux types (plages, tâches). Effort moyen.
6. **`tabular-nums`** sur les heures, durées et compteurs. Effort minime.
7. **Générer les thèmes** depuis 3 variables (base, accent, contraste) pour que Studio et prod partagent la même source. Effort élevé ; à faire quand la charte est choisie.
8. **Verre sur la palette Ctrl+K, popovers et toasts seulement**, avec repli opaque. Effort faible.
9. **Thème clair de lecture pour les mails** (étude NN/g). Effort moyen ; à tester sur lui d'abord.
10. **Rituel du matin / bilan du soir** : l'occasion d'y mettre ressorts et soin, puisque ces écrans sont rares (règle de fréquence).

À écarter pour l'instant : grain, border beam permanent, mesh gradients, sons par défaut, haptique, squircle sans repli.

## 11. Ce qui est consensuel, ce qui est anecdotique

**Consensus (plusieurs sources ou norme)** : élévation par luminosité en sombre ; contraste minimum 4,5:1 (texte) et 3:1 (composants) ; durées inférieures à 300 ms et ease-out ; pas d'animation pour les gestes très fréquents ; réduire plutôt que supprimer en mouvement réduit ; rayons concentriques ; OKLCH ou LCH plutôt que HSL ; échelles de couleur par rôle ; codage redondant pour le daltonisme ; chiffres tabulaires.

**Source unique sérieuse** : jetons de ressorts Material 3 Expressive ; recommandations Emil Kowalski (durées par composant, vélocité 0,11) ; Linear (3 variables, refonte 2026) ; NN/g (lecture clair/sombre, 2020) ; Apple (verre uniquement en navigation).

**Anecdotique ou marketing** : « +5 à +8 % par couche » ; le grain et les mesh gradients comme tendances 2026 ; Superhuman à 50-60 ms (tiers) ; tous les « DESIGN.md » tiers pris comme valeurs exactes ; l'idée qu'un nom « fluide » fait un meilleur outil personnel (l'étude PNAS porte sur des actions boursières, je la transpose par analogie).

## 12. Sources (URL, date de lecture 2026-10-07 sauf mention)

- Linear, refonte 2026 : https://linear.app/now/behind-the-latest-design-refresh (2026-03-12)
- Linear, refonte 2024 : https://linear.app/now/how-we-redesigned-the-linear-ui (déploiement terminé le 2024-03-28)
- Linear, Design for the AI age : https://linear.app/now/design-for-the-ai-age (2025-04-07, lu mais non utilisé : propos sur l'IA et la structure)
- Linear, marque : https://linear.app/brand
- Rauno Freiberg : https://rauno.me/craft/interaction-design (principes, sans chiffres)
- Emil Kowalski : https://emilkowal.ski/ui/you-dont-need-animations , https://emilkowal.ski/ui/great-animations , https://emilkowal.ski/ui/building-a-toast-component , https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md
- Material 3 (jetons) : https://github.com/material-components/material-components-android/blob/master/docs/theming/Motion.md
- Vercel : https://vercel.com/geist/colors , https://github.com/vercel-labs/web-interface-guidelines , https://vercel.com/design/guidelines
- Radix Colors : https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale , https://www.radix-ui.com/colors/docs/palette-composition/composing-a-palette
- OKLCH : https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl (support de septembre 2025)
- Tailwind 4 : https://tailwindcss.com/blog/tailwindcss-v4 (2025-01-22)
- Stripe : https://stripe.com/blog/accessible-color-systems (2019-10-15)
- APCA : https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell.html
- WCAG 2.2 : https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html , https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
- Mouvement réduit : https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- NN/g : https://www.nngroup.com/articles/response-times-3-important-limits/ (1993) ; https://www.nngroup.com/articles/dark-mode/ (2020-02-02)
- Josh Comeau : https://www.joshwcomeau.com/css/designing-shadows/ , https://www.joshwcomeau.com/css/backdrop-filter/ , https://www.joshwcomeau.com/animation/linear-timing-function/ (état octobre 2025), https://www.joshwcomeau.com/react/announcing-use-sound-react-hook/
- Apple Liquid Glass : https://developer.apple.com/videos/play/wwdc2025/219/ (2025)
- CSS-Tricks, grain : https://css-tricks.com/grainy-gradients/ (2021-09-13)
- Refactoring UI : https://www.refactoringui.com/
- Okabe-Ito : https://jfly.uni-koeln.de/color/
- Squircle : https://www.smashingmagazine.com/2026/03/beyond-border-radius-css-corner-shape-property-ui/ (2026-03)
- Haptique : https://haptics-web.vercel.app/ , https://github.com/WICG/web-haptics
- Things : https://culturedcode.com/things/features/
- Family : https://benji.org/family-values (2024-07-08)
- Sunsama : https://roadmap.sunsama.com/changelog/daily-shutdown
- Magic UI : https://magicui.design/docs/components/border-beam
- Raycast (tiers) : https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/raycast/DESIGN.md
- Mobbin : https://mobbin.com/ ; Recent : https://recent.design/
- Nommage : https://pages.stern.nyu.edu/~aalter/fluctuations.pdf (2006-06-13) ; https://99designs.com/blog/famous-design/4-principles-by-paul-rand-that-may-surprise-you/
- Guides de tendance et de sombre cités comme anecdotiques : uxmagic.ai/blog/dark-mode-ui-design-guide , muz.li/blog/dark-mode-design-systems-a-complete-guide-to-patterns-tokens-and-hierarchy , fireart.studio/blog/the-best-web-design-trends
