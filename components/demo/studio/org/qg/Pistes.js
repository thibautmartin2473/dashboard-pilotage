'use client';

// Les deux pistes hors campagnes : Examens (fin octobre) et Admin et perso (paiements regroupés).
import { useState } from 'react';
import { fmtDay, fmtRange } from './classify';
import { Block, DISPLAY, Empty, Eyebrow, Ghost, MONO, When } from './ui';

function Panel({ title, kicker, children }) {
  return (
    <section
      aria-label={title}
      className="flex min-w-0 flex-col gap-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 [box-shadow:var(--shadow)]"
    >
      <header>
        <Eyebrow>{kicker}</Eyebrow>
        <h3 className={`${DISPLAY} text-xl leading-tight text-[var(--text)]`}>{title}</h3>
      </header>
      {children}
    </section>
  );
}

export function PisteExamens({ exam, cours }) {
  const [all, setAll] = useState(false);
  const next = exam.next;
  const revisions = all ? exam.revisions : exam.revisions.slice(0, 5);
  return (
    <Panel title="Examens" kicker="Piste 1 · partiels et finals">
      {next ? (
        <div className="flex items-end justify-between gap-3 rounded-[var(--radius-sm)] bg-[var(--bg)] p-3" style={{ borderLeft: '3px solid var(--danger)' }}>
          <div className="min-w-0">
            <Eyebrow>Prochain examen</Eyebrow>
            <p className={`${DISPLAY} mt-0.5 text-lg leading-tight break-words text-[var(--text)]`}>{next.label}</p>
            <p className="text-[12px] text-[var(--text-muted)]">{fmtRange(next.day, next.to)}</p>
          </div>
          <p className={`${MONO} text-3xl leading-none font-semibold`} style={{ color: next.days <= 3 ? 'var(--danger)' : 'var(--text)' }}>
            {next.days > 0 ? `J-${next.days}` : "Auj."}
          </p>
        </div>
      ) : (
        <Empty>Aucun examen daté dans l&apos;agenda.</Empty>
      )}

      {exam.marks.length > 0 ? (
        <Block title="Calendrier des épreuves" count={exam.marks.length}>
          <ul>
            {exam.marks.map((m) => (
              <li key={m.key} className="flex min-w-0 items-baseline gap-2 py-1">
                <span className={`${MONO} w-[6.4rem] shrink-0 text-[12px] text-[var(--text)]`}>{fmtRange(m.day, m.to)}</span>
                <span className="min-w-0 flex-1 text-[13px] break-words text-[var(--text)]">
                  {m.label}
                  {m.count > 1 ? <span className="text-[var(--text-muted)]"> ({m.count} jours)</span> : null}
                </span>
                <When days={m.days} />
              </li>
            ))}
          </ul>
        </Block>
      ) : null}

      <Block title="Révisions planifiées" count={exam.revisions.length}>
        {exam.revisions.length === 0 ? (
          <Empty>Aucun bloc de révision à venir.</Empty>
        ) : (
          <>
            <ul>
              {revisions.map((e) => (
                <li key={e.key} className="flex min-w-0 items-baseline gap-2 py-1">
                  <span className={`${MONO} w-[4.4rem] shrink-0 text-[11px] text-[var(--text-muted)]`}>{fmtDay(e.day)}</span>
                  <span className="min-w-0 flex-1 text-[13px] break-words text-[var(--text)]">{e.text}</span>
                  <span className={`${MONO} text-[11px] text-[var(--text-faint)]`}>{e.time}</span>
                </li>
              ))}
            </ul>
            {exam.revisions.length > 5 ? (
              <button type="button" aria-expanded={all} onClick={() => setAll((v) => !v)} className="mt-1 cursor-pointer text-[12px] text-[var(--text-muted)] underline underline-offset-2">
                {all ? 'Replier' : `Voir les ${exam.revisions.length - 5} autres blocs`}
              </button>
            ) : null}
          </>
        )}
      </Block>
      {cours > 0 ? <p className="text-[12px] text-[var(--text-faint)]">{cours} séances de cours et jours fériés de l&apos;agenda sont mis de côté (hors périmètre).</p> : null}
    </Panel>
  );
}

export function PisteAdmin({ admin, onDone }) {
  const empty = admin.recurrences.length === 0 && admin.items.length === 0 && admin.events.length === 0;
  return (
    <Panel title="Admin et perso" kicker="Piste 2 · paiements et démarches">
      {empty ? <Empty>Rien d&apos;administratif d&apos;ouvert.</Empty> : null}

      {admin.recurrences.length > 0 ? (
        <Block title="Paiements récurrents" count={admin.recurrences.length}>
          <ul className="flex flex-col gap-2">
            {admin.recurrences.map((r) => {
              const due = r.tasks[0];
              const late = due?.days !== null && due?.days !== undefined && due.days < 0;
              return (
                <li key={r.key} className="rounded-[var(--radius-sm)] bg-[var(--bg)] p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-[var(--text)]">{r.label}</p>
                      <p className="text-[12px] text-[var(--text-muted)]">
                        {r.tasks.length} échéances regroupées, chaque mois le {r.dom === 1 ? '1er' : r.dom} · prochain {fmtDay(r.next)}
                      </p>
                      {late ? (
                        <p className="mt-0.5 text-[12px]" style={{ color: 'var(--danger)' }}>
                          Le premier paiement n&apos;est pas marqué fait ({due.text})
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <When days={r.days} />
                      {due ? (
                        <Ghost onClick={() => onDone(due)} label={`Marquer fait : ${due.text}`}>
                          Payé
                        </Ghost>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Block>
      ) : null}

      {admin.items.length > 0 || admin.events.length > 0 ? (
        <Block title="Démarches et achats" count={admin.items.length + admin.events.length}>
          <ul className="flex flex-col gap-1">
            {admin.items.map((t) => (
              <li key={t.key} className="flex min-w-0 items-start gap-2">
                <span className="min-w-0 flex-1 text-[13px] leading-snug break-words text-[var(--text)]" title={t.title}>
                  {t.text}
                </span>
                <When days={t.days} />
                <Ghost onClick={() => onDone(t)} label={`Marquer fait : ${t.text}`}>
                  Fait
                </Ghost>
              </li>
            ))}
            {admin.events.map((e) => (
              <li key={e.key} className="flex min-w-0 items-baseline gap-2">
                <span className="min-w-0 flex-1 text-[13px] text-[var(--text)]">{e.text}</span>
                <span className={`${MONO} text-[11px] text-[var(--text-muted)]`}>{fmtDay(e.day)}</span>
              </li>
            ))}
          </ul>
        </Block>
      ) : null}
    </Panel>
  );
}
