'use client';

// Une campagne = une cible de recrutement : son étape, ses échéances, ses relances de personnes
// et ses blocs de préparation à venir dans l'agenda. Tous les gestes sont simulés (journal).
import { useState } from 'react';
import { STAGES, fmtDay, fmtRange } from './classify';
import { Block, DISPLAY, Dot, Ghost, KIND_LABEL, KIND_TONE, MONO, PersonMark, WithPerson, STAGE_TONE, When } from './ui';

function StageTrack({ stage, name, onStage }) {
  const idx = STAGES.findIndex((s) => s.id === stage);
  return (
    <div role="group" aria-label={`Étape de ${name}`} className="flex gap-1">
      {STAGES.map((s, i) => (
        <button
          key={s.id}
          type="button"
          aria-pressed={i === idx}
          aria-label={`Passer ${name} à l'étape ${s.label}`}
          title={s.label}
          onClick={() => i !== idx && onStage(s.id)}
          className="group flex min-h-6 min-w-0 flex-1 cursor-pointer items-center"
        >
          <span
            className="block h-1.5 w-full rounded-full transition-all group-hover:h-2.5"
            style={{ background: i <= idx ? STAGE_TONE[stage] : 'var(--border-strong)', opacity: i <= idx ? 1 : 0.55 }}
          />
        </button>
      ))}
    </div>
  );
}

function Row({ date, children, right, tone }) {
  return (
    <li className="flex min-w-0 items-start gap-2 py-1">
      <span className={`${MONO} w-[4.4rem] shrink-0 pt-px text-[11px] text-[var(--text-muted)]`}>{date}</span>
      {tone ? <Dot color={tone} className="mt-1.5" /> : null}
      <span className="min-w-0 flex-1 text-[13px] leading-snug break-words text-[var(--text)]">{children}</span>
      {right}
    </li>
  );
}

