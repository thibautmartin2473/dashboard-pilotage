'use client';

import { useMemo, useState } from 'react';
import { addDays, buildRows, dayCapacity, dayLong, dayShort, fmtMin, frDay, horizonDays, loadState } from './Logic';
import { Btn, Frame, Label, PanelHead, Phrase, Stat, Tag, cx } from './ui';

const MAX_PRIO = 3;
const TONE_VAR = { ok: 'var(--accent)', near: 'var(--warning)', over: 'var(--danger)' };

function Gauge({ rows, avail, target, load }) {
  const total = Math.max(avail, load, 1);
  const starts = rows.reduce((acc, r, i) => [...acc, i ? acc[i - 1] + rows[i - 1].min : 0], []);
  return (
    <div className="mt-3">
      <div
        className="relative flex h-9 gap-[2px] overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--bg)]"
        role="img"
        aria-label={`${fmtMin(load)} engagées, cible ${fmtMin(target)}, ${fmtMin(avail)} libres`}
      >
        {rows.map((r, i) => {
          const start = starts[i];
          const end = start + r.min;
          const color = end <= target ? 'var(--accent)' : start >= target ? 'var(--danger)' : 'var(--warning)';
          return (
            <div
              key={r.id}
              title={`${r.title} : ${fmtMin(r.min)}`}
              className="h-full min-w-[3px] transition-[width] duration-100 motion-reduce:transition-none"
              style={{ width: `${(r.min / total) * 100}%`, background: color, opacity: 0.88 }}
            />
          );
        })}
        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-[var(--text)]" style={{ left: `${(target / total) * 100}%` }} />
        {load > avail && (
          <div className="pointer-events-none absolute inset-y-0 border-l-2 border-dashed border-[var(--text-muted)]" style={{ left: `${(avail / total) * 100}%` }} />
        )}
      </div>
      <div className="relative mt-1 h-4 font-mono text-[10.5px] text-[var(--text-muted)]">
        <span className="absolute left-0">0</span>
        <span className="absolute -translate-x-1/2 whitespace-nowrap text-[var(--text)]" style={{ left: `${Math.min(88, Math.max(12, (target / total) * 100))}%` }}>
          cible {fmtMin(target)}
        </span>
        <span className="absolute right-0">{fmtMin(total)}</span>
      </div>
      {load > avail && <p className="text-[11.5px] text-[var(--text-faint)]">Trait pointillé : fin du temps libre ({fmtMin(avail)}). Au-delà, tu travailles sur du temps déjà pris.</p>}
    </div>
  );
}

