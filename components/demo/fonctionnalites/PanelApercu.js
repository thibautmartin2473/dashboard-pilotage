'use client';

import { useMemo, useState } from 'react';
import { AGENDA_FROM, AGENDA_TO, cleanBlockTitle, dayIntervals, dayShort, packColumns, fmtMin, frDay, hm, horizonDays, planProposals, weekdayOf } from './Logic';
import { Btn, Frame, Label, PanelHead, Phrase, Tag, cx } from './ui';

const SPAN = AGENDA_TO - AGENDA_FROM;
const HOURS = [8, 10, 12, 14, 16, 18, 20];
const pos = (s, e) => ({ top: `${((s - AGENDA_FROM) / SPAN) * 100}%`, height: `${(Math.max(15, e - s) / SPAN) * 100}%` });

export default function PanelApercu({ data, shared, log }) {
  const nowMs = Date.parse(data.nowIso);
  const days = useMemo(() => horizonDays(data.today), [data.today]);
  const [freeDays, setFreeDays] = useState({});
  const [rejected, setRejected] = useState({});
  const [committed, setCommitted] = useState({});
  const [srcOpen, setSrcOpen] = useState(null);
  const [receipt, setReceipt] = useState('');

  const extraBusy = Object.values(committed).map((c) => ({ day: c.slot.day, s: c.slot.s, e: c.slot.e }));
  const proposals = useMemo(
    () =>
      planProposals({
        tasks: data.tasks,
        events: data.events,
        categories: data.categories,
        today: data.today,
        nowMs,
        est: shared.est,
        logged: shared.logged,
        locked: shared.locked,
        asleep: shared.asleep,
        done: shared.done,
        freeDays,
        extraBusy,
        exclude: Object.fromEntries(Object.values(committed).map((c) => [c.taskId, true])),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.tasks, data.events, data.categories, data.today, nowMs, shared, freeDays, committed]
  );
  const existing = useMemo(
    () => Object.fromEntries(days.map((d) => [d, packColumns(dayIntervals(data.events, d, data.categories))])),
    [days, data.events, data.categories]
  );

  const retained = proposals.filter((p) => p.slot && !rejected[p.id]);
  const noFit = proposals.filter((p) => !p.slot).length;
  const written = Object.values(committed);
  const sentenceDays = days.filter((d) => freeDays[d]).map((d) => weekdayOf(d));

  const commit = (list) => {
    if (!list.length) return;
    setCommitted((c) => ({
      ...c,
      ...Object.fromEntries(list.map((p) => [p.id, { taskId: p.taskId, title: p.title, slot: p.slot, chunk: p.chunk, at: nowMs }])),
    }));
    for (const p of list) {
      log(`calendar_events : créer le bloc "[bloc planifié] ${p.title.slice(0, 40)}" le ${frDay(p.slot.day)} de ${hm(p.slot.s)} à ${hm(p.slot.e)} (colorId 6)`);
      log(`tasks : event_id = nouveau bloc, due_date = ${p.slot.day} sur "${p.title.slice(0, 40)}"`);
    }
    setReceipt(`Démo : rien n'a été envoyé à Google Agenda. ${list.length} bloc${list.length > 1 ? 's auraient' : ' aurait'} été créé${list.length > 1 ? 's' : ''}, et ${list.length > 1 ? 'chacun reste annulable' : 'il reste annulable'} ci-dessous.`);
  };
  const undo = (id) => {
    const c = committed[id];
    setCommitted(({ ...rest }) => {
      delete rest[id];
      return rest;
    });
    log(`calendar_events : supprimer le bloc "${c.title.slice(0, 40)}" du ${frDay(c.slot.day)} (annulé)`);
    setReceipt('');
  };
  const toggleReject = (id) => setRejected((r) => ({ ...r, [id]: !r[id] }));

  return (
    <Frame>
      <PanelHead
        n={4}
        title="Claude propose, tu valides"
        rule="Quand Claude replanifie, rien n'est écrit dans Google Agenda tant que tu n'as pas validé. L'aperçu montre les blocs en pointillé dans un agenda bac à sable ; tu retiens ou refuses ligne par ligne, tu peux déclarer une journée libre, et chaque ligne dit pourquoi et d'où elle vient."
        problem="Claude replace déjà les tâches (66 sur 80 viennent du skill planifier) mais sans étape de revue : un bloc mal posé se découvre après coup, et la boucle fabrique des doublons."
        reference="Reclaim 2.0 (mode aperçu, un bouton de revue), Akiflow (Aki demande confirmation avant d'ajouter). Motion en contre-exemple : l'IA déplace sans expliquer."
        proof="Aide Reclaim et billet d'ingénierie Dropbox (primaires). Mac Power Users : Matt_Lockett (six semaines puis abandon). HN : afro88 (un bouton de source par élément)."
        effort="14 h : le placement existe en partie dans le skill planifier ; reste la table d'aperçu, l'écran de revue, l'écriture groupée et l'annulation. La plus coûteuse des quatre."
        criteria="F4 (aperçu, validation élément par élément, journée libre), F7 (source en 1 clic), F8"
        lib="Toast Base UI avec Annuler ; Motion pour l'apparition des blocs en pointillé."
      />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-[var(--border)] px-4 py-3 sm:px-5">
        <Label>Journée libre</Label>
        <div className="flex flex-wrap gap-2">
          {days.map((d) => (
            <Btn
              key={d}
              pressed={!!freeDays[d]}
              onClick={() => {
                setFreeDays((f) => ({ ...f, [d]: !f[d] }));
                log(`proposals : ${freeDays[d] ? 'reprendre' : 'laisser libre'} le ${frDay(d)} (Claude ne pose rien ce jour-là)`);
              }}
            >
              <span className="capitalize">{dayShort(d)}</span>
            </Btn>
          ))}
        </div>
      </div>

      <div className="grid gap-6 px-4 py-5 sm:px-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="min-w-0">
          <p className="text-[13px] leading-relaxed text-[var(--text-muted)]" aria-live="polite">
            {proposals.length === 0
              ? 'Rien à proposer : aucune tâche en retard ni proche de son échéance sans bloc.'
              : `${proposals.length} proposition${proposals.length > 1 ? 's' : ''}, ${retained.length} retenue${retained.length > 1 ? 's' : ''}${noFit ? `, ${noFit} ne rentre${noFit > 1 ? 'nt' : ''} pas` : ''}.`}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Btn tone="primary" disabled={retained.length === 0} onClick={() => commit(retained)}>
              Valider les {retained.length} retenues
            </Btn>
            <Btn
              onClick={() => setRejected(Object.fromEntries(proposals.map((p) => [p.id, true])))}
              disabled={proposals.length === 0}
            >
              Tout refuser
            </Btn>
            <Btn tone="quiet" onClick={() => setRejected({})}>
              Tout reprendre
            </Btn>
          </div>
          {receipt && (
            <p className="mt-3 rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-2 text-[12.5px] leading-relaxed text-[var(--text)]" aria-live="polite">
              {receipt}
            </p>
          )}

          <ul className="mt-4 rounded-[var(--radius-sm)] border border-[var(--border)]">
            {proposals.map((p) => {
              const off = rejected[p.id] || !p.slot;
              return (
                <li key={p.id} className="border-b border-[var(--border)] px-3 py-3 last:border-b-0">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={!off}
                      disabled={!p.slot}
                      aria-label={`Retenir « ${p.title} »`}
                      onClick={() => toggleReject(p.id)}
                      className="-m-2 inline-flex h-11 w-11 shrink-0 items-center justify-center disabled:opacity-40 sm:m-0 sm:h-6 sm:w-6"
                    >
                      <span
                        className={cx(
                          'flex h-5 w-5 items-center justify-center rounded-[4px] border transition-colors duration-100 motion-reduce:transition-none',
                          off ? 'border-[var(--border-strong)]' : 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-contrast)]'
                        )}
                      >
                        {!off && (
                          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                            <path d="M2.5 6.5l2.2 2.2L9.5 3.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className={cx('text-[13.5px] leading-snug break-words', off && 'text-[var(--text-muted)] line-through')}>{p.title}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[11.5px] tabular-nums">
                        {p.slot ? (
                          <>
                            <Tag tone="accent" dashed>
                              {fmtMin(p.chunk)}
                            </Tag>
                            <span className="text-[var(--text)]">
                              <span className="capitalize">{dayShort(p.slot.day)}</span> {hm(p.slot.s)} à {hm(p.slot.e)}
                            </span>
                          </>
                        ) : (
                          <Tag tone="danger" dashed>
                            Ne rentre pas
                          </Tag>
                        )}
                      </div>
                      <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--text-muted)]">{p.why.join(' ')}</p>
                      <button
                        type="button"
                        aria-expanded={srcOpen === p.id}
                        onClick={() => setSrcOpen(srcOpen === p.id ? null : p.id)}
                        className="mt-1 inline-flex min-h-11 items-center sm:min-h-8 text-[12px] text-[var(--accent)] underline decoration-[color-mix(in_srgb,var(--accent)_40%,transparent)] underline-offset-2"
                      >
                        {srcOpen === p.id ? 'Masquer la source' : 'Voir la source'}
                      </button>
                      {srcOpen === p.id && (
                        <p className="mt-1 rounded-[var(--radius-sm)] bg-[var(--surface-2)] px-2.5 py-2 text-[12px] leading-relaxed text-[var(--text)]">
                          {p.source}. Ouvre le bloc ou la tâche d&apos;origine dans le vrai site.
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
            {proposals.length === 0 && <li className="px-3 py-4 text-[12.5px] text-[var(--text-muted)]">Aucune proposition en attente.</li>}
          </ul>

          <div className="mt-5">
            <Label>Ce que Claude a changé</Label>
            <ul className="mt-2 rounded-[var(--radius-sm)] border border-[var(--border)]">
              {written.length === 0 && <li className="px-3 py-3 text-[12.5px] text-[var(--text-muted)]">Rien d&apos;écrit. Valide pour voir l&apos;entrée apparaître ici.</li>}
              {written.map((c) => (
                <li key={c.taskId} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--border)] px-3 py-2 last:border-b-0">
                  <span className="min-w-0 flex-1 basis-44 text-[12.5px] leading-snug break-words">
                    {c.title}
                    <span className="ml-2 font-mono text-[11.5px] text-[var(--text-muted)]">
                      <span className="capitalize">{dayShort(c.slot.day)}</span> {hm(c.slot.s)}
                    </span>
                  </span>
                  <Tag tone="success">écrit (démo)</Tag>
                  <Btn tone="quiet" onClick={() => undo(`p:${c.taskId}`)}>
                    Annuler
                  </Btn>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-[var(--text-muted)]">
            <Label>Agenda bac à sable</Label>
            <span className="inline-flex items-center gap-1.5">
              <i className="inline-block h-3 w-4 rounded-[3px] border border-dashed border-[var(--accent)] bg-[var(--accent-soft)]" /> proposé
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="inline-block h-3 w-4 rounded-[3px] bg-[var(--cat-tache)]" /> écrit
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="inline-block h-3 w-4 rounded-[3px] bg-[color-mix(in_srgb,var(--cat-cours)_35%,transparent)]" /> déjà là
            </span>
          </div>
          <div className="flex gap-1">
            <div className="relative w-6 shrink-0 pt-6" aria-hidden>
              <div className="relative h-[336px]">
                {HOURS.map((h) => (
                  <span key={h} className="absolute -translate-y-1/2 font-mono text-[9.5px] text-[var(--text-faint)]" style={{ top: `${((h * 60 - AGENDA_FROM) / SPAN) * 100}%` }}>
                    {h}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid min-w-0 flex-1 grid-cols-5 gap-1">
              {days.map((d) => (
                <div key={d} className="min-w-0">
                  <div className={cx('mb-1 h-5 truncate text-center font-mono text-[10.5px] capitalize', freeDays[d] ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]')}>
                    {freeDays[d] ? 'libre' : dayShort(d)}
                  </div>
                  <div className="relative h-[336px] overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)]">
                    {[[AGENDA_FROM, 540], [720, 840], [1140, AGENDA_TO]].map(([a, b]) => (
                      <div key={a} className="absolute inset-x-0 bg-[var(--surface-2)] opacity-70" style={pos(a, b)} />
                    ))}
                    {existing[d]
                      .filter((i) => i.e > AGENDA_FROM && i.s < AGENDA_TO)
                      .map((i) => (
                        <div
                          key={`${i.ev.id}-${i.s}`}
                          title={`${cleanBlockTitle(i.ev.title)}, ${hm(i.s)} à ${hm(i.e)}`}
                          className="absolute overflow-hidden rounded-[3px] border-l-2 px-1 text-[9px] leading-tight"
                          style={{
                            ...pos(Math.max(i.s, AGENDA_FROM), Math.min(i.e, AGENDA_TO)),
                            left: `calc(${(i.col / i.cols) * 100}% + 2px)`,
                            width: `calc(${100 / i.cols}% - 3px)`,
                            borderColor: i.kind === 'tache' ? 'var(--cat-tache)' : 'var(--cat-cours)',
                            background: `color-mix(in srgb, ${i.kind === 'tache' ? 'var(--cat-tache)' : 'var(--cat-cours)'} 22%, transparent)`,
                          }}
                        >
                          <span className="line-clamp-2 break-words text-[var(--text-muted)]">{cleanBlockTitle(i.ev.title)}</span>
                        </div>
                      ))}
                    {written
                      .filter((c) => c.slot.day === d)
                      .map((c) => (
                        <div
                          key={`w-${c.taskId}`}
                          title={`${c.title} (écrit en démo)`}
                          className="absolute inset-x-0.5 overflow-hidden rounded-[3px] bg-[var(--cat-tache)] px-1 text-[9px] leading-tight font-medium text-[var(--bg)]"
                          style={pos(c.slot.s, c.slot.e)}
                        >
                          <span className="line-clamp-2 break-words">{c.title}</span>
                        </div>
                      ))}
                    {proposals
                      .filter((p) => p.slot && p.slot.day === d && !rejected[p.id])
                      .map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleReject(p.id)}
                          title={`${p.title}, ${hm(p.slot.s)} à ${hm(p.slot.e)}. Cliquer pour refuser.`}
                          aria-label={`Refuser la proposition « ${p.title} »`}
                          className="absolute inset-x-0.5 overflow-hidden rounded-[3px] border border-dashed border-[var(--accent)] bg-[var(--accent-soft)] px-1 text-left text-[9px] leading-tight text-[var(--text)] transition-opacity duration-100 motion-reduce:transition-none"
                          style={pos(p.slot.s, p.slot.e)}
                        >
                          <span className="line-clamp-2 break-words">{p.title}</span>
                        </button>
                      ))}
                    {data.today === d && (
                      <div
                        className="pointer-events-none absolute inset-x-0 h-px bg-[var(--danger)]"
                        style={{ top: `${Math.min(100, Math.max(0, ((minNow(nowMs) - AGENDA_FROM) / SPAN) * 100))}%` }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-2 text-[11.5px] leading-relaxed text-[var(--text-faint)]">
            Les blocs de tâche se suivent un par un, jamais « X + Y » dans un même bloc. Clique un bloc en pointillé pour le refuser.
            {sentenceDays.length > 0 ? ` ${sentenceDays.map((s) => s[0].toUpperCase() + s.slice(1)).join(' et ')} restent libres.` : ''}
          </p>
        </div>
      </div>
      <Phrase>
        Replanifie mes retards sur les {days.length} prochains jours
        {sentenceDays.length > 0 ? `, laisse ${sentenceDays.join(' et ')} libre${sentenceDays.length > 1 ? 's' : ''}` : ''}, et montre-moi l&apos;aperçu avant d&apos;écrire dans l&apos;agenda.
      </Phrase>
    </Frame>
  );
}

function minNow(nowMs) {
  const f = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(nowMs));
  const [h, m] = f.split(':');
  return Number(h) * 60 + Number(m);
}
