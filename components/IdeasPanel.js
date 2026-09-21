'use client';

import Link from 'next/link';
import { useState } from 'react';
import Panel from './Panel';
import { Button, ConfirmDelete, ErrorLine, IconButton, TextArea, mutedClass, useAction } from './ui';
import { addIdea, deleteIdea, doneIdea, updateIdea } from '@/app/edit-actions';
import { timeAgo } from '@/lib/format';

function IdeaRow({ note, now }) {
  const { pending, error, run } = useAction();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(note.content);

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
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <IconButton label="Modifier l'idée" disabled={pending} onClick={() => setEditing(true)}>
              ✎
            </IconButton>
            <Button disabled={pending} className="px-2 py-1" onClick={() => run(() => doneIdea(note.id))}>
              Traitée
            </Button>
            <ConfirmDelete pending={pending} onConfirm={() => run(() => deleteIdea(note.id))} label="Supprimer l'idée" />
          </div>
        </>
      )}
      <ErrorLine error={error} />
    </li>
  );
}

export default function IdeasPanel({ notes, state, now }) {
  const { pending, error, run } = useAction();
  const [content, setContent] = useState('');

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
      {notes?.length ? (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {notes.map((n) => (
            <IdeaRow key={n.id} note={n} now={now} />
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
