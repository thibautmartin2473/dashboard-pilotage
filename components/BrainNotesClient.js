'use client';

import { useState } from 'react';

const STATUS_LABELS = { new: 'nouvelle', triaged: 'rangée', done: 'faite' };
const STATUS_COLORS = {
  new: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  triaged: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

export default function BrainNotesClient({ initialNotes }) {
  const [notes, setNotes] = useState(initialNotes);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/brain-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const { note, error } = await res.json();
      if (error) throw new Error(error);
      setNotes((prev) => [note, ...prev]);
      setContent('');
    } catch (err) {
      alert(`Erreur : ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ce qu'il reste à faire, une idée..."
          rows={3}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Ajouter
        </button>
      </form>

      <ul className="space-y-2">
        {notes.map((note) => (
          <li
            key={note.id}
            className="rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className={`rounded px-1.5 py-0.5 text-xs ${STATUS_COLORS[note.status]}`}>
                {STATUS_LABELS[note.status]}
              </span>
              <span className="text-xs text-zinc-400">
                {new Date(note.created_at).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <p className="whitespace-pre-wrap">{note.content}</p>
            {note.triaged_to && (
              <p className="mt-1 text-xs text-zinc-400">→ {note.triaged_to}</p>
            )}
          </li>
        ))}
        {notes.length === 0 && (
          <li className="text-sm text-zinc-400">Aucune idée pour l&apos;instant.</li>
        )}
      </ul>
    </div>
  );
}
