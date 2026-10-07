'use client';

// Colonne « À ranger » du Cockpit : tâches, idées et propositions des mails dans une seule liste, chaque
// élément avec sa suggestion de placement et cinq gestes (Valider, Affecter ailleurs, Cocher, Supprimer,
// Plus tard). Mise à jour optimiste : l'élément disparaît tout de suite et revient si le serveur refuse.
import { useOptimistic, useState, useTransition } from 'react';
import { ElsewherePicker, ItemMeta, SuggestionBox, TypeBadge, btnClass, primaryBtn } from './RangerParts';
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
      className="flex max-h-[calc(100vh-1.5rem)] min-w-0 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 xl:sticky xl:top-3 xl:self-start"
    >
      <h2 className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-100">
        <span className="min-w-0 flex-1 truncate">À ranger</span>
        <span className="tabular rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 font-mono text-[11px] font-normal text-zinc-400" data-testid="ranger-count">
          {visible.length}
        </span>
      </h2>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {!ready && (
          <p className="mb-2 rounded-lg border border-amber-800 bg-amber-950 px-2.5 py-1.5 text-[11px] text-amber-400" data-testid="ranger-sql-banner">
            Exécuter supabase/ranger.sql pour activer Supprimer et Plus tard
          </p>
        )}
        {error && (
          <p role="alert" className="mb-2 text-xs text-red-400">
            {error}
          </p>
        )}
        <p className="mb-2 font-mono text-[11px] text-zinc-400">
          {visible.length ? `${counts.join(', ')}${dueCount ? `, dont ${dueCount} à ranger en priorité` : ''}` : 'Tout est rangé.'}
        </p>

        {todayList.length > 0 && (
          <details className="mb-3 rounded-lg border border-zinc-800 bg-zinc-950/40 px-2.5 py-1.5">
            <summary className="cursor-pointer text-xs font-medium text-zinc-300">{`Pour aujourd'hui, sans bloc (${todayList.length})`}</summary>
            <ul className="mt-1.5 space-y-1">
              {todayList.map((t) => (
                <li key={t.id}>
                  <label className="flex cursor-pointer items-start gap-2 text-xs text-zinc-100">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => act({ key: `task:${t.id}`, kind: 'task', id: t.id, title: t.title }, 'done')}
                      className="mt-0.5 size-4 shrink-0 cursor-pointer [accent-color:var(--color-accent)]"
                      aria-label={`Cocher : ${t.title}`}
                    />
                    <span className="min-w-0 break-words">{t.title}</span>
                  </label>
                </li>
              ))}
            </ul>
          </details>
        )}

        <ul className="space-y-2.5" data-testid="ranger-list">
          {shown.map((item) => {
            const g = gesturesFor(item, { ready });
            return (
              <li key={item.key} className="space-y-1.5 rounded-lg border border-zinc-800 bg-zinc-900 p-2.5" data-testid="ranger-item">
                <div className="flex flex-wrap items-center gap-1.5">
                  <TypeBadge item={item} />
                  {item.isDue && <span className="font-mono text-[10px] text-amber-400">{item.dueReason}</span>}
                </div>
                <p className="text-sm font-medium break-words text-zinc-100">{item.title}</p>
                {item.detail && <p className="text-xs break-words text-zinc-400">{item.detail}</p>}
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
                  <div className="flex flex-wrap gap-1.5">
                    <button type="button" className={primaryBtn} disabled={!g.validate} onClick={() => act(item, 'place', item.suggestion.target)}>
                      Valider
                    </button>
                    <button type="button" className={btnClass} disabled={!g.elsewhere} onClick={() => setPicker(item.key)}>
                      Affecter ailleurs
                    </button>
                    <button type="button" className={btnClass} onClick={() => act(item, 'done')}>
                      {g.doneLabel}
                    </button>
                    <button
                      type="button"
                      className={btnClass}
                      disabled={!g.drop}
                      title={g.drop ? undefined : 'Demande supabase/ranger.sql'}
                      onClick={() => act(item, 'drop')}
                    >
                      Supprimer
                    </button>
                    <button
                      type="button"
                      className={btnClass}
                      disabled={!g.later}
                      title={g.later ? 'Revient dimanche' : 'Demande supabase/ranger.sql'}
                      onClick={() => act(item, 'later')}
                    >
                      Plus tard
                    </button>
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
