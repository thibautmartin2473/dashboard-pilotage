'use client';

import { useState } from 'react';
import { LinkedIdeas } from './IdeasPanel';
import NotificationsPanel from './NotificationsPanel';
import Panel from './Panel';
import { Button, ConfirmDelete, ErrorLine, Field, IconButton, Select, mutedClass, useAction } from './ui';
import { addTask, completeTask } from '@/app/actions';
import { deleteTask, moveTaskPriority, updateTask } from '@/app/edit-actions';
import { BUCKETS, BUCKET_LABELS, SECTIONS, SECTION_LABELS, describeWhen, isOverdue, todayEmptyMessage } from '@/lib/home';

const BucketOptions = () =>
  BUCKETS.map((b) => (
    <option key={b} value={b}>
      {BUCKET_LABELS[b]}
    </option>
  ));

const ProjectOptions = ({ projects }) => (
  <>
    <option value="">Sans projet</option>
    {projects.map((p) => (
      <option key={p.slug} value={p.slug}>
        {p.name}
      </option>
    ))}
  </>
);

function AddTask({ projects }) {
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
    <form onSubmit={submit} className="mb-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Field
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ajouter une tâche…"
          maxLength={200}
          required
          className="flex-1"
        />
        <Button type="submit" disabled={pending}>
          {pending ? 'Ajout…' : 'Ajouter'}
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <Select name="bucket" defaultValue="inbox" aria-label="Section">
          <BucketOptions />
        </Select>
        <Field type="date" name="due_date" aria-label="Échéance" />
        <Select name="project_slug" defaultValue="" aria-label="Projet">
          <ProjectOptions projects={projects} />
        </Select>
      </div>
      <ErrorLine error={error} />
    </form>
  );
}

function TaskEditForm({ task, projects, onDone }) {
  const { pending, error, run } = useAction();
  const submit = (e) => {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    run(async () => {
      const result = await updateTask({ id: task.id, ...values });
      if (!result.error) onDone();
      return result;
    });
  };
  return (
    <form onSubmit={submit} className="space-y-2">
      <Field name="title" defaultValue={task.title} aria-label="Titre" maxLength={200} required className="w-full" />
      <div className="flex flex-wrap gap-2">
        <Select name="project_slug" defaultValue={task.project_slug ?? ''} aria-label="Projet">
          <ProjectOptions projects={projects} />
        </Select>
        <Field type="date" name="due_date" defaultValue={task.due_date ?? ''} aria-label="Échéance" />
        <Select name="bucket" defaultValue={task.bucket} aria-label="Section">
          <BucketOptions />
        </Select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
        <Button disabled={pending} onClick={onDone}>
          Annuler
        </Button>
      </div>
      <ErrorLine error={error} />
    </form>
  );
}

function TaskRow({ task, first, last, today, projects, ideas }) {
  const { pending, error, run } = useAction();
  const [editing, setEditing] = useState(false);
  const overdue = isOverdue(task, today);

  return (
    <li className={`flex items-start gap-2 py-2 ${pending ? 'opacity-50' : ''}`}>
      <input
        type="checkbox"
        checked={pending}
        disabled={pending || editing}
        onChange={() => run(() => completeTask(task.id))}
        aria-label={`Terminer : ${task.title}`}
        className="mt-1 h-5 w-5 shrink-0"
      />
      <div className="min-w-0 flex-1">
        {editing ? (
          <TaskEditForm task={task} projects={projects} onDone={() => setEditing(false)} />
        ) : (
          <>
            <p className="break-words text-sm">{task.title}</p>
            <p className={mutedClass}>
              {task.project_slug}
              {task.project_slug && task.due_date && ' · '}
              {task.due_date && (
                <span className={overdue ? 'font-medium text-red-600 dark:text-red-400' : ''}>
                  {overdue ? 'en retard : ' : 'pour le '}
                  {task.due_date}
                </span>
              )}
            </p>
            <LinkedIdeas ideas={ideas} taskId={task.id} />
          </>
        )}
        <ErrorLine error={error} />
      </div>
      {!editing && (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          <IconButton label={`Monter : ${task.title}`} disabled={pending || first} onClick={() => run(() => moveTaskPriority(task.id, 'up'))}>
            ↑
          </IconButton>
          <IconButton label={`Descendre : ${task.title}`} disabled={pending || last} onClick={() => run(() => moveTaskPriority(task.id, 'down'))}>
            ↓
          </IconButton>
          <IconButton label={`Modifier : ${task.title}`} disabled={pending} onClick={() => setEditing(true)}>
            ✎
          </IconButton>
          <ConfirmDelete pending={pending} onConfirm={() => run(() => deleteTask(task.id))} label={`Supprimer : ${task.title}`} />
        </div>
      )}
    </li>
  );
}

// Tâches : compteurs, formulaire, propositions issues des mails (à accepter ou ignorer), puis les tâches par section. Les événements du jour
// s'ajoutent à la section « Aujourd'hui » (lecture seule, ils se modifient dans l'agenda) : on n'écrit
// « Rien ici » que si le jour n'a ni tâche ni événement.
export default function ActionsPanel({ sections, todayEvents, projects, state, today, notifications, ideas }) {
  const events = todayEvents ?? [];
  const count = (s) => (s === 'today' ? sections?.today.length + events.length : sections?.[s].length);

  return (
    <Panel title="Tâches" state={state} file="tasks.sql">
      <p className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm" data-testid="task-counters">
        {SECTIONS.map((s) => (
          <span key={s} className={s === 'overdue' && count(s) ? 'font-medium text-red-600 dark:text-red-400' : ''}>
            {SECTION_LABELS[s]} : {count(s)}
          </span>
        ))}
      </p>
      <AddTask projects={projects} />
      <NotificationsPanel state={notifications} />
      {SECTIONS.map((s) => {
        const list = sections?.[s] ?? [];
        const empty = list.length === 0 && (s === 'today' ? todayEmptyMessage(0, todayEvents) : 'Aucune tâche.');
        return (
          <section key={s} className="mt-3" data-testid={`section-${s}`}>
            <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {SECTION_LABELS[s]} ({count(s)})
            </h3>
            {s === 'today' && events.length > 0 && (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {events.map((e) => (
                  <li key={e.id} className="py-1.5 text-sm">
                    <span className="break-words">{e.title}</span>
                    <span className={`block ${mutedClass}`}>Agenda · {describeWhen(e)}</span>
                    <LinkedIdeas ideas={ideas} eventId={e.id} />
                  </li>
                ))}
              </ul>
            )}
            {list.length > 0 && (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {list.map((t, i) => (
                  <TaskRow key={t.id} task={t} first={i === 0} last={i === list.length - 1} today={today} projects={projects} ideas={ideas} />
                ))}
              </ul>
            )}
            {empty && <p className="text-sm text-zinc-500 dark:text-zinc-400">{empty}</p>}
          </section>
        );
      })}
    </Panel>
  );
}
