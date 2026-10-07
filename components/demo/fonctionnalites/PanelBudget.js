'use client';

import { useMemo, useState } from 'react';
import { STEP, estimateMin, fmtMin, frDateTime, makeCtx, taskBudget, taskState, weekFree, cleanBlockTitle } from './Logic';
import { Btn, Cells, Frame, Label, PanelHead, Phrase, Stat, Tag, cx } from './ui';

const STATE_TONE = { late: 'danger', locked: 'warning', nobloc: 'muted', ontime: 'accent', asleep: 'muted', done: 'success' };
const SHOWN = 10;

export default function PanelBudget({ data, shared, upd, log }) {
  const nowMs = Date.parse(data.nowIso);
  const { est, logged, locked, asleep, done } = shared;
  const [sel, setSel] = useState(null);
  const [all, setAll] = useState(false);

  const ctx = useMemo(() => makeCtx({ tasks: data.tasks, events: data.events, nowMs, today: data.today }), [data.tasks, data.events, nowMs, data.today]);
  const free = useMemo(
    () => weekFree({ events: data.events, categories: data.categories, today: data.today, nowMs }),
    [data.events, data.categories, data.today, nowMs]
  );

  const rows = useMemo(
    () =>
      data.tasks
        .map((t) => {
          const b = taskBudget(t, ctx, { est, logged });
          return { t, b, st: taskState(b, { locked: locked[t.id], asleep: asleep[t.id], done: done[t.id] }) };
        })
        .sort(
          (x, y) =>
            Number(y.st.key === 'late') - Number(x.st.key === 'late') ||
            (x.t.due_date ?? '9999').localeCompare(y.t.due_date ?? '9999') ||
            y.b.R - x.b.R
        ),
    [data.tasks, ctx, est, logged, locked, asleep, done]
  );

  const live = rows.filter((r) => r.st.key !== 'done' && r.st.key !== 'asleep');
  const tot = live.reduce((s, r) => ({ R: s.R + r.b.R, F: s.F + r.b.F, U: s.U + r.b.U }), { R: 0, F: 0, U: 0 });
  const shown = all ? rows : rows.slice(0, SHOWN);
  const short = tot.U - free;

  const cut = (t) => t.title.slice(0, 50);
  const consign = (r, min) => {
    upd('logged', r.t.id, Math.min(r.b.B, (logged[r.t.id] ?? 0) + min));
    log(`tasks : consigner ${fmtMin(min)} fait sur "${cut(r.t)}" (spent_min += ${min}, le budget restant baisse de autant)`);
  };

  return (
    <Frame>
      <PanelHead
        n={2}
        title="La tâche est un budget de temps"
        rule="Une tâche porte une durée estimée. Les blocs de l'agenda ne sont pas des copies de la tâche : ils en consomment le budget. Ce qui est fait hors bloc se consigne, et le reste à faire se lit d'un coup d'œil en cellules de 15 minutes."
        problem="« La tâche est une copie de ce que l'agenda montre déjà » (DIAGNOSTIC) : un bloc passé sans coche ne dit rien, d'où les 95 « Oublié hier ? »."
        reference="Reclaim (durée totale, démarrer, consigner du travail fait hors bloc, reporter la tâche entière, verrouiller) ; Motion pour la grammaire des états."
        proof="Aide Reclaim et billet Dropbox (primaires). HN : krono, « le bloc est une suggestion, pas un contrat »."
        effort="12 h : deux colonnes (estimate_min, spent_min), skill planifier qui écrit l'estimation, bande de cellules, consigner et report."
        criteria="F1, F6 (pas de 15 min), F4 (verrouiller ce que Claude ne doit pas toucher)"
        lib="@number-flow/react pour les durées, Motion (composant m, LazyMotion) pour l'animation des cellules."
      />

      <div className="grid grid-cols-2 gap-4 border-b border-[var(--border)] px-4 py-4 sm:grid-cols-4 sm:px-5">
        <Stat label="Reste à faire" value={fmtMin(tot.R)} sub={`${live.length} tâches ouvertes`} />
        <Stat label="Posé à venir" value={fmtMin(tot.F)} sub="dans des blocs futurs" tone="accent" />
        <Stat label="Sans bloc" value={fmtMin(tot.U)} sub="aucun créneau réservé" tone={tot.U > free ? 'danger' : undefined} />
        <Stat label="Libre sur 5 jours" value={fmtMin(free)} sub="9h-12h et 14h-19h, hors blocs" />
      </div>
      <p
        className={cx(
          'border-b border-[var(--border)] px-4 py-3 text-[13px] leading-relaxed sm:px-5',
          short > 0 ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'
        )}
        aria-live="polite"
      >
        {short > 0
          ? `Il manque ${fmtMin(short)} : tout ne rentrera pas dans les 5 prochains jours. C'est ce que Claude doit te dire avant de poser quoi que ce soit.`
          : `Les ${fmtMin(tot.U)} sans bloc rentrent dans les ${fmtMin(free)} libres des 5 prochains jours.`}
        <span className="text-[var(--text-muted)]"> Durées devinées du titre par la démo : la vraie table n&apos;a pas encore cette colonne.</span>
      </p>

      <ul>
        {shown.map((r) => {
          const { t, b, st } = r;
          const open = sel === t.id;
          const total = Math.ceil(Math.max(b.B, b.L + b.F) / STEP);
          const dim = st.key === 'done' || st.key === 'asleep';
          return (
            <li key={t.id} className="border-b border-[var(--border)] last:border-b-0">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setSel(open ? null : t.id)}
                className="flex min-h-14 w-full flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5 text-left hover:bg-[var(--surface-2)] sm:px-5"
              >
                <span className={cx('min-w-0 flex-1 basis-56 text-[13.5px] leading-snug break-words', dim && 'text-[var(--text-muted)] line-through')}>
                  {t.title}
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <Cells size="sm" total={total} done={b.L / STEP} planned={b.F / STEP} label={`${fmtMin(b.L)} fait, ${fmtMin(b.F)} posé, ${fmtMin(b.U)} sans bloc sur ${fmtMin(b.B)}`} />
                  <span className="w-14 text-right font-mono text-[11.5px] text-[var(--text-muted)] tabular-nums">{fmtMin(b.B)}</span>
                  <Tag tone={STATE_TONE[st.key]} dashed={st.key === 'nobloc'} className="w-32 justify-center">
                    {st.label}
                  </Tag>
                </span>
              </button>

              {open && (
                <div className="space-y-4 border-t border-[var(--border)] bg-[var(--surface-2)] px-4 py-4 sm:px-5">
                  <div>
                    <Cells
                      total={total}
                      done={b.L / STEP}
                      planned={b.F / STEP}
                      label={`${fmtMin(b.L)} fait, ${fmtMin(b.F)} posé, ${fmtMin(b.U)} sans bloc sur ${fmtMin(b.B)}`}
                    />
                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[12px] tabular-nums">
                      <span className="text-[var(--accent)]">fait {fmtMin(b.L)}</span>
                      <span className="text-[var(--cat-tache)]">posé {fmtMin(b.F)}</span>
                      <span className="text-[var(--text-muted)]">sans bloc {fmtMin(b.U)}</span>
                      <span className="text-[var(--text)]">budget {fmtMin(b.B)}</span>
                    </div>
                    <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-muted)]">
                      {t.due_date ? `Échéance ${t.due_date.slice(8, 10)}/${t.due_date.slice(5, 7)}. ` : 'Sans échéance. '}
                      {b.ev
                        ? `Bloc lié : « ${cleanBlockTitle(b.ev.title)} », ${frDateTime(b.ev.starts_at)}${(ctx.perEvent.get(b.ev.id) ?? 1) > 1 ? `, partagé entre ${ctx.perEvent.get(b.ev.id)} tâches` : ''}.`
                        : 'Aucun bloc lié.'}
                    </p>
                  </div>

                  {b.P > 0 && (
                    <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-sm)] border border-dashed border-[var(--danger)] px-3 py-2.5 text-[12.5px]">
                      <span className="min-w-0 flex-1 basis-56 text-[var(--text)]">
                        Le bloc est passé : {fmtMin(b.P)} non consignées. Fait ou pas ?
                      </span>
                      <Btn onClick={() => consign(r, b.P)}>Consigner {fmtMin(b.P)} faites</Btn>
                      <Btn tone="quiet" onClick={() => setSel(null)}>
                        Replacer (voir l&apos;aperçu, onglet 4)
                      </Btn>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Btn disabled={b.R === 0} onClick={() => consign(r, STEP)}>
                      Consigner 15 min faites
                    </Btn>
                    <Btn
                      onClick={() => {
                        upd('est', t.id, b.B + STEP);
                        log(`tasks : estimate_min ${b.B} -> ${b.B + STEP} sur "${cut(t)}"`);
                      }}
                    >
                      Ajouter 15 min au budget
                    </Btn>
                    <Btn
                      disabled={b.B <= STEP}
                      onClick={() => {
                        upd('est', t.id, Math.max(STEP, b.B - STEP));
                        log(`tasks : estimate_min ${b.B} -> ${Math.max(STEP, b.B - STEP)} sur "${cut(t)}"`);
                      }}
                    >
                      Retirer 15 min
                    </Btn>
                    <Btn
                      pressed={!!locked[t.id]}
                      onClick={() => {
                        upd('locked', t.id, !locked[t.id]);
                        log(`tasks : ${locked[t.id] ? 'déverrouiller' : 'verrouiller'} "${cut(t)}" (Claude ne la replace plus seul)`);
                      }}
                    >
                      {locked[t.id] ? 'Verrouillée' : 'Verrouiller'}
                    </Btn>
                    <Btn
                      pressed={!!asleep[t.id]}
                      onClick={() => {
                        upd('asleep', t.id, !asleep[t.id]);
                        log(`tasks : snoozed_until = demain sur "${cut(t)}" (libère ${fmtMin(b.F)} de blocs à venir)`);
                      }}
                    >
                      {asleep[t.id] ? 'Réveiller' : 'Reporter à demain'}
                    </Btn>
                    <Btn
                      tone="primary"
                      onClick={() => {
                        upd('done', t.id, !done[t.id]);
                        log(`tasks : ${done[t.id] ? 'rouvrir' : 'marquer fait'} "${cut(t)}" (libère ${fmtMin(b.R)} de budget)`);
                      }}
                    >
                      {done[t.id] ? 'Rouvrir' : `Terminer, libère ${fmtMin(b.R)}`}
                    </Btn>
                    {(est[t.id] !== undefined || logged[t.id] !== undefined) && (
                      <Btn
                        tone="quiet"
                        onClick={() => {
                          upd('est', t.id, undefined);
                          upd('logged', t.id, undefined);
                        }}
                      >
                        Revenir à {fmtMin(estimateMin(t.title))}
                      </Btn>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {rows.length > SHOWN && (
        <div className="border-t border-[var(--border)] px-4 py-2 sm:px-5">
          <Btn tone="quiet" onClick={() => setAll((a) => !a)}>
            {all ? 'Voir les 10 premières' : `Voir les ${rows.length - SHOWN} autres`}
          </Btn>
        </div>
      )}
      <div className="border-t border-[var(--border)] px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11.5px] text-[var(--text-muted)]">
          <Label>Lecture</Label>
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block h-3 w-3 rounded-[3px] border border-[var(--accent)] bg-[var(--accent)]" /> fait
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block h-3 w-3 rounded-[3px] border border-dashed border-[var(--cat-tache)] bg-[color-mix(in_srgb,var(--cat-tache)_22%,transparent)]" /> posé dans un bloc futur
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="inline-block h-3 w-3 rounded-[3px] border border-[var(--border-strong)]" /> reste sans bloc
          </span>
        </div>
      </div>
      <Phrase>Estime mes tâches ouvertes, dis-moi s&apos;il me manque du temps cette semaine, et ne touche pas aux tâches verrouillées.</Phrase>
    </Frame>
  );
}
