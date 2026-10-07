# Recherche profonde : synthèse décisionnelle pour les vitrines v2 (2026-10-07)

Ce fichier sert de **grille aux juges** des propositions v2 (identité, charte, composants, fonctionnalités). Il croise les six fichiers de recherche ; il ne les remplace pas (détails, chiffres et URL y restent). Un enseignement n'est retenu ici que s'il est confirmé par **au moins deux sources indépendantes**, ou par un save Instagram plus une source externe.

## 0. Codes de source et limites

| Code | Fichier | Nature |
|---|---|---|
| IG | `recherche/instagram.md` (+ annexe des notes) | 520 saves relus, recoupés sur le web |
| GH | `recherche/github.md` | dépôts, npm, API GitHub lus le 2026-10-07 |
| FO | `recherche/reddit.md` | Hacker News, Mac Power Users, forum Obsidian (Reddit illisible) |
| AR | `recherche/apps-reference.md` | Sunsama, Akiflow, Motion, Reclaim, Linear, Things, Raycast, Superhuman, Todoist, Cron... |
| DS | `recherche/design.md` | règles chiffrées, contraste calculé (WCAG 2 et APCA) |
| R1 | `RECHERCHE.md` | première passe (bibliothèques, rituels) |
| W | vérifications de cette passe (2026-10-07) | WebSearch / WebFetch |

Limites qui pèsent sur la grille :
1. **Reddit n'a jamais été lu** (domaine refusé). Aucune proposition ne doit écrire « recommandé sur Reddit ». Les « forums » sont HN et MPU : public de développeurs et d'utilisateurs Apple avancés.
2. **Instagram = légendes et transcriptions**, pas les images ; 4 vidéos design sont des pubs Manus. Un save prouve qu'il a regardé, pas que l'outil est bon.
3. **Compatibilités = peer déclarées** dans npm, aucune installation testée. Tout passe par une branche d'essai.
4. Les chartes de marques (Raycast, Superhuman, Notion) sont **rétro-ingéniérées par des tiers** : ordre de grandeur, pas valeurs.

### Contradictions entre sources, tranchées

| Sujet | Sources en désaccord | Tranché |
|---|---|---|
| Durée des animations | FO P9 : 150 à 250 ms ; DS 6.2 : 0 à 120 ms pour les gestes fréquents ; IG (Impeccable) : 150 ms au survol | **La fréquence prime** : geste fait des dizaines de fois par jour = 0 à 120 ms ; occasionnel = 150 à 250 ms ; rare (rituel) = jusqu'à 400 ms |
| Report automatique des retards | AR (Linear reporte au cycle suivant) et GH (Open Sunsama reporte) contre FO (le report silencieux fabrique le cimetière) | **Pas de report silencieux** : un retard sort par un verbe (faire, reporter, abandonner) ou par la fin de vie |
| Notifications | R1 (Sonner) contre GH (Toast officiel shadcn sur Base UI, juillet 2026) | Toast Base UI si le socle est Base UI ; Sonner sinon |
| Police de titre | R1 (Inter Display, Satoshi) contre GH (Inter au ralenti depuis 2024-11) et W (Satoshi interdit en auto-hébergement sans accord écrit) | **Garder Geist** ; Mona Sans ou Geist Pixel pour l'affichage |
| Glisser tactile | R1 (pragmatic-drag-and-drop limité au tactile) contre GH (README : iOS et Android pris en charge) | Contesté : test sur son téléphone obligatoire |
| Clair ou sombre | FO 5.6 (pure préférence) ; DS (NN/g : lecture meilleure en clair) | Sombre pour le Cockpit, **clair proposé pour la lecture des mails** |
| Blocs de tâches orange | DS (orange Okabe-Ito, sûr pour le daltonisme) contre FO 6.6 (le couple crème et orange signale le « look IA ») | Orange sur graphite acceptable ; **interdit sur fond crème ou beige** |

---

## Axe 1. Identité : nom et logo

### Enseignements (classés par solidité)

