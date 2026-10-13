import { CARD } from '../card';
import { buildAvancement, headerNotes, joursDepuis, syncInfo, frShortDate } from '@/lib/avancement';
import AvancementReglage from './AvancementReglage';
import { Barre, PastilleRetard } from './AvancementParts';

// Onglet « Avancement » (/avancement) : TOUT le détail. Quatre groupes (Strategy Boost, Carrière, Cours EDHEC, Autre
// masqué par défaut), chaque ligne triée du plus en retard au plus en avance. Les RETARDS passent devant et se voient :
// carte pleine teintée, filet corail épais, titre plus grand, pastille de statut pleine alignée à droite, barre
// épaisse. Les lignes « dans les temps » et « en avance » sont en retrait : une seule ligne fine, texte gris, pastille
// remplacée par un mot. Composant serveur : les lignes viennent de la table `avancement` (scripts/push-avancement.mjs,
// 0 token) avec leurs textes déjà calculés ; rien ne se recalcule ici.

// Statut des lignes en retrait : un mot, discret (jamais la seule couleur).
const MOT = { dans_les_temps: 'text-[var(--ink-muted)]', en_avance: 'text-[var(--action-ink)]' };

function Puce({ label, className = '' }) {
  return label ? <span className={`shrink-0 rounded-md bg-[var(--btn-fill)] px-1.5 py-0.5 text-xs font-medium text-[var(--ink)] ${className}`}>{label}</span> : null;
}

// Ligne EN RETARD : la plus visible. La pastille de statut reste dans la rangée du titre, alignée à droite, et ne
// passe jamais sous « attendu aujourd'hui ».
function LigneRetard({ l }) {
  const meta = [l.attenduText && `attendu aujourd'hui : ${l.attenduText}`, l.echeanceText && `pour le ${l.echeanceText}`].filter(Boolean).join(' · ');
  return (
    <li
      id={l.id}
      className="scroll-mt-4 rounded-xl border-l-[6px] border-[var(--late)] bg-[var(--late-soft)] px-3.5 py-3"
      data-testid="avancement-ligne"
      data-statut="en_retard"
    >
      <div className="grid grid-cols-1 items-start gap-x-3 gap-y-1.5 sm:grid-cols-[minmax(0,1fr)_auto]">
        <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <Puce label={l.typeLabel} />
          <span className="min-w-0 text-base font-semibold break-words">{l.label}</span>
        </p>
        <span className="justify-self-end rounded-full bg-[var(--late-ink)] px-3 py-1 text-sm font-bold whitespace-nowrap text-[var(--action-text)]" data-testid="avancement-statut">
          {l.statutText}
        </span>
      </div>
      {l.explication && <p className="mt-1 text-xs break-words text-[var(--ink-muted-on-tint)]">{l.explication}</p>}
      {l.detail && l.kind !== 'niveau' && <p className="mt-1 text-xs break-words text-[var(--ink)]">{l.detail}</p>}
      <div className="mt-2 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <Barre l={l} grande />
        </div>
        <span className="tabular shrink-0 text-base font-bold">{l.valueText}</span>
      </div>
      {meta && <p className="tabular mt-1 text-xs text-[var(--ink-muted-on-tint)]">{meta}</p>}
      {l.ancienne && <p className="mt-1 text-xs font-semibold text-[var(--late-ink)]">{`Ancienne valeur du ${l.ancienne} : la source était illisible au dernier calcul`}</p>}
    </li>
  );
}

// Ligne DANS LES TEMPS ou EN AVANCE (et sans mesure, examen passé) : en retrait, une ligne fine. Sur grand écran
// quatre colonnes alignées d'une ligne à l'autre ; sur téléphone, titre et statut sur la première ligne, barre et
// valeur sur la seconde.
function LigneCalme({ l }) {
  const title = [l.explication, l.attenduText && `Attendu aujourd'hui : ${l.attenduText}`, l.echeanceText && `Pour le ${l.echeanceText}`].filter(Boolean).join(' - ');
  const sansBarre = !l.measured;
  const mot = l.statutText;
  return (
    <li id={l.id} className="scroll-mt-4 rounded-lg px-3 py-1.5" data-testid="avancement-ligne" data-statut={l.passe ? 'passe' : (l.statut ?? 'sans-mesure')} title={title}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 @xl:grid-cols-[minmax(0,1fr)_7rem_5.5rem_10rem]">
        <p className="col-start-1 row-start-1 flex min-w-0 items-center gap-2 text-sm text-[var(--ink)]">
          <Puce label={l.typeLabel} className="max-sm:hidden" />
          <span className="min-w-0 break-words">{l.label}</span>
        </p>
        {sansBarre ? (
          <span className="tabular col-span-2 col-start-1 row-start-2 text-xs text-[var(--ink-muted)] sm:col-span-2 sm:col-start-2 sm:row-start-1 sm:text-right">{l.valueText || 'pas de mesure'}</span>
        ) : (
          <>
            <div className="col-start-1 row-start-2 @xl:col-start-2 @xl:row-start-1">
              <Barre l={l} />
            </div>
            <span className="tabular col-start-2 row-start-2 text-right text-xs text-[var(--ink-muted)] @xl:col-start-3 @xl:row-start-1">{l.valueText}</span>
          </>
        )}
        <span className={`tabular col-start-2 row-start-1 text-right text-xs whitespace-nowrap @xl:col-start-4 ${MOT[l.statut] ?? 'text-[var(--ink-muted)]'}`}>{mot}</span>
      </div>
      {sansBarre && l.explication && <p className="mt-0.5 text-xs break-words text-[var(--ink-muted)]">{l.explication}</p>}
      {l.detail && (l.passe || l.kind === 'compteur' || l.kind === 'jalons' || sansBarre) && <p className="mt-0.5 text-xs break-words text-[var(--ink-muted)]">{l.detail}</p>}
      {l.ancienne && <p className="mt-0.5 text-xs font-semibold text-[var(--late-ink)]">{`Ancienne valeur du ${l.ancienne} : la source était illisible au dernier calcul`}</p>}
    </li>
  );
}

