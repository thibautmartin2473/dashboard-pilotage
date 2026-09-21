'use client';

import { useState } from 'react';
import Panel from './Panel';
import { Button, ConfirmDelete, ErrorLine, Field, mutedClass, useAction } from './ui';
import { acceptNotification, deleteNotification, dismissNotification } from '@/app/command-actions';
import { describeWhen, isoToParisLocal } from '@/lib/home';

const KINDS = {
  event: ['Événement', 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'],
  deadline: ['Échéance', 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'],
  todo: ['À faire', 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'],
  info: ['Info', 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'],
};

// Modifier : titre et dates proposés, puis « Accepter » crée l'élément avec ces valeurs.
function EditForm({ n, onDone }) {
  const { pending, error, run } = useAction();
  const [form, setForm] = useState({
    title: n.title,
    start: n.starts_at ? isoToParisLocal(n.starts_at) : '',
    end: n.ends_at ? isoToParisLocal(n.ends_at) : '',
    due_date: n.due_date ?? '',
  });
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const submit = (e) => {
    e.preventDefault();
    const values = n.kind === 'event' ? { title: form.title, start: form.start, end: form.end } : { title: form.title, due_date: form.due_date };
    run(async () => {
      const result = await acceptNotification({ id: n.id, ...values });
      if (!result.error) onDone();
      return result;
    });
  };
  return (
    <form onSubmit={submit} className="mt-2 space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <Field value={form.title} onChange={(e) => set({ title: e.target.value })} aria-label="Titre" maxLength={200} required className="w-full" />
      <div className="flex flex-wrap gap-2">
        {n.kind === 'event' ? (
          <>
            <label className={`flex flex-col ${mutedClass}`}>
              Début
              <Field type="datetime-local" value={form.start} onChange={(e) => set({ start: e.target.value })} required />
            </label>
            <label className={`flex flex-col ${mutedClass}`}>
              Fin
              <Field type="datetime-local" value={form.end} onChange={(e) => set({ end: e.target.value })} />
            </label>
          </>
        ) : (
          <label className={`flex flex-col ${mutedClass}`}>
            Échéance
            <Field type="date" value={form.due_date} onChange={(e) => set({ due_date: e.target.value })} required={n.kind === 'deadline'} />
          </label>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Ajout…' : 'Accepter'}
        </Button>
        <Button disabled={pending} onClick={onDone}>
          Annuler
        </Button>
      </div>
      <ErrorLine error={error} />
    </form>
  );
}

function NotificationRow({ n }) {
  const { pending, error, run } = useAction();
  const [editing, setEditing] = useState(false);
  const [label, pill] = KINDS[n.kind] ?? [n.kind, KINDS.info[1]];
  const when = n.starts_at
    ? describeWhen({ starts_at: n.starts_at, ends_at: n.ends_at, all_day: false })
    : n.due_date && `pour le ${n.due_date}`;

  return (
    <li className={`py-2 ${pending ? 'opacity-50' : ''}`} data-testid="notification">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${pill}`}>{label}</span>
        <span className="min-w-0 break-words text-sm font-medium">{n.title}</span>
      </div>
      {n.detail && <p className={`break-words ${mutedClass}`}>{n.detail}</p>}
      {(when || n.mail_link) && (
        <p className={mutedClass}>
          {when}
          {when && n.mail_link && ' · '}
          {n.mail_link && /^https?:\/\//i.test(n.mail_link) && (
            <a href={n.mail_link} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
              Ouvrir le mail
            </a>
          )}
        </p>
      )}
      {editing ? (
        <EditForm n={n} onDone={() => setEditing(false)} />
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button disabled={pending} onClick={() => run(() => acceptNotification({ id: n.id }))}>
            Accepter
          </Button>
          {n.kind !== 'info' && (
            <Button disabled={pending} onClick={() => setEditing(true)}>
              Modifier
            </Button>
          )}
          <Button disabled={pending} onClick={() => run(() => dismissNotification(n.id))}>
            Ignorer
          </Button>
          <ConfirmDelete pending={pending} onConfirm={() => run(() => deleteNotification(n.id))} label={`Supprimer : ${n.title}`} />
        </div>
      )}
      <ErrorLine error={error} />
    </li>
  );
}

// Propositions de Claude issues des mails (statut « new »). `state` = { data } ou { error, message } :
// table absente ou panne s'affichent à la place de la liste, jamais comme « aucune notification ».
export default function NotificationsPanel({ state }) {
  const list = state.data ?? [];
  return (
    <div className="mt-3" data-testid="notifications">
      <Panel title="Notifications" count={state.data ? list.length : null} state={state} file="notifications.sql">
        {list.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Aucune notification.</p>
        ) : (
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {list.map((n) => (
              <NotificationRow key={n.id} n={n} />
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
