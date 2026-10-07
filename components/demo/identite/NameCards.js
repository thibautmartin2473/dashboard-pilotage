// Section « Six noms » : une fiche par nom (sens, ton, risques, collisions, dictée), les noms écartés
// avec leur preuve, et la grille de critères I1 à I9 de la recherche (RECHERCHE-PROFONDE.md, axe 1).
import { Wordmark } from './Logo';
import { NAMES, REJECTED, CRITERIA, DICTATION, verdict } from './names';

const WORD = { ok: 'ok', warn: 'réserve', ko: 'échec' };
const TONE = { ok: 'var(--success)', warn: 'var(--warning)', ko: 'var(--danger)' };

export function Chip({ status, children }) {
  return (
    <span
      className="inline-flex items-center rounded-[var(--radius-sm)] border px-1.5 py-0.5 font-mono text-[11px] leading-none"
      style={{ borderColor: TONE[status], color: TONE[status] }}
    >
      {children ?? WORD[status]}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[5.5rem_1fr] sm:gap-3">
      <dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-faint)]">{label}</dt>
      <dd className="min-w-0 text-[13px] leading-relaxed text-[var(--text-muted)]">{children}</dd>
    </div>
  );
}

function NameCard({ n, onPick, picked }) {
  const v = verdict(n);
  return (
    <article
      className="flex min-w-0 flex-col gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4"
      style={{ boxShadow: picked ? 'inset 0 0 0 1px var(--accent)' : 'var(--shadow)' }}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-faint)]">Nom n°{n.rank}</p>
          <div className="mt-3 text-[var(--text)]">
            <Wordmark name={n.name} height={34} />
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Chip status={n.drawn ? 'ok' : 'warn'}>{n.drawn ? 'logo dessiné' : 'non dessiné'}</Chip>
          <Chip status={v.pass ? 'ok' : 'ko'}>{v.pass ? 'I1 et I3 passés' : 'seuil non passé'}</Chip>
        </div>
      </header>

      <p className="text-[15px] leading-snug text-[var(--text)]">{n.pitch}</p>

      <dl className="grid gap-3">
        <Field label="Sens">{n.meaning}</Field>
        <Field label="Ton">{n.tone}</Field>
        <Field label="Risques">
          <ul className="grid gap-1.5">
            {n.risks.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Field>
        <Field label="Collisions">
          <ul className="grid gap-1.5">
            {n.collisions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </Field>
        <Field label="Dictée">
          <div className="flex flex-wrap gap-1.5">
            {DICTATION(n.name).map((s) => (
              <span key={s} className="rounded-[var(--radius-sm)] bg-[var(--surface-2)] px-2 py-1 font-mono text-[12px] text-[var(--text)]">
                {s}
              </span>
            ))}
          </div>
          <p className="mt-1.5">
            Risque {n.dictation.level} : {n.dictation.why}. Test à la voix non fait ici : à dicter trois fois chacune.
          </p>
        </Field>
      </dl>

      {n.drawn && (
        <button
          type="button"
          onClick={() => onPick(n.id)}
          className="mt-auto self-start rounded-[var(--radius-sm)] border border-[var(--border-strong)] px-3 py-1.5 text-[13px] text-[var(--text)] hover:bg-[var(--surface-2)]"
        >
          Voir le logo de {n.name}
        </button>
      )}
    </article>
  );
}

export function NamesSection({ onPick, sel }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
        {NAMES.map((n) => (
          <NameCard key={n.id} n={n} onPick={onPick} picked={n.id === sel} />
        ))}
      </div>

      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4">
        <h3 className="text-[15px] font-semibold text-[var(--text)]">Noms écartés après recherche</h3>
        <p className="mt-1 text-[13px] text-[var(--text-muted)]">
          Les six noms ci-dessus sont ceux qui ont survécu. Ceux-là sonnaient bien et ont été éliminés par une preuve (critère I3).
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {REJECTED.map((r) => (
            <li key={r.name} className="rounded-[var(--radius-sm)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text)]">{r.name}</span> : {r.why}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12px] text-[var(--text-faint)]">
          Limites : recherche sur GitHub (étoiles) et WebSearch le 2026-10-07. Non vérifiés : App Store et Google Play un par un, base de marques, disponibilité des noms de
          domaine.
        </p>
      </div>
    </div>
  );
}

export function CriteriaTable() {
  return (
    <div className="grid gap-4">
      <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-3 sm:p-4">
        <div className="grid grid-cols-[4.25rem_repeat(9,minmax(0,1fr))] items-center gap-x-1 gap-y-1.5 text-center sm:grid-cols-[6rem_repeat(9,minmax(0,1fr))]">
          <span />
          {CRITERIA.map((c) => (
            <span key={c.id} title={`${c.label} : ${c.test}`} className="font-mono text-[10px] text-[var(--text-faint)] sm:text-[11px]">
              {c.id}
            </span>
          ))}
          {NAMES.map((n) => {
            const v = verdict(n);
            return [
              <span key={`${n.id}-n`} className="truncate pr-1 text-left text-[13px] font-semibold text-[var(--text)]">
                {n.name}
              </span>,
              ...CRITERIA.map((c) => {
                const [st, why] = v[c.id];
                return (
                  <span key={`${n.id}-${c.id}`} title={why} className="font-mono text-[11px] font-semibold" style={{ color: TONE[st] }}>
                    {st === 'ok' ? 'ok' : st === 'warn' ? 'R' : 'X'}
                  </span>
                );
              }),
            ];
          })}
        </div>
        <p className="mt-3 font-mono text-[11px] text-[var(--text-faint)]">ok : critère rempli. R : réserve (voir la fiche). X : échec.</p>
      </div>
      <ul className="grid gap-1.5 text-[12px] text-[var(--text-muted)] sm:grid-cols-2">
        {CRITERIA.map((c) => (
          <li key={c.id}>
            <span className="font-mono text-[var(--text)]">{c.id}</span> {c.label} : {c.test}
          </li>
        ))}
      </ul>
    </div>
  );
}
