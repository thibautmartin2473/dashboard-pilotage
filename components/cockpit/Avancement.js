import { CARD } from '../card';
import { buildAvancement, syncInfo } from '@/lib/avancement';

// Bloc « Avancement » du Cockpit, SOUS la disposition fixe de l'accueil (agenda, À ranger, mails). Quatre groupes
// (Strategy Boost, Carrière, Cours EDHEC, Autre), chaque ligne triée du plus en retard au plus en avance : un
// libellé clair, une courte explication, une barre de niveau, un TRAIT vertical = où il devrait être aujourd'hui,
// la valeur et un statut en toutes lettres. Composant serveur : les lignes viennent de la table `avancement`
// (scripts/push-avancement.mjs, 0 token) avec leurs textes déjà calculés ; rien ne se recalcule ici.
// Charte : jetons de app/globals.css seulement, un statut n'est jamais la seule couleur (le mot l'accompagne).

// Pastille de statut : un mot, doublé de la teinte (texte sur fond teinté : jetons -ink, contraste >= 5:1).
const STATUT = {
  en_retard: 'bg-[var(--late-soft)] text-[var(--late-ink)]',
  dans_les_temps: 'bg-[var(--btn-fill)] text-[var(--ink)]',
  en_avance: 'bg-[var(--action-soft)] text-[var(--action-ink)]',
};
// Remplissage de la barre : corail = retard, bleu acier sinon.
const REMPLI = { en_retard: 'bg-[var(--late)]', dans_les_temps: 'bg-[var(--action)]', en_avance: 'bg-[var(--action-press)]' };

function Barre({ l }) {
  const trait = l.traitPct == null ? null : `min(max(${l.traitPct}%, 1px), calc(100% - 1px))`;
  return (
    <div className="relative h-5" aria-hidden="true">
      <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-[var(--btn-fill)]">
        <div className={`h-full rounded-full ${REMPLI[l.statut] ?? 'bg-[var(--ink-muted)]'}`} style={{ width: `${l.barPct}%` }} />
        {Array.from({ length: Math.max(0, l.ticks - 1) }, (_, i) => (
          <span key={i} className="absolute inset-y-0 w-px bg-[var(--card-solid)]" style={{ left: `${((i + 1) / l.ticks) * 100}%` }} />
        ))}
      </div>
      {trait && (
        <span
          className="absolute top-0 h-5 w-0.5 -translate-x-1/2 rounded-full bg-[var(--ink)]"
          style={{ left: trait }}
          title={`Où il devrait être aujourd'hui : ${l.attenduText}`}
        />
      )}
    </div>
  );
}