function Groupe({ g, now }) {
  const age = g.calculeLe ? joursDepuis(g.calculeLe, now) : null;
  return (
    <section aria-labelledby={`av-${g.id}`} data-testid={`avancement-${g.id}`}>
      <h3 id={`av-${g.id}`} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 border-b border-[var(--line)] px-3 pb-1.5">
        <span className="text-base font-semibold">{g.title}</span>
        {g.echeances.length > 0 && <span className="tabular text-xs text-[var(--ink-muted)]">{`échéance${g.echeances.length > 1 ? 's' : ''} : ${g.echeances.join(', ')}`}</span>}
        {g.late > 0 && <PastilleRetard className="ml-auto">{`${g.late} en retard`}</PastilleRetard>}
      </h3>
      {g.calculeLe && (
        <p className={`tabular px-3 pt-1.5 text-xs ${age != null && age > 3 ? 'font-semibold text-[var(--late-text)]' : 'text-[var(--ink-muted)]'}`} data-testid="avancement-source-date">
          {`Source Progression.md calculée le ${frShortDate(g.calculeLe)}${age != null && age > 3 ? ` (il y a ${age} jours : peut-être périmée)` : ''}`}
        </p>
      )}
      {g.note && <p className="px-3 pt-1 text-xs text-[var(--ink-muted)]">{g.note}</p>}
      <ul className="@container mt-2 grid gap-1">
        {g.lignes.map((l) => (l.statut === 'en_retard' ? <LigneRetard key={l.key} l={l} /> : <LigneCalme key={l.key} l={l} />))}
      </ul>
    </section>
  );
}

export default function AvancementDetail({ rows, showHidden = false, now }) {
  const view = buildAvancement(rows, { showHidden });
  const sync = syncInfo(rows, now);
  const notes = headerNotes(rows, now);
  const boost = view.groups.find((g) => g.id === 'strategy-boost');
  const others = view.groups.filter((g) => g !== boost);
  const stale = sync && sync.ageHours > 36;

  return (
    <section id="avancement-detail" aria-labelledby="avancement-titre" className={`${CARD} flex min-h-0 flex-1 flex-col overflow-hidden`}>
      <h2 id="avancement-titre" className="flex min-h-10 shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--line)] px-4 py-2 text-sm font-semibold">
        <span>Avancement</span>
        {sync && (
          <span className="tabular flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-normal text-[var(--ink-muted)]">
            {view.late > 0 && <PastilleRetard className="text-sm">{`${view.late} en retard`}</PastilleRetard>}
            {view.ok > 0 && <span>{`${view.ok} dans les temps`}</span>}
            {view.ahead > 0 && <span>{`${view.ahead} en avance`}</span>}
            {view.unmeasured > 0 && <span>{`${view.unmeasured} sans mesure`}</span>}
            {view.past > 0 && <span>{`${view.past} examen${view.past > 1 ? 's' : ''} passé${view.past > 1 ? 's' : ''}`}</span>}
          </span>
        )}
        {sync && (
          <span className={`tabular ml-auto text-xs font-normal ${stale ? 'font-semibold text-[var(--late-text)]' : 'text-[var(--ink-muted)]'}`} data-testid="avancement-sync">
            {stale ? `Données du ${sync.label} : la synchronisation du soir n'a pas tourné` : `Mis à jour le ${sync.label}`}
          </span>
        )}
      </h2>

      {(notes.avertissements.length > 0 || notes.exportInfo) && (
        <div className="shrink-0 space-y-1 border-b border-[var(--line)] px-4 py-2" data-testid="avancement-notes">
          {notes.exportInfo && (
            <p className={`tabular text-xs ${notes.exportInfo.late ? 'font-semibold text-[var(--late-text)]' : 'text-[var(--ink-muted)]'}`} data-testid="avancement-export">
              {notes.exportInfo.text}
            </p>
          )}
          {notes.avertissements.length > 0 && (
            <div className="rounded-lg border-l-[3px] border-[var(--late)] bg-[var(--late-soft)] px-3 py-1.5" role="status" data-testid="avancement-avertissements">
              <p className="text-xs font-semibold text-[var(--late-ink)]">{`Au dernier calcul : ${notes.avertissements.length} avertissement${notes.avertissements.length > 1 ? 's' : ''}`}</p>
              <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-xs text-[var(--ink)]">
                {notes.avertissements.map((a, i) => (
                  <li key={i} className="break-words">
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!sync ? (
        <p className="px-4 py-6 text-sm text-[var(--ink-muted)]" role="status" data-testid="avancement-vide">
          En attente de la première synchronisation.
        </p>
      ) : (
        <div className="min-h-0 flex-1 xl:overflow-y-auto">
          <div className="grid gap-x-8 gap-y-6 p-3 pb-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            {boost && <Groupe g={boost} now={now} />}
            {others.length > 0 && (
              <div className="space-y-6">
                {others.map((g) => (
                  <Groupe key={g.id} g={g} now={now} />
                ))}
              </div>
            )}
          </div>
          {(view.hidden > 0 || showHidden) && <AvancementReglage showHidden={showHidden} hidden={view.hidden} />}
          <div className="h-3" />
        </div>
      )}
    </section>
  );
}
