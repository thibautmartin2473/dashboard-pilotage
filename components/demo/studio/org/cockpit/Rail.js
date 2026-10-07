'use client';

// Le rail d'infos : prochaine échéance (compte à rebours), bilan d'hier (une seule carte), mails non lus.
import { useState } from 'react';
import { formatMailDate } from '@/lib/home';
import { countdown, frDay, frDayShort, shortDay } from './lib';
import { BTN, BTN_PRIMARY, CARD, DISPLAY, FOCUS, LABEL, MONO } from './ui';

export function Echeance({ deadlines, nowMs }) {
  const [first, ...rest] = deadlines;
  if (!first) {
    return (
      <section className={`${CARD} p-3`} aria-label="Prochaine échéance">
        <h2 className={LABEL}>Prochaine échéance</h2>
        <p className="mt-2 text-[13px] text-[var(--text-muted)]">Aucune échéance datée devant vous.</p>
      </section>
    );
  }
  const c = countdown(first, nowMs);
  return (
    <section className={`${CARD} overflow-hidden`} aria-label="Prochaine échéance">
      <div className="p-3">
        <h2 className={LABEL}>Prochaine échéance</h2>
        <div className="mt-2 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-wide text-[var(--accent)] uppercase">{first.kind.label}</p>
            <p className={`${DISPLAY} mt-0.5 text-[15px] leading-snug font-semibold text-[var(--text)]`}>{first.title}</p>
            <p className="mt-1 text-[12px] text-[var(--text-muted)]">
              {frDay(first.day)}
              {first.prep.length > 0 && ` · ${first.prep.length} bloc${first.prep.length > 1 ? 's' : ''} de préparation prévu${first.prep.length > 1 ? 's' : ''}`}
              {first.prep.length === 0 && ' · aucun bloc de préparation'}
            </p>
          </div>
          <div className="shrink-0 text-right" aria-live="polite">
            <div className={`${DISPLAY} text-[32px] leading-none font-bold text-[var(--text)]`}>{c.big}</div>
            {c.sub && <div className={`${MONO} mt-1 text-[11px] text-[var(--text-muted)]`}>{c.sub}</div>}
          </div>
        </div>
      </div>
      {rest.length > 0 && (
        <ul className="border-t border-[color:var(--border)] bg-[var(--surface-2)] px-3 py-2">
          {rest.map((d) => {
            const k = countdown(d, nowMs);
            return (
              <li key={d.id} className="flex items-baseline justify-between gap-2 py-0.5 text-[12px]">
                <span className="min-w-0 truncate text-[var(--text-muted)]">
                  <span className={MONO}>{shortDay(d.day)}</span> {d.title}
                </span>
                <span className={`${MONO} shrink-0 font-semibold text-[var(--text)]`}>{k.big}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// Une carte pour toute la veille. `groups` : blocs d'hier avec tâches ouvertes ; `result` : null tant
// qu'en attente, puis { done, recased } ; `onResolve(mode, doneIds)` ; `onReplay()` pour rejouer la démo.
export function Bilan({ groups, yesterday, result, onResolve, onReplay }) {
  const [checked, setChecked] = useState({});
  const all = groups.flatMap((g) => g.tasks);
  const ticked = all.filter((t) => checked[t.id]);

  if (result) {
    return (
      <section className={`${CARD} border-l-[5px] border-l-[color:var(--success)] p-3`} aria-label="Bilan d'hier">
        <h2 className={LABEL}>Bilan d&apos;hier</h2>
        <p className="mt-1.5 text-[13px] text-[var(--text)]">
          Clos : {result.done} faite{result.done > 1 ? 's' : ''}, {result.recased} recasée{result.recased > 1 ? 's' : ''}.
        </p>
        <button type="button" onClick={() => { setChecked({}); onReplay(); }} className={`${LABEL} mt-1.5 underline underline-offset-2 ${FOCUS}`}>
          Rejouer le bilan
        </button>
      </section>
    );
  }
  if (all.length === 0) {
    return (
      <section className={`${CARD} p-3`} aria-label="Bilan d'hier">
        <h2 className={LABEL}>Bilan d&apos;hier</h2>
        <p className="mt-1.5 text-[13px] text-[var(--text-muted)]">Rien en attente : tous les blocs d&apos;hier sont soldés.</p>
      </section>
    );
  }
  return (
    <section className={`${CARD} border-l-[5px] border-l-[color:var(--warning)] p-3`} aria-label="Bilan d'hier">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className={LABEL}>Bilan d&apos;hier</h2>
        <span className="text-[11px] text-[var(--text-muted)]">{frDayShort(yesterday)}</span>
      </div>
      <p className={`${DISPLAY} mt-1 text-[15px] leading-snug font-semibold text-[var(--text)]`}>
        {all.length} tâche{all.length > 1 ? 's' : ''} restée{all.length > 1 ? 's' : ''} ouverte{all.length > 1 ? 's' : ''} dans {groups.length} bloc{groups.length > 1 ? 's' : ''}
      </p>
      <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">Cochez ce qui était fait.</p>

      <div className="mt-2 space-y-2.5">
        {groups.map((g) => (
          <div key={g.block.id}>
            <p className="text-[12px] font-semibold text-[var(--text)]">
              {g.title} <span className={`${MONO} font-normal text-[var(--text-muted)]`}>{g.time}</span>
            </p>
            <ul className="mt-0.5">
              {g.tasks.map((t) => (
                <li key={t.id}>
                  <label className="flex cursor-pointer items-start gap-2 rounded-[var(--radius-sm)] px-1 py-1 text-[13px] leading-snug hover:bg-[var(--surface-2)]">
                    <input
                      type="checkbox"
                      checked={Boolean(checked[t.id])}
                      onChange={() => setChecked((c) => ({ ...c, [t.id]: !c[t.id] }))}
                      className={`mt-[1px] size-4 shrink-0 cursor-pointer [accent-color:var(--accent)] ${FOCUS}`}
                    />
                    <span className="text-[var(--text)]">{t.title}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => onResolve('done', [])} className={BTN_PRIMARY}>
          Tout était fait
        </button>
        <button type="button" onClick={() => onResolve('partial', ticked.map((t) => t.id))} className={BTN}>
          Recaser le reste ({all.length - ticked.length})
        </button>
      </div>
    </section>
  );
}

export function Mails({ unread, onNavigate }) {
  const rows = unread.slice(0, 5);
  return (
    <section className={`${CARD} p-3`} aria-label="Mails non lus">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className={LABEL}>Mails non lus</h2>
        <span className={`${DISPLAY} text-[22px] leading-none font-bold text-[var(--text)]`}>{unread.length}</span>
      </div>
      {rows.length === 0 ? (
        <p className="mt-2 text-[13px] text-[var(--text-muted)]">Boîte à zéro.</p>
      ) : (
        <ul className="mt-2 divide-y divide-[color:var(--border)]">
          {rows.map((m) => (
            <li key={m.id} className="py-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="min-w-0 truncate text-[13px] font-semibold text-[var(--text)]">{m.sender || 'Expéditeur inconnu'}</span>
                <span className={`${MONO} shrink-0 text-[11px] text-[var(--text-faint)]`}>{formatMailDate(m.received_at)}</span>
              </div>
              <div className="truncate text-[12px] text-[var(--text-muted)]">{m.subject || '(sans objet)'}</div>
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={() => onNavigate?.('mails')} className={`${LABEL} mt-2 underline underline-offset-2 ${FOCUS}`}>
        Tous les mails
      </button>
    </section>
  );
}
