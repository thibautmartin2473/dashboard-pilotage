import Link from 'next/link';
import LienAttente from '../LienAttente';
import { CARD } from '../card';
import { FocusTitle } from '../ui';
import { buildAvancement, summaryPosts, syncInfo } from '@/lib/avancement';
import { Barre, PastilleRetard } from './AvancementParts';

// Résumé COMPACT d'avancement, SOUS la disposition du Cockpit de l'accueil (on y descend en faisant défiler la
// page) : une barre rapide par grand poste (méthode de cas, tests en ligne, lettres, réseau, fit, partiels), les
// retards d'abord. Pas de cartes détaillées : chaque poste mène à sa ligne dans l'onglet Avancement (/avancement),
// qui porte TOUT le détail. Composant serveur ; les lignes viennent de la table `avancement` avec leurs textes déjà
// calculés (scripts/push-avancement.mjs).

const TEXTE = {
  en_retard: 'font-semibold text-[var(--late-text)]',
  dans_les_temps: 'text-[var(--ink-muted)]',
  en_avance: 'text-[var(--action-ink)]',
};

function Poste({ p }) {
  const late = p.status === 'en_retard';
  return (
    <li>
      <Link
        href={p.href}
        data-testid="avancement-poste"
        data-statut={p.status ?? 'sans-mesure'}
        className={`relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 rounded-lg border-l-[3px] px-2.5 py-1.5 hover:bg-[var(--btn-fill)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--focus)] sm:grid-cols-[minmax(0,11rem)_minmax(4rem,1fr)_minmax(0,15rem)] ${
          late ? 'border-[var(--late)] bg-[var(--late-soft)]' : 'border-transparent'
        }`}
      >
        <span className={`min-w-0 truncate text-sm ${late ? 'font-semibold' : 'text-[var(--ink)]'}`}>{p.title}</span>
        {p.status ? (
          <span className="col-span-2 row-start-2 sm:col-span-1 sm:col-start-2 sm:row-start-1">
            <Barre l={{ barPct: p.barPct, traitPct: p.traitPct, statut: p.status, ticks: 0 }} />
          </span>
        ) : (
          <span className="hidden sm:block" />
        )}
        <span className={`tabular col-start-2 row-start-1 min-w-0 text-right text-xs sm:col-start-3 ${TEXTE[p.status] ?? 'text-[var(--ink-muted)]'}`}>{p.text}</span>
        <LienAttente className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-[var(--action)]" />
      </Link>
    </li>
  );
}

export default function AvancementResume({ rows, showHidden = false, now }) {
  const view = buildAvancement(rows, { showHidden });
  const sync = syncInfo(rows, now);
  const postes = summaryPosts(view);
  const stale = sync && sync.ageHours > 36;

  return (
    <section id="avancement" aria-labelledby="avancement-resume-titre" className={`${CARD} flex shrink-0 flex-col overflow-hidden`}>
      <h2 id="avancement-resume-titre" className="flex min-h-10 shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--line)] px-4 py-2 text-sm font-semibold">
        <FocusTitle href="/avancement">Avancement</FocusTitle>
        {sync && (
          <span className="tabular flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-normal text-[var(--ink-muted)]">
            {view.late > 0 && <PastilleRetard>{`${view.late} en retard`}</PastilleRetard>}
            {view.ok > 0 && <span>{`${view.ok} dans les temps`}</span>}
            {view.ahead > 0 && <span>{`${view.ahead} en avance`}</span>}
          </span>
        )}
        {sync && (
          <span className={`tabular ml-auto text-xs font-normal ${stale ? 'font-semibold text-[var(--late-text)]' : 'text-[var(--ink-muted)]'}`} data-testid="avancement-sync">
            {stale ? `Données du ${sync.label} : la synchronisation du soir n'a pas tourné` : `Mis à jour le ${sync.label}`}
          </span>
        )}
      </h2>

      {!sync ? (
        <p className="px-4 py-4 text-sm text-[var(--ink-muted)]" role="status" data-testid="avancement-vide">
          En attente de la première synchronisation.
        </p>
      ) : (
        <>
          <ul className="grid gap-x-6 gap-y-0.5 p-2 md:grid-cols-2" data-testid="avancement-resume">
            {postes.map((p) => (
              <Poste key={p.id} p={p} />
            ))}
          </ul>
          <p className="px-4 pb-2 text-xs text-[var(--ink-muted)]">
            <Link href="/avancement" className="underline hover:no-underline">
              Tout le détail dans l&apos;onglet Avancement
            </Link>
          </p>
        </>
      )}
    </section>
  );
}
