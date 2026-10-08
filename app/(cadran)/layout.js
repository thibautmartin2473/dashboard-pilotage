import AutoRefresh from '@/components/AutoRefresh';
import ConstellationFond from '@/components/ConstellationFond';

// Cadre commun des cinq vues du Cockpit (/, /agenda, /a-ranger, /mails, /brain). Les noms de dossier entre
// parenthèses ne changent pas l'URL (groupe de routes). Un layout n'est pas remonté quand on passe d'une vue
// à l'autre : ce qui est ici garde son état et ses éléments DOM pendant toute la navigation.
//  - le fond Constellation (#cadran-fond) : un seul canvas, le graphe (/api/vault-graph) n'est téléchargé et
//    calculé qu'une fois, au lieu d'une fois par vue ;
//  - AutoRefresh : un seul minuteur de relecture (60 s), qui ne repart pas à zéro à chaque navigation ;
//  - la hauteur de la fenêtre : sur grand écran (>= 1280 px) la page tient dans la fenêtre (`xl:h-dvh`), seule
//    la zone de chaque vue défile.
// Le rail est dans le layout racine (app/layout.js). Le bandeau « Maintenant » et la fenêtre Commande restent
// dans les pages (components/cockpit/CockpitShell.js) : ils ont besoin des données de chaque page.
// Les écrans d'attente sont les `loading.js` de chaque vue (components/cockpit/Squelettes.js) : ils se posent
// dans ce cadre, qui reste à l'écran.
export default function CadranLayout({ children }) {
  return (
    <div className="flex min-h-full flex-col xl:h-dvh xl:overflow-hidden">
      {/* Sans prop : le fond charge le graphe seul (/api/vault-graph, toutes les 5 min), pour ne pas
          relire 200 Ko en base à chaque rafraîchissement de 60 s de la page. */}
      <div id="cadran-fond" aria-hidden="true" className="fixed inset-0 -z-10">
        <ConstellationFond />
      </div>
      <AutoRefresh />
      {children}
    </div>
  );
}
