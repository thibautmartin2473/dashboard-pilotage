// Registre du Studio : trois axes indépendants qui se combinent librement.
// Chaque emplacement a un fichier propriétaire (voir docs/refonte-taches/STUDIO.md) :
// on n'ajoute pas d'entrée ici sans créer le fichier correspondant.
import { CHARTES } from './chartes-meta';
import NavRail from './nav/Rail';
import NavOnglets from './nav/Onglets';
import NavPalette from './nav/Palette';
import NavFil from './nav/Fil';
import { NAV_META } from './nav/meta';
import OrgCockpit from './org/cockpit/Home';
import OrgJournal from './org/journal/Home';
import OrgConsole from './org/console/Home';
import OrgQg from './org/qg/Home';
import { META as COCKPIT } from './org/cockpit/meta';
import { META as JOURNAL } from './org/journal/meta';
import { META as CONSOLE } from './org/console/meta';
import { META as QG } from './org/qg/meta';

export { CHARTES };

export const NAVS = [
  { id: 'rail', Component: NavRail, ...NAV_META.rail },
  { id: 'onglets', Component: NavOnglets, ...NAV_META.onglets },
  { id: 'palette', Component: NavPalette, ...NAV_META.palette },
  { id: 'fil', Component: NavFil, ...NAV_META.fil },
];

export const ORGS = [
  { id: 'cockpit', Component: OrgCockpit, ...COCKPIT },
  { id: 'journal', Component: OrgJournal, ...JOURNAL },
  { id: 'console', Component: OrgConsole, ...CONSOLE },
  { id: 'qg', Component: OrgQg, ...QG },
];

// Sections communes à toutes les navigations. « accueil » est rendu par
// l'organisation choisie ; les autres par components/demo/studio/sections/
// (sauf si l'organisation fournit sa propre vue, via `sections` dans son meta).
export const SECTIONS = [
  { id: 'accueil', label: 'Accueil' },
  { id: 'agenda', label: 'Agenda' },
  { id: 'taches', label: 'Tâches' },
  { id: 'echeances', label: 'Échéances' },
  { id: 'idees', label: 'Idées' },
  { id: 'mails', label: 'Mails' },
  { id: 'apps', label: 'Apps et projets' },
  { id: 'revue', label: 'Revue' },
];
