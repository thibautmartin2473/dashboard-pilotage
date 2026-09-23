'use client';

import Link from 'next/link';
import { useState } from 'react';
import Panel from './Panel';
import { Button, ConfirmDelete, ErrorLine, IconButton, Select, TextArea, mutedClass, useAction } from './ui';
import { addIdea, deleteIdea, doneIdea, ideaToTask, linkIdea, updateIdea } from '@/app/edit-actions';
import { timeAgo } from '@/lib/format';

const targetOf = (note) => (note.task_id ? `task:${note.task_id}` : note.event_id ? `event:${note.event_id}` : '');

// Idées liées à une tâche ou à un événement, affichées discrètement sous celui-ci.
export function LinkedIdeas({ ideas, taskId, eventId }) {
  const list = (ideas ?? []).filter((n) => (taskId ? n.task_id === taskId : n.event_id === eventId));
  if (!list.length) return null;
  return (
    <ul className={`mt-0.5 space-y-0.5 ${mutedClass}`} data-testid="linked-ideas">
      {list.map((n) => (
        <li key={n.id} className="break-words">
          💡 {n.content}
        </li>
      ))}
    </ul>
  );
}

function IdeaRow({ note, now, targets }) {
  const { pending, error, run } = useAction();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(note.content);
  const target = targetOf(note);
  const known = targets.find((t) => t.value === target);

  return (
    <li className={`py-2 ${pending ? 'opacity-50' : ''}`}>
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              const result = await updateIdea(note.id, content);
              if (!result.error) setEditing(false);
              return result;
            });
          }}
          className="space-y-2"
        >
          <TextArea value={content} onChange={(e) => setContent(e.target.value)} rows={3} maxLength={2000} required className="w-full" aria-label="Texte de l'idée" />
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              Enregistrer
            </Button>
            <Button
              disabled={pending}
              onClick={() => {
                setContent(note.content);
                setEditing(false);
              }}
            >
              Annuler
            </Button>
          </div>
        </form>
      ) : (
        <>
          <p className="whitespace-pre-wrap break-words text-sm">{note.content}</p>
          <p className={mutedClass}>
            {note.project_slug && `${note.project_slug} · `}
            {timeAgo(note.created_at, now)}
          </p>
          {target && (
            <p className={`break-words ${mutedClass}`}>
              → {known ? known.label : note.task_id ? 'Tâche terminée ou supprimée' : 'Événement passé ou retiré'}
            </p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <IconButton label="Modifier l'idée" disabled={pending} onClick={() => setEditing(true)}>
              ✎
            </IconButton>
            <Button disabled={pending} className="px-2 py-1" onClick={() => run(() => doneIdea(note.id))}>
              Traitée
            </Button>
            {!target && (
              <Button disabled={pending} className="px-2 py-1" onClick={() => run(() => ideaToTask(note.id))}>
                En faire une tâche
              </Button>
            )}
            <ConfirmDelete pending={pending} onConfirm={() => run(() => deleteIdea(note.id))} label="Supprimer l'idée" />
            {(targets.length > 0 || target) && <Select
              value={target}
              disabled={pending}
              onChange={(e) => run(() => linkIdea(note.id, e.target.value))}
              aria-label="Affecter l'idée à une tâche ou un événement"
              className="max-w-full py-1 sm:max-w-64"
            >
              <option value="">Affecter à… (aucune)</option>
              {target && !known && <option value={target}>Cible actuelle (introuvable)</option>}
              {targets.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>}
          </div>
        </>
      )}
      <ErrorLine error={error} />
    </li>
  );
}

export default function IdeasPanel({ notes, state, now, targets = [] }) {
  const { pending, error, run } = useAction();
  const [content, setContent] = useState('');
  // select('*') ne renvoie pas task_id tant que supabase/ideas.sql n'a pas été exécuté.
  const linksMissing = notes?.length > 0 && !('task_id' in notes[0]);
  return (
    <Panel title="Idées" count={notes?.length} state={state} file="brain_notes.sql">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            const result = await addIdea(content);
            if (!result.error) setContent('');
            return result;
          });
        }}
        className="mb-2 space-y-2"
      >
        <TextArea value={content} onChange={(e) => setContent(e.target.value)} rows={2} maxLength={2000} required placeholder="Nouvelle idée…" className="w-full" aria-label="Nouvelle idée" />
        <Button type="submit" disabled={pending}>
          {pending ? 'Ajout…' : 'Ajouter'}
        </Button>
        <ErrorLine error={error} />
      </form>
      {linksMissing && (
        <p className="mb-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Affecter une idée à une tâche ou un événement : exécuter <code>supabase/ideas.sql</code>
        </p>
      )}
      {notes?.length ? (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {notes.map((n) => (
            <IdeaRow key={n.id} note={n} now={now} targets={linksMissing ? [] : targets} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Aucune idée en attente.</p>
      )}
      <Link href="/brain" className="mt-2 inline-block text-sm underline">
        Toutes les idées
      </Link>
    </Panel>
  );
}
