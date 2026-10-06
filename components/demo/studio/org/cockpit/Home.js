'use client';

// Le Cockpit : l'agenda EST l'accueil. Une frise (jour / 3 jours / semaine) où les tâches vivent
// dans leurs blocs, un tiroir « À placer », un rail d'infos étroit. Aucune liste de tâches autonome.
// Tout est en état local : chaque geste réel est simplement écrit dans le journal du Studio.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildWeek, clampOffset, dayLabel, latestMails, timeParis } from '@/lib/home';
import { addDays, blocksOfDay, dayOf, isWorkBlock, suggestBlock } from '@/components/demo/TodayLogic';
import { findNextBlock, planWrites } from '@/components/demo/ReviewLogic';
import { diffDays } from '@/components/demo/DeadlinesLogic';
import Frise from './Frise';
import Tiroir from './Tiroir';
import { Bilan, Echeance, Mails } from './Rail';
import { VIEWS, bilanGroups, cleanTitle, frDay, frDayShort, futureWorkBlocks, partitionTasks, upcomingDeadlines, windowFor } from './lib';
import { BTN, DISPLAY, FOCUS, IconLeft, IconRight, MONO } from './ui';

const minutesOf = (ms) => {
  const [h, m] = timeParis(new Date(ms).toISOString()).split('h').map(Number);
  return h * 60 + m;
};

