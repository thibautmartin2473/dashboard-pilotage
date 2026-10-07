'use client';

// La Console : l'accueil se pilote au clavier. Un champ de commande en haut, dessous une boîte
// de réception à zéro (une ligne par décision à prendre, raccourcis F R A P, J/K pour se
// déplacer), à droite la journée en colonne compacte. Lecture seule : chaque geste est simulé
// en état local et appelle log(...).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { frDateTime } from '@/components/demo/TriageLogic';
import {
  GESTURES, actionLog, buildDay, buildInbox, hm, localEntry, runCommand, slotFor, slotLabel, summarize, sundayOf, writesFor,
} from './logic';

const MONO = '[font-family:var(--font-mono)]';
const DISPLAY = '[font-family:var(--font-display)]';

const TONE_TEXT = {
  danger: 'text-[color:var(--danger)]',
  warning: 'text-[color:var(--warning)]',
  success: 'text-[color:var(--success)]',
  accent: 'text-[color:var(--accent)]',
  muted: 'text-[color:var(--text-muted)]',
};
const KIND_BAR = {
  cours: 'bg-[var(--cat-cours)]',
  tache: 'bg-[var(--cat-tache)]',
  autre: 'bg-[var(--cat-autre)]',
};
const MAX_FEED = 3;
const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]';

function isTyping(el) {
  const tag = el?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || Boolean(el?.isContentEditable);
}

