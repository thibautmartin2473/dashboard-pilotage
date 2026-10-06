'use client';

// Propriétaire : agent « chartes » (kit de composants + vues de section communes).
// Les organisations peuvent remplacer une vue via `sections` dans leur meta ; sinon ces vues
// servent à toutes les navigations, et chaque charte les habille par les jetons.
import AgendaView from './Agenda';
import TachesView from './Taches';
import EcheancesView from './Echeances';
import IdeesView from './Idees';
import MailsView from './Mails';
import AppsView from './Apps';
import RevueView from './Revue';

export const SECTION_VIEWS = {
  agenda: AgendaView,
  taches: TachesView,
  echeances: EcheancesView,
  idees: IdeesView,
  mails: MailsView,
  apps: AppsView,
  revue: RevueView,
};
