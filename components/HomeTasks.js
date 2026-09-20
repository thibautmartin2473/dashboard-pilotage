'use client';

import { useState, useTransition } from 'react';
import Panel from './Panel';
import { acceptSuggestion, addTask, completeTask, dismissSuggestion, moveTask } from '@/app/actions';
import { BUCKETS, BUCKET_LABELS, isOverdue } from '@/lib/home';

const field =
  'rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900';
const button =
  'rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-900';

// Lance une Server Action : `pending` pendant l'appel, `error` si elle renvoie { error }.
function useAction() {
  const [pending, start] = useTransition();
  const [error, setError] = useState(null);
  const run = (fn) =>
    start(async () => {
      try {
        setError((await fn())?.error ?? null);
      } catch (err) {
        setError(err.message);
      }
    });
  return { pending, error, run };
}

const ErrorLine = ({ error }) =>
  error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null;

const BucketOptions = () =>
  BUCKETS.map((b) => (
    <option key={b} value={b}>
      {BUCKET_LABELS[b]}
    </option>
  ));

export function AddTask({ projects, disabled }) {
  const { pending, error, run } = useAction();
  const [title, setTitle] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    run(async () => {
      const result = await addTask(values);
      if (!result.error) setTitle('');
      return result;
    });
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ajouter une tâche…"
          maxLength={200}
          required
          disabled={disabled}
          className={`${field} min-w-0 flex-1 py-2.5`}
        />
        <button type="submit" disabled={disabled || pending} className={button}>
          {pending ? 'Ajout…' : 'Ajouter'}
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <select name="bucket" defaultValue="inbox" disabled={disabled} className={field} aria-label="Liste">
          <BucketOptions />
        </select>
        <input type="date" name="due_date" disabled={disabled} className={field} aria-label="Échéance" />
        <select name="project_slug" defaultValue="" disabled={disabled} className={field} aria-label="Projet">
          <option value="">Sans projet</option>
          {projects.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <ErrorLine error={error} />
    </form>
  );
}

function TaskRow({ task, panel, today }) {
  const { pending, error, run } = useAction();
  const overdue = isOverdue(task, today);

  return (
    <li className={`flex items-start gap-3 py-2 ${pending ? 'opacity-50' : ''}`}>
      <input
        type="checkbox"
        checked={pending}
        disabled={pending}
        onChange={() => run(() => completeTask(task.id))}
        aria-label={`Terminer : ${task.title}`}
        className="mt-1 h-5 w-5 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="break-words text-sm">{task.title}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {task.project_slug}
          {task.project_slug && task.due_date && ' · '}
          {task.due_date && (
            <span className={overdue ? 'font-medium text-red-600 dark:text-red-400' : ''}>
              {overdue ? 'en retard : ' : 'pour le '}
              {task.due_date}
            </span>
          )}
        </p>
        <ErrorLine error={error} />
      </div>
      <select
        value={panel}
        disabled={pending}
        onChange={(e) => run(() => moveTask(task.id, e.target.value))}
        aria-label={`Déplacer : ${task.title}`}
        className={`${field} max-w-32 shrink-0 py-1 text-xs`}
      >
        <BucketOptions />
      </select>
    </li>
  );
}

export function TaskPanel({ title, panel, tasks, state, today }) {
  return (
    <Panel title={title} count={tasks?.length} state={state} file="tasks.sql">
      {tasks?.length ? (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {tasks.map((t) => (
            <TaskRow key={t.id} task={t} panel={panel} today={today} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Rien ici.</p>
      )}
    </Panel>
  );
}

function SuggestionRow({ suggestion }) {
  const { pending, error, run } = useAction();
  const save = suggestion.instagram_saves;

  return (
    <li className={`py-2 ${pending ? 'opacity-50' : ''}`}>
      <p className="break-words text-sm">{suggestion.text}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {suggestion.project_slug}
        {suggestion.project_slug && save && ' · '}
        {save && (
          <a href={save.url} target="_blank" rel="noopener noreferrer" className="underline">
            d&apos;après @{save.author || 'une save'}
          </a>
        )}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button disabled={pending} onClick={() => run(() => acceptSuggestion(suggestion.id))} className={button}>
          Ajouter à la prochaine session
        </button>
        <button disabled={pending} onClick={() => run(() => dismissSuggestion(suggestion.id))} className={button}>
          Ignorer
        </button>
      </div>
      <ErrorLine error={error} />
    </li>
  );
}

export function SuggestionsPanel({ suggestions, state }) {
  return (
    <Panel
      title="Suggestions de next steps"
      count={suggestions?.length}
      state={state}
      file="instagram.sql"
      className="md:col-span-2"
    >
      {suggestions?.length ? (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {suggestions.map((s) => (
            <SuggestionRow key={s.id} suggestion={s} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Aucune suggestion. Claude en écrit pendant une session, à partir de tes saves Instagram.
        </p>
      )}
    </Panel>
  );
}
