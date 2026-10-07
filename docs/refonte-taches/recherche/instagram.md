# Recherche : ce que disent les saves Instagram de Thibaut (2026-10-07)

Angle : ses 520 enregistrements Instagram, lus en profondeur, puis recoupés avec le web pour savoir si les outils qu'il a sauvegardés existent et valent quelque chose. La première recherche (RECHERCHE.md) n'avait retenu que 11 notes sur 149 de type skill. Celle-ci en relit 520 et en tire 6 familles, avec le décompte de chaque récurrence.

## 0. À lire d'abord : méthode et limites

1. **Ce qui a été lu** : les 520 notes du vault (`03 Ressources/Instagram`), soit 118 de type skill, 31 de type connaissance, 371 de type loisir. Pour chacune : légende, résumé, phrase « à retenir », fiche (`recos`, `attention`), et pour au moins 14 reels la section « Visuel » (texte à l'écran). La transcription complète a été relue pour une vingtaine de notes (toutes celles de design, de dashboard et d'outils d'interface), les autres par légende, résumé, phrase à retenir et fiche. Aucun accès à Instagram (règle du skill `instagram-memoire`) : tout vient du vault.
2. **Seules les légendes et les transcriptions audio existent**, pas l'image, sauf les 14 reels « Visuel ». Beaucoup de vidéos de la vague IA ne nomment pas leurs outils (« un skill design », « une banque de composants ») : ces noms-là ne sont pas dans les saves. Je ne les ai pas inventés ; quand un nom a pu être retrouvé par recherche web, c'est marqué comme tel et daté.
3. **Date de save** : 42 notes IA portent `saved_at: 2026-09-22`, donc une grosse vague de saves le même jour (ou une date d'export, je ne peux pas trancher). Le décompte des « récurrences » ci-dessous compte des vidéos, pas des jours d'intérêt : un même créateur peut peser plusieurs fois (@kingarms.ai : 5 notes, @dryxio.us : 6).
4. **Partenariats payés** : 4 des vidéos design (@vibecode.rob, @buildwaleesh, @eli_buildz_, @buildingwiththane) sont des pubs Manus (#manuspartner, #ad). Elles comptent comme « il a regardé », pas comme « c'est recommandé ».
5. **Web** : vérifications faites le 2026-10-07 par WebSearch et WebFetch (pas de Reddit ni de Firecrawl). Les nombres d'étoiles GitHub viennent d'un résumeur de page : ordre de grandeur, pas au chiffre près.
6. **Pas d'intention d'appli de planification** dans ses saves : aucune note ne cite Sunsama, Akiflow, Motion, Notion Calendar, Linear, Things. Ses goûts de produit se lisent ailleurs (voir section 3).

## 1. Le décompte : comment ses saves ont bougé (et ce qui est encore vrai)

Saves par année et thèmes dominants (compté dans le vault le 2026-10-07) :

| Année | Saves | Dominant |
|---|---|---|
| 2017 | 92 | Humour 56, Voile et yachts 34 |
| 2018 | 52 | Humour 29, Voile et yachts 20 |
| 2019 | 29 | Voile et yachts 13, Musique et DJ 4 |
| 2020 | 42 | LEGO, Design et Déco 10 (Star Wars), Musique 6 |
| 2021 | 16 | Espace et science 11 |
| 2022 | 28 | Restos et bars 11, Sorties 9 |
| 2023 | 32 | Musique 4, Cinéma 4, Restos 4, IA 3 |
| 2024 | 36 | Carrière et finance 7, Cinéma 6, Musique 5 |
| 2025 | 54 | IA et tech 13, Cuisine 7, Mode 6, Restos 6 |
| 2026 | 139 | **IA et tech 61, Mode 20, Restos 19, Cinéma 13** |

Lecture : les 74 notes « Voile et yachts » (67 datent de 2017 à 2019) et les saves LEGO ou espace sont **des goûts d'adolescent, très marqués mais anciens**. Pour le design du dashboard, les saves qui comptent sont celles de 2025 et 2026 : IA et outils, mode, restos de Paris, cinéma. Je garde les anciens comme signal faible (un goût pour l'objet technique rapide, voir section 3), pas comme direction.

## 2. Les six familles de saves utiles au dashboard

Compte = nombre de notes de la famille ; entre crochets, les notes sources (identifiants du vault, URL en annexe).

### A. « Que mon site ne ressemble pas à du site généré par IA » : 12 notes, la famille la plus liée au design

C'est le seul sujet de design qui revient vraiment. Trois ingrédients répétés :

1. **Un skill ou plugin de direction artistique qui fixe typo, couleurs, espacements ou qui audite le rendu** : [[2026-09-22-antoineblanco99-Dbdpp0lFfAn]], [[2026-09-22-kingarms.ai-DX7lWqFx9I9]], [[2026-09-22-alexpetkov.ai-Ddeh5nyDlph]] (Impeccable, nommé), [[2026-09-22-henriexploria-DdZj4wLlJi9]] (quatre skills nommés à l'écran : /anti-ui-slop, /minimalist-ui, /ui-ux-pro-max, /web-design-guidelines, plus /canvas-design), [[2026-03-03-dryxio.us-DVbZ06TDCGo]] (outil gratuit qui livre « le prompt exact » du design choisi, **nom jamais cité**, ne pas le chercher à l'aveugle).
2. **Une bibliothèque d'animation** : Framer Motion ([[2026-09-22-kingarms.ai-DX7lWqFx9I9]]), motion.dev ([[2026-09-22-vibecode.rob-DdgxxPNRAVP]], pub Manus), Motion Primitives ([[2026-09-22-buildwaleesh-DbqYVjazc5Q]], pub Manus), Motion Sites et Spline ([[2026-09-22-eli_buildz_-DdXvT9ZDocg]], pub Manus).
3. **Une banque de composants** : 21st.dev ([[2026-09-22-antoineblanco99-Dbdpp0lFfAn]], [[2026-09-22-eli_buildz_-DdXvT9ZDocg]]), « BKLA UI » et « Coconut UI » ([[2026-09-22-vibecode.rob-DdgxxPNRAVP]]), Watermelon UI et Haikei ([[2026-09-22-buildwaleesh-DbqYVjazc5Q]]).
4. Hors de ces trois : **les primitives** ([[2026-09-22-buildwithnico-DanT1aqMKNM]]) : ne pas laisser l'IA recoder menus, dropdowns et modales (collisions avec le bord de l'écran, clic extérieur, accessibilité) ; on ne fait que styler. Et Google Stitch, design par prompt exportable vers Figma ([[2025-06-24-lemondedumarketing-DLR2jXxCvwS]], enregistré 2025-10-28). Deux saves de la même famille sans contenu exploitable : [[2026-09-22-buildingwiththane-DcSlxgRCBPm]] (pub Manus, musique seule) et [[2026-09-22-yukihasmotion-DapBC1-RLT2]] (démo de motion design, aucun outil dit), ce qui fait 12 avec les autres.

**Ce que j'ai vérifié sur le web (2026-10-07) pour chaque nom flou ou cité :**

| Nom dans la save | Ce que c'est vraiment | Statut |
|---|---|---|
| Impeccable | Plugin et skill de design pour agents (auteur Paul Bakaus, Apache 2.0), 24 commandes (audit, critique, polish, typeset, layout, animate, distill...), 60 règles de détection déterministes de « tells » de design généré. Se lance par `npx impeccable install`. Marche avec Claude Code, Cursor, Codex, Gemini CLI et d'autres. Environ 78 000 étoiles lues. | **Réel, très recommandé** (recoupé : impeccable.style, le dépôt GitHub et deux comparatifs de blog). Point d'attention : l'étoile peut être gonflée par l'effet de mode, lire le README avant. |
| /anti-ui-slop | Il existe plusieurs projets « anti-slop » distincts sur GitHub (luantaraschi/anti-slop : 49 tells sur surface, finition, états, mots ; duddudcns/anti-slop ; TheMizeGuy/anti-slop). La save ne dit pas lequel. | **Ambigu** : ne pas installer « le » anti-slop, choisir un dépôt, lire le code. |
| /ui-ux-pro-max | Dépôt nextlevelbuilder/ui-ux-pro-max-skill (MIT) : base de 67 styles, 161 palettes, 57 couples de polices, 99 règles UX. | Réel, utile comme **bibliothèque de choix** (styles, palettes, fonts) plus que comme auditeur. |
| /canvas-design, frontend-design | Skills officiels Anthropic dans anthropics/skills ; frontend-design vise « un design intentionnel qui ne lit pas comme des défauts de template ». | **Réel et officiel**, déjà dans l'écosystème de Claude. |
| 21st.dev | Registre communautaire shadcn (12 000+ composants, thèmes, templates), installation par la CLI shadcn : le code est copié dans le projet, pas importé. | Réel, très cité. Qualité inégale car communautaire. |
| Motion Primitives | Bibliothèque d'ibelick sur Motion et Tailwind : 34 composants gratuits (dock, morphing dialog, morphing popover, animated number, sliding number, transition panel, toolbar extensible, texte animé). | **Réel, bon candidat** pour les micro-interactions. |
| « BKLA UI » | C'est **Bklit UI** (dépôt bklit/bklit-ui), graphiques sur shadcn, Visx et Framer Motion : gauge, ring, funnel, sankey, live charts... | **Nom corrigé** par recherche web ; la transcription audio avait « BKLA ». |
| « Coconut UI » | C'est **Kokonut UI** (kokonutui.com), 100+ composants animés (bento grid, action search bar, entrées IA). | **Nom corrigé** par recherche web. |
| Haikei | haikei.app : générateur gratuit de SVG (vagues, blobs, grilles, dégradés). | Réel, **peu utile à un dashboard sobre**. |
| Spline | Outil 3D web avec offre gratuite. | Réel, **hors sujet** pour un cockpit. |
| Watermelon UI, Recent Design | Non vérifiés (peu de résultats nets). | À ignorer pour l'instant. |
| Manus | Vendeur de site en une description ; sponsor des 4 vidéos. | **Publicité**, ne pas en tirer de conclusion. |
| Google Stitch | Outil gratuit de Google Labs, design par prompt, export Figma. | Réel ; l'auteur de la save l'a utilisé pour une page de paiement. |

**Consensus ou anecdote ?** Très recommandé (plusieurs saves indépendantes, outil confirmé sur le web, adopté largement) : (i) s'appuyer sur des primitives et un registre shadcn plutôt que de laisser l'IA recoder les composants ; (ii) faire auditer le rendu avec un outil qui nomme les tells de design généré (Impeccable) ; (iii) fixer typo, couleurs et espacements dans un document que l'agent relit. Anecdotique ou promotionnel : « remplace un site à 10 000 € », « niveau agence en une commande », Spline, Haikei, « classé numéro 1 » sans nom.

**Ce qu'Impeccable nomme comme défauts** (page impeccable.style, lue le 2026-10-07) : palettes « beige IA », serif italique en titre, « chip soup » (un statut collé à chaque ligne), cartes dans des cartes, point qui pulse, titres et boutons qui se disputent l'œil, courbes d'animation datées, texte gris sur fond coloré, noir pur. Le Cockpit actuel a justement des puces (propositions, suggestions, 5 gestes) et une colonne « À ranger » faite de cartes : **c'est le contrôle de qualité le plus directement applicable**, voir section 4.

### B. « Mon tableau de bord de vie, mon second cerveau, mon agent de bilan » : 8 notes

- [[2026-09-22-nocode.joshua-DcE150pz_Rj]] : cinq projets de week-end, dont **life dashboard** (une page, agenda, mails, tâches, outils connectés, mis à jour chaque matin avec un briefing de la journée), **agent de bilan quotidien et hebdomadaire** (revue chaque soir, synthèse « quoi améliorer » chaque semaine) et **kit de marque** (donner sa voix et ses valeurs, obtenir couleurs, polices et composants réutilisables).
- [[2026-09-22-kingarms.ai-DcUT92yRUZ-]] : configurer Claude en une journée, dont **tâches planifiées** (« un brief du jour à 8h ») et **artifacts** (un tracker ou dashboard publié par lien).
- Mémoire et second cerveau : [[2026-09-22-nateherkai-Dcn_65hFXOg]] (vault Obsidian raw/wiki/output), [[2026-09-22-dryxio.us-DcwZoA2sm7p]] (arborescence : dossier cerveau, fichier d'index, fichier court terme « maintenant.md » relié à Notion pour les tâches ouvertes), [[2026-09-22-0xloucash-DYh3sFeotZD]] et [[2026-07-31-madamet3ch-DbdnQBPNqHm]] (ses reels sauvegardés rangés en notes consultables : c'est ce qu'il a déjà), [[2026-09-22-corecodevibes-Dc5xK-aIFWl]] et [[2026-09-22-maxjohnscn-DdbjQpYIeWn]] (ARCHITECTURE.md qui dit l'intention, pas la liste des fichiers).
- **Il a déjà ces trois briques** (dashboard, vault, routines) : ces saves valident son choix plus qu'elles n'ajoutent. Ce qui manque et qu'elles décrivent : la **synthèse hebdomadaire** et le **brief de début de journée en une carte**.

### C. « Un tableau de bord dense qui reste lisible » : 5 notes, et des motifs d'interface précis

- **World Monitor** ([[2026-03-01-nat.doa-DVWDXIkjIbt]], « un Bloomberg Terminal gratuit ? »). J'ai ouvert le site (worldmonitor.app, 2026-10-07) : carte au centre, **dossier par pays** qui s'ouvre au clic (score, synthèse IA, signaux actifs, frise sur 7 jours), **six « moniteurs » thématiques à un clic**, **palette de commandes Ctrl-K** (619 commandes annoncées), aucune inscription, couches activables (16 % par défaut sur 57). Projet open source (AGPL-3.0, dépôt koala73/worldmonitor). Ses saves ne le disent pas, mais c'est le seul exemple de dashboard dense qu'il ait enregistré.
- **La carte des 137 agents** ([[2026-08-28-alassafi.ai-DbYh2P-MQnj]]) : chaque tâche est étiquetée « humain / assisté / autonome ». Motif transposable : étiqueter chaque routine par son niveau d'autonomie.
- **Anara** ([[2026-06-11-venemt_-DZc0yI4tJHR]]) : 162 documents importés, chat dont chaque réponse a une **bulle grise qui ouvre le passage source**. Recoupé : Anara cite « au niveau du passage » (plusieurs comparatifs 2026).
- **Codenotch** ([[2026-09-22-baroobi.inc-DdXCmHdlKhd]], section Visuel) : une encoche noire avec anneaux d'usage et un état « Working » qui passe à **ambre quand l'agent attend ta réponse**. Voir la mise en garde en section 4 (repo cloné partout, macOS seulement).
- [[2025-08-09-datamarv_ia-DNI_gkisp-g]] : feuille de route par métier, **une carte par étape, un clic ouvre le cours**.

### D. « Économiser mes jetons et tenir mes limites » : 9 notes

[[2026-09-22-henriexploria-DcL60ujidkz]], [[2026-09-22-kayvon.ai-DaeHnQXR76N]] (Graphify), [[2026-09-22-dryxio.us-DbG1z6ZscX4]], [[2026-09-22-kingarms.ai-DdKVGAfxxDb]], [[2026-09-22-thomasbssh-DdD_nzuOZYn]], [[2026-07-23-wallstwardrobe-DbJEq-KyICp]] (consigne de concision), [[2026-09-12-yannisflowlabs-DdMo3i1OdkZ]] (convertir les PDF en Markdown avant de les donner), [[2026-09-22-alexpetkov.ai-Ddeh5nyDlph]] (Caveman), [[2026-09-22-baroobi.inc-DdXCmHdlKhd]] (afficher le quota restant). **C'est la douleur la plus répétée de la période, et c'est aussi celle de sa demande du jour** (crédits hebdo à renouveler). Les gains annoncés (« 70 fois moins de jetons ») ne sont **pas vérifiés** et se contredisent entre vidéos ([[2026-09-22-kayvon.ai-DaeHnQXR76N]]). Retenue pour le design : un affichage de l'état de la session et du quota rend le pilotage par Claude moins aveugle.

### E. Connecteurs, navigateur piloté, tâches planifiées : 7 notes

[[2026-09-22-kingarms.ai-DcE_mo7NBeC]], [[2026-09-22-henriexploria-DdT13UlkoYD]], [[2026-08-26-dryxio.us-Dcgv3MEsMGD]] (Perplexity, Firecrawl, Playwright ou Claude in Chrome, Context7, Composio), [[2026-09-22-ai.amirtech-Dc1NGcnA9PB]] (gros dépôt d'agents et skills : probablement ECC, déjà installé chez lui), [[2026-09-22-koen_salo-DayGbO9Mu3w]], [[2026-09-22-yannisflowlabs-DcJUpo-s7gX]], [[2026-09-22-kingarms.ai-DcUT92yRUZ-]]. Utile ici pour **la preuve visuelle** : Claude in Chrome ou Playwright peuvent ouvrir `/demo` et faire des captures avant et après (c'est ce que suggère [[2026-09-22-henriexploria-DdT13UlkoYD]] avec les appels `navigate`, `click`, `screenshot`). Firecrawl est **exclu** par sa règle (plus de crédits).

### F. Hors design mais qui pèse sur les fonctions : sécurité de mise en ligne (environ 8 notes), carrière (5 notes)

- Sécurité : [[2026-05-08-kingarms.ai-DYFyOC3RlH5]], [[2026-09-17-buildwithmathias-DdYXVDhuyng]], [[2026-09-14-yatesvids-DdSXJx4vQEK]], [[2026-09-22-sayed.developer-Dc0b0K-thYr]], [[2026-09-22-dryxio.us-DaGJxJgsL7Y]], [[2026-08-02-thewebwombat-Dbje8dMhOkJ]]. Un seul item touche le design : **états de chargement, états vides, pages d'erreur** (la liste de [[2026-09-14-yatesvids-DdSXJx4vQEK]] et [[2026-09-17-buildwithmathias-DdYXVDhuyng]]). Déjà traité dans le guide Claude Code (sections 3 et 6).
- Carrière : [[2026-09-22-fez.infocus-DZ8Q2J4tgT-]] (entretiens simulés notés, networking, CV adapté), [[2026-09-09-sahni.ai-DdDMxPEE2v_]] (méthode Minto : conclusion d'abord), [[2024-09-12-recruituhq-C_1T_31Ohid]] et [[2024-09-17-jerryjhlee-DACNohJtmFR]] (cas, networking), [[2024-09-23-thegaryguo-DARynvHP_o2]] (classement Vault). Pour le dashboard : les saves confirment que **candidatures et relances sont son vrai pipeline**, plus que les tâches de travail.

## 3. Ce qu'il aime hors IA : la matière du goût (2025 et 2026 surtout)

Ces saves n'ont rien à voir avec le web, mais ce sont les seuls indices sur l'esthétique. Tout ce qui suit est de **l'inférence**, marquée comme telle.

- **Mode (20 saves en 2026, 6 en 2025)** : tailoring et intemporel plutôt que streetwear. Savile Row ([[2024-12-10-celine_debussy-DDaUBCQuypn]]), chemises à grands cols et mariage ([[2025-04-21-lucallaccio-DItpHZOqObY]]), pantalons à pinces ([[2025-10-11-lila.inspo-DPqcqWBgtUf]], [[2026-09-23-simonxschlegl-DakiBd8BZ4T]], [[2026-09-23-whoisoms-DdMKz6tIRpv]]), alternatives à Zara dont Noyoko « intemporel » et Gant « préppy Ivy League » ([[2026-08-13-guillaume_edouardtm-Db_bp4iI_D3]]), denim brut, mocassins ([[2026-07-28-antoniobelardo_-DbLkpP9qxsv]]), vintage et friperie, montres à l'esthétique vintage ([[2026-08-27-celine_debussy-DcjUgkIM8AU]]), parfumerie de niche (11 notes). Constante : **qualité de matière, coupe sobre, bon rapport qualité prix, pièces qui durent**.
- **Restos et bars de Paris (19 saves en 2026)** : intimiste, jazz live, DJ sur vinyle, déco soignée, bistrots anciens (Duc des Lombards [[2026-04-01-punktfam-DWmEsrwCD9P]], Billie [[2026-02-22-punktfam-DVEFqEliNfh]], La Boule Rouge [[2026-07-09-luciepassionglucides-DalGqVHIcAl]], Le Mistral [[2026-05-06-bouffe2lolo-DX9iPndM6Cf]]). Il a aussi enregistré **l'appli Punkt** (cinq notes, [[2026-01-01-punktfam-DS-awxYiPAf]] en tête) qui transforme une vidéo en lieu épinglé : recoupé sur l'App Store, gratuite pour 5 imports par semaine.
- **Cinéma (13 saves en 2026)** : films très composés, mise en scène marquée (The Fall [[2026-06-24-art.housearchive-DZ-GFeIpH--]], The Handmaiden [[2025-11-26-mariuslaugier-DRhvuPsCIso]], Pauvres Créatures [[2023-12-16-thefilmthusiasts-C06vhNtIQXg]], Le vent se lève et Porco Rosso [[2026-04-24-animee_recon-DXhIr_jESJm]], [[2026-02-16-cinesospeso-DU0r3iGCNP1]]), Nolan ([[2026-01-03-louissrouleau-DTDoVKMjPOW]]).
- **Voile, foils, superyachts (74 saves, 2017 à 2019)** : prototype AC75 d'Emirates Team New Zealand et d'INEOS ([[2017-11-20-emiratesteamnz-BbuwSFAlZGN]], [[2018-08-31-americascup-BnImExJAStA]]), foilers ([[2017-11-30-armellecleach-BcIrwKwACw6]]), concepts de coque ([[2018-08-19-theyachtguy-BmqXRaSBJ4H]]). Goût ancien pour **l'objet technique rapide dont la forme suit la fonction**.
- **LEGO Star Wars (2020), espace (2021)** : vaisseaux, stations, images NASA ([[2022-04-06-nasa-Cb_XXYiPJjv]]). Même famille : instruments, sombre et précis.
- **Musique électronique et DJ (27 saves)** : plutôt la scène (Garrix, DJ Snake, Boiler Room), le matériel (stems DDJ [[2023-09-01-djandmusicins-CwpmA8rpORV]]) et les lieux.
- **Humour (104 saves, surtout 2017 et 2018)** : mèmes et sketchs français ; peu d'indication sur le ton voulu pour l'interface, je ne m'en sers pas.
- **Un seul jugement d'interface explicite** : le classement d'applis de randonnée ([[2024-05-10-loomi_outdoor-C6y5sBuIH2Q]]) : Komoot « agréable à utiliser », AllTrails « la plus stylée », Visorando « fait mal aux yeux » : il a enregistré une vidéo qui juge des apps **à leur beauté et à leur confort d'usage**, pas seulement à leurs fonctions.

## 4. Ce qui en découle pour les propositions (sélection, pas volume)

Chaque piste porte sa source dans les saves, son poids et son risque. « Poids » = effet probable sur la qualité perçue ou l'usage ; « Risque » = coût ou piège.

**Design et composants**

1. **Audit anti-slop avant de choisir une charte (poids fort, risque faible).** Faire passer `/demo/*` dans Impeccable (`audit`, `critique`, `polish`) et lire le rapport avant de comparer les chartes. Sources : famille A (quatre saves) et impeccable.style. Cible précise : les puces « chip soup », les cartes dans des cartes de la colonne « À ranger », les titres qui rivalisent avec les boutons. Installation par `npx impeccable install` sur une branche de test ; vérifier la licence et le README avant.
2. **Primitives pour tout ce qui s'ouvre (poids fort, risque moyen).** Le dashboard n'a aujourd'hui aucune dépendance d'interface (package.json : seulement Next, React, Supabase, Tailwind). Le rangement forcé, les menus de gestes et les fenêtres devraient reposer sur des primitives (le choix exact n'est pas dans la save [[2026-09-22-buildwithnico-DanT1aqMKNM]]), avec Tailwind pour le style. Risque : compatibilité React 19 et Next 16 non testée ici, à vérifier par `npm install` sur une branche.
3. **Micro-interactions depuis Motion Primitives, pas un site animé (poids moyen, risque faible).** Retenir quatre pièces : `animated number` et `sliding number` (compteurs de tâches ou de quota), `morphing dialog` (ouvrir un bloc de l'agenda en fiche), `transition panel`. Écarter texte animé, spotlight, glow, magnétique : ce sont les effets que les audits anti-slop signalent. Durées de l'exemple Impeccable à titre de départ : 150 ms au survol, 160 ms à l'appui (exemple lu sur la page, pas une norme).
4. **Jauges et anneaux avec Bklit UI pour les quotas hebdo (poids moyen, risque moyen).** La famille « gauge, ring, funnel » de Bklit (Visx et Motion) répond à un besoin réel : visualiser les quotas hebdo de `planifier`. Alternative sans dépendance : SVG maison de 30 lignes. Ne pas ajouter une bibliothèque de graphiques pour un seul anneau.
5. **Kit de marque écrit une fois (poids fort, risque faible).** Reprendre [[2026-09-22-nocode.joshua-DcE150pz_Rj]] : un fichier unique (voix, valeurs, couleurs, polices, rayons, durées) que Claude relit, au lieu de décider à chaque demande. Il existe déjà `MA_VOIX.md` pour la voix : le kit visuel en est le pendant. Cela règle le « design très basique » à la racine.

**Fonctionnalités**

6. **Palette de commandes Ctrl-K qui enveloppe la CommandBox (poids fort, risque faible).** Il existe déjà `components/CommandBox.js` (une phrase en français, aperçu, bouton Confirmer). La palette de World Monitor montre le motif attendu : un seul geste clavier, jamais de menu à apprendre. Variante cohérente avec « il pilote par Claude » : la palette propose en tête « Dis-le à Claude » (copie une phrase prête à coller) avant les gestes directs.
7. **Un état « Claude travaille, attend, a fini » dans le rail (poids moyen, risque moyen).** Motif de Codenotch : une pastille d'état qui passe à l'ambre quand une action attend sa confirmation (le « rangement forcé » en est un cas). Je n'ai **pas vérifié** que le dashboard puisse lire l'état de la session ni le quota Claude : version minimale sans donnée externe, la pastille ambre sur « il reste N éléments à confirmer ». Attention : Codenotch est une app **macOS** (il est sous Windows), et la recherche web renvoie au moins neuf dépôts identiques sous des comptes différents, ce qui est un signal d'alerte classique : à lire comme inspiration visuelle, **ne rien installer** sans avoir identifié le dépôt d'origine (vinzdg/codenotch dans les résultats) et lu le code.
8. **Fiche-dossier par échéance (poids fort, risque moyen).** Transposer le « dossier par pays » : cliquer « Bain 02/11 » ouvre une fiche (date, état de la prépa, contacts, tâches liées, dernier mail), au lieu d'une ligne de liste. C'est la réponse directe à « candidatures et relances = vrai pipeline » (famille F) et au constat du DIAGNOSTIC (échéances séparées des to-do).
9. **Étiquette d'autonomie sur chaque routine (poids moyen, risque faible).** Reprendre « humain / assisté / autonome » ([[2026-08-28-alassafi.ai-DbYh2P-MQnj]]) : une petite page « Machines » qui liste `refresh-dashboard-agenda-mails` et les autres routines avec leur dernier passage et leur niveau. Aide à voir ce qui fabrique les 95 « Oublié hier ? ».
10. **Source cliquable sous chaque proposition issue des mails (poids moyen, risque faible).** Motif Anara : la bulle qui ouvre le passage d'origine. Chaque idée ou tâche suggérée porte un lien vers le mail qui l'a déclenchée ; ça rend une suggestion vérifiable en un clic et limite le « d'où ça vient ? ».
11. **Carte de bilan unique, quotidienne et hebdomadaire (poids fort, risque faible).** [[2026-09-22-nocode.joshua-DcE150pz_Rj]] décrit le bilan du soir et la synthèse du dimanche ; le DIAGNOSTIC pose déjà le principe d'une seule carte. À faire en **une** carte, pas en notifications.

**À écarter pour l'instant** : Spline et 3D, Haikei, Motion Sites, tout site « cinématique » ; Manus ; Agent Reach (CGU) ; OmniRoute ; le skill « watermark » (affirmation fausse ou non vérifiée) ; Graphify tant que le gain n'est pas mesuré sur dashboard-pilotage avant et après.

## 5. Ce que ses saves disent de ses goûts

1. **Il cherche à éviter le look « fait par IA ».** 12 saves (famille A) tournent autour d'un même mot, « générique » (le mot des créateurs, pas le sien) ; l'ennemi est le banal, pas le « moche ». Toute proposition qui ressemble à un template de landing page échouera à ce critère.
2. **Il croit aux systèmes qui se construisent par couches** (skill de design, bibliothèque de mouvement, banque de composants, primitives), pas au prompt isolé. Il veut un kit réutilisable, pas un dessin unique.
3. **Il veut du sobre et du durable plutôt que du spectaculaire.** Mode : intemporel, tailoring, matières ; restos : intimiste, jazz, vinyle. Aucun save n'est brutaliste, néon ou « dopamine design ». Les effets 3D et les animations de landing page (Spline, Motion Sites) lui ont été montrés, rien n'indique qu'il s'en serve.
4. **Il aime l'objet technique précis qui expose un état** (foils, prototypes de course, stations spatiales, encoche d'usage, carte d'agents). Direction plausible pour le Cockpit : un instrument de bord (lecture rapide d'état, une couleur d'alerte unique), pas un journal ni un tableau de tâches. C'est une inférence, pas une demande.
5. **Il juge les apps à la sensation d'usage** (randonnée : « agréable » contre « fait mal aux yeux ») et enregistre les apps qui réduisent un frottement (Punkt, Anara, SocialLite qui supprime le scroll infini : [[2026-09-22-getsociallite-DdS_v2GgJHf]]).
6. **Le goût pour l'épure va avec un goût pour la densité maîtrisée** : il a enregistré World Monitor (très dense) à côté de saves sobres. Il ne refuse pas l'information, il refuse le bruit.
7. **Ses vrais problèmes du moment sont des limites et des frictions, pas l'esthétique** : 9 saves sur les jetons et les quotas, environ 8 sur la sécurité de mise en ligne. Le design ne sera jugé que s'il économise des échanges avec Claude.
8. **Il pilote par la parole et le dit en actes** : saves sur les tâches planifiées, les connecteurs, le vault, le second cerveau ; aucune sur une appli à cliquer. Les gestes du dashboard doivent d'abord être des phrases, puis des boutons.
9. **Il veut un tableau de bord de vie qui se met à jour seul chaque matin** (briefing, bilan du soir, synthèse hebdo). Il l'a déjà largement ; il manque le bilan, pas l'agenda.
10. **Ses saves sont pleines de promesses non vérifiées** : la fiche de ses saves signale « 10 000 € », « 70 fois », « watermark » comme accroches ou affirmations non vérifiées. Chaque outil retenu doit donc passer le test du dépôt (auteur, licence, dernier commit).
11. **Peu de goût déclaré pour la marque, le nom ou le logo** : aucun save sur identité visuelle, typographie nommée ou palette, hormis une affiche de polices non nommées ([[2023-07-24-waveindex-CvFVH7_NFYq]], inexploitable). Les propositions de nom et de logo ne peuvent donc pas s'appuyer sur ses saves ; elles doivent partir de ses valeurs (sobre, précis, durable) et de ce qu'il choisira en voyant.
12. **Ses goûts ont changé de planète tous les 2 ou 3 ans** (voile, LEGO, espace, restos, IA) : un dashboard qui lui sert plusieurs années doit tenir sur des principes (hiérarchie, état, sobriété), pas sur une mode du moment (par contraste, un article de tendances 2026 trouvé sur le web, celui de Canva, annonce le « imparfait volontaire » et les couleurs vives : rien dans ses saves n'indique que ce soit son goût).

## Annexe 1 : sources web (toutes consultées le 2026-10-07)

- Impeccable : https://impeccable.style/ et https://github.com/pbakaus/impeccable (24 commandes, 60 règles, Apache 2.0)
- Plugins anti-slop concurrents : https://github.com/luantaraschi/anti-slop et https://github.com/duddudcns/anti-slop
- UI UX Pro Max : https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- Skills officiels Anthropic : https://github.com/anthropics/skills/tree/main/skills/frontend-design et https://github.com/anthropics/skills/tree/main/skills/canvas-design
- 21st.dev : https://21st.dev/ et https://21st.dev/community/shadcn-directory
- Motion Primitives : https://21st.dev/@ibelick/library/motion-primitives
- Bklit UI : https://github.com/bklit/bklit-ui et https://ui.bklit.com/
- Kokonut UI : https://kokonutui.com/ et https://21st.dev/blog/kokonut-ui-components
- Haikei : https://haikei.app/
- Spline : https://spline.design/
- Motion Sites : https://motionsites.ai/academy
- Codenotch (et ses copies) : https://github.com/vinzdg/codenotch
- World Monitor : https://www.worldmonitor.app/ et https://www.worldmonitor.app/docs/about
- Punkt AI : https://apps.apple.com/us/app/punkt-ai/id6444187351
- Anara : https://tooldirectory.ai/tools/anara et https://dupple.com/reviews/anara-ai
- Google Stitch : cité par https://uxmagic.ai/blog/claude-design-alternatives (gratuit, Google Labs)
- Comparatif d'outils pour améliorer le design de l'IA : https://techarion.com/blog/best-tools-to-improve-claude-ai-ui-design-2026
- Tendances design 2026 (contraste) : https://www.canva.com/newsroom/news/design-trends-2026/
- Autre présentation d'Impeccable : https://www.chaseai.io/blog/claude-code-impeccable-skill-frontend-design

Les articles de comparatif sont des blogs de produit : ils confirment l'existence et les fonctions, pas la qualité.

## Annexe 2 : notes citées (identifiant, compte, date d'enregistrement, URL)

La liste complète avec URL est dans le fichier `recherche/instagram-annexe-notes.md` (générée depuis le vault, une ligne par note).
