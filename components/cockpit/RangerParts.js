'use client';

// Briques communes à la colonne « À ranger » et à la feuille de rangement forcé : boutons de geste, ligne de
// métadonnées, encadré de suggestion, sélecteur « Affecter ailleurs ». Aucune logique de données ici.
import { useState } from 'react';
import { fieldClass, keyClass, shortcutTitle } from '../ui';
import { frDay } from '@/lib/ranger';

// Les cinq gestes de « À ranger » : toujours visibles sur l'élément sélectionné, toujours dans le même ordre.
// Valider est le seul primaire ; Supprimer a le texte corail foncé. Le raccourci (V, A, C, S, P) s'indique au
// survol (title) et aux lecteurs d'écran (aria-keyshortcuts), plus de lettre encadrée.
export const btnClass = keyClass();
export const primaryBtn = keyClass({ level: 'primary' });
export const GESTURE_TONE = { place: 'neutral', elsewhere: 'neutral', done: 'neutral', drop: 'late', later: 'neutral' };

// Libellé affiché d'un geste « Cocher » : « Fait » (la logique garde son nom, lib/ranger.js).
export const doneText = (label) => (label === 'Cocher' ? 'Fait' : label);

// Un geste = un bouton. `kind` : place | elsewhere | done | drop | later.
export function GestureKey({ kind, letter, children, className = '', title, ...props }) {
  return (
    <button
      type="button"
      className={`${keyClass({ level: kind === 'place' ? 'primary' : 'secondary', tone: GESTURE_TONE[kind] })} ${className}`}
      aria-keyshortcuts={letter}
      title={shortcutTitle(typeof children === 'string' ? children : '', letter, title)}
      {...props}
    >
      {children}
    </button>
  );
}

// Les cinq gestes d'un élément, dans l'ordre fixe V A C S P. `g` = gesturesFor(item), `on` = { place, elsewhere,
// done, drop, later }. Partagé par la colonne et la feuille de rangement forcé.
export function Gestures({ g, on, label, ref }) {
  const sql = 'Demande supabase/ranger.sql';
  return (
    <div ref={ref} className="flex flex-wrap gap-2" role="group" aria-label={label}>
      <GestureKey kind="place" letter="V" disabled={!g.validate} onClick={on.place}>
        Valider
      </GestureKey>
      <GestureKey kind="elsewhere" letter="A" disabled={!g.elsewhere} onClick={on.elsewhere}>
        Affecter ailleurs
      </GestureKey>
      <GestureKey kind="done" letter="C" onClick={on.done}>
        {doneText(g.doneLabel)}
      </GestureKey>
      <GestureKey kind="drop" letter="S" disabled={!g.drop} title={g.drop ? undefined : sql} onClick={on.drop}>
        Supprimer
      </GestureKey>
      <GestureKey kind="later" letter="P" disabled={!g.later} title={g.later ? 'Revient dimanche' : sql} onClick={on.later}>
        Plus tard
      </GestureKey>
    </div>
  );
}

// Type d'élément : un mot, jamais la seule couleur. Les propositions des mails sont « à traiter » (bleu acier tinté).
const TYPE_STYLE = {
  task: 'bg-[var(--btn-fill)] text-[var(--ink)]',
  idea: 'bg-[var(--btn-fill)] text-[var(--ink)]',
  notification: 'bg-[var(--action-soft)] text-[var(--action-ink)]',
};

