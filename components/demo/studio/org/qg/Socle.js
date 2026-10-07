'use client';

// Le socle commun à toutes les cibles : cas, drills, fit, CV, réseau. Il ne vit pas dans une
// colonne d'étape, il alimente toutes les campagnes.
import { useState } from 'react';
import { fmtDay } from './classify';
import { Block, DISPLAY, Empty, Eyebrow, Ghost, MONO, PersonMark, WithPerson, When } from './ui';

export default function Socle({ socle, onDone }) {
  const [showTodo, setShowTodo] = useState(false);
  const total = socle.themes.reduce((n, [, c]) => n + c, 0);
  const nextBlocks = socle.blocks.slice(0, 4);
  return (
    <section
      aria-label="Socle conseil"
      className="grid min-w-0 gap-5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-4 [box-shadow:var(--shadow)] lg:grid-cols-3"
    >
      <div className="min-w-0 lg:col-span-3">
        <Eyebrow>Transversal · toutes les cibles</Eyebrow>
        <h3 className={`${DISPLAY} text-xl leading-tight text-[var(--text)]`}>Socle conseil</h3>
        <p className="text-[12px] text-[var(--text-muted)]">Cas, drills, fit, CV et réseau : ce qui sert à chaque campagne à la fois.</p>
      </div>

      <Block title="Préparation de fond" count={socle.todo.length}>
        {socle.todo.length === 0 ? (
          <Empty>Rien d&apos;ouvert.</Empty>
        ) : (
          <>
            <button
              type="button"
              aria-expanded={showTodo}
              onClick={() => setShowTodo((v) => !v)}
              className="cursor-pointer text-[12px] text-[var(--text-muted)] underline underline-offset-2 hover:text-[var(--text)]"
            >
              {showTodo ? 'Replier la liste' : `Déplier les ${socle.todo.length} tâches (séries regroupées)`}
            </button>
            {showTodo ? (
              <ul className="mt-1.5 flex flex-col gap-1">
                {socle.todo.map((t) => (
                  <li key={t.key} className="flex min-w-0 items-start gap-2">
                    <span className="min-w-0 flex-1 text-[13px] leading-snug break-words text-[var(--text)]" title={t.title}>
                      {t.text}
                      {t.count > 1 ? <span className="text-[var(--text-muted)]"> x{t.count}</span> : null}
                    </span>
                    <Ghost onClick={() => onDone(t)} label={`Marquer fait : ${t.text}`}>
                      Fait
                    </Ghost>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        )}
      </Block>

      <Block title="Réseau hors cible" count={socle.relances.length}>
        {socle.relances.length === 0 ? (
          <Empty>Aucune relance en attente.</Empty>
        ) : (
          <ul className="flex flex-col gap-1">
            {socle.relances.map((r) => (
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
        )}
      </Block>

      <Block title="Blocs à venir dans l'agenda" count={socle.blocks.length}>
        {socle.themes.length > 0 ? (
          <ul className="mb-2 flex flex-col gap-1.5" aria-label="Répartition des blocs par thème">
            {socle.themes.map(([name, n]) => (
              <li key={name} className="flex items-center gap-2 text-[12px]">
                <span className="w-36 shrink-0 text-[var(--text-muted)]">{name}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
                  <span className="block h-full rounded-full" style={{ width: `${Math.max(8, (n / total) * 100)}%`, background: 'var(--accent)' }} />
                </span>
                <span className={`${MONO} w-5 text-right text-[var(--text)]`}>{n}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <ul>
          {nextBlocks.map((e) => (
            <li key={e.key} className="flex min-w-0 items-baseline gap-2 py-0.5">
              <span className={`${MONO} w-[4.4rem] shrink-0 text-[11px] text-[var(--text-muted)]`}>{fmtDay(e.day)}</span>
              <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--text)]" title={e.text}>
                {e.text}
              </span>
            </li>
          ))}
        </ul>
        {socle.doneCount > 0 ? <p className="mt-1 text-[12px] text-[var(--text-muted)]">{socle.doneCount} faites ou passées</p> : null}
      </Block>
    </section>
  );
}