function Ligne({ l }) {
  const late = l.statut === 'en_retard';
  const attendu = l.measured && l.attenduText ? `attendu aujourd'hui : ${l.attenduText}` : '';
  const echeance = l.echeanceText ? `pour le ${l.echeanceText}` : '';
  const meta = [attendu, echeance].filter(Boolean).join(' · ');
  // Détail : utile et lisible pour les compteurs (lettres, réseau, jalons) ; pour un niveau, juste en infobulle.
  const showDetail = l.detail && l.kind !== 'niveau';
  return (
    <li
      className={`rounded-xl border-l-[3px] px-3 py-2 ${late ? 'border-[var(--late)]' : 'border-transparent'}`}
      data-testid="avancement-ligne"
      data-statut={l.statut ?? 'sans-mesure'}
      title={l.kind === 'niveau' ? l.detail : undefined}
    >
      <p className="flex min-w-0 items-center gap-2">
        {l.typeLabel && <span className="shrink-0 rounded-md bg-[var(--btn-fill)] px-1.5 py-0.5 text-xs font-medium text-[var(--ink)]">{l.typeLabel}</span>}
        <span className="min-w-0 text-sm font-medium break-words">{l.label}</span>
      </p>
      {l.explication && <p className="mt-0.5 text-xs break-words text-[var(--ink-muted)]">{l.explication}</p>}
      {showDetail && (
        <p className={`mt-0.5 text-xs break-words ${l.kind === 'compteur' ? 'line-clamp-3' : ''} text-[var(--ink)]`} title={l.detail}>
          {l.detail}
        </p>
      )}

      {l.measured ? (
        <>
          <div className="mt-1.5 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <Barre l={l} />
            </div>
            <span className="tabular shrink-0 text-sm font-semibold">{l.valueText}</span>
          </div>
          <p className="mt-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <span className="tabular min-w-0 text-xs text-[var(--ink-muted)]">{meta}</span>
            {l.statutText && (
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUT[l.statut] ?? 'bg-[var(--btn-fill)] text-[var(--ink)]'}`}>{l.statutText}</span>
            )}
          </p>
        </>
      ) : (
        <p className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span className="rounded-full bg-[var(--card-inset)] px-2 py-0.5 text-xs font-medium text-[var(--ink)]">{l.valueText || 'pas de mesure'}</span>
          <span className="tabular min-w-0 text-xs text-[var(--ink-muted)]">{l.echeanceText ? `pour le ${l.echeanceText}` : ''}</span>
        </p>
      )}
    </li>
  );
}

function Groupe({ g, wide = false }) {
  return (
    <section aria-labelledby={`av-${g.id}`} data-testid={`avancement-${g.id}`}>
      <h3 id={`av-${g.id}`} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 border-b border-[var(--line)] px-3 pb-1.5">
        <span className="text-sm font-semibold">{g.title}</span>
        {g.echeances.length > 0 && <span className="tabular text-xs text-[var(--ink-muted)]">{`échéance${g.echeances.length > 1 ? 's' : ''} : ${g.echeances.join(', ')}`}</span>}
        {g.late > 0 && (
          <span className="tabular ml-auto rounded-full bg-[var(--late-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--late-ink)]">{`${g.late} en retard`}</span>
        )}
      </h3>
      {g.note && <p className="px-3 pt-1.5 text-xs text-[var(--ink-muted)]">{g.note}</p>}
      <ul className={`mt-1 grid gap-x-3 ${wide ? 'lg:grid-cols-2' : ''}`}>
        {g.lignes.map((l) => (
          <Ligne key={l.key} l={l} />
        ))}
      </ul>
    </section>
  );
}

export default function Avancement({ rows, now }) {
  const view = buildAvancement(rows);
  const sync = syncInfo(rows, now);
  const boost = view.groups.find((g) => g.id === 'strategy-boost');
  const others = view.groups.filter((g) => g !== boost);
  const stale = sync && sync.ageHours > 36;

  return (
    <section id="avancement" aria-labelledby="avancement-titre" className={`${CARD} flex shrink-0 flex-col overflow-hidden`}>
      <h2 id="avancement-titre" className="flex min-h-10 shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--line)] px-4 py-2 text-sm font-semibold">
        <span>Avancement</span>
        {sync && (
          <span className="tabular flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-normal text-[var(--ink-muted)]">
            {view.late > 0 && <span className="rounded-full bg-[var(--late-soft)] px-2 py-0.5 font-semibold text-[var(--late-ink)]">{`${view.late} en retard`}</span>}
            {view.ok > 0 && <span>{`${view.ok} dans les temps`}</span>}
            {view.ahead > 0 && <span>{`${view.ahead} en avance`}</span>}
            {view.unmeasured > 0 && <span>{`${view.unmeasured} sans mesure`}</span>}
          </span>
        )}
        {sync && (
          <span className={`tabular ml-auto text-xs font-normal ${stale ? 'font-semibold text-[var(--late-text)]' : 'text-[var(--ink-muted)]'}`} data-testid="avancement-sync">
            {stale ? `Données du ${sync.label} : la synchronisation du soir n'a pas tourné` : `Mis à jour le ${sync.label}`}
          </span>
        )}
      </h2>

      {!sync ? (
        <p className="px-4 py-6 text-sm text-[var(--ink-muted)]" role="status" data-testid="avancement-vide">
          En attente de la première synchronisation.
        </p>
      ) : (
        <div className="grid gap-x-8 gap-y-6 p-3 pb-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {boost && <Groupe g={boost} wide />}
          {others.length > 0 && (
            <div className="space-y-6">
              {others.map((g) => (
                <Groupe key={g.id} g={g} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