export default function OrgConsoleHome({ data, log, onNavigate }) {
  const items = useMemo(() => buildInbox(data), [data]);
  const [decisions, setDecisions] = useState({});
  const [history, setHistory] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [text, setText] = useState('');
  const [outcome, setOutcome] = useState(null); // { type: 'preview' | 'error', ... }
  const [feed, setFeed] = useState([]);
  const [added, setAdded] = useState([]);
  const [doneTasks, setDoneTasks] = useState({});
  const inputRef = useRef(null);
  const userMoved = useRef(false);

  const pending = useMemo(() => items.filter((i) => !decisions[i.id]), [items, decisions]);
  const cur = Math.min(cursor, Math.max(0, pending.length - 1));
  const current = pending[cur];
  const recased = Object.values(decisions).filter((d) => d.g === 'R').length;
  const slot = useMemo(() => slotFor(data, recased), [data, recased]);
  const sunday = sundayOf(data);
  const day = useMemo(() => buildDay(data, added), [data, added]);
  const lastId = history[history.length - 1];
  const last = lastId ? items.find((i) => i.id === lastId) : null;

  const decide = useCallback(
    (g) => {
      if (!current) return;
      for (const line of writesFor(current, g, { slot, sunday })) log(line);
      setDecisions((d) => ({ ...d, [current.id]: { g, count: current.count } }));
      setHistory((h) => [...h, current.id]);
    },
    [current, slot, sunday, log]
  );

  const undo = useCallback(() => {
    if (!history.length) return;
    const id = history[history.length - 1];
    const rest = { ...decisions };
    delete rest[id];
    setDecisions(rest);
    setHistory((h) => h.slice(0, -1));
    setCursor(Math.max(0, items.filter((i) => !rest[i.id]).findIndex((i) => i.id === id)));
    userMoved.current = true;
  }, [history, decisions, items]);

  const move = useCallback(
    (delta) => {
      userMoved.current = true;
      setCursor(Math.min(Math.max(cur + delta, 0), Math.max(0, pending.length - 1)));
    },
    [cur, pending.length]
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      const k = e.key.toLowerCase();
      if (k === ':' || k === 'c') {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (k === 'j') move(1);
      else if (k === 'k') move(-1);
      else if (k === 'u') undo();
      else if (current && 'frap'.includes(k) && k.length === 1) decide(k.toUpperCase());
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move, undo, decide, current]);

  // Garde la ligne choisie visible quand on se déplace au clavier (pas au premier rendu).
  useEffect(() => {
    if (!userMoved.current || !current) return;
    document.getElementById(`console-row-${current.id}`)?.scrollIntoView({ block: 'nearest' });
  }, [current]);

  const pushFeed = (line) => setFeed((f) => [{ id: `${Date.now()}-${f.length}`, line }, ...f].slice(0, MAX_FEED));

  const confirm = (actions) => {
    const fresh = [];
    actions.forEach((a, i) => {
      log(actionLog(a));
      pushFeed(actionLog(a));
      const entry = localEntry(a, data.today, added.length + i);
      if (entry) fresh.push(entry);
    });
    if (fresh.length) setAdded((x) => [...x, ...fresh]);
    setText('');
    setOutcome(null);
  };

  const submit = (e) => {
    e.preventDefault();
    if (outcome?.type === 'preview') return confirm(outcome.actions);
    const res = runCommand(text, data);
    if (res.type === 'nav') {
      pushFeed(`aller : ${res.label}`);
      setText('');
      onNavigate(res.section);
    } else if (res.type === 'day') {
      setText('');
      document.getElementById('console-day')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    } else if (res.type !== 'empty') setOutcome(res);
  };

  const fill = (value) => {
    setText(value);
    setOutcome(null);
    inputRef.current?.focus();
  };

  const toggleTask = (t) => {
    const done = !doneTasks[t.id];
    setDoneTasks((d) => ({ ...d, [t.id]: done }));
    log(`tasks : ${done ? 'marquer fait' : 'rouvrir'} "${t.title}"`);
  };

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 pt-5 pb-28 sm:px-6">
      <div className={`flex items-center justify-between gap-3 text-[11px] tracking-[0.14em] text-[color:var(--text-faint)] uppercase ${MONO}`}>
        <span>La Console</span>
        <span className="normal-case tracking-normal">{frDateTime(data.nowIso)}</span>
      </div>

      {/* Champ de commande */}
      <form onSubmit={submit} className="mt-2" autoComplete="off">
        <label htmlFor="console-cmd" className="sr-only">
          Commande
        </label>
        <div className="flex items-center gap-3 rounded-[var(--radius)] border-2 border-[color:var(--border-strong)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow)] focus-within:border-[color:var(--accent)]">
          <span aria-hidden className={`text-[22px] leading-none text-[color:var(--accent)] ${MONO}`}>
            &gt;
          </span>
          <input
            id="console-cmd"
            ref={inputRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setOutcome(null);
            }}
            onKeyDown={(e) => {
              if (e.key !== 'Escape') return;
              if (outcome || text) {
                setText('');
                setOutcome(null);
              } else e.currentTarget.blur();
            }}
            placeholder="tâche : ... pour vendredi"
            spellCheck={false}
            enterKeyHint="go"
            className={`min-w-0 flex-1 bg-transparent text-[16px] text-[color:var(--text)] outline-none focus:outline-none focus-visible:outline-none placeholder:text-[color:var(--text-faint)] sm:text-[19px] ${MONO}`}
          />
          <kbd
            className={`hidden rounded-[var(--radius-sm)] border border-[color:var(--border-strong)] px-1.5 py-0.5 text-[11px] text-[color:var(--text-muted)] sm:inline ${MONO}`}
          >
            :
          </kbd>
        </div>

        {outcome?.type === 'preview' && (
          <div role="status" className="mt-2 rounded-[var(--radius-sm)] border border-[color:var(--accent)] bg-[var(--accent-soft)] p-3">
            <p className={`text-[11px] tracking-[0.14em] text-[color:var(--text-muted)] uppercase ${MONO}`}>Aperçu</p>
            <ul className="mt-1 space-y-1 text-[14px] break-words">
              {outcome.actions.map((a, i) => (
                <li key={i}>{a.label}</li>
              ))}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="submit"
                className={`min-h-9 rounded-[var(--radius-sm)] bg-[var(--accent)] px-3 text-[13px] font-medium text-[color:var(--accent-contrast)] ${FOCUS}`}
              >
                Confirmer (Entrée)
              </button>
              <button
                type="button"
                onClick={() => setOutcome(null)}
                className={`min-h-9 rounded-[var(--radius-sm)] border border-[color:var(--border-strong)] px-3 text-[13px] ${FOCUS}`}
              >
                Annuler (Échap)
              </button>
            </div>
          </div>
        )}
        {outcome?.type === 'error' && (
          <div role="status" className="mt-2 rounded-[var(--radius-sm)] border border-[color:var(--danger)] p-3 text-[13px]">
            <p className="break-words text-[color:var(--danger)]">{outcome.message}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {outcome.examples.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => fill(ex)}
                  className={`max-w-full rounded-[var(--radius-sm)] border border-[color:var(--border-strong)] px-2 py-1 text-left text-[12px] break-words ${MONO} ${FOCUS}`}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Exemples de commandes">
          {[
            'tâche : relancer Bain pour vendredi',
            'idée : revoir les saves Instagram',
            'ajoute une session de 14 à 16h mercredi',
            'bilan',
            'échéances',
            'ménage',
            'mails',
          ].map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => fill(ex)}
              className={`min-h-7 max-w-full rounded-[var(--radius-sm)] border border-[color:var(--border)] px-2 text-[12px] text-[color:var(--text-muted)] hover:border-[color:var(--border-strong)] hover:text-[color:var(--text)] ${MONO} ${FOCUS}`}
            >
              {ex}
            </button>
          ))}
        </div>

        {feed.length > 0 && (
          <ul className={`mt-2 space-y-0.5 text-[12px] text-[color:var(--text-muted)] ${MONO}`} aria-label="Dernières commandes">
            {feed.map((f) => (
              <li key={f.id} className="break-words">
                <span className="text-[color:var(--success)]">ok</span> {f.line}
              </li>
            ))}
          </ul>
        )}
      </form>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
        {/* Boîte de réception */}
        <section aria-label="Boîte de réception" className="min-w-0">
          <div className="flex items-end justify-between gap-3">
            <h2 className={`text-[17px] font-semibold tracking-tight ${DISPLAY}`}>Boîte de réception</h2>
            <p className={`text-[13px] text-[color:var(--text-muted)] ${MONO}`}>
              reste{' '}
              <b className={`text-[26px] leading-none font-semibold ${pending.length ? 'text-[color:var(--text)]' : 'text-[color:var(--success)]'}`}>
                {pending.length}
              </b>
              {items.length > 0 && <span className="text-[color:var(--text-faint)]"> / {items.length}</span>}
            </p>
          </div>
          <div
            role="img"
            aria-label={`${items.length - pending.length} décisions prises sur ${items.length}`}
            className="mt-2 flex h-2 gap-px"
          >
            {items.map((i) => (
              <span
                key={i.id}
                className={`min-w-[2px] flex-1 rounded-[1px] ${
                  decisions[i.id] ? 'bg-[var(--accent)]' : i.id === current?.id ? 'bg-[var(--text)]' : 'bg-[var(--border-strong)]'
                }`}
              />
            ))}
          </div>

          {last && (
            <p className={`mt-2 flex flex-wrap items-center gap-x-2 text-[12px] text-[color:var(--text-muted)] ${MONO}`}>
              <span className="min-w-0 break-words">
                {GESTURES.find((g) => g.g === decisions[last.id]?.g)?.label ?? 'traité'} : {last.title.slice(0, 60)}
              </span>
              <button type="button" onClick={undo} className={`underline underline-offset-2 hover:text-[color:var(--text)] ${FOCUS}`}>
                annuler (U)
              </button>
            </p>
          )}

          {pending.length === 0 ? (
            <div className="mt-4 rounded-[var(--radius)] border border-dashed border-[color:var(--border-strong)] px-4 py-10 text-center">
              <p className={`text-[11px] tracking-[0.2em] text-[color:var(--success)] uppercase ${MONO}`}>0 / {items.length}</p>
              <p className={`mt-1 text-[34px] leading-tight font-semibold tracking-tight sm:text-[42px] ${DISPLAY}`}>Boîte à zéro</p>
              <p className={`mt-2 text-[12px] break-words text-[color:var(--text-muted)] ${MONO}`}>
                {summarize(decisions).join(' · ') || 'Rien ne demandait de décision.'}
              </p>
              {history.length > 0 && (
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={undo}
                    className={`min-h-9 rounded-[var(--radius-sm)] border border-[color:var(--border-strong)] px-3 text-[13px] ${FOCUS}`}
                  >
                    Annuler le dernier geste (U)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDecisions({});
                      setHistory([]);
                      setCursor(0);
                    }}
                    className={`min-h-9 rounded-[var(--radius-sm)] border border-[color:var(--border-strong)] px-3 text-[13px] ${FOCUS}`}
                  >
                    Tout rouvrir
                  </button>
                </div>
              )}
            </div>
          ) : (
            <ul className="mt-3 border-t border-[color:var(--border)]">
              {pending.map((item, i) => {
                const sel = i === cur;
                return (
                  <li
                    key={item.id}
                    id={`console-row-${item.id}`}
                    className={`relative scroll-mt-20 border-b border-[color:var(--border)] ${sel ? 'bg-[var(--surface-2)]' : ''}`}
                  >
                    <span aria-hidden className={`absolute inset-y-0 left-0 w-[3px] ${sel ? 'bg-[var(--accent)]' : 'bg-transparent'}`} />
                    <button
                      type="button"
                      aria-current={sel ? 'true' : undefined}
                      onClick={() => {
                        userMoved.current = false;
                        setCursor(i);
                      }}
                      className={`grid w-full grid-cols-[3.2rem_minmax(0,1fr)] gap-x-2 px-3 py-2 text-left sm:grid-cols-[3.7rem_minmax(0,1fr)_auto] ${FOCUS}`}
                    >
                      <span className={`col-start-1 row-start-1 pt-[3px] text-[10.5px] tracking-[0.1em] ${MONO} ${TONE_TEXT[item.tone]}`}>
                        {item.tag}
                      </span>
                      <span className={`col-start-2 row-start-1 text-[14px] leading-snug break-words ${sel ? 'font-medium' : 'line-clamp-1'}`}>
                        {item.title}
                      </span>
                      <span
                        className={`col-start-2 row-start-2 mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-[color:var(--text-muted)] sm:col-start-3 sm:row-start-1 sm:mt-0 sm:justify-end sm:pt-[2px] sm:whitespace-nowrap ${MONO}`}
                      >
                        {item.meta.map((m) => (
                          <span key={m}>{m}</span>
                        ))}
                      </span>
                    </button>
                    {sel && <Expanded item={item} slot={slot} sunday={sunday} onDecide={decide} />}
                  </li>
                );
              })}
            </ul>
          )}

          <p className={`mt-3 hidden flex-wrap gap-x-3 gap-y-1 text-[11px] text-[color:var(--text-faint)] sm:flex ${MONO}`}>
            <span>J K se déplacer</span>
            <span>F fait</span>
            <span>R recaser</span>
            <span>A abandonner</span>
            <span>P plus tard</span>
            <span>U annuler</span>
            <span>: commande</span>
          </p>
        </section>

        {/* Journée */}
        <aside id="console-day" aria-label="La journée" className="min-w-0 scroll-mt-4 lg:sticky lg:top-4">
          <div className="flex items-baseline justify-between gap-3 border-b border-[color:var(--border-strong)] pb-1.5">
            <h2 className={`text-[17px] font-semibold tracking-tight ${DISPLAY}`}>Journée</h2>
            <span className={`text-[11px] text-[color:var(--text-muted)] ${MONO}`}>{day.label}</span>
          </div>
          <Day day={day} doneTasks={doneTasks} onToggle={toggleTask} />
        </aside>
      </div>
    </div>
  );
}