1. **Nom court, prononçable et dictable sans ambiguïté.** Une ou deux syllabes ; il en parlera à Claude et le dictera, un mot rare sera mal transcrit. Sources : DS 9.1 (étude PNAS sur la fluidité de prononciation, transposée par analogie ; guides de nommage convergents), AR 4 (les 14 noms de référence font 1 à 3 syllabes).
2. **Un mot qui dit le temps ou l'action vaut mieux qu'un mot commun abstrait seul.** Linear, Things, Arc ne tiennent que par le produit ; Cron (chronos), Reclaim, TickTick disent le métier en un mot ; Cron rebaptisé « Notion Calendar » montre que le nom d'origine était meilleur. Sources : AR 2.5 et 4, DS 9.2.
3. **Le logo le plus rentable pour un outil à un utilisateur porte une information vivante** (date du jour, nombre d'éléments à ranger), comme l'icône de Cron dans le Dock. Un logo informatif n'est pas décoratif, donc compatible avec sa règle. Sources : AR 2.5 et 4 ; IG 5.4 (goût pour l'objet technique qui expose un état : foils, encoche d'usage Codenotch ; inférence marquée comme telle).
4. **Un seul signe, monochrome d'abord, lisible de 16 à 512 px, trait unique sur grille de 4 px.** Les marques d'outils sobres (Linear, Raycast, Arc) tiennent en monochrome. Sources : DS 9.1 et 9.3 (Paul Rand, test à 16 px, usage monochrome de Linear), AR 4 (famille « forme géométrique abstraite »).
5. **Registre : sobre, précis, durable, instrument de bord ; pas spectaculaire.** Sources : IG 5.3 et 5.4 (tailoring, pièces qui durent, foils et stations spatiales, aucune save néon ou brutaliste), DS 8 (Linear vise « neutre et intemporel »), AR 5 (les outils rapides sont sombres, monochromes, un accent).
6. **Vérifier les collisions avant de proposer.** Deux des trois noms de DS 9.2 sont déjà pris dans un domaine voisin : **« Vigie » est un tableau de bord auto-hébergé français avec tâches et agenda** (github.com/tristanbasb/vigie) ; **« Quart » est un framework web Python connu**, et l'app « Quartrix » fait de la gestion de tâches. « Cap » est trop courant pour être cherché. Sources : W (recherche du 2026-10-07), DS 9.2.
7. **Police du logotype sous licence libre d'auto-hébergement.** Geist (OFL, avec Geist Pixel) et Mona Sans (OFL, axe de largeur 75 à 125 %) conviennent ; **Satoshi et General Sans (licence ITF de Fontshare) interdisent l'auto-hébergement, la conversion et le sous-ensemble sans accord écrit**. Sources : GH 4, W (madegooddesigns.com/fontshare, uwarp.design), R1 4.

### Pièges

- Nom déjà porté par un outil du même domaine (voir 6) ou proche de ses projets (Spircle, Stage, EDHEC AI).
- Vocabulaire de mode IA (« brain », « copilot », « AI », étincelles) : marqueurs du « look IA » (FO 6.6, IG famille A).
- Accent ou caractère spécial dans le nom (Repère) : saisie et URL pénibles (DS 9.2).
- Logo généré par Stitch ou une IA et livré tel quel : il doit être retracé à la main en SVG (R1 21).
- Copier la charte ou le logo d'une marque (awesome-design-md sert de matière, pas de modèle : GH 6.1).
- Nom de promesse (« Superhuman ») : prétentieux pour un outil personnel (AR 2.12).
- Ses saves ne disent **rien** sur nom, logo ou palette (IG 5.11) : une proposition qui s'en réclame se trompe.

### Critères mesurables pour les juges

| N° | Critère | Seuil |
|---|---|---|
| I1 | Longueur du nom | 1 ou 2 syllabes, 8 lettres au plus, sans accent ni signe |
| I2 | Test de dictée | 3 phrases (« ouvre X », « range ça dans X », « X de demain ») transcrites correctement 3 fois sur 3 |
| I3 | Collisions | aucun dépôt GitHub de plus de 100 étoiles ni app de productivité du même nom ; aucun mot commun avec ses projets ; recherche citée dans la proposition |
| I4 | Lisibilité du logo | reconnaissable à 16 px (favicon) et 512 px ; fonctionne en monochrome blanc sur fond de la charte et noir sur clair |
| I5 | Construction | grille de 4 px, une épaisseur de trait, 3 formes au plus, SVG livré |
| I6 | Sens | le logo porte une information vivante (date, compteur) **ou** la proposition explique pourquoi elle y renonce |
| I7 | Interdits | aucune étincelle, aucun dégradé, aucune lettre décorative, aucun pictogramme décoratif |
| I8 | Licence | polices du logotype sous OFL ou licence équivalente autorisant l'auto-hébergement |
| I9 | Déclinaisons | favicon, en-tête du rail, écran d'ouverture du rituel, montrés sur le vrai fond |

---

## Axe 2. Charte graphique

### Enseignements

1. **En sombre, l'élévation se fait par la luminosité des surfaces, pas par les ombres.** 4 à 5 surfaces espacées d'environ 0,035 à 0,055 en L (OKLCH), filets d'un pixel ; ombres réservées aux couches flottantes (deux couches minimum). Sources : DS 2.1 (consensus de guides, Raycast sans ombre), AR 2.10 et 3.1 (Linear, Raycast), R1 22.
2. **Un seul accent, réservé aux états interactifs et aux statuts ; la couleur sert l'information.** Sources : AR 5 (aucune marque de référence ne multiplie les accents), DS règle 3, R1 22, GH 6.2 (skill `frontend-design` : 4 à 6 couleurs nommées, un seul élément mémorable).
3. **Jetons OKLCH par rôle, échelle de 12 étapes, thème généré par 3 variables (base, accent, contraste).** Compatible avec son système `data-charte` : le Studio bascule de charte en changeant deux nombres. Sources : DS 3.1 (Radix, Linear, Stripe, Vercel Geist), GH 2.4 (Tailwind 4 natif en OKLCH), AR 2.6, R1 3.
4. **Les textes secondaires actuels sont trop pâles.** Mesures : `--text-muted` APCA Lc 50, `--text-faint` Lc 37, `--border-strong` 1,85:1 (échoue le critère WCAG 1.4.11 des composants). Correctifs calculés : texte secondaire L 0,79 (Lc 64), filet de contrôle L 0,52 (3,1:1). Sources : DS 3.2 et 3.3 (calcul), FO 6.7 (lisibilité avant esthétique, témoignage TDAH), IG (Impeccable range « texte gris sur fond coloré » parmi les défauts).
5. **Plages et tâches distinguées par la forme, pas seulement la couleur.** Plage = bloc plein avec trait de 3 px à gauche ; tâche = fond translucide et contour pointillé ; couleurs Okabe-Ito ; une famille de teintes par couleur pour passé, à venir, sélection. Le rose (cours) et l'orange (tâches) actuels se confondent en vision deutan. Sources : DS 3.4, AR 2.5 (Cron : famille de teintes), AR 2.3 (Motion : tâche « fantôme » en pointillés).
6. **Éviter les marqueurs du design généré.** Beige et crème avec accent orange, serif italique en titre, « chip soup » (une puce sur chaque ligne), cartes dans des cartes, point qui pulse, noir pur, cartes arrondies identiques à ombre douce. La colonne « À ranger » actuelle (cartes et puces) est directement visée. Sources : FO 6.6 (billet « The AI Aesthetic », 378 points), IG famille A (12 saves, Impeccable), GH 6.2 (`frontend-design`).
7. **Rayons concentriques et boutons rectangulaires.** Rayon extérieur = rayon intérieur + marge ; échelle 6 / 10 / 16 px ; boutons en rectangle d'environ 8 px, pilule réservée à un seul bouton d'en-tête. Sources : DS 5 (consensus), AR 5 (b).
8. **Typographie : deux familles et une mono au plus, chiffres tabulaires partout où il y a des heures.** Geist Sans et Geist Mono restent ; échelle 1,125 à 1,2 ; `tabular-nums` sur heures, durées, compteurs. Sources : DS 4 (Vercel guidelines), GH 4, R1 4.

### Pièges

- Préréglage shadcn appliqué sans retouche : « les sites shadcn se ressemblent tous » (GH 2.1, README de tweakcn). Rhea (compact) est le seul cohérent avec l'agenda ; Luma (aéré) contredit la densité.
- Modifier les échelles Radix : casse leurs garanties de contraste ; ajouter ses échelles à côté (DS 3.1).
- Grain, mesh gradients, border beam permanent, halo derrière du texte dense (DS 2.3 à 2.5, 8).
- Verre (`backdrop-filter`) sur l'agenda ou les cartes : réservé aux couches flottantes (DS 2.2, Apple WWDC25 et Josh Comeau).
- Reprendre les couleurs d'un site marketing (Superhuman, Notion) : ce sont des vitrines, pas des outils (AR 7.4).
- Juger le contraste au seul WCAG 2 en sombre : il surestime le contraste près du noir (DS 3.2, APCA).

### Critères mesurables pour les juges

| N° | Critère | Seuil |
|---|---|---|
| C1 | Texte de corps | WCAG 7:1 ou plus et APCA Lc 75 ou plus sur sa surface |
| C2 | Texte secondaire | Lc 60 ou plus ; métadonnées Lc 45 et 4,5:1 au minimum ; jamais de corps en couleur « faint » |
| C3 | Filets de contrôle (champs, cases, boutons secondaires) | 3:1 ou plus contre le fond adjacent |
| C4 | Surfaces | 4 ou 5 niveaux, écart de L entre 0,03 et 0,06 ; aucune ombre sur un élément non flottant |
| C5 | Accent | une seule teinte d'accent ; présente uniquement sur interactif, sélection, focus ou statut (vérifiable par recherche du jeton) |
| C6 | Couleurs en tout | accent + 3 sémantiques (succès, alerte, danger) + 3 catégories d'agenda au plus |
| C7 | Jetons | OKLCH dans `@theme` ; la charte se régénère en changeant 3 variables (démontré dans le Studio) |
| C8 | Daltonisme | plages et tâches distinguables en niveaux de gris et en simulation deutéranopie |
| C9 | Rayons | valeurs dans {6, 10, 16} px, emboîtées ; une pilule au plus par écran |
| C10 | Chiffres | `tabular-nums` sur 100 % des heures, durées et compteurs |
| C11 | Anti-look IA | zéro des marqueurs listés en 6 (audit Impeccable ou liste manuelle jointe) |
| C12 | Modes | sombre complet ; clair au moins pour la lecture des mails |

---

## Axe 3. Composants et micro-interactions

### Enseignements

1. **Ne pas recoder menus, modales, popovers, tiroirs : primitives accessibles, puis style.** shadcn sur Base UI (défaut confirmé par l'annonce shadcn de juillet 2026), Radix en réserve. Sources : IG (save buildwithnico : collisions, clic extérieur, accessibilité), GH 2.1 et 2.2, R1 2.
2. **La fréquence d'un geste fixe son animation.** Plus de 100 fois par jour : aucune ; dizaines de fois (ranger, cocher, déplacer un bloc) : 0 à 120 ms sans rebond ; occasionnel (menus, toasts) : 150 à 250 ms ; modales et tiroirs : 200 à 500 ms ; rare (rituels) : on peut y mettre du soin. Toute animation est interruptible et ne bloque jamais le clic. Sources : DS 6.1 et 6.2 (Emil Kowalski), FO 6.1 (fil HN de 546 points : « 300 ms est déjà trop », « attendre la fin d'une animation est le pire défaut »), IG (Impeccable : 150 ms au survol, 160 ms à l'appui).
3. **Courbe ease-out forte, jamais d'ease-in ; animer seulement `transform` et `opacity` ; en mouvement réduit, retirer les déplacements et garder l'opacité.** Courbe de référence `cubic-bezier(0.23, 1, 0.32, 1)` ; appui de bouton `scale(0.97)` ; entrée à partir de 0,95, jamais de 0. Sources : DS 6.1 et 3.5 (Emil, MDN), R1 1, FO P9.
4. **Annuler plutôt que confirmer, et réponse optimiste avec un état d'échec explicite.** Après « ranger » ou « déplacer », un toast « Rangé dans Demain 14h : Annuler » ; l'interface répond sans attendre le serveur, mais affiche un échec de synchronisation au lieu de mentir. Sources : R1 7, FO 6.2 (fil « How's Linear so fast ? », 497 points, objections sur le chemin d'échec), AR 1.7 (Superhuman sous 100 ms, Linear), GH 3.3.
5. **Palette de commande avec grammaire stricte.** Raccourci affiché à côté de chaque action, Entrée = action principale, aperçu de l'effet, destructif en rouge, raccourci configurable (Ctrl+K est pris par certains navigateurs), jamais la seule voie d'accès ; variante propre à lui : « Dis-le à Claude » en tête, qui enveloppe la `CommandBox` existante. Sources : AR 3.1 (Akiflow, Linear, Raycast, Superhuman, Cron), FO 6.4 (fil de 321 points), IG (World Monitor, 619 commandes au Ctrl-K), GH 3.2.
6. **Une touche = un verbe pour le triage de « À ranger ».** Accepter, refuser, doublon, reporter (Linear) ; E fait, B reporter (Superhuman). Sources : AR 2.6, 2.12 et 3.1, R1 18, FO 6.5.
7. **Une grammaire d'états de tâche lisible sans couleur.** À l'heure, en cours, en retard, ne rentre pas, fantôme (proposée mais non posée : pointillés, plus clair), verrouillée ; plus un état « attend ta réponse » en ambre pour ce que Claude a proposé. Sources : AR 2.3 (page officielle Motion, meilleure grammaire trouvée), DS 3.4 (codage redondant), IG (Codenotch : ambre quand l'agent attend).
8. **Peu de pièces animées, choisies.** Transitions de layout des blocs (Motion `layout`, avec `layoutScroll` car l'agenda défile), chiffres animés (NumberFlow) pour les compteurs, `Kbd` pour afficher les raccourcis, verre sur palette, popovers et toasts seulement. Sources : GH 2.3, 3.4, 2.1 ; IG 4.3 (Motion Primitives : animated number, morphing dialog) ; DS 2.2.

### Pièges

- Kits d'effets de page d'accueil (meteors, particles, spotlight, glow, magnétique, texte qui scintille, shimmer permanent) : GH 5.1, IG 4.3, FO 6.6.
- Vaul (non maintenu, README) ; Motion `Reorder` pour la grille (une seule liste) ; `<ViewTransition>` (exige React 19.3, projet en 19.2.8) : GH 2.3, 3.3, 7.
- Squelettes de chargement animés : réserver la hauteur des blocs vaut mieux (FO 6.3).
- Commandes trop petites, fiche de tâche dense, accueil en plusieurs étapes (FO 6.7, témoignage TDAH).
- Copier un composant de 21st.dev ou coss UI sans vérifier sa licence (AGPL dans coss) : GH 5.1, R1 12.
- Sons et haptique : aucune preuve d'effet, contraires à sa règle sans notification (DS 7, AR 3.2).

### Critères mesurables pour les juges

| N° | Critère | Seuil |
|---|---|---|
| K1 | Cibles | 24 x 24 px au minimum (44 px en mobile) ; `:focus-visible` sur 100 % des éléments focalisables |
| K2 | Durées | gestes fréquents 120 ms au plus sans rebond ; aucune animation au-delà de 300 ms hors tiroirs, modales et rituels (500 ms au plus) |
| K3 | Courbes et propriétés | aucune ease-in ; seules `transform` et `opacity` sont animées |
| K4 | Interruptibilité | aucun clic ignoré pendant une animation (test : cliquer pendant la transition) |
| K5 | Mouvement réduit | sous `prefers-reduced-motion`, plus aucun déplacement ni zoom, fondus conservés |
| K6 | Annulation | toute écriture réversible propose Annuler en 1 clic, visible 4 s au moins ; zéro boîte de confirmation pour une action réversible |
| K7 | Vitesse perçue | retour visuel sous 100 ms ; indicateur de chargement seulement après 150 à 300 ms, maintenu 300 ms au moins |
| K8 | Palette | ouverture au clavier, raccourcis en `Kbd`, Entrée exécute l'action principale, destructif en rouge, raccourci modifiable |
| K9 | États de tâche | 5 états au moins, distinguables en niveaux de gris |
| K10 | Primitives | menus, popovers, dialogues, tiroirs, toasts sur Base UI ou Radix ; aucun piège à focus écrit à la main |
| K11 | Effets | zéro effet décoratif permanent ; un effet continu au plus, réservé à la tâche en cours et coupé en mouvement réduit |

---

## Axe 4. Fonctionnalités

Ancrage : DIAGNOSTIC du 2026-10-06 (60 tâches ouvertes dont environ 40 en retard, 95 rappels « Oublié hier ? » intacts, aucune fin de vie). Chaque fonctionnalité doit dire lequel de ces trois problèmes elle règle.

### Enseignements

1. **Tout élément a une fin de vie par défaut.** Une tâche sans date, intacte depuis N jours, passe seule dans une réserve repliée puis disparaît, avec un compteur discret des expirés ; le « un jour peut-être » sort du système actif. Sources : FO 2 et 3 (5 commentateurs HN lus : leaky bucket, purgatoire, archivage à 1 ou 2 mois), AR 1.4 (Linear, Arc, Reclaim, Things).
2. **Plafonner la journée, pas l'ambition.** 3 priorités du jour au plus ; charge cible affichée en heures estimées contre heures disponibles (Sunsama conseille 5 à 6 h engagées sur 8), alerte à l'approche et au dépassement. Sources : FO P2, AR 1.5 (Sunsama, Akiflow ; plainte contre Motion qui tasse les journées), R1 14.
3. **Claude propose sous aperçu, Thibaut valide ; jamais de planning imposé.** Mode aperçu, validation de tout ou élément par élément, option « journée libre ». Sources : AR 1.2 et 2.7 (Reclaim 2.0, billet d'ingénierie Dropbox), FO 5.2 et P6 (abandon de Motion après six semaines), R1 20.
4. **Des rituels courts, en une carte.** Matin en moins de 2 minutes (hier, aujourd'hui, ce qui attend) ; soir « fait, reporté, abandonné » avec un seul bouton de report ; synthèse du dimanche. Le rituel long fait fuir. Sources : AR 1.6 et 2.1 (Sunsama, Akiflow), FO 3.6 et P14 (rituel utile contre accueil trop long), IG (save nocode.joshua : briefing du matin, bilan du soir, synthèse hebdo), R1 14 et 16.
5. **Timeboxing par glisser, en blocs successifs déplaçables.** Glisser une tâche de « À ranger » vers la grille, régler la durée par la poignée, empiler des blocs indépendants dans une plage ; les blocs sont des intentions, avec un report groupé (+30 min, demain) d'un geste. Sources : R1 15, FO 3.5 et P5 (« le bloc est une suggestion, pas un contrat »), AR 2.2 et 2.8 (Akiflow Time Slots, bouton de dépôt de Things, report en bloc de Todoist), GH 3.1 (aucune bibliothèque ne gère la durée par poignée : à écrire).
6. **Date de début distincte de l'échéance ; échéances dures visibles sans push.** La tâche dort jusqu'à son jour ; les échéances qui comptent (Gorilla, candidatures, paiements) ont un bandeau à compte à rebours et une fiche-dossier (« Bain 02/11 » : date, prépa, contacts, tâches, dernier mail). Sources : FO P3 et P13, AR 2.8 (Things), IG 2C et 4.8 (World Monitor : dossier qui s'ouvre au clic ; candidatures = son vrai pipeline).
7. **Tout ce que Claude pose est traçable.** Chaque suggestion porte son « pourquoi » et sa source cliquable (le mail d'origine) ; un journal « ce que Claude a changé » ; une pastille « Claude attend ta réponse ». Sources : FO 5.4 et P7 (fil « AI HUDs », 979 points : bouton de source sur chaque élément), IG 2C (Anara : bulle qui ouvre le passage source ; Codenotch), AR 1.2.
8. **Mails en boîtes divisées, relance si pas de réponse.** Cabinets, EDHEC, candidatures, personnes à relancer ; un fil revient s'il reste sans réponse (networking, recruteurs). Sources : AR 2.12 (Superhuman), IG famille F (candidatures et relances au premier plan).

### Pièges

- Auto-planification totale (Motion) : opacité, journées tassées (AR 2.3, FO 5.2).
- Points ou séries qui punissent l'arriéré (Karma de Todoist) : avec 40 retards, pure culpabilité (AR 2.13).
- Report automatique silencieux des retards (FO 8.1).
- Remplacer l'agenda sur mesure par FullCalendar, Schedule-X ou react-big-calendar : perte de la distinction plage / tâche (GH 3.7, R1).
- Accumuler des fonctions : refaire l'outil chaque semaine est une procrastination (FO 2) ; « une seule chose bien faite » (FO 6.7).
- Notifications push, sons (DS 7, AR 7.6) ; écritures dans les démos (contrat STUDIO : lecture seule).

### Critères mesurables pour les juges

| N° | Critère | Seuil |
|---|---|---|
| F1 | Diagnostic | chaque fonctionnalité nomme le problème réglé (retards, rappels ignorés, « À ranger » qui grossit) |
| F2 | Fin de vie | chaque liste a une règle chiffrée (jours avant réserve, jours avant disparition) et un compteur d'expirés |
| F3 | Plafond | 3 priorités visibles au plus ; charge du jour en heures estimées sur heures disponibles, alerte au dépassement |
| F4 | Contrôle | toute action de Claude passe par un aperçu, accepte la validation élément par élément et l'option « rien aujourd'hui » |
| F5 | Rituels | matin en 2 minutes et 3 étapes au plus, sur une carte ; soir en 1 carte ; zéro questionnaire |
| F6 | Glisser | tâche vers créneau en 1 geste ; durée par poignée au pas de 15 min ; report groupé en 1 geste |
| F7 | Traçabilité | 100 % des suggestions issues d'un mail ouvrent leur source en 1 clic |
| F8 | Surfaces | zéro notification push ; une seule surface de bilan |
| F9 | Contrat de démo | lecture seule des vraies données, aucune Server Action ni écriture |
| F10 | Clavier | chaque verbe de triage a une touche unique, affichée dans l'infobulle |

---

## Pile conseillée

Pile du projet : Next 16.3.5, React 19.2.8, Tailwind 4, Supabase ; aucune bibliothèque d'interface installée. « Déclaré » = peer npm, non testé ici. Tout s'installe sur une branche, versions épinglées.

| Rôle | Bibliothèque (version lue) | Compatibilité | Risque |
|---|---|---|---|
| Socle de composants | shadcn/ui, CLI 4.21.4, préréglage Rhea puis jetons retouchés | Next 16 + React 19 + Tailwind 4 + Base UI prouvés par un gabarit de 7,1 k étoiles | Faible ; `shadcn init` réécrit `globals.css` : relire le diff ; rendu générique si non retouché |
| Primitives | `@base-ui/react` 1.8.0 (Drawer, Toast, Combobox, Menu) ; Radix en réserve | Déclaré React 17 à 19 | Faible ; iOS Safari 26 : `position: relative` sur `body`, `isolation: isolate` sur la racine |
| Animation | `motion` 14.0.0 (ou rester en 13.5.x), composant `m` + `LazyMotion` | Déclaré React 18 ou 19 ; ticket Turbopack limité à Motion+ payant | Moyen : la 14.0.0 a cinq jours ; `layoutScroll` obligatoire dans l'agenda |
| Couleurs | Jetons OKLCH dans `@theme`, échelle 12 étapes à la Radix | CSS natif Tailwind 4 | Nul ; mesurer le contraste (C1 à C3) |
| Icônes | `lucide-react` 1.52.0 | Déclaré jusqu'à React 19 | Faible ; une seule famille par écran |
| Notifications | Toast shadcn sur Base UI (ou `sonner` 2.0.8) | Déclaré React 18 ou 19 | Faible |
| Palette | `cmdk` 1.1.1 via `Command` (ou `kbar` 1.0.0 pour un registre d'actions avec raccourcis) | Tickets React 19 fermés ; kbar tourne dans le gabarit Next 16 | Faible ; cmdk sans envoi depuis 2025-10 ; dépend de Radix Dialog même sur socle Base UI |
| Glisser | `@atlaskit/pragmatic-drag-and-drop` 4.0.0 ; prototype possible avec `drag` de Motion | Indépendant de React | Moyen : tactile à tester ; poignée de durée à écrire soi-même |
| Raccourcis | `react-hotkeys-hook` 5.3.3 ou hook maison de 30 lignes | Déclaré React 16.8 ou plus | Faible |
| Chiffres animés | `@number-flow/react` 0.6.2 | Déclaré React 18 ou 19 | Moyen (0.x) |
| Saisie naturelle | `chrono-node` 2.10.2, module français seul, plus analyseur maison des durées | Sans dépendance | Moyen : ambiguïtés de date |
| Graphique (écran de bilan seul) | Recharts 3.10.1 via `Chart` | Déclaré jusqu'à React 19, `override` de `react-is` | Moyen ; inutile sur le Cockpit |
| Polices | Geist Sans et Mono (OFL) ; option Mona Sans ou Geist Pixel pour l'affichage | `next/font` | Faible ; Satoshi et General Sans exclus en auto-hébergement |
| Audit de rendu (outil de dev) | Impeccable (Apache 2.0, `npx impeccable install`) | Agent, hors bundle | Moyen : lire README et code avant ; popularité de mode |

**Ordre d'adoption** : (1) jetons OKLCH et contraste corrigé ; (2) shadcn sur Base UI, Motion, Lucide ; (3) Toast « Annuler », tiroir, palette ; (4) glisser et blocs successifs ; (5) rituels, NumberFlow, chrono-node ; (6) écran de bilan avec Recharts.

**À écarter** : Vaul (non maintenu), Tremor (peer React 18 seulement), Planby (licence propriétaire), FullCalendar, Schedule-X et react-big-calendar (perte plage / tâche), Motion+ (payant, couvert par le gratuit), react-spring et AutoAnimate (doublons de Motion), `<ViewTransition>` (React 19.3 requis), Magic UI, React Bits et Aceternity comme fondation, ui-ux-pro-max-skill sans lecture préalable, Spline, Haikei, Manus.

---

## Ce que ses saves Instagram imposent

Contraintes tirées de saves recoupées sur le web (IG), à vérifier par les juges sur chaque proposition :

1. **Ne pas ressembler à un site généré par IA** : c'est le seul thème de design récurrent (12 saves). Toute proposition passe l'audit anti-look IA (critère C11) ; l'ennemi est le banal, pas le laid.
2. **Un système en couches, pas un dessin unique** : primitives, bibliothèque de mouvement, banque de composants copiés, et un **document de direction artistique écrit une fois** (voix, couleurs, polices, rayons, durées) que Claude relit, pendant visuel de `MA_VOIX.md` (saves antoineblanco99, kingarms.ai, nocode.joshua « kit de marque »).
3. **Motion comme moteur d'animation** (4 saves : Framer Motion, motion.dev, Motion Primitives), mais dans les bornes de l'axe 3 : micro-interactions, pas site cinématique.
4. **Sobre, durable, densité maîtrisée** : tailoring et pièces qui durent, bars intimistes, et pourtant World Monitor (très dense) enregistré. Il refuse le bruit, pas l'information. Aucune 3D, aucun Spline, aucun néon.
5. **Un instrument de bord qui expose un état** (inférence : foils, stations spatiales, encoche Codenotch) : lecture rapide, une couleur d'alerte unique, état de Claude visible (ambre quand il attend).
6. **Un tableau de bord de vie qui se met à jour seul** : briefing du matin, bilan du soir, synthèse hebdomadaire en une carte (nocode.joshua, kingarms.ai). Il a déjà l'agenda ; il lui manque le bilan.
7. **Sources cliquables** sous chaque suggestion (Anara) et **état de session et de quota visible** (9 saves sur les jetons et limites).
8. **Les gestes sont d'abord des phrases** : il pilote par la parole ; la palette commence par « Dis-le à Claude ».
9. **Rien sur nom, logo ou palette** dans ses saves : ces axes partent de ses valeurs (sobre, précis, durable) et de son choix en voyant, jamais d'une prétendue préférence Instagram.
10. **Hygiène** : les pubs Manus ne sont pas des recommandations ; rien ne s'installe depuis un « commente pour recevoir » ou un dépôt cloné en série (Codenotch : au moins neuf copies) sans auteur, licence et dernier commit vérifiés.

## Sources ajoutées par cette passe (W, 2026-10-07)

- Vigie, tableau de bord auto-hébergé : https://github.com/tristanbasb/vigie
- Quartrix (gestion de tâches) : https://apps.apple.com/us/app/quartrix-todo-for-balance/id6738711519
- Licence ITF de Fontshare (Satoshi, auto-hébergement soumis à accord écrit) : https://madegooddesigns.com/fontshare/ ; https://www.uwarp.design/blog/satoshi-font-guide ; https://www.fontshare.com/fonts/satoshi
- Geist (`font-feature-settings` et jeux stylistiques via npm ; chiffres tabulaires non mentionnés sur la page, à tester) : https://vercel.com/font

## Points faibles et vérifications (relecture critique, 2026-10-07)

### Vérifié par WebSearch (3 points)

1. **`<ViewTransition>` écarté à tort ou à raison, non tranché.** Le fichier dit « React 19.3 requis, projet en 19.2.8 ». Deux sources web disent l'inverse pour Next 16.3 et plus : le composant marche dans l'App Router avec le React canary embarqué, sans rien installer (le projet est en Next 16.3.5). Navigateurs : Chromium 125+, Firefox 144+, Safari 18.2+. En revanche un ticket react/react #37614 signale que le mode enter/exit n'est pas activé en navigation Next 16. **Correction : la ligne « À écarter » devient « à tester sur branche »** ; ne pas l'exclure d'office des juges.
2. **shadcn sur Base UI** : la source unique (un gabarit de 7,1 k étoiles) est dépassée. Le changelog officiel indique que Base UI est désormais le défaut des nouveaux projets, avec composants publiés pour Radix, Base UI et React Aria. Fiabilité relevée : faible risque confirmé.
3. **Glisser tactile** (contradiction R1/GH) : le README annonce iOS et Android, mais un ticket (#112) signale un échec du glisser sur Android depuis Chrome 128, et des retours jugent l'appui long trop long. **La contradiction reste ouverte** : test sur son téléphone obligatoire, et prévoir un repli (boutons « déplacer »).

### Angles non couverts ou fragiles

- **Mobile** : à peine mentionné (2 occurrences). Pas de critère juge (taille des cibles tactiles, 44 px, clavier virtuel, bascule rail/barre basse).
- **Accessibilité** : contraste seul mesuré. Manquent `prefers-reduced-motion`, navigation clavier du glisser, annonces lecteur d'écran des Toast.
- **Performance** : aucun budget (poids JS ajouté par Motion, Recharts, cmdk, chrono-node ; LCP/INP).
- **Coût** : rien sur les coûts (Supabase, polices, quota de jetons de Claude pour piloter).
- **Maintenance solo** : une quinzaine de bibliothèques dont des 0.x et une version de 5 jours (motion 14.0.0). Il faut un plafond de dépendances et une règle de mise à jour.
- **Sources uniques présentées comme consensus** : les chartes de marques sont rétro-ingéniérées par des tiers ; les « forums » se limitent à HN et MPU ; « confirmé par deux sources » repose parfois sur des fichiers eux-mêmes issus des mêmes pages.

### Reste incertain

Compatibilités React 19 = peers déclarés, jamais installés ; effet de `shadcn init` sur `globals.css` ; ViewTransition (ticket #37614) ; glisser tactile ; versions du 2026-10-07 qui bougent vite.
