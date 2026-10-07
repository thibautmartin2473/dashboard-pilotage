# Décisions de Thibaut pour la refonte (2026-10-07)

Après le Studio des vitrines (branche `demo/vitrines`) :

1. **Charte** : Graphite, en **sombre**, mais « un peu plus clair, une sorte d'équilibre » : fond
   gris graphite moyen plutôt que presque noir, surfaces nettement détachées, texte doux.
   Polices Geist et Geist Mono, un seul accent bleu.
2. **Navigation** : rail latéral (repliable en icônes ; tiroir sur téléphone).
3. **Organisation** : le Cockpit, en **pleine largeur d'écran**, avec une **vue sur 5 jours
   directement visible** (J à J+4) ; les tâches vivent dans les blocs de l'agenda.
4. **Une seule liste « À ranger » sur le côté**, qui regroupe tâches, idées et propositions issues
   des mails. Pour chaque élément, le site **propose intelligemment où le recaser** (bloc et raison).
   Cinq gestes : **Valider** la suggestion, **Affecter ailleurs**, **Cocher** (fait),
   **Supprimer**, **Remettre à plus tard**.
5. **Rangement forcé en début de session** : à l'ouverture, tant qu'il reste des éléments d'avant
   aujourd'hui à ranger, un écran plein les présente un par un ; on ne peut pas le fermer sans
   avoir tout traité (« Plus tard » compte comme traité). Il remplace le « Bilan d'hier » et les
   notifications « Oublié hier ? » (étape 4 bis de la routine, à retirer à la mise en ligne).
6. **Mails côte à côte** : à gauche ce qui arrive sur thibautmartin04@gmail.com (source `gmail`),
   à droite thibaut.martin95429@edhec.com (source `edhec`).
7. Questions non tranchées : la reco du questionnaire s'applique. « Supprimer » garde l'historique
   (statut abandonné, `dropped_at`) ; « Plus tard » revient le dimanche suivant (`snoozed_until`).

Lot 2, plus tard (BACKLOG) : bande Échéances avec alerte « aucune préparation prévue »,
récurrences (loyer, EDHEC), 3 priorités du jour, revue du dimanche, relances de personnes.