export function TypeBadge({ item }) {
  return (
    <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium ${TYPE_STYLE[item.kind]}`}>
      {item.typeLabel}
      {item.notifLabel ? ` : ${item.notifLabel.toLowerCase()}` : ''}
    </span>
  );
}

// Version compacte (colonne « À ranger », élément sélectionné) : UNE ligne tronquée (échéance, projet ; l'âge si rien
// d'autre), le lien du mail à part ; le détail complet, bloc d'origine compris, est dans le title.
function CompactMeta({ item }) {
  const age = `créé ${item.age <= 1 ? item.ageLabel : `il y a ${item.age} j`}`;
  const due = item.late > 0 ? `en retard de ${item.late} j (échéance ${frDay(item.due)})` : item.due ? `échéance ${frDay(item.due)}` : '';
  const project = item.projectName ? `projet ${item.projectName}` : '';
  const line = [due, project].filter(Boolean).join(' · ') || age;
  const full = [age, due, item.origin && `bloc d'origine : ${item.origin}`, project].filter(Boolean).join(' · ');
  return (
    <div className="tabular flex items-center gap-2.5 text-xs text-[var(--ink-muted)]" data-testid="ranger-meta">
      <p className={`min-w-0 flex-1 truncate ${item.late > 0 ? 'font-semibold text-[var(--late-text)]' : ''}`} title={full}>
        {line}
      </p>
      {item.mailLink && (
        <a href={item.mailLink} target="_blank" rel="noopener noreferrer" className="shrink-0 underline hover:no-underline">
          mail
        </a>
      )}
    </div>
  );
}

// Âge, échéance, bloc d'origine et projet d'un élément, sur une ligne qui passe à la ligne.
export function ItemMeta({ item, compact = false }) {
  if (compact) return <CompactMeta item={item} />;
  const bits = [];
  bits.push(<span key="age">{`créé ${item.age <= 1 ? item.ageLabel : `il y a ${item.age} j`}`}</span>);
  if (item.late > 0) {
    bits.push(
      <span key="due" className="font-semibold text-[var(--late-text)]">
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
    <p className="tabular flex flex-wrap gap-x-2.5 gap-y-0.5 text-xs text-[var(--ink-muted)]" data-testid="ranger-meta">
      {bits}
    </p>
  );
}

export function SuggestionBox({ item, large = false, compact = false }) {
  const s = item.suggestion;
  if (compact) {
    return (
      <div
        className={`rounded-lg border-l-[3px] bg-[var(--card-inset)] px-2.5 py-1.5 ${s.target ? 'border-[var(--action)]' : 'border-[var(--line-strong)]'}`}
        data-testid="ranger-suggestion"
        title={s.reason}
      >
        <p className={`line-clamp-2 break-words text-sm ${s.target ? 'text-[var(--ink)]' : 'text-[var(--ink-muted)]'}`}>
          <span className="mr-1.5 text-xs font-semibold tracking-wide text-[var(--ink-muted)] uppercase">{s.target ? 'Suggestion' : 'Pas de suggestion'}</span>
          {s.reason}
        </p>
      </div>
    );
  }
  return (
    <div
      className={`rounded-lg border-l-[3px] bg-[var(--card-inset)] ${large ? 'px-4 py-3' : 'px-3 py-2'} ${s.target ? 'border-[var(--action)]' : 'border-[var(--line-strong)]'}`}
      data-testid="ranger-suggestion"
    >
      <div className="text-xs font-semibold tracking-wide text-[var(--ink-muted)] uppercase">{s.target ? 'Suggestion' : 'Pas de suggestion'}</div>
      <p className={`mt-1 break-words ${large ? 'text-base' : 'text-sm'} ${s.target ? 'text-[var(--ink)]' : 'text-[var(--ink-muted)]'}`}>{s.reason}</p>
    </div>
  );
}

// « Affecter ailleurs » : les prochains blocs de travail (touches 1 à 9 puis 0 dans le rangement forcé),
// ou un jour sans bloc. `futureDays` faux (supabase/ranger.sql pas exécuté) : seul aujourd'hui est possible.
export function ElsewherePicker({ options, today, futureDays = true, numbered = false, onPick, onCancel }) {
  const [day, setDay] = useState('');
  return (
    <div className="space-y-2 rounded-xl bg-[var(--card-inset)] p-3" role="group" aria-label="Affecter ailleurs" data-testid="ranger-elsewhere">
      <p className="text-xs font-semibold tracking-wide text-[var(--ink-muted)] uppercase">Affecter à</p>
      {options.length ? (
        <ul className="space-y-2">
          {options.map((o, i) => (
            <li key={o.eventId}>
              <button
                type="button"
                onClick={() => onPick({ type: 'block', eventId: o.eventId })}
                className={`${btnClass} w-full justify-start whitespace-normal text-left`}
                title={numbered ? `${o.label} (${(i + 1) % 10})` : undefined}
              >
                {numbered && <span className="tabular w-4 shrink-0 text-xs text-[var(--ink-muted)]">{(i + 1) % 10}</span>}
                <span className="min-w-0 flex-1 break-words">{o.label}</span>
                {o.tasks > 0 && <span className="tabular shrink-0 text-xs text-[var(--ink-muted)]">{`${o.tasks} tâche${o.tasks > 1 ? 's' : ''}`}</span>}
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