function Expanded({ item, slot, sunday, onDecide }) {
  const lines = item.detail.slice(0, 5);
  const more = item.detail.length - lines.length;
  return (
    <div className="pr-3 pb-3 pl-3 sm:pl-[4.45rem]">
      {lines.length > 0 && (
        <ul className={`space-y-0.5 text-[12px] leading-snug text-[color:var(--text-muted)] ${MONO}`}>
          {lines.map((l, i) => (
            <li key={i} className="break-words">
              {l.length > 220 ? `${l.slice(0, 219)}...` : l}
            </li>
          ))}
          {more > 0 && <li className="text-[color:var(--text-faint)]">et {more} autres</li>}
        </ul>
      )}
      <div className="mt-2.5 flex flex-wrap gap-2">
        {GESTURES.map((g) => (
          <button
            key={g.g}
            type="button"
            onClick={() => onDecide(g.g)}
            className={`flex min-h-9 items-center gap-2 rounded-[var(--radius-sm)] border border-[color:var(--border-strong)] bg-[var(--surface)] px-2.5 text-[13px] hover:border-[color:var(--text-muted)] ${FOCUS}`}
          >
            <kbd className={`rounded-[var(--radius-sm)] border border-current px-1 text-[11px] leading-[1.3] ${MONO} ${TONE_TEXT[g.tone]}`}>{g.g}</kbd>
            {g.label}
          </button>
        ))}
      </div>
      <p className={`mt-2 text-[11px] break-words text-[color:var(--text-faint)] ${MONO}`}>
        R : {slot ? `vers ${slotLabel(slot)}` : 'aucun bloc orange à venir'} · P : dimanche {sunday.slice(8, 10)}/{sunday.slice(5, 7)}
      </p>
    </div>
  );
}

