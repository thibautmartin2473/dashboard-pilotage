'use client';

// Liste des éléments que les mots-clés n'ont rangés nulle part. Chacun peut être rangé à la main
// (geste simulé : il rejoint la campagne ou la piste choisie et le compteur baisse).
import { DESTINATIONS, fmtDay } from './classify';
import { Eyebrow, MONO, When } from './ui';

export default function NonClasse({ items, onPlace, onClose }) {
  return (
    <section
      id="non-classe"
      aria-label="Éléments non classés"
      className="rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--surface)] p-4 [box-shadow:var(--shadow)]"
    >
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <Eyebrow>Non classé · {items.length}</Eyebrow>
          <p className="mt-0.5 max-w-prose text-[13px] text-[var(--text-muted)]">
            Aucun mot-clé de recrutement, d&apos;examen ou d&apos;admin dans ces titres (souvent des chantiers hors recrutement). Les règles sont dans classify.js.
          </p>
        </div>
        <button type="button" onClick={onClose} className="min-h-8 cursor-pointer text-[12px] text-[var(--text-muted)] underline underline-offset-2">
          Fermer la liste
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-[13px] text-[var(--text)]">Tout est rangé.</p>
      ) : (
        <ul className="divide-y divide-[var(--border)]">
          {items.map((it) => (
            <li key={it.key} className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 py-2">
              <span className={`${MONO} w-14 shrink-0 text-[11px] tracking-wide text-[var(--text-muted)] uppercase`}>
                {it.kind === 'task' ? 'Tâche' : 'Agenda'}
              </span>
              <span className="min-w-0 flex-1 basis-56 text-[13px] leading-snug break-words text-[var(--text)]" title={it.title}>
                {it.text}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {it.kind === 'event' && it.day ? <span className={`${MONO} text-[11px] text-[var(--text-muted)]`}>{fmtDay(it.day)}</span> : <When days={it.days} />}
                <label className="sr-only" htmlFor={`place-${it.key}`}>
                  Ranger {it.text}
                </label>
                <select
                  id={`place-${it.key}`}
                  value=""
                  onChange={(e) => e.target.value && onPlace(it, e.target.value)}
                  className="min-h-8 rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface)] px-2 text-[12px] text-[var(--text)]"
                >
                  <option value="">Ranger dans…</option>
                  {DESTINATIONS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
