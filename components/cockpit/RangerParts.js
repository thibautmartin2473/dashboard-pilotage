'use client';

// Briques communes à la colonne « À ranger » et à l'écran de rangement forcé : boutons, ligne de
// métadonnées, encadré de suggestion, sélecteur « Affecter ailleurs ». Aucune logique de données ici.
import { useState } from 'react';
import { fieldClass } from '../ui';
import { frDay } from '@/lib/ranger';

const BTN =
  'rounded-lg border px-2.5 py-1.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40';
export const btnClass = `${BTN} border-zinc-700 bg-zinc-800/60 text-zinc-100 hover:border-[var(--color-accent)] hover:bg-zinc-800`;
export const primaryBtn = `${BTN} border-[var(--color-accent)] bg-[var(--color-accent)] text-zinc-950 hover:opacity-90`;

const TYPE_STYLE = {
  task: 'border-zinc-700 text-zinc-300',
  idea: 'border-[var(--color-accent)] text-[var(--color-accent)]',
  notification: 'border-amber-800 text-amber-400',
};

export function TypeBadge({ item }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide uppercase ${TYPE_STYLE[item.kind]}`}>
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
      <span key="due" className="text-red-400">
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
    <p className="flex flex-wrap gap-x-2.5 gap-y-0.5 font-mono text-[11px] text-zinc-400" data-testid="ranger-meta">
      {bits}
    </p>
  );
}

export function SuggestionBox({ item, large = false }) {
  const s = item.suggestion;
  return (
    <div
      className={`rounded-lg border bg-zinc-950/60 ${large ? 'px-3.5 py-3' : 'px-2.5 py-2'} ${s.target ? 'border-[var(--color-accent-soft)]' : 'border-zinc-800'}`}
      data-testid="ranger-suggestion"
    >
      <div className="font-mono text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">{s.target ? 'Suggestion' : 'Pas de suggestion'}</div>
      <p className={`mt-0.5 break-words ${large ? 'text-sm' : 'text-xs'} ${s.target ? 'text-zinc-100' : 'text-zinc-400'}`}>{s.reason}</p>
    </div>
  );
}

// « Affecter ailleurs » : les prochains blocs de travail (touches 1 à 9 puis 0 dans le rangement forcé),
// ou un jour sans bloc. `futureDays` faux (supabase/ranger.sql pas exécuté) : seul aujourd'hui est possible.
export function ElsewherePicker({ options, today, futureDays = true, numbered = false, onPick, onCancel }) {
  const [day, setDay] = useState('');
  return (
    <div className="space-y-1.5 rounded-lg border border-zinc-700 bg-zinc-950/60 p-2.5" role="group" aria-label="Affecter ailleurs" data-testid="ranger-elsewhere">
      <p className="font-mono text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">Affecter à</p>
      {options.length ? (
        <ul className="space-y-1">
          {options.map((o, i) => (
            <li key={o.eventId}>
              <button type="button" onClick={() => onPick({ type: 'block', eventId: o.eventId })} className={`${btnClass} flex w-full items-baseline gap-2 text-left`}>
                {numbered && <span className="font-mono text-[11px] text-[var(--color-accent)]">{(i + 1) % 10}</span>}
                <span className="min-w-0 flex-1 break-words">{o.label}</span>
                {o.tasks > 0 && <span className="shrink-0 font-mono text-[10px] text-zinc-400">{`${o.tasks} tâche${o.tasks > 1 ? 's' : ''}`}</span>}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-zinc-400">Aucun bloc de travail dans les 14 prochains jours.</p>
      )}
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (day) onPick({ type: 'day', day });
        }}
      >
        <label className="text-xs text-zinc-400" htmlFor="ranger-day">
          Ou un jour sans bloc
        </label>
        <input
          id="ranger-day"
          type="date"
          value={day}
          min={today}
          max={futureDays ? undefined : today}
          onChange={(e) => setDay(e.target.value)}
          className={`${fieldClass} px-2 py-1 text-xs`}
        />
        <button type="submit" disabled={!day} className={btnClass}>
          Ce jour
        </button>
      </form>
      {!futureDays && <p className="text-[11px] text-zinc-400">Un jour futur demande supabase/ranger.sql.</p>}
      <button type="button" onClick={onCancel} className={btnClass}>
        Annuler
      </button>
    </div>
  );
}
