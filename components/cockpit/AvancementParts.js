// Éléments communs à l'onglet Avancement (AvancementDetail.js) et à son résumé du Cockpit (AvancementResume.js) :
// la barre avec son TRAIT vertical (où il devrait être aujourd'hui) et les teintes de statut. Composants serveur.
// Charte : jetons de app/globals.css seulement, un statut n'est jamais la seule couleur (le mot l'accompagne).

// Remplissage de la barre : corail = retard, bleu acier sinon.
const REMPLI = { en_retard: 'bg-[var(--late)]', dans_les_temps: 'bg-[var(--action)]', en_avance: 'bg-[var(--action-press)]' };

// `l` : { barPct, traitPct, ticks, statut, attenduText } (vue d'une ligne) ou un poste du résumé ; `grande` : barre
// épaisse des lignes en retard.
export function Barre({ l, grande = false }) {
  const trait = l.traitPct == null ? null : `min(max(${l.traitPct}%, 1px), calc(100% - 1px))`;
  const h = grande ? 'h-6' : 'h-4';
  return (
    <div className={`relative ${h}`} aria-hidden="true">
      <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 overflow-hidden rounded-full bg-[var(--btn-fill)] ${grande ? 'h-3' : 'h-1.5'}`}>
        <div className={`h-full rounded-full ${REMPLI[l.statut] ?? 'bg-[var(--ink-muted)]'}`} style={{ width: `${l.barPct}%` }} />
        {Array.from({ length: Math.max(0, (l.ticks ?? 0) - 1) }, (_, i) => (
          <span key={i} className="absolute inset-y-0 w-px bg-[var(--card-solid)]" style={{ left: `${((i + 1) / l.ticks) * 100}%` }} />
        ))}
      </div>
      {trait && (
        <span
          className={`absolute top-0 ${h} -translate-x-1/2 rounded-full bg-[var(--ink)] ${grande ? 'w-[3px]' : 'w-0.5'}`}
          style={{ left: trait }}
          title={l.attenduText ? `Où il devrait être aujourd'hui : ${l.attenduText}` : "Où il devrait être aujourd'hui"}
        />
      )}
    </div>
  );
}

// Pastille « N en retard » : la seule qui soit pleine (corail foncé, texte blanc), pour que les retards ressortent.
export function PastilleRetard({ children, className = '' }) {
  return (
    <span className={`tabular inline-block rounded-full bg-[var(--late-ink)] px-2.5 py-0.5 text-xs font-bold whitespace-nowrap text-[var(--action-text)] ${className}`}>{children}</span>
  );
}
