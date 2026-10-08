'use client';

// Colonne « À ranger » du Cockpit : tâches, idées et propositions des mails dans une seule liste, UNE ligne
// par élément (titre, suggestion). L'élément sélectionné s'ouvre et montre toujours ses cinq gestes (Valider,
// Affecter ailleurs, Fait, Supprimer, Plus tard) ; au clavier, flèches pour choisir et V A C S P pour agir.
// Mise à jour optimiste : l'élément disparaît tout de suite et revient si le serveur refuse.
import { useEffect, useOptimistic, useRef, useState, useTransition } from 'react';
import { ElsewherePicker, Gestures, ItemMeta, SuggestionBox, TypeBadge, btnClass } from './RangerParts';
import { rangerApply } from '@/app/ranger-actions';
import { gesturesFor } from '@/lib/ranger';

const PAGE = 40; // éléments rendus d'un coup (le reste derrière « Afficher la suite »)
const NONE = new Set();
const short = (t) => (t.length > 50 ? `${t.slice(0, 49)}...` : t);

export default function RangerColumn({ items, todayTasks, options, ready, today }) {
  const [gone, addGone] = useOptimistic(NONE, (set, keys) => new Set([...set, ...keys]));
  const [, start] = useTransition();
  const [error, setError] = useState(null);
  const [picker, setPicker] = useState(null); // clé de l'élément dont « Affecter ailleurs » est ouvert
  const [limit, setLimit] = useState(PAGE);
  const [sel, setSel] = useState({ key: null, index: 0 }); // élément sélectionné (clé et rang, pour passer au suivant)
  const list = useRef(null);
  const refocus = useRef(false); // rendre le focus à la ligne sélectionnée après un geste au clavier

  const act = (item, gesture, target) => {
    refocus.current = Boolean(list.current?.contains(document.activeElement));
    setError(null);
    setPicker(null);
    start(async () => {
      addGone([item.key]);
      try {
        const res = await rangerApply({ gesture, refs: [{ kind: item.kind, id: item.id, target }] });
        if (res.error) setError(`${short(item.title)} : ${res.error}`);
      } catch (err) {
        setError(`${short(item.title)} : ${err.message}`);
      }
    });
  };

  const visible = items.filter((i) => !gone.has(i.key));
  const shown = visible.slice(0, limit);
  // Sélection : l'élément choisi, sinon celui qui a pris sa place (même rang), sinon le premier.
  const current = shown.find((i) => i.key === sel.key) ?? shown[Math.min(sel.index, shown.length - 1)] ?? null;
  const currentKey = current?.key;

  useEffect(() => {
    if (!refocus.current || !currentKey) return;
    refocus.current = false;
    [...(list.current?.querySelectorAll('[data-row]') ?? [])].find((n) => n.dataset.row === currentKey)?.focus();
  }, [currentKey]);

  const select = (item) => setSel({ key: item.key, index: shown.indexOf(item) });
  const run = (item, g, gesture) => {
    if (gesture === 'elsewhere') {
      if (g.elsewhere) setPicker(item.key);
    } else if (gesture === 'place') {
      if (g.validate) act(item, 'place', item.suggestion.target);
    } else if (gesture === 'done') act(item, 'done');
    else if (gesture === 'drop') {
      if (g.drop) act(item, 'drop');
    } else if (gesture === 'later' && g.later) act(item, 'later');
  };

  // Clavier dans la liste : flèches pour changer d'élément, V A C S P pour agir sur l'élément sélectionné.
  const onKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || !current) return;
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const at = shown.indexOf(current) + (e.key === 'ArrowDown' ? 1 : -1);
      const next = shown[Math.max(0, Math.min(shown.length - 1, at))];
      if (next && next !== current) {
        e.preventDefault();
        setSel({ key: next.key, index: shown.indexOf(next) });
        refocus.current = true;
      }
      return;
    }
    if (e.repeat || picker === current.key) return;
    const k = e.key.toLowerCase();
    const gesture = { v: 'place', a: 'elsewhere', c: 'done', s: 'drop', p: 'later' }[k];
    if (!gesture) return;
    e.preventDefault();
    run(current, gesturesFor(current, { ready }), gesture);
  };

  const dueCount = visible.filter((i) => i.isDue).length;
  const todayList = todayTasks.filter((t) => !gone.has(`task:${t.id}`));
  const counts = ['task', 'idea', 'notification']
    .map((k) => [k, visible.filter((i) => i.kind === k).length])
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${n} ${k === 'task' ? (n > 1 ? 'tâches' : 'tâche') : k === 'idea' ? (n > 1 ? 'idées' : 'idée') : n > 1 ? 'mails' : 'mail'}`);

  return (
    <aside
      id="a-ranger"
      aria-label="À ranger"
      className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--ink)] max-xl:max-h-[32rem] xl:h-full"
    >
      <h2 className="flex min-h-10 shrink-0 items-center gap-2 border-b border-[var(--line)] px-4 py-2 text-sm font-semibold">
        <span className="min-w-0 flex-1 truncate">À ranger</span>
        <span className="tabular rounded-full bg-[var(--btn-fill)] px-2 py-0.5 text-xs font-normal text-[var(--ink)]" data-testid="ranger-count">
          {visible.length}
        </span>
      </h2>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {!ready && (
          <p className="mx-1 mt-3 rounded-lg border border-[var(--pending)] px-3 py-2 text-sm" data-testid="ranger-sql-banner">
            <span className="font-semibold">À activer : </span>exécuter supabase/ranger.sql pour activer Supprimer et Plus tard
          </p>
        )}
        {error && (
          <p role="alert" className="mx-1 mt-3 text-sm text-[var(--late-text)]">
            <span className="font-semibold">Erreur : </span>
            {error}
          </p>
        )}
        <p className="tabular px-2 py-3 text-xs text-[var(--ink-muted)]">
          {visible.length ? `${counts.join(', ')}${dueCount ? `, dont ${dueCount} à ranger en priorité` : ''}` : 'Tout est rangé.'}
        </p>

        {todayList.length > 0 && (
          <details className="mx-1 mb-3 border-y border-[var(--line)] py-2">
            <summary className="cursor-pointer text-sm font-medium">{`Pour aujourd'hui, sans bloc (${todayList.length})`}</summary>
            <ul className="mt-2 space-y-2">
              {todayList.map((t) => (
                <li key={t.id}>
                  <label className="flex cursor-pointer items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => act({ key: `task:${t.id}`, kind: 'task', id: t.id, title: t.title }, 'done')}
                      className="mt-0.5 size-4 shrink-0 cursor-pointer [accent-color:var(--action)]"
                      aria-label={`Cocher : ${t.title}`}
                    />
                    <span className="min-w-0 break-words">{t.title}</span>
                  </label>
                </li>
              ))}
            </ul>
          </details>
        )}

        <ul ref={list} onKeyDown={onKeyDown} className="space-y-0.5" data-testid="ranger-list">
          {shown.map((item) => {
            const selected = item === current;
            const g = gesturesFor(item, { ready });
            const suggestion = item.suggestion.target ? item.suggestion.label || 'Suggestion' : 'Pas de suggestion';
            return (
              <li
                key={item.key}
                className={`rounded-xl ${selected ? 'bg-[var(--action-soft)] [--ink-muted:var(--ink-muted-on-tint)] [--late-text:var(--late-ink)]' : ''} ${item.isDue ? 'border-l-[3px] border-[var(--late)]' : 'border-l-[3px] border-transparent'}`}
                data-testid="ranger-item"
              >
                <button
                  type="button"
                  data-row={item.key}
                  aria-expanded={selected}
                  onClick={() => select(item)}
                  className="flex min-h-10 w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-left hover:bg-[var(--btn-fill)] [@media(pointer:coarse)]:min-h-11"
                >
                  <TypeBadge item={item} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium" title={item.title}>
                    {item.title}
                  </span>
                  {item.isDue && <span className="shrink-0 text-xs font-semibold text-[var(--late-text)]">retard</span>}
                  <span className={`max-w-[38%] shrink truncate text-xs ${item.suggestion.target ? 'text-[var(--action-ink)]' : 'text-[var(--ink-muted)]'}`} title={item.suggestion.reason}>
                    {suggestion}
                  </span>
                </button>

                {selected && (
                  <div className="space-y-2 px-2.5 pb-3 pt-1">
                    <p className="text-sm font-medium break-words">{item.title}</p>
                    {item.isDue && <p className="text-xs font-semibold text-[var(--late-text)]">{item.dueReason}</p>}
                    {item.detail && <p className="text-sm break-words text-[var(--ink-muted)]">{item.detail}</p>}
                    <ItemMeta item={item} />
                    <SuggestionBox item={item} />
                    {picker === item.key ? (
                      <ElsewherePicker
                        options={options}
                        today={today}
                        futureDays={ready}
                        onPick={(target) => act(item, 'place', target)}
                        onCancel={() => setPicker(null)}
                      />
                    ) : (
                      <Gestures
                        g={g}
                        label={`Gestes : ${short(item.title)}`}
                        on={{
                          place: () => run(item, g, 'place'),
                          elsewhere: () => run(item, g, 'elsewhere'),
                          done: () => run(item, g, 'done'),
                          drop: () => run(item, g, 'drop'),
                          later: () => run(item, g, 'later'),
                        }}
                      />
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {visible.length > 0 && <p className="px-2 pt-3 text-xs text-[var(--ink-muted)]">Flèches pour choisir un élément, puis V, A, C, S ou P.</p>}

        {visible.length > limit && (
          <button type="button" className={`${btnClass} mx-1 mt-3 w-[calc(100%-0.5rem)]`} onClick={() => setLimit((n) => n + PAGE)}>
            {`Afficher la suite (${visible.length - limit})`}
          </button>
        )}
      </div>
    </aside>
  );
}
