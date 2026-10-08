'use client';

// Colonne « À ranger » du Cockpit : tâches, idées et propositions des mails dans une seule liste, chaque
// élément avec sa suggestion de placement et cinq gestes (Valider, Affecter ailleurs, Cocher, Supprimer,
// Plus tard). Mise à jour optimiste : l'élément disparaît tout de suite et revient si le serveur refuse.
import { useOptimistic, useState, useTransition } from 'react';
import { ElsewherePicker, GestureKey, ItemMeta, SuggestionBox, TypeBadge, btnClass } from './RangerParts';
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

  const act = (item, gesture, target) => {
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

  // Raccourcis d'un élément : actifs quand le focus est dans l'élément (clic sur l'élément ou sur un de ses boutons).
  const onItemKey = (e, item, g) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat || picker === item.key) return;
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    // Gestes sans confirmation (C, S, P) : seulement quand un bouton de geste a le focus, pas en naviguant dans la liste.
    const onButton = e.target.tagName === 'BUTTON';
    if (k === 'v' && g.validate) act(item, 'place', item.suggestion.target);
    else if (k === 'a' && g.elsewhere) setPicker(item.key);
    else if (k === 'c' && onButton) act(item, 'done');
    else if (k === 's' && onButton && g.drop) act(item, 'drop');
    else if (k === 'p' && onButton && g.later) act(item, 'later');
    else return;
    e.preventDefault();
  };

  const visible = items.filter((i) => !gone.has(i.key));
  const shown = visible.slice(0, limit);
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
      className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--content-surface)] text-[var(--ink)] max-xl:max-h-[32rem] xl:h-full"
    >
      <h2 className="flex min-h-10 shrink-0 items-center gap-2 border-b border-[var(--frame-border)] bg-[var(--frame-bg)] px-4 py-2 text-sm font-semibold text-[var(--frame-text)]">
        <span className="min-w-0 flex-1 truncate">À ranger</span>
        <span className="tabular rounded-full border border-[var(--frame-border)] bg-[var(--frame-surface)] px-2 py-0.5 font-mono text-xs font-normal text-[var(--frame-text)]" data-testid="ranger-count">
          {visible.length}
        </span>
      </h2>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        {!ready && (
          <p className="mt-3 rounded-[5px] border border-[var(--pending)] px-3 py-2 text-sm" data-testid="ranger-sql-banner">
            <span className="font-semibold">À activer : </span>exécuter supabase/ranger.sql pour activer Supprimer et Plus tard
          </p>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-[var(--late)]">
            <span className="font-semibold">Erreur : </span>
            {error}
          </p>
        )}
        <p className="py-3 font-mono text-xs text-[var(--ink-muted)]">
          {visible.length ? `${counts.join(', ')}${dueCount ? `, dont ${dueCount} à ranger en priorité` : ''}` : 'Tout est rangé.'}
          {visible.length > 0 && <span className="block">Sélectionne un élément puis touche V, A, C, S ou P.</span>}
        </p>

        {todayList.length > 0 && (
          <details className="mb-3 border-y border-[var(--line)] py-2">
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

        <ul className="divide-y divide-[var(--line)] border-t border-[var(--line)]" data-testid="ranger-list">
          {shown.map((item) => {
            const g = gesturesFor(item, { ready });
            return (
              <li
                key={item.key}
                tabIndex={-1}
                onKeyDown={(e) => onItemKey(e, item, g)}
                className="space-y-2 py-3 outline-none focus-within:bg-[var(--content-bg)]"
                data-testid="ranger-item"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <TypeBadge item={item} />
                  {item.isDue && <span className="font-mono text-xs font-semibold text-[var(--late)]">{item.dueReason}</span>}
                </div>
                <p className="text-base font-medium break-words">{item.title}</p>
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
                  <div className="flex flex-wrap gap-2" role="group" aria-label={`Gestes : ${short(item.title)}`}>
                    <GestureKey kind="place" letter="V" disabled={!g.validate} onClick={() => act(item, 'place', item.suggestion.target)}>
                      Valider
                    </GestureKey>
                    <GestureKey kind="elsewhere" letter="A" disabled={!g.elsewhere} onClick={() => setPicker(item.key)}>
                      Affecter ailleurs
                    </GestureKey>
                    <GestureKey kind="done" letter="C" onClick={() => act(item, 'done')}>
                      {g.doneLabel}
                    </GestureKey>
                    <GestureKey
                      kind="drop"
                      letter="S"
                      disabled={!g.drop}
                      title={g.drop ? undefined : 'Demande supabase/ranger.sql'}
                      onClick={() => act(item, 'drop')}
                    >
                      Supprimer
                    </GestureKey>
                    <GestureKey
                      kind="later"
                      letter="P"
                      disabled={!g.later}
                      title={g.later ? 'Revient dimanche' : 'Demande supabase/ranger.sql'}
                      onClick={() => act(item, 'later')}
                    >
                      Plus tard
                    </GestureKey>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {visible.length > limit && (
          <button type="button" className={`${btnClass} mt-3 w-full`} onClick={() => setLimit((n) => n + PAGE)}>
            {`Afficher la suite (${visible.length - limit})`}
          </button>
        )}
      </div>
    </aside>
  );
}
