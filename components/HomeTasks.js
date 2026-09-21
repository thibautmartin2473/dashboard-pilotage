'use client';

import { useState } from 'react';
import Panel from './Panel';
import { Button, ConfirmDelete, ErrorLine, Field, IconButton, Select, useAction } from './ui';
import { acceptSuggestion, dismissSuggestion } from '@/app/actions';
import { addSuggestion, deleteSuggestion, updateSuggestion } from '@/app/edit-actions';

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

function SuggestionRow({ suggestion, projects }) {
  const { pending, error, run } = useAction();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(suggestion.text);
  const save = suggestion.instagram_saves;

  return (
    <li className={`py-2 ${pending ? 'opacity-50' : ''}`}>
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              const result = await updateSuggestion({ id: suggestion.id, text, project_slug: suggestion.project_slug });
              if (!result.error) setEditing(false);
              return result;
            });
          }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <Field value={text} onChange={(e) => setText(e.target.value)} maxLength={500} required aria-label="Texte" className="flex-1" />
          <Button type="submit" disabled={pending}>
            Enregistrer
          </Button>
          <Button
            disabled={pending}
            onClick={() => {
              setText(suggestion.text);
              setEditing(false);
            }}
          >
            Annuler
          </Button>
        </form>
      ) : (
        <p className="break-words text-sm">{suggestion.text}</p>
      )}
      {save && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          <a href={save.url} target="_blank" rel="noopener noreferrer" className="underline">
            d&apos;après @{save.author || 'une save'}
          </a>
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Select
          value={suggestion.project_slug ?? ''}
          disabled={pending}
          onChange={(e) => run(() => updateSuggestion({ id: suggestion.id, text: suggestion.text, project_slug: e.target.value }))}
          aria-label="Affecter à un projet"
        >
          <ProjectOptions projects={projects} />
        </Select>
        <Button disabled={pending} onClick={() => run(() => acceptSuggestion(suggestion.id))}>
          Ajouter à la prochaine session
        </Button>
        <Button disabled={pending} onClick={() => run(() => dismissSuggestion(suggestion.id))}>
          Ignorer
        </Button>
        <IconButton label="Modifier la suggestion" disabled={pending || editing} onClick={() => setEditing(true)}>
          ✎
        </IconButton>
        <ConfirmDelete pending={pending} onConfirm={() => run(() => deleteSuggestion(suggestion.id))} label="Supprimer la suggestion" />
      </div>
      <ErrorLine error={error} />
    </li>
  );
}

function AddSuggestion({ projects }) {
  const { pending, error, run } = useAction();
  const [text, setText] = useState('');
  const [project, setProject] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          const result = await addSuggestion({ text, project_slug: project });
          if (!result.error) setText('');
          return result;
        });
      }}
      className="mb-2"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <Field value={text} onChange={(e) => setText(e.target.value)} placeholder="Nouvelle suggestion…" maxLength={500} required aria-label="Nouvelle suggestion" className="flex-1" />
        <Select value={project} onChange={(e) => setProject(e.target.value)} aria-label="Projet">
          <ProjectOptions projects={projects} />
        </Select>
        <Button type="submit" disabled={pending}>
          {pending ? 'Ajout…' : 'Ajouter'}
        </Button>
      </div>
      <ErrorLine error={error} />
    </form>
  );
}

export function SuggestionsPanel({ suggestions, state, projects = [] }) {
  return (
    <Panel title="Suggestions de next steps" count={suggestions?.length} state={state} file="instagram.sql">
      <AddSuggestion projects={projects} />
      {suggestions?.length ? (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {suggestions.map((s) => (
            <SuggestionRow key={s.id} suggestion={s} projects={projects} />
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