export default function Campagne({ c, onStage, onDone }) {
  const [showTodo, setShowTodo] = useState(false);
  const [showRel, setShowRel] = useState(false);
  const stage = STAGES.find((s) => s.id === c.stage);
  const tone = STAGE_TONE[c.stage];
  const { target } = c;
  const relances = showRel ? c.relances : c.relances.slice(0, 3);
  const dated = c.milestones;
  const prep = c.prep.slice(0, 3);
  const empty = dated.length === 0 && c.relances.length === 0 && c.prep.length === 0 && c.todo.length === 0;

  return (
    <article
      aria-label={`Campagne ${target.name}`}
      className="flex min-w-0 flex-col gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 [box-shadow:var(--shadow)]"
      style={{ borderTop: `3px solid ${tone}` }}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className={`${DISPLAY} text-lg leading-tight text-[var(--text)]`}>{target.name}</h3>
          <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">
            {c.next ? (
              <>
                Prochain : <span className="text-[var(--text)]">{c.next.label}</span>
              </>
            ) : c.stage === 'clos' ? (
              'Rien à venir'
            ) : (
              'Pas de date posée'
            )}
          </p>
        </div>
        {c.next ? <When days={c.next.days} className="mt-1" /> : null}
      </header>

      <div>
        <StageTrack stage={c.stage} name={target.name} onStage={(s) => onStage(c, s)} />
        <p className={`${MONO} mt-0.5 text-[11px] tracking-wide text-[var(--text-muted)] uppercase`}>
          <span style={{ color: tone }}>{stage.label}</span> · {c.openTasks} tâche{c.openTasks > 1 ? 's' : ''} ouverte{c.openTasks > 1 ? 's' : ''}
        </p>
      </div>

      {dated.length > 0 ? (
        <Block title="Échéances" count={dated.length}>
          <ul>
            {dated.map((m) => (
              <Row
                key={m.key}
                date={m.day ? (m.count > 1 ? fmtRange(m.day, m.to).replace(/^\w+\. /, '') : fmtDay(m.day)) : 'sans date'}
                tone={KIND_TONE[m.kindKey]}
                right={<When days={m.days} className="mt-0.5" />}
              >
                <span className="text-[var(--text-muted)]">{KIND_LABEL[m.kindKey]} · </span>
                {m.label}
                {m.count > 1 ? <span className="text-[var(--text-muted)]"> ({m.count}{m.task ? ' tâches' : ' séances'})</span> : null}
                {m.task ? (
                  <button
                    type="button"
                    onClick={() => onDone(m.task)}
                    className="ml-1 inline-flex min-h-7 cursor-pointer items-center px-1 text-[12px] text-[var(--text-muted)] underline underline-offset-2 hover:text-[var(--text)]"
                    aria-label={`Marquer fait : ${m.label}`}
                  >
                    fait
                  </button>
                ) : null}
              </Row>
            ))}
          </ul>
        </Block>
      ) : null}

      {c.relances.length > 0 ? (
        <Block title="Relances" count={c.relances.length}>
          <ul className="flex flex-col gap-1">
            {relances.map((r) => (
              <li key={r.key} className="flex min-w-0 items-center gap-2">
                <PersonMark person={r.person} />
                <span className="min-w-0 flex-1 text-[13px] leading-snug break-words text-[var(--text)]">
                  <WithPerson text={r.text} person={r.person} />
                </span>
                <When days={r.days} />
                <Ghost onClick={() => onDone(r)} label={`Marquer fait : ${r.text}`}>
                  Fait
                </Ghost>
              </li>
            ))}
          </ul>
          {c.relances.length > 3 ? (
            <button type="button" onClick={() => setShowRel((v) => !v)} className="mt-1 cursor-pointer text-[12px] text-[var(--text-muted)] underline underline-offset-2">
              {showRel ? 'Replier' : `Voir les ${c.relances.length - 3} autres`}
            </button>
          ) : null}
        </Block>
      ) : null}

      {c.prep.length > 0 ? (
        <Block title="Préparation à venir" count={c.prep.length}>
          <ul>
            {prep.map((e) => (
              <Row key={e.key} date={fmtDay(e.day)} right={<span className={`${MONO} text-[11px] text-[var(--text-faint)]`}>{e.time}</span>}>
                {e.text}
              </Row>
            ))}
          </ul>
          {c.prep.length > 3 ? (
            <p className="text-[12px] text-[var(--text-muted)]">
              + {c.prep.length - 3} autres blocs jusqu&apos;au {fmtDay(c.prep[c.prep.length - 1].day)}
            </p>
          ) : null}
        </Block>
      ) : null}

      {c.todo.length > 0 ? (
        <Block title="À faire" count={c.todo.length}>
          <button
            type="button"
            aria-expanded={showTodo}
            onClick={() => setShowTodo((v) => !v)}
            className="cursor-pointer text-[12px] text-[var(--text-muted)] underline underline-offset-2 hover:text-[var(--text)]"
          >
            {showTodo ? 'Replier' : `Voir les ${c.todo.length} tâche${c.todo.length > 1 ? 's' : ''} de préparation`}
          </button>
          {showTodo ? (
            <ul className="mt-1.5 flex flex-col gap-1">
              {c.todo.map((t) => (
                <li key={t.key} className="flex min-w-0 items-start gap-2">
                  <span className="min-w-0 flex-1 text-[13px] leading-snug break-words text-[var(--text)]" title={t.title}>
                    {t.text}
                    {t.count > 1 ? <span className="text-[var(--text-muted)]"> x{t.count}</span> : null}
                  </span>
                  <When days={t.days} />
                  <Ghost onClick={() => onDone(t)} label={`Marquer fait : ${t.text}`}>
                    Fait
                  </Ghost>
                </li>
              ))}
            </ul>
          ) : null}
        </Block>
      ) : null}

      {empty ? <p className="text-[13px] text-[var(--text-muted)]">Rien d&apos;ouvert pour cette cible.</p> : null}

      <footer className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--border)] pt-2">
        <span className="text-[12px] text-[var(--text-muted)]">
          {c.doneCount > 0 ? `${c.doneCount} fait${c.doneCount > 1 ? 'es' : ''} ou passé${c.doneCount > 1 ? 'es' : ''}` : 'Rien de fait encore'}
        </span>
        {c.stage === 'clos' ? (
          <Ghost onClick={() => onStage(c, 'prep')} label={`Rouvrir ${target.name}`}>
            Rouvrir
          </Ghost>
        ) : (
          <Ghost onClick={() => onStage(c, 'clos')} label={`Clore la cible ${target.name}`}>
            Clore la cible
          </Ghost>
        )}
      </footer>
    </article>
  );
}
