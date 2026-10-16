# Idées d'amélioration en attente

Règle de Thibaut (2026-09-24) : ses idées s'accumulent ici, **sans PR à chaque fois**.
On code et on ouvre une seule PR groupée quand il y en a assez, ou quand il le demande.
Livrée → supprimer la ligne dans la PR qui la livre.

## À faire

- [ ] **« Mes apps » éclaté** (2026-09-24). Supprimer le panneau/onglet « Mes apps » : chaque app
  devient sa propre box sur l'accueil, au même rang que les autres panneaux (masquable,
  réordonnable via « Organiser la page »), mais en format compact, pas plus grosse que nécessaire.
- [ ] **Renommer tout « dashboard-pilotage » en « Cadran »** (2026-10-14, « pas tout de suite, mais il
  faudra le faire un jour »). L'UI dit déjà « Cadran » (titre, manifest). Inventaire du 14/10 : environ
  490 occurrences (29 dans ce repo, 443 dans GLOBAL dont 186 dans des journaux régénérés à ne pas
  toucher, 14 dans `~/.claude`). Trois niveaux : (1) le visible (realm Basic Auth de `proxy.js`,
  `package.json`, `public/privacy.html` et `terms.html` qui disent « Dashboard Thibaut », groupe
  « Dashboard » de la barre latérale), sans risque ; (2) les dossiers `Projets\dashboard-pilotage` et
  `Vault/02 Projets/Fiches projets/dashboard-pilotage/` : une trentaine de chemins à corriger d'un coup (tâches
  planifiées `refresh-dashboard-agenda-mails` et `ranger-sessions-veille`, regex du mod atelier
  `register.tsx` et `palette.ts`, `vault-sync/state.json`, `pilote-nuit/taches.json`, skills
  `planifier` et `design-greffe`, `install-taches.ps1`, `roadmap.json` + `SELF_PROJECT_SLUG` à changer
  ensemble), et les liens `[[dashboard-pilotage]]` du vault ; (3) l'URL Vercel
  `dashboard-pilotage-omega.vercel.app`, codée en dur dans les hooks de Spircle et EDHEC AI et le
  plugin Obsidian : plutôt ajouter un alias « cadran » en gardant l'ancienne. Faire 1 puis 2 dans une
  session dédiée, jamais en remplacement de texte aveugle (casse les liens).

## Lot 2 du Cockpit (décidé le 2026-10-07, après la refonte « À ranger », voir docs/refonte-taches/DECISIONS.md)

- [ ] **Bande Échéances** avec alerte « aucune préparation prévue » : les vraies échéances (candidatures à date, paiements, tests en ligne) séparées des to-do de travail, et une alerte quand une échéance proche n'a aucun bloc de préparation avant elle.
- [ ] **Récurrences** : loyer, paiements EDHEC et autres tâches qui reviennent (aujourd'hui 6 lignes pour 2 paiements récurrents).
- [ ] **3 priorités du jour** : peu de choses visibles à la fois, le reste replié.
- [ ] **Revue du dimanche** : les éléments reportés avec « Plus tard » reviennent le dimanche suivant ; une revue guidée pour les passer en revue d'un coup.
- [ ] **Relances de personnes** : networking et relances (une dizaine de tâches ouvertes) avec la date du dernier contact.
