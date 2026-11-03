# 6. Constellation (graphe du vault)

Périmètre : fond animé et vue plein écran du graphe du vault, plugin Obsidian `constellation-cockpit`, `/api/hooks/vault-graph`, `lib/constellation-sim.js`. (`D\` = `docs\claude-branches\`, voir la racine du projet.)

Le graphe du vault Obsidian (notes = points, liens = traits), animé façon Obsidian, en fond du Cadran et
en vue plein écran. Spécification : section 7 de `Projets/dashboard-pilotage-demo/docs/refonte-taches/SPEC.md`.

- **Données** : le plugin Obsidian `constellation-cockpit` (désactivé tant que la table n'existe pas)
  envoie `{nodes, links}` à `POST /api/hooks/vault-graph` (secret `HOOK_SECRET` en `x-hook-secret` ou
  `Authorization: Bearer`, 413 au-delà de 5 000 notes ou 2 Mo mesurés en octets ; secret comparé en temps constant). Contrat d'un noeud : `path`, `name`,
  `group`, `type` (Hub, Fiche, Cours et cas, Outil Claude, Note, PDF, Image, Save Instagram), `degree` ;
  chaque chaîne est tronquée à 500 caractères, `degree` est un entier borné à [0, 100000] (sinon 0) ;
  un lien est `[index, index]`. Une seule ligne en base (`vault_graph`, id `vault`, RLS sans policy anon).
  **Le plugin envoie vers l'URL de PRODUCTION** : la route n'est utile qu'une fois la PR mergée sur `main`.
- **SQL à exécuter par Thibaut** (jamais par Claude : base de production) : `supabase/vault-graph.sql`.
  Tant que la table manque, `loadVaultGraph()` (`lib/vault-graph.js`) renvoie `null` sans erreur : le
  fond ne dessine rien, la vue plein écran affiche « en attente de la première synchronisation ».
- **Fichiers** : `lib/constellation-sim.js` (moteur de forces pur, grille spatiale, sans DOM),
  `components/Constellation.js` (canvas, modes `fond` et `plein`), `components/ConstellationFond.js`
  (à poser dans `#cadran-fond`), `app/constellation/page.js` (vue plein écran : le rail n'y est pas rendu, le lien Retour prend le focus et un texte rappelle que le graphe se manipule à la souris ou au doigt), `app/api/vault-graph/route.js`
  (lecture pour le fond, Basic Auth du site, `?since=` pour ne rien renvoyer si le graphe n'a pas changé).
- **Modes** : `fond` = décor pleine fenêtre derrière le Cockpit (monté une fois dans `app/(cadran)/layout.js` ; positions finales gardées dans le navigateur, voir `D\cockpit-ui.md` point 4) (opacité 0,55 réglable par la prop
  `opacite`, aucune interaction, un clic sur une zone de fond libre ouvre `/constellation`) : **figé**
  (demande de Thibaut du 2026-10-08, latence ressentie) : simulation calculée par tranches de 6 ms rendues
  au navigateur, sans dessin intermédiaire, un seul dessin final, aucune animation CSS (elle forçait le
  recalcul du flou du verre posé par-dessus). `plein` = molette pour zoomer, glisser pour se déplacer, glisser un point pour le
  déplacer, survol qui allume les voisins, clic qui ouvre la note via `obsidian://open`.
- **Règles de coût (à garder)** : aucun token, tout tourne dans le navigateur. La simulation tourne à
  l'ouverture et quand on interagit, puis refroidit et S'ARRÊTE (plus de calcul ni de
  `requestAnimationFrame`). Pause totale quand l'onglet est caché. `prefers-reduced-motion` : rendu figé
  à l'état final. Le graphe est comparé par signature de contenu : `AutoRefresh` (60 s) ne relance jamais
  la simulation si rien n'a changé, et un graphe modifié garde les positions des noeuds connus.
  `ConstellationFond` sans prop `graph` se charge seul (au montage puis toutes les 5 min onglet visible)
  pour ne pas relire 200 Ko en base à chaque rafraîchissement de la page.
- **Couleurs** : celles du kit (dégradés de bleu et de gris, point = type, lien = thème), ne pas les remplacer.