export default function OrgCockpitHome({ data, log, onNavigate }) {
  const today = data.today;
  const yesterday = addDays(today, -1);

  const [nowMs, setNowMs] = useState(() => Date.parse(data.nowIso));
  const [view, setView] = useState('jour');
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState({});
  const [done, setDone] = useState({});
  const [placed, setPlaced] = useState({});
  const [later, setLater] = useState({});
  const [bilanResult, setBilanResult] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [hover, setHover] = useState(null);
  const [notice, setNotice] = useState(null);
  const scroller = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const events = useMemo(() => data.events.map((e) => ({ ...e, title: e.title ?? '' })), [data.events]);
  const eventsById = useMemo(() => new Map(events.map((e) => [e.id, e])), [events]);
  const categories = data.categories;

  const win = windowFor(view, offset, today);
  const week = useMemo(
    () => buildWeek(events, new Date(nowMs), categories, win.offset, win.length),
    [events, nowMs, categories, win.offset, win.length]
  );
  const nowMin = minutesOf(nowMs);

  // Tâches fusionnées avec les gestes locaux.
  const tasks = useMemo(
    () =>
      data.tasks
        .filter((t) => !later[t.id])
        .map((t) => ({ ...t, done: Boolean(done[t.id]), eventId: t.id in placed ? placed[t.id] : t.event_id })),
    [data.tasks, done, placed, later]
  );
  const groups = useMemo(() => bilanGroups({ events, categories, tasks: data.tasks, yesterday }), [events, categories, data.tasks, yesterday]);
  const bilanPending = groups.length > 0 && !bilanResult;
  const { byBlock, tray } = useMemo(
    () => partitionTasks({ tasks, eventsById, today, yesterday, bilanPending }),
    [tasks, eventsById, today, yesterday, bilanPending]
  );
  const waiting = bilanPending ? groups.flatMap((g) => g.tasks).length : 0;

  const unread = useMemo(() => latestMails(data.mails, 'all', 500).filter((m) => m.unread !== false), [data.mails]);
  const deadlines = useMemo(
    () => upcomingDeadlines({ tasks: data.tasks, events, today, nowMs }),
    [data.tasks, events, today, nowMs]
  );

  // ---- Gestes (état local + journal) ----
  const toggleTask = useCallback(
    (t) => {
      setDone((d) => ({ ...d, [t.id]: !t.done }));
      log(t.done ? `tasks : rouvrir "${t.title}" (done_at = null)` : `tasks : marquer fait "${t.title}" (done_at = maintenant)`);
    },
    [log]
  );

  const placeIn = useCallback(
    (t, blockId) => {
      const ev = eventsById.get(blockId);
      if (!ev) return;
      const day = dayOf(ev.starts_at);
      const where = `${cleanTitle(ev.title)}, ${dayLabel(day, today).toLowerCase()} à ${timeParis(ev.starts_at)}`;
      setPlaced((p) => ({ ...p, [t.id]: blockId }));
      log(`tasks : placer "${t.title}" dans le bloc "${cleanTitle(ev.title)}" du ${dayLabel(day, today).toLowerCase()} ${timeParis(ev.starts_at)} (event_id = ${String(blockId).slice(0, 8)}...)`);
      setNotice({ text: `Placée dans « ${where} ».`, day });
    },
    [eventsById, today, log]
  );

  const placeNext = (t) => {
    const origin = t.eventId ? eventsById.get(t.eventId) : null;
    const sug = suggestBlock(t, origin, events, categories, nowMs);
    if (!sug) {
      setNotice({ text: 'Aucun bloc de travail à venir dans l’agenda : la tâche reste dans le tiroir.', day: null });
      return;
    }
    placeIn(t, sug.event.id);
  };

  const unplace = (t) => {
    setPlaced((p) => ({ ...p, [t.id]: null }));
    log(`tasks : sortir "${t.title}" de son bloc (event_id = null, retour dans À placer)`);
    setNotice({ text: `« ${t.title} » est revenue dans le tiroir.`, day: null });
  };

  const drag = {
    id: dragId,
    hover,
    start: (id) => setDragId(id),
    end: () => { setDragId(null); setHover(null); },
    over: (id) => setHover(id),
    drop: (blockId) => {
      const t = tasks.find((x) => x.id === dragId);
      setDragId(null);
      setHover(null);
      if (!t) return;
      if (blockId === null) {
        if (t.eventId) unplace(t);
      } else if (t.eventId !== blockId) {
        placeIn(t, blockId);
      }
    },
  };

  const resolveBilan = (mode, doneIds) => {
    const future = futureWorkBlocks(events, categories, nowMs, today);
    const nextDone = {};
    const nextPlaced = {};
    const nextLater = {};
    let nd = 0;
    let nr = 0;
    for (const g of groups) {
      const blockRef = { id: g.block.id, title: g.title };
      const next = findNextBlock(blockRef, future);
      const plan = planWrites({ block: blockRef, tasks: g.tasks.map((t) => ({ id: t.id, title: t.title, done: false })), mode, doneIds, next });
      plan.lines.forEach((line) => log(line));
      nd += plan.done;
      nr += plan.recased;
      for (const t of g.tasks) {
        if (mode === 'done' || doneIds.includes(t.id)) nextDone[t.id] = true;
        else if (next) nextPlaced[t.id] = next.block.id;
        else nextLater[t.id] = true;
      }
    }
    setDone((d) => ({ ...d, ...nextDone }));
    setPlaced((p) => ({ ...p, ...nextPlaced }));
    setLater((l) => ({ ...l, ...nextLater }));
    setBilanResult({ done: nd, recased: nr, ids: groups.flatMap((g) => g.tasks.map((t) => t.id)) });
  };

  const replayBilan = () => {
    const ids = new Set(bilanResult?.ids ?? []);
    const strip = (o) => Object.fromEntries(Object.entries(o).filter(([k]) => !ids.has(k)));
    setDone(strip);
    setPlaced(strip);
    setLater(strip);
    setBilanResult(null);
    log('bilan d’hier : démo rejouée, rien n’avait été écrit');
  };

  // ---- Navigation dans la frise ----
  const v = VIEWS.find((x) => x.id === view) ?? VIEWS[0];
  const go = (n) => setOffset(clampOffset(win.offset + n * v.step));
  const goDay = (day) => { setOffset(clampOffset(diffDays(day, today))); setView('jour'); };
  const toggleOpen = (id, dflt) => setOpen((o) => ({ ...o, [id]: !(o[id] ?? dflt) }));

  // Au changement de fenêtre, la frise défile jusqu'à « maintenant » (ou au bloc en cours).
  useEffect(() => {
    const box = scroller.current;
    if (!box) return;
    const col = box.querySelector('[data-today]');
    box.scrollLeft = col ? Math.max(0, col.offsetLeft - 8) : 0;
    if (box.scrollHeight <= box.clientHeight) return;
    const target = box.querySelector('[data-live]') ?? box.querySelector('[data-now]');
    if (!target) { box.scrollTop = 0; return; }
    box.scrollTop += target.getBoundingClientRect().top - box.getBoundingClientRect().top - 72;
  }, [view, win.offset]);

  // ---- En-tête ----
  const todayBlocks = blocksOfDay(events, today).filter((b) => isWorkBlock(b, categories));
  const todayTasks = todayBlocks.flatMap((b) => byBlock.get(b.id) ?? []);
  const todayDone = todayTasks.filter((t) => t.done).length;
  const firstDay = week.days[0].day;
  const lastDay = week.days[week.days.length - 1].day;
  const title = view === 'jour' ? frDay(firstDay) : `${frDayShort(firstDay)} au ${frDayShort(lastDay)}`;
  const isHere = week.days.some((d) => d.isToday);

  return (
    <div className="mx-auto w-full max-w-[100rem] px-4 py-4 sm:px-6 sm:py-6">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[var(--accent)] uppercase">{isHere ? 'Le cockpit du jour' : 'Le cockpit'}</p>
          <h1 className={`${DISPLAY} text-[26px] leading-tight font-semibold text-[var(--text)] sm:text-[32px]`}>{title}</h1>
          <p className={`${MONO} mt-0.5 text-[12px] text-[var(--text-muted)]`}>
            {todayBlocks.length} bloc{todayBlocks.length > 1 ? 's' : ''} de travail aujourd&apos;hui · {todayDone}/{todayTasks.length} tâches faites
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Étendue de la frise" className="inline-flex rounded-[var(--radius-sm)] border border-[color:var(--border-strong)] bg-[var(--surface)] p-0.5">
            {VIEWS.map((x) => (
              <button
                key={x.id}
                type="button"
                aria-pressed={x.id === view}
                onClick={() => setView(x.id)}
                className={`rounded-[calc(var(--radius-sm)-2px)] px-3 py-1.5 text-[13px] font-medium ${FOCUS} ${x.id === view ? 'bg-[var(--accent)] text-[var(--accent-contrast)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}
              >
                {x.label}
              </button>
            ))}
          </div>
          <div className="inline-flex gap-1">
            <button type="button" className={BTN} onClick={() => go(-1)} aria-label="Période précédente"><IconLeft /></button>
            <button type="button" className={BTN} onClick={() => setOffset(0)} disabled={offset === 0}>
              Aujourd&apos;hui
            </button>
            <button type="button" className={BTN} onClick={() => go(1)} aria-label="Période suivante"><IconRight /></button>
          </div>
        </div>
      </header>

      <div className="mt-5 flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_21rem] lg:grid-rows-[auto_auto_auto_auto_1fr] lg:gap-x-6">
        <div className="order-2 min-w-0 lg:order-none lg:col-start-1 lg:row-span-5 lg:row-start-1">
          {notice && (
            <div role="status" className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[color:var(--accent)] bg-[var(--accent-soft)] px-3 py-2 text-[13px] text-[var(--text)]">
              <span>{notice.text}</span>
              <span className="flex gap-3">
                {notice.day && (
                  <button type="button" className={`font-semibold underline underline-offset-2 ${FOCUS}`} onClick={() => goDay(notice.day)}>
                    Voir le bloc
                  </button>
                )}
                <button type="button" className={`underline underline-offset-2 ${FOCUS}`} onClick={() => setNotice(null)}>
                  Fermer
                </button>
              </span>
            </div>
          )}
          <div ref={scroller} className="relative overflow-x-auto pb-2 lg:max-h-[calc(100dvh-15rem)] lg:min-h-[24rem] lg:overflow-y-auto lg:pr-2">
            <Frise week={week} view={view} nowMin={nowMin} byBlock={byBlock} open={open} onToggleOpen={toggleOpen} drag={drag} onToggleTask={toggleTask} />
          </div>
        </div>

        <div className="order-1 min-w-0 lg:order-none lg:col-start-2 lg:row-start-1">
          <Bilan groups={groups} yesterday={yesterday} result={bilanResult} onResolve={resolveBilan} onReplay={replayBilan} />
        </div>
        <div className="order-3 min-w-0 lg:order-none lg:col-start-2 lg:row-start-2">
          <Echeance deadlines={deadlines} nowMs={nowMs} />
        </div>
        <div className="order-4 min-w-0 lg:order-none lg:col-start-2 lg:row-start-3">
          <Tiroir tray={tray} waiting={waiting} drag={drag} onToggleDone={toggleTask} onPlace={placeNext} />
        </div>
        <div className="order-5 min-w-0 lg:order-none lg:col-start-2 lg:row-start-4">
          <Mails unread={unread} onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
}
