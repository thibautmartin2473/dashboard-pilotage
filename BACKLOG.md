# Idées d'amélioration en attente

Règle de Thibaut (2026-09-24) : ses idées s'accumulent ici, **sans PR à chaque fois**.
On code et on ouvre une seule PR groupée quand il y en a assez, ou quand il le demande.
Livrée → supprimer la ligne dans la PR qui la livre.

## À faire

- [ ] **« Mes apps » éclaté** (2026-09-24). Supprimer le panneau/onglet « Mes apps » : chaque app
  devient sa propre box sur l'accueil, au même rang que les autres panneaux (masquable,
  réordonnable via « Organiser la page »), mais en format compact, pas plus grosse que nécessaire.
- [ ] **Catégories d'agenda éditables** (2026-09-29). Aujourd'hui 3 catégories figées
  (`lib/home.js`, `CATEGORY_COLOR_ID` : Cours EDHEC rouge, Tâche orange, Autre bleu). Pouvoir en
  créer, renommer, supprimer et choisir leur couleur depuis le site. Point à trancher : la
  couleur ne remonte pas dans Google (11 couleurs `colorId` possibles seulement), et les conflits
  distinguent aujourd'hui « tâche » et « plage » : une nouvelle catégorie doit dire de quel côté elle est.
