'use client';

import { useState } from 'react';
import { Button, Panel, Select } from '@/components/ui';

function Stat({ label, value, sub, alert = false }) {
  return (
    <div className={`min-w-0 rounded-xl border bg-zinc-950 px-3 py-2.5 ${alert ? 'border-red-800' : 'border-zinc-800'}`}>
      <div className="font-mono text-[10px] font-semibold tracking-[0.1em] text-zinc-400 uppercase">{label}</div>
      <div className={`tabular font-mono text-2xl font-bold ${alert ? 'text-red-400' : 'text-zinc-100'}`}>{value}</div>
      <div className="text-[11px] text-zinc-400">{sub}</div>
    </div>
  );
}

export default function ReviewWeek({ data, recased, emit, undo, variant }) {
  const { stats, later, ideas, future, candidates } = data;
  const max = Math.max(1, ...stats.map((s) => s.count));
  const total = stats.reduce((n, s) => n + s.count, 0);
  const [laterChoice, setLaterChoice] = useState({});
  const [ideaChoice, setIdeaChoice] = useState({});
  const [ideaBlock, setIdeaBlock] = useState({});
  const [picked, setPicked] = useState([]);

  const decideLater = (t, choice) => {
    setLaterChoice((c) => ({ ...c, [t.id]: choice }));
    emit(`later:${t.id}`, [
      choice === 'keep'
        ? `tasks : garder "${t.title}" dans Plus tard (status = 'later', revue le ${data.weekLabel})`
        : `tasks : abandonner "${t.title}" (status = 'dropped', sort de toutes les listes)`,
    ]);
  };
  const decideIdea = (n, choice) => {
    const block = future.find((b) => b.id === (ideaBlock[n.id] ?? future[0]?.id));
    setIdeaChoice((c) => ({ ...c, [n.id]: choice }));
    emit(
      `idea:${n.id}`,
      choice === 'task'
        ? [
            `tasks : créer "${n.content.slice(0, 60)}" dans le bloc "${block?.title ?? 'aucun bloc à venir'}" du ${block?.dayLabel ?? '?'} (event_id)`,
            `brain_notes : status = 'triaged', triaged_to = 'task', task_id = (nouvelle tâche)`,
          ]
        : [`brain_notes : status = 'done' (jetée) "${n.content.slice(0, 60)}"`]
    );
  };
  const togglePick = (t) => {
    const on = picked.includes(t.id);
    const nextPicked = on ? picked.filter((x) => x !== t.id) : [...picked, t.id];
    setPicked(nextPicked);
    const list = nextPicked.map((id) => candidates.find((c) => c.id === id));
    if (!list.length) undo('prio');
    else emit('prio', list.map((c) => `tasks : priorité de la semaine du ${data.weekLabel} = "${c.title}" (priority_week)`));
  };
  const undoLater = (id) => {
    setLaterChoice(({ [id]: _d, ...r }) => r);
    undo(`later:${id}`);
  };
  const undoIdea = (id) => {
    setIdeaChoice(({ [id]: _d, ...r }) => r);
    undo(`idea:${id}`);
  };

  return (
    <div className="grid gap-4">
      <p className="text-xs text-zinc-400">
        {variant === 'A'
          ? "Variante A : la revue du dimanche prend la place de la carte de bilan sur l'accueil, une fois par semaine."
          : 'Variante B : la routine du dimanche écrit cette revue dans la session ; tu tranches en listes numérotées. Ici, la version à cliquer.'}
      </p>

      <Panel title="Chiffres de la semaine">
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Faites" value={total} sub="sur 7 jours (done_at)" />
          <Stat label="Recasées" value={recased} sub="dans cette démo, non mesuré en base" />
          <Stat label="Ouvertes" value={data.openCount} sub={`dont ${data.overdueCount} en retard`} alert={data.overdueCount > 0} />
        </div>
        <div className="mt-4 flex h-24 items-end gap-1.5" role="img" aria-label={`Tâches faites par jour : ${stats.map((s) => `${s.label} ${s.count}`).join(', ')}`}>
          {stats.map((s) => (
            <div key={s.day} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
              <span className="font-mono text-[11px] text-zinc-300">{s.count}</span>
              <div className="w-full rounded-sm bg-[var(--color-accent)]" style={{ height: `${Math.max(2, (s.count / max) * 56)}px`, opacity: s.count ? 1 : 0.25 }} />
            </div>
          ))}
        </div>
        <div className="mt-1 flex gap-1.5">
          {stats.map((s) => <span key={s.day} className="min-w-0 flex-1 truncate text-center font-mono text-[9px] text-zinc-400">{s.label}</span>)}
        </div>
      </Panel>

      <Panel title="Plus tard : à trier" count={later.length}>
        <p className="mb-3 text-xs text-zinc-400">
          Tâches que la règle des 2 jours aurait déjà sorties de ta vue (bloc passé sans bilan, ou en retard de plus de 7 jours sans bloc). Garder = revue dans une semaine. Abandonner = elle disparaît.
        </p>
        {later.length === 0 ? <p className="text-sm text-zinc-400">Rien dans Plus tard.</p> : (
          <ul className="grid gap-2">
            {later.slice(0, 12).map((t) => (
              <li key={t.id} className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                <div className="min-w-0 break-words text-sm text-zinc-100">{t.title}</div>
                <div className="text-xs text-zinc-400">{t.reason}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {laterChoice[t.id] ? (
                    <>
                      <span className="text-xs text-emerald-300">{laterChoice[t.id] === 'keep' ? 'Gardée' : 'Abandonnée'}</span>
                      <Button onClick={() => undoLater(t.id)}>Annuler</Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => decideLater(t, 'keep')}>Garder</Button>
                      <Button onClick={() => decideLater(t, 'drop')}>Abandonner</Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {later.length > 12 && <p className="mt-2 text-xs text-zinc-400">{later.length - 12} autres masquées dans cette démo.</p>}
      </Panel>

      <Panel title="Idées en attente" count={ideas.length}>
        {ideas.length === 0 ? <p className="text-sm text-zinc-400">Aucune idée en attente.</p> : (
          <ul className="grid gap-2">
            {ideas.map((n) => (
              <li key={n.id} className="min-w-0 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                <div className="min-w-0 break-words text-sm text-zinc-100">{n.content}</div>
                {ideaChoice[n.id] ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-emerald-300">{ideaChoice[n.id] === 'task' ? 'Devenue une tâche' : 'Jetée'}</span>
                    <Button onClick={() => undoIdea(n.id)}>Annuler</Button>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Select aria-label="Bloc cible" value={ideaBlock[n.id] ?? future[0]?.id ?? ''} onChange={(e) => setIdeaBlock((s) => ({ ...s, [n.id]: e.target.value }))} className="min-w-0 max-w-full">
                      {future.length === 0 && <option value="">Aucun bloc orange à venir</option>}
                      {future.slice(0, 10).map((b) => <option key={b.id} value={b.id}>{b.dayLabel} {b.time} {b.title}</option>)}
                    </Select>
                    <Button disabled={!future.length} onClick={() => decideIdea(n, 'task')}>En faire une tâche dans un bloc</Button>
                    <Button onClick={() => decideIdea(n, 'trash')}>Jeter</Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title={`Choisis tes 5 priorités de la semaine du ${data.weekLabel}`} count={`${picked.length}/5`}>
        <ul className="grid gap-1.5">
          {candidates.map((c) => {
            const on = picked.includes(c.id);
            return (
              <li key={c.id}>
                <label className={`flex min-w-0 items-start gap-2 rounded-lg border px-3 py-2 text-sm ${on ? 'border-[var(--color-accent)] bg-zinc-800/60' : 'border-zinc-800 bg-zinc-950'}`}>
                  <input type="checkbox" className="mt-1" checked={on} disabled={!on && picked.length >= 5} onChange={() => togglePick(c)} />
                  <span className="min-w-0 break-words text-zinc-100">
                    {c.title}
                    {c.due && <span className={`ml-2 font-mono text-[11px] ${c.late ? 'text-red-400' : 'text-zinc-400'}`}>{c.late ? 'en retard, ' : ''}échéance {c.due}</span>}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        {picked.length >= 5 && <p className="mt-2 text-xs text-amber-300">5 priorités choisies : décoche-en une pour en changer.</p>}
      </Panel>
    </div>
  );
}