export default function PanelJournee({ data, shared, log }) {
  const nowMs = Date.parse(data.nowIso);
  const { est, logged, done, asleep } = shared;
  const days = useMemo(() => horizonDays(data.today), [data.today]);
  const [dayIdx, setDayIdx] = useState(0);
  const [pct, setPct] = useState(70);
  const [prio, setPrio] = useState({});
  const [moved, setMoved] = useState({});
  const [showRest, setShowRest] = useState(false);
  const [msg, setMsg] = useState('');

  const allRows = useMemo(
    () => buildRows({ tasks: data.tasks, events: data.events, categories: data.categories, today: data.today, nowMs, est, logged, done, asleep }),
    [data.tasks, data.events, data.categories, data.today, nowMs, est, logged, done, asleep]
  );
  const dayOfRow = (r) => (r.id in moved ? moved[r.id] : r.baseDay);
  const caps = useMemo(
    () => Object.fromEntries(days.map((d) => [d, dayCapacity({ events: data.events, categories: data.categories, day: d })])),
    [days, data.events, data.categories]
  );
  const summary = days.map((d) => {
    const rows = allRows.filter((r) => dayOfRow(r) === d);
    const load = rows.reduce((s, r) => s + r.min, 0);
    return { d, rows, load, st: loadState(load, caps[d].avail, pct), cap: caps[d] };
  });

  const day = days[dayIdx];
  const cur = summary[dayIdx];
  const prioIds = (prio[day] ?? []).filter((id) => cur.rows.some((r) => r.id === id));
  const prioRows = prioIds.map((id) => cur.rows.find((r) => r.id === id));
  const rest = cur.rows.filter((r) => !prioIds.includes(r.id));
  const pool = allRows
    .filter((r) => r.kind === 'tâche' && !days.includes(dayOfRow(r) ?? ''))
    .sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999') || a.title.localeCompare(b.title))
    .slice(0, 8);

  const over = cur.st.key === 'over' ? cur.load - cur.st.target : 0;
  const candidate =
    over > 0
      ? [...rest].sort((a, b) => b.min - a.min).find((r) => cur.load - r.min <= cur.st.target) ?? [...rest].sort((a, b) => b.min - a.min)[0]
      : null;

  const toggleStar = (r) => {
    setMsg('');
    if (prioIds.includes(r.id)) {
      setPrio((p) => ({ ...p, [day]: prioIds.filter((x) => x !== r.id) }));
      return;
    }
    if (prioIds.length >= MAX_PRIO) {
      setMsg(`${MAX_PRIO} priorités au plus par jour. Retires-en une pour choisir « ${r.title.slice(0, 40)} ».`);
      return;
    }
    setPrio((p) => ({ ...p, [day]: [...prioIds, r.id] }));
    log(`tasks : priorité du ${frDay(day)} = "${r.title.slice(0, 50)}" (${prioIds.length + 1}/${MAX_PRIO})`);
  };
  const moveTo = (r, to) => {
    setMsg('');
    setMoved((m) => ({ ...m, [r.id]: days.includes(to) ? to : 'plus tard' }));
    log(
      r.kind === 'bloc'
        ? `calendar_events : déplacer le bloc "${r.title.slice(0, 40)}" au ${frDay(to)} (aperçu d'abord)`
        : `tasks : due_date = ${to} sur "${r.title.slice(0, 50)}"${r.baseDay ? ', event_id = null' : ''}`
    );
  };

  const renderRow = (r, star) => (
    <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--border)] px-3 py-1.5 last:border-b-0">
      <button
        type="button"
        onClick={() => toggleStar(r)}
        aria-pressed={star}
        aria-label={star ? `Retirer « ${r.title} » des priorités` : `Faire de « ${r.title} » une priorité`}
        className={cx(
          'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] sm:h-8 sm:w-8',
          'transition-colors duration-100 motion-reduce:transition-none',
          star ? 'text-[var(--accent)]' : 'text-[var(--text-faint)] hover:text-[var(--text)]'
        )}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
          <path d="M8 1.5l1.9 4.1 4.4.5-3.3 3 .9 4.4L8 11.3l-3.9 2.2.9-4.4-3.3-3 4.4-.5z" fill={star ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      </button>
      <span className="min-w-0 flex-1 basis-44 text-[13px] leading-snug break-words">
        {r.title}
        {r.block && <span className="ml-2 text-[11.5px] text-[var(--text-muted)]">{r.block}</span>}
      </span>
      {r.late > 0 && <Tag tone="danger">{r.late} j de retard</Tag>}
      {r.kind === 'bloc' && <Tag>bloc sans tâche</Tag>}
      <span className="w-14 text-right font-mono text-[12px] text-[var(--text)] tabular-nums">{fmtMin(r.min)}</span>
      <Btn tone="quiet" onClick={() => moveTo(r, addDays(day, 1))}>
        Décaler à demain
      </Btn>
    </li>
  );

  return (
    <Frame>
      <PanelHead
        n={3}
        title="Une journée qui a un plafond"
        rule="Chaque jour affiche ce qu'il engage contre ce qu'il peut tenir : heures estimées sur heures libres (9h-12h et 14h-19h moins les plages), avec une cible réglable. Trois priorités au plus ; le reste est replié. Dépasser la cible déclenche une alerte et un décalage proposé."
        problem="40 retards et 2 tâches faites en 7 jours : la liste promet plus que ce qu'une journée contient, alors tout glisse."
        reference="Sunsama (charge cible, 5 à 6 h engagées sur 8, alerte à l'approche et au dépassement), Akiflow (2 à 3 objectifs du jour). Contre-exemple : Motion tasse les journées."
        proof="HN et Mac Power Users : geoffaire (3 choses au plus), butz (limite dure : ajouter oblige à retirer). Sunsama : source primaire."
        effort="7 h : capacité calculée depuis les événements (déjà lus), jauge, champ de priorité du jour, alerte."
        criteria="F3 (3 priorités, charge sur heures disponibles, alerte), F8 (aucun push)"
        lib="aucune pour le calcul ; transitions de la jauge en CSS, nombres animés avec @number-flow/react."
      />

      <div className="grid grid-cols-5 gap-1 border-b border-[var(--border)] p-2 sm:gap-2 sm:px-5 sm:py-3" role="tablist" aria-label="Jour">
        {summary.map((s, i) => (
          <button
            key={s.d}
            type="button"
            role="tab"
            aria-selected={i === dayIdx}
            onClick={() => {
              setDayIdx(i);
              setMsg('');
            }}
            className={cx(
              'min-h-14 min-w-0 rounded-[var(--radius-sm)] border px-1.5 py-1.5 text-left transition-colors duration-100 motion-reduce:transition-none sm:px-2.5',
              i === dayIdx ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border)] hover:border-[var(--border-strong)]'
            )}
          >
            <span className="block truncate text-[11.5px] font-medium capitalize">{dayShort(s.d)}</span>
            <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
              <span
                className="block h-full rounded-full transition-[width] duration-100 motion-reduce:transition-none"
                style={{ width: `${Math.min(100, (s.load / Math.max(1, s.cap.avail)) * 100)}%`, background: TONE_VAR[s.st.key] }}
              />
            </span>
            <span className="mt-1 block truncate font-mono text-[10.5px] text-[var(--text-muted)] tabular-nums">{fmtMin(s.load)}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 px-4 py-5 sm:px-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Engagé" value={fmtMin(cur.load)} tone={cur.st.key === 'over' ? 'danger' : cur.st.key === 'near' ? 'warning' : 'accent'} />
            <Stat label="Cible" value={fmtMin(cur.st.target)} sub={`${pct} % du libre`} />
            <Stat label="Libre" value={fmtMin(cur.cap.avail)} sub="de 8 h de travail" />
            <Stat label="Plages" value={fmtMin(cur.cap.plage)} sub="cours et événements, hors blocs posés dessus" />
          </div>
          <Gauge rows={cur.rows} avail={cur.cap.avail} target={cur.st.target} load={cur.load} />

          <label htmlFor="cible" className="mt-3 block max-w-md">
            <span className="flex items-baseline justify-between gap-3 text-[12.5px]">
              <span className="text-[var(--text-muted)]">Cible de charge (Sunsama conseille 65 à 75 %)</span>
              <span className="font-mono text-[var(--accent)] tabular-nums">{pct} %</span>
            </span>
            <input id="cible" type="range" min={50} max={90} step={5} value={pct} onChange={(e) => setPct(Number(e.target.value))} className="mt-1 block h-6 w-full cursor-pointer accent-[var(--accent)]" />
          </label>

          <p
            aria-live="polite"
            className={cx(
              'mt-3 min-h-5 text-[13px] leading-relaxed',
              cur.st.key === 'over' ? 'text-[var(--danger)]' : cur.st.key === 'near' ? 'text-[var(--warning)]' : 'text-[var(--text-muted)]'
            )}
          >
            {msg ||
              (cur.st.key === 'over'
                ? `Tu dépasses ta cible de ${fmtMin(over)} ${dayLong(day, data.today)}.`
                : cur.st.key === 'near'
                  ? `Tu approches de ta cible : il reste ${fmtMin(cur.st.target - cur.load)} avant l'alerte.`
                  : `Sous la cible : il reste ${fmtMin(cur.st.target - cur.load)} de marge.`)}
          </p>
          {candidate && (
            <Btn className="mt-1" tone="primary" onClick={() => moveTo(candidate, addDays(day, 1))}>
              Décaler « {candidate.title.slice(0, 36)} » à demain, libère {fmtMin(candidate.min)}
            </Btn>
          )}

          <div className="mt-5">
            <div className="mb-2 flex items-baseline gap-3">
              <Label>Priorités du jour</Label>
              <span className="font-mono text-[11.5px] text-[var(--text-muted)] tabular-nums">
                {prioIds.length}/{MAX_PRIO}
              </span>
            </div>
            <ul className="rounded-[var(--radius-sm)] border border-[var(--border)]">
              {prioRows.length === 0 && <li className="px-3 py-3 text-[12.5px] text-[var(--text-muted)]">Aucune. Marque jusqu&apos;à trois lignes avec l&apos;étoile, ci-dessous.</li>}
              {prioRows.map((r) => renderRow(r, true))}
            </ul>
            <button
              type="button"
              aria-expanded={showRest}
              onClick={() => setShowRest((s) => !s)}
              className="mt-3 flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] px-3 text-left sm:min-h-9"
            >
              <span className="text-[13px] font-medium">Le reste de la journée</span>
              <span className="font-mono text-[12px] text-[var(--text-muted)] tabular-nums">{rest.length}</span>
              <span className="ml-auto font-mono text-[11px] text-[var(--text-muted)]" aria-hidden>
                {showRest ? '−' : '+'}
              </span>
            </button>
            {showRest && (
              <ul className="rounded-b-[var(--radius-sm)] border border-t-0 border-[var(--border)]">
                {rest.length === 0 && <li className="px-3 py-3 text-[12.5px] text-[var(--text-muted)]">Rien d&apos;autre ce jour-là.</li>}
                {rest.map((r) => renderRow(r, false))}
              </ul>
            )}
          </div>
        </div>

        <aside className="min-w-0">
          <Label>À poser quelque part</Label>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--text-muted)]">
            Tâches sans bloc sur les 5 jours, les plus urgentes d&apos;abord. Ajouter fait bouger la jauge de {dayLong(day, data.today)}.
          </p>
          <ul className="mt-3 rounded-[var(--radius-sm)] border border-[var(--border)]">
            {pool.length === 0 && <li className="px-3 py-3 text-[12.5px] text-[var(--text-muted)]">Tout est posé.</li>}
            {pool.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--border)] px-3 py-2 last:border-b-0">
                <span className="min-w-0 flex-1 basis-40 text-[13px] leading-snug break-words">{r.title}</span>
                <span className="font-mono text-[11.5px] text-[var(--text-muted)] tabular-nums">{fmtMin(r.min)}</span>
                <Btn onClick={() => moveTo(r, day)}>Ajouter</Btn>
              </li>
            ))}
          </ul>
        </aside>
      </div>
      <Phrase>
        Cale-moi {dayLong(day, data.today)} à {pct} % de charge, trois priorités au plus, et décale le reste sans me demander.
      </Phrase>
    </Frame>
  );
}