function Day({ day, doneTasks, onToggle }) {
  if (!day.entries.length && !day.allDay.length && !day.free.length) {
    return <p className="py-6 text-[13px] text-[color:var(--text-muted)]">Rien au programme aujourd&apos;hui.</p>;
  }
  const nowAt = day.entries.findIndex((e) => e.startMin > day.nowMin);
  const marker = (
    <li key="now" className={`flex items-center gap-2 py-1 text-[11px] text-[color:var(--accent)] ${MONO}`} aria-label="Maintenant">
      <span className="h-px flex-1 bg-[var(--accent)]" />
      {hm(day.nowMin)}
    </li>
  );
  const rows = day.entries.map((e) => <Entry key={e.id} e={e} past={e.endMin <= day.nowMin} doneTasks={doneTasks} onToggle={onToggle} />);
  if (nowAt === -1) rows.push(marker);
  else rows.splice(nowAt, 0, marker);
  return (
    <div>
      {day.allDay.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {day.allDay.map((e) => (
            <li
              key={e.id}
              className={`max-w-full rounded-[var(--radius-sm)] border border-[color:var(--border)] px-2 py-0.5 text-[12px] break-words text-[color:var(--text-muted)]`}
            >
              {e.title}
            </li>
          ))}
        </ul>
      )}
      <ol className="mt-1">{rows}</ol>
      {day.free.length > 0 && (
        <div className="mt-3 border-t border-[color:var(--border)] pt-2">
          <p className={`text-[10.5px] tracking-[0.12em] text-[color:var(--text-faint)] uppercase ${MONO}`}>Sans bloc</p>
          <ul className="mt-1 space-y-0.5">
            {day.free.slice(0, 5).map((t) => (
              <TaskLine key={t.id} t={t} done={doneTasks[t.id]} onToggle={onToggle} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Entry({ e, past, doneTasks, onToggle }) {
  return (
    <li className={`flex gap-2 border-b border-[color:var(--border)] py-1.5 ${past ? 'opacity-60' : ''}`}>
      <span aria-hidden className={`w-[3px] shrink-0 rounded-[1px] ${KIND_BAR[e.kind]}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className={`shrink-0 text-[11px] text-[color:var(--text-muted)] ${MONO}`}>
            {hm(e.startMin)}
            <span className="text-[color:var(--text-faint)]">-{hm(e.endMin)}</span>
          </span>
          {e.conflict && <span className={`text-[10.5px] text-[color:var(--danger)] ${MONO}`}>chevauche</span>}
          {e.local && <span className={`text-[10.5px] text-[color:var(--accent)] ${MONO}`}>ajouté</span>}
        </div>
        <p className="text-[13px] leading-snug break-words">{e.title}</p>
        {e.tasks.length > 0 && (
          <ul className="mt-0.5 space-y-0.5">
            {e.tasks.slice(0, 4).map((t) => (
              <TaskLine key={t.id} t={t} done={doneTasks[t.id]} onToggle={onToggle} />
            ))}
            {e.tasks.length > 4 && <li className={`text-[11px] text-[color:var(--text-faint)] ${MONO}`}>et {e.tasks.length - 4} autres</li>}
          </ul>
        )}
      </div>
    </li>
  );
}

function TaskLine({ t, done, onToggle }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onToggle(t)}
        aria-pressed={Boolean(done)}
        className={`flex w-full items-start gap-2 py-0.5 text-left text-[12px] leading-snug ${FOCUS} ${done ? 'text-[color:var(--text-faint)] line-through' : 'text-[color:var(--text-muted)]'}`}
      >
        <span
          aria-hidden
          className={`mt-[2px] flex size-3.5 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border ${
            done ? 'border-[color:var(--success)] bg-[var(--success)]' : 'border-[color:var(--border-strong)]'
          }`}
        >
          {done && (
            <svg viewBox="0 0 12 12" className="size-2.5 text-[color:var(--accent-contrast)]" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2.5 6.5l2.2 2.2 4.8-5" />
            </svg>
          )}
        </span>
        <span className="min-w-0 break-words">{t.title}</span>
      </button>
    </li>
  );
}
