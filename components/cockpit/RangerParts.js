'use client';

// Briques communes à la colonne « À ranger » et à l'écran de rangement forcé : boutons, ligne de
// métadonnées, encadré de suggestion, sélecteur « Affecter ailleurs ». Aucune logique de données ici.
import { useState } from 'react';
import { KeyCap, fieldClass, keyClass } from '../ui';
import { frDay } from '@/lib/ranger';

// Les cinq gestes de « À ranger » : toujours visibles, toujours dans le même ordre, lettre du raccourci
// à gauche (V, A, C, S, P). Valider est le seul primaire ; le trait du bas porte le rôle de chaque geste.
export const btnClass = keyClass();
export const primaryBtn = keyClass({ level: 'primary' });
export const GESTURE_TONE = { place: 'action', elsewhere: 'neutral', done: 'done', drop: 'late', later: 'pending' };

// Un geste = une touche (lettre + libellé). `kind` : place | elsewhere | done | drop | later.
export function GestureKey({ kind, letter, children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`${keyClass({ level: kind === 'place' ? 'primary' : 'secondary', tone: GESTURE_TONE[kind] })} ${className}`}
      aria-keyshortcuts={letter}
      {...props}
    >
      <KeyCap>{letter}</KeyCap>
      {children}
    </button>
  );
}

// Type d'élément : un mot, jamais la seule couleur. Les propositions des mails sont « à traiter » (laiton).
const TYPE_STYLE = {
  task: 'border-[var(--line-strong)] text-[var(--ink)]',
  idea: 'border-[var(--line-strong)] text-[var(--ink)]',
  notification: 'border-[var(--pending)] text-[var(--ink)]',
};

export function TypeBadge({ item }) {
  return (
    <span className={`rounded-[3px] border px-1.5 py-0.5 font-mono text-xs font-semibold tracking-wide uppercase ${TYPE_STYLE[item.kind]}`}>
      {item.typeLabel}
      {item.notifLabel ? ` : ${item.notifLabel.toLowerCase()}` : ''}
    </span>
  );
}

// Âge, échéance, bloc d'origine et projet d'un élément, sur une ligne qui passe à la ligne.
export function ItemMeta({ item }) {
  const bits = [];
  bits.push(<span key="age">{`créé ${item.age <= 1 ? item.ageLabel : `il y a ${item.age} j`}`}</span>);
  if (item.late > 0) {
    bits.push(
      <span key="due" className="font-semibold text-[var(--late)]">
        {`en retard de ${item.late} j (échéance ${frDay(item.due)})`}
      </span>
    );
  } else if (item.due) {
    bits.push(<span key="due">{`échéance ${frDay(item.due)}`}</span>);
  }
  if (item.origin) bits.push(<span key="origin">{`bloc d'origine : ${item.origin}`}</span>);
  if (item.projectName) bits.push(<span key="project">{`projet ${item.projectName}`}</span>);
  if (item.mailLink)
    bits.push(
      <a key="mail" href={item.mailLink} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
        mail
      </a>
    );
  return (
    <p className="flex flex-wrap gap-x-2.5 gap-y-0.5 font-mono text-xs text-[var(--ink-muted)]" data-testid="ranger-meta">
      {bits}
    </p>
  );
}

export function SuggestionBox({ item, large = false }) {
  const s = item.suggestion;
  return (
    <div
      className={`rounded-[5px] border-l-2 bg-[var(--content-bg)] ${large ? 'px-4 py-3' : 'px-3 py-2'} ${s.target ? 'border-[var(--action)]' : 'border-[var(--line-strong)]'}`}
      data-testid="ranger-suggestion"
    >
      <div className="font-mono text-xs font-semibold tracking-wide text-[var(--ink-muted)] uppercase">{s.target ? 'Suggestion' : 'Pas de suggestion'}</div>
      <p className={`mt-1 break-words ${large ? 'text-base' : 'text-sm'} ${s.target ? 'text-[var(--ink)]' : 'text-[var(--ink-muted)]'}`}>{s.reason}</p>
    </div>
  );
}

// « Affecter ailleurs » : les prochains blocs de travail (touches 1 à 9 puis 0 dans le rangement forcé),
// ou un jour sans bloc. `futureDays` faux (supabase/ranger.sql pas exécuté) : seul aujourd'hui est possible.
export function ElsewherePicker({ options, today, futureDays = true, numbered = false, onPick, onCancel }) {
  const [day, setDay] = useState('');
  return (
    <div className="space-y-2 rounded-[5px] border border-[var(--line-strong)] bg-[var(--content-bg)] p-3" role="group" aria-label="Affecter ailleurs" data-testid="ranger-elsewhere">
      <p className="font-mono text-xs font-semibold tracking-wide text-[var(--ink-muted)] uppercase">Affecter à</p>
      {options.length ? (
        <ul className="space-y-2">
          {options.map((o, i) => (
            <li key={o.eventId}>
              <button type="button" onClick={() => onPick({ type: 'block', eventId: o.eventId })} className={`${btnClass} w-full justify-start whitespace-normal text-left`}>
                {numbered && <KeyCap>{(i + 1) % 10}</KeyCap>}
                <span className="min-w-0 flex-1 break-words">{o.label}</span>
                {o.tasks > 0 && <span className="shrink-0 font-mono text-xs text-[var(--ink-muted)]">{`${o.tasks} tâche${o.tasks > 1 ? 's' : ''}`}</span>}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--ink-muted)]">Aucun bloc de travail dans les 14 prochains jours.</p>
      )}
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (day) onPick({ type: 'day', day });
        }}
      >
        <label className="text-sm text-[var(--ink-muted)]" htmlFor="ranger-day">
          Ou un jour sans bloc
        </label>
        <input
          id="ranger-day"
          type="date"
          value={day}
          min={today}
          max={futureDays ? undefined : today}
          onChange={(e) => setDay(e.target.value)}
          className={`${fieldClass} px-2 text-sm`}
        />
        <button type="submit" disabled={!day} className={btnClass}>
          Ce jour
        </button>
      </form>
      {!futureDays && <p className="text-xs text-[var(--ink-muted)]">Un jour futur demande supabase/ranger.sql.</p>}
      <button type="button" onClick={onCancel} className={keyClass({ level: 'tertiary' })}>
        Annuler
      </button>
    </div>
  );
}
