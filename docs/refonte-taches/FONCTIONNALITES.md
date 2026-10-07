# Fonctionnalités : 13 idées en trois paniers, 4 maquettées (2026-10-07)

Maquette interactive : `/demo/fonctionnalites` (vraies données en lecture seule, état local, journal « Ce qui serait écrit »). Code : `app/demo/fonctionnalites/page.js`, `components/demo/fonctionnalites/*`. Grille de critères : `RECHERCHE-PROFONDE.md`, axe 4 (F1 à F10). Codes de source : AR = `recherche/apps-reference.md`, FO = `recherche/reddit.md` (en fait Hacker News et Mac Power Users : Reddit n'a jamais été lu), GH = `recherche/github.md`, IG = `recherche/instagram.md`.

## Failles d'abord (classées par gravité)

1. **Les durées n'existent nulle part.** Les fonctionnalités 2, 3 et 4 reposent sur une durée estimée par tâche ; la table `tasks` n'a pas cette colonne. La maquette les devine du titre (« appeler » = 15 min, « lettre » = 1 h 30, « cas » = 1 h...) : c'est une heuristique de ma part, pas une mesure. En vrai, c'est Claude qui estimerait à la création, et si l'estimation est fausse la jauge ment. Mesurer l'écart estimé contre réel pendant deux semaines avant de s'y fier.
2. **Treize fonctionnalités, c'est le piège que les forums décrivent.** « Refaire l'outil chaque semaine est une procrastination » (FO 2, jmayhugh, tf2). Les 116 h du total ne se font pas. Je recommande 4 fonctionnalités (5, 1, 3, 2), puis les deux déjà maquettées (voir « Ordre de réalisation »), pas 13.
3. **La fin de vie n'a pas encore de prise sur ta base.** La table a 16 jours : à 14 jours de réserve et 30 de disparition, la maquette montre 11 actives, 5 en réserve et 0 expirée (mesuré le 2026-10-07). Les seuils 14 et 30 viennent de commentaires HN, pas d'un essai sur toi. Et « intacte depuis N jours » est approximé par l'âge de création : il manque une colonne de dernière modification (1 h de plus).
4. **Le plafond suppose 9h-12h et 14h-19h tous les jours.** Ton vrai rythme va souvent jusqu'à 22h (DIAGNOSTIC). Avec ce créneau, aujourd'hui n'a que 4 h 30 de libre (3 h 30 de cours), 3 h engagées contre une cible de 3 h 15 : c'est juste, mais ça dépend entièrement de la fenêtre et du pourcentage choisis. À rendre réglables.
5. **Le coût de l'aperçu (4) est le moins sûr.** 14 h, avec plus ou moins 50 %, parce que l'écriture groupée dans Google Agenda et l'annulation n'ont jamais été exercées sous aperçu. Reclaim 2.0 est en bêta privée selon une source secondaire (AR 2.7).
6. **Le glisser (8) n'a pas été simulé.** Une fausse version sans bibliothèque mentirait sur le tactile, qui est son risque : le README de pragmatic-drag-and-drop dit iOS et Android, un ticket signale un échec sur Android depuis Chrome 128 (RECHERCHE-PROFONDE, points faibles). Test sur ton téléphone obligatoire, avec boutons « déplacer » en repli.
7. **Les preuves viennent d'un public de développeurs.** HN et Mac Power Users : peu d'étudiants, rien sur le conseil ou la finance. Les saves Instagram prouvent un intérêt, pas qu'un outil est bon.

## Ordre de réalisation recommandé

| Étape | Fonctionnalités | Heures | Pourquoi dans cet ordre |
|---|---|---|---|
| 1 | 5 date de début, 1 fin de vie, 3 plafond | 17 | Les moins chères, aucune ne dépend d'une autre, et elles s'attaquent aux 40 retards et à « À ranger » dès la première semaine |
| 2 | 2 budget de temps | 12 | Rend le plafond honnête (durées réelles) ; à lancer avec une semaine de mesure |
| 3 | 4 aperçu | 14 | Seulement quand 2 et 3 donnent des chiffres fiables : l'aperçu propose à partir d'eux |
| 4 | 6 rituels, 9 échéances | 17 | Déjà maquettés (`/demo/bilan`, `/demo/echeances`) ; reprise de code |

Total conseillé : 60 h. Le reste attend d'avoir vécu avec ça trois semaines.

## Panier 1 : indispensables (43 h)

Ils réparent les trois problèmes du diagnostic : 40 tâches en retard, 95 rappels « Oublié hier ? » intacts, « À ranger » qui grossit.

### 1. Fin de vie par défaut (6 h) : maquette, panneau 1
- **Ce que ça fait** : sans vraie date, un élément passe en réserve repliée après 14 jours et disparaît après 30, en laissant un compteur. Les vraies échéances (candidature, test, examen, dépôt) et les paiements récurrents sont exemptés ; les retards dont la date vient d'un bloc posé par Claude comptent (option). Toucher à un élément remet son âge à zéro.
- **Moment** : à l'ouverture du site (rangement forcé), calculé chaque nuit par la routine.
- **Référence** : Linear (le backlog que l'on ose purger), Arc (archivage automatique), Things (Un jour), Reclaim (clôture automatique) ; AR 1.4.
- **Preuve** : FO 2 et 3 (jerf, stavros, ergonaught, elamje, butz : leaky bucket, purgatoire, archiver au-delà d'un à deux mois) ; Linear et Arc, sources primaires.
- **Effort** : 6 h. `dropped_at` et `snoozed_until` existent déjà (`supabase/ranger.sql`) ; reste la règle dans la routine, la zone repliée et le compteur.
- **Problème réglé** : « À ranger » qui grossit. Critères F1, F2.

### 2. La tâche est un budget de temps (12 h) : maquette, panneau 2
- **Ce que ça fait** : une durée estimée par tâche ; les blocs de l'agenda la consomment ; ce qui est fait hors bloc se consigne ; le reste se lit en cellules de 15 minutes (fait plein, posé en pointillé, reste vide). Un bloc passé non consigné demande « fait ou pas ? » au lieu de fabriquer une notification. États : posée, sans bloc, en retard, verrouillée, dort, faite (grammaire de Motion).
- **Moment** : à la création (Claude estime), puis pendant la journée.
- **Référence** : Reclaim (durée totale, démarrer, consigner du travail hors bloc, reporter la tâche entière, verrouiller) ; AR 1.1 et 2.3.
- **Preuve** : aide Reclaim et billet Dropbox (primaires) ; FO 5.5 (krono : le bloc est une suggestion, pas un contrat).
- **Effort** : 12 h. Deux colonnes (`estimate_min`, `spent_min`), l'estimation écrite par le skill `planifier`, la bande de cellules, consigner et reporter.
- **Problème réglé** : les 95 rappels ignorés (un bloc passé sans coche ne dit rien aujourd'hui). Critères F1, F6, F4.

### 3. Une journée qui a un plafond (7 h) : maquette, panneau 3
- **Ce que ça fait** : pour chacun des 5 jours, heures engagées contre heures libres (fenêtre de travail moins les plages, un bloc de tâche posé sur un cours rendant ce temps travaillable), cible réglable (70 % par défaut), trois priorités au plus avec le reste replié, alerte à l'approche et au dépassement, décalage proposé d'un clic.
- **Moment** : le matin en posant la journée, puis à chaque ajout.
- **Référence** : Sunsama (charge cible, 5 à 6 h engagées sur 8), Akiflow (2 à 3 objectifs) ; Motion en contre-exemple (tasse les journées) ; AR 1.5.
- **Preuve** : FO 3.2 et P2 (geoffaire : 3 choses au plus ; butz : limite dure, ajouter oblige à retirer) ; Sunsama, source primaire.
- **Effort** : 7 h. Capacité calculée depuis les événements déjà lus, jauge, champ de priorité du jour, alerte.
- **Problème réglé** : 40 retards et 2 tâches faites en 7 jours. Critères F3, F8.

### 4. Claude propose, tu valides (14 h) : maquette, panneau 4
- **Ce que ça fait** : toute replanification passe par un aperçu en pointillé dans un agenda bac à sable ; validation ligne par ligne ou en bloc ; journée libre déclarable ; chaque ligne porte son pourquoi et sa source ; un journal « ce que Claude a changé » avec annulation. Un bloc par tâche, successifs, jamais « X + Y ».
- **Moment** : chaque fois que Claude replanifie, souvent le soir ou le dimanche.
- **Référence** : Reclaim 2.0 (mode aperçu, un bouton de revue), Akiflow (Aki demande confirmation) ; Motion en contre-exemple ; AR 1.2 et 2.7.
- **Preuve** : aide Reclaim et billet d'ingénierie Dropbox (primaires) ; FO 5.2 et P6 (Matt_Lockett : six semaines puis abandon ; option « rien aujourd'hui ») ; FO 7 P7 (afro88 : un bouton de source par élément).
- **Effort** : 14 h. Le placement existe en partie dans le skill `planifier` ; reste la table d'aperçu, l'écran de revue, l'écriture groupée et l'annulation.
- **Problème réglé** : blocs mal posés découverts après coup, doublons fabriqués par la boucle. Critères F4, F7, F8.

### 5. Date de début distincte de l'échéance (4 h) : non maquettée
- **Ce que ça fait** : la tâche dort jusqu'à sa date de début (`snoozed_until`, déjà là) et apparaît seule ce jour-là ; l'échéance reste une date limite à part, sans bruit avant.
- **Moment** : à la création, puis chaque matin au réveil des tâches.
- **Référence** : Things (À venir), OmniFocus ; AR 2.8.
- **Preuve** : FO 3.4 et P3 (kstrauser, koliber, Show HN « do et due », 160 points).
- **Effort** : 4 h (filtre dans `splitTasks`, champ dans la fiche, réveil dans la routine).
- **Problème réglé** : « À ranger » qui grossit de choses lointaines. Non maquettée : trop simple pour apprendre quelque chose d'une démo.

## Panier 2 : fortes (41 h)

### 6. Rituels courts, matin et soir (9 h) : déjà maquettée dans `/demo/bilan`
- **Ce que ça fait** : le matin en 3 étapes et moins de 2 minutes (hier, aujourd'hui, ce qui attend) ; le soir une seule carte : fait, reporté, abandonné. Zéro questionnaire. Remplace les 95 notifications.
- **Moment** : à l'ouverture le matin ; entre 18h30 et 22h le soir (il travaille souvent jusqu'à 22h).
- **Référence** : Sunsama (rituel en cinq temps, version courte), Akiflow (arrêt du jour) ; AR 1.6.
- **Preuve** : FO 3.6 et P14 (Terretta contre jbverschoor : le questionnaire d'accueil est trop long) ; save nocode.joshua (briefing du matin, bilan du soir).
- **Effort** : 9 h (reprise de `ReviewLogic`, arrêt de l'étape 4 bis de la routine). Critère F5.

### 7. Tout ce que Claude pose est traçable (8 h) : en partie dans le panneau 4
- **Ce que ça fait** : chaque suggestion porte son pourquoi et sa source en un clic ; journal « ce que Claude a changé » ; pastille « Claude attend ta réponse » (ambre).
- **Moment** : à chaque suggestion ; relecture le soir.
- **Référence** : Reclaim 2.0 (journal), fil « AI HUDs » ; AR 1.2.
- **Preuve** : FO 5.4 et P7 (afro88, fil à 979 points) ; save Anara (bulle qui ouvre le passage source).
- **Effort** : 8 h (table `claude_log`, `source_ref` sur les tâches). Critère F7.

### 8. Report groupé et glisser, durée par poignée (16 h) : non maquettée
- **Ce que ça fait** : décaler tout un bloc de 30 minutes ou à demain d'un geste (3 h à lui seul) ; glisser une tâche sur la grille et régler la durée par une poignée au pas de 15 minutes (13 h).
- **Moment** : quand la journée déraille, en plein travail.
- **Référence** : Akiflow (Time Slots), Things (bouton de dépôt), Todoist (report en bloc) ; AR 2.2 et 2.8.
- **Preuve** : FO 3.5 (TheSocialAndrew : décaler tous les blocs d'un geste ; krono) ; GH 3.1 (aucune bibliothèque ne gère la durée par poignée : à écrire).
- **Effort** : 16 h, dont 13 incertaines (tactile). Critère F6. Le report groupé seul se fait sans risque.

### 9. Échéances dures et fiche-dossier (8 h) : déjà maquettée dans `/demo/echeances`
- **Ce que ça fait** : bandeau à compte à rebours (tests Gorilla, candidatures, paiements) sans notification ; chaque échéance ouvre sa fiche : date, prépa, contacts, tâches, dernier mail.
- **Moment** : chaque matin ; avant un test ou un entretien.
- **Référence** : Things (échéance), Due (retours d'usage), World Monitor (save) ; AR 2.8.
- **Preuve** : FO P13 (dealtek, jmayhugh, geoffaire, wvp, confiance faible à moyenne) ; saves Instagram 2C et 4.8.
- **Effort** : 8 h (reprise de `DeadlinesLogic`). Critère F8 (zéro push).

## Panier 3 : bonus (32 h)

### 10. Mails en boîtes divisées et relances (10 h)
Cabinets, EDHEC, candidatures, personnes à relancer ; un fil revient s'il reste sans réponse après N jours. Moment : tri chaque jour, relances le vendredi. Référence : Superhuman (AR 2.12). Preuve : blog Superhuman (primaire), saves Instagram famille F. Effort : 10 h, car la détection « sans réponse » demande les fils Gmail à la synchro.

### 11. Mode partiels (5 h)
Un contexte actif du 14 au 23 octobre qui baisse le plafond, endort tout ce qui n'est pas examen jusqu'au 24 et affiche le compte à rebours ; un second pour les tests Gorilla (26 au 30). Référence : Arc (Spaces), Things (Quand vous voulez) ; AR 2.11. Preuve : le DIAGNOSTIC donne les dates (21 à 23 octobre, 26 à 30 pour Bain). Effort : 5 h, mais dépend de 1, 3 et 5 déjà en place.

### 12. Habitudes à fenêtre flexible (11 h)
Tennis, drills, relances : heures par semaine, jours, heure idéale ; l'habitude se déplace seule quand l'agenda se remplit. Moment : le dimanche, à la revue de la semaine. Référence : Reclaim (Habitudes, AR 2.7). Preuve : aide Reclaim (primaire) ; aucun forum lu ne la confirme. Effort : 11 h.

### 13. Saisie naturelle et durée au clavier (6 h)
« appeler Bruno demain 14h = 15 » : dates en français, durée après « = », abréviations t+1. Référence : Akiflow (jetons), Todoist, Things (saisie sous 1 seconde). Preuve : FO P11 (thornjm, raybb). Effort : 6 h avec `chrono-node` (module français). Valeur faible : il saisit en parlant à Claude (14 messages sur 929 parlent du dashboard).

## Pourquoi ces quatre sont maquettés

1. **Elles forment une chaîne** : la durée (2) alimente la charge (3), la charge cadre ce que Claude propose (4), et la fin de vie (1) vide le stock qui les nourrit.
2. **Aucune n'était démontrée** : le triage (`/demo/tri`), le bilan, la journée et les échéances ont déjà leurs pages (fonctionnalités 6 et 9 comprises).
3. **On ne les juge pas sur papier** : le bon seuil de réserve, la lecture des cellules, la jauge et les blocs en pointillé se décident en les manipulant.

Écartées de la maquette : 5 (trop simple), 6 et 9 (déjà montrées), 7 (incluse dans le panneau 4), 8 (le tactile ne se simule pas).

### Ce que la maquette apprend déjà sur tes vraies données (2026-10-07)
- **Budget** : 31 tâches ouvertes, environ 15 h 15 de reste à faire (durées devinées), dont 11 h 30 sans bloc, contre 23 h 20 libres sur 5 jours : ça rentre, mais seulement en plein jour ouvré chaque jour.
- **Plafond** : aujourd'hui a 4 h 30 libres et 3 h engagées (cible 3 h 15, alerte « tu approches ») ; jeudi 8 engage 6 h pour une cible de 5 h, donc dépasse d'1 h.
- **Aperçu** : 8 propositions de blocs pour les retards, tous posés dans des créneaux libres, hors plages.

## Bibliothèques de la recherche à utiliser en vrai

La maquette est en React, Tailwind et CSS, sans dépendance ajoutée. En vrai (RECHERCHE-PROFONDE, pile conseillée) :
- **Motion** (composant `m` avec `LazyMotion`, `layoutScroll` dans l'agenda) : cellules du budget, apparition des blocs en pointillé.
- **@number-flow/react** (0.x, risque moyen) : durées, compteurs d'expirés, heures de la jauge.
- **Toast Base UI** (ou Sonner) : bouton Annuler de chaque geste (optimiste, avec état d'échec explicite).
- **@atlaskit/pragmatic-drag-and-drop** : seulement pour 8, et la poignée de durée reste à écrire.
- **chrono-node** (module français) : seulement pour 13.
- Aucune pour les panneaux 1 à 3 : la règle, la capacité et la jauge sont du calcul et du CSS.

## Questions pour trancher (réponds « 1 oui 2 non 3 bof »)

1. Seuils de la fin de vie : réserve à 14 jours, disparition à 30 ?
2. Plafond : cible à 70 % du temps libre, fenêtre 9h-12h et 14h-19h (ou 9h-22h) ?
3. Maximum trois priorités du jour, le reste replié ?
4. Tout ce que Claude replanifie passe par un aperçu à valider, avec « journée libre » ?
5. Une colonne de durée estimée par tâche, estimée par Claude à la création ?
6. On commence par les quatre des étapes 1 et 2 (5, 1, 3, 2) et on s'arrête là trois semaines avant le reste ?
