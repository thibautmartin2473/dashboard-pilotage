'use client';

import Link from 'next/link';
import { useState } from 'react';
import Panel from './Panel';
import StatusBadge from './StatusBadge';
import { Button, ConfirmDelete, ErrorLine, Field, IconButton, Select, mutedClass, useAction } from './ui';
import { addApp, addProject, deleteApp, moveApp, removeProject, renameProject, updateApp } from '@/app/edit-actions';

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

// Formulaire nom / adresse / projet, pour ajouter (`app` absent) ou modifier une tuile.
function AppForm({ app, projects, onDone }) {
  const { pending, error, run } = useAction();
  const submit = (e) => {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    run(async () => {
      const result = app ? await updateApp({ id: app.id, ...values }) : await addApp(values);
      if (!result.error) onDone();
      return result;
    });
  };
  return (
    <form onSubmit={submit} className="space-y-2">
      <Field name="name" defaultValue={app?.name ?? ''} placeholder="Nom" aria-label="Nom" maxLength={100} required className="w-full" />
      <Field name="url" defaultValue={app?.url ?? ''} placeholder="https://… ou /chemin" aria-label="Adresse" maxLength={500} required className="w-full" />
      <Select name="project_slug" defaultValue={app?.project_slug ?? ''} aria-label="Projet lié" className="w-full">
        <ProjectOptions projects={projects} />
      </Select>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Enregistrement…' : app ? 'Enregistrer' : 'Ajouter'}
        </Button>
        <Button disabled={pending} onClick={onDone}>
          Annuler
        </Button>
      </div>
      <ErrorLine error={error} />
    </form>
  );
}

function AppTile({ app, project, projects, first, last }) {
  const { pending, error, run } = useAction();
  const [editing, setEditing] = useState(false);
  const external = /^https?:\/\//i.test(app.url);

  return (
    <li className={`min-w-0 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800 ${pending ? 'opacity-50' : ''}`}>
      {editing ? (
        <AppForm app={app} projects={projects} onDone={() => setEditing(false)} />
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            {external ? (
              <a href={app.url} target="_blank" rel="noopener noreferrer" className="min-w-0 break-words text-base font-semibold underline">
                {app.name} ↗
              </a>
            ) : (
              <Link href={app.url} className="min-w-0 break-words text-base font-semibold underline">
                {app.name}
              </Link>
            )}
            {project && <StatusBadge status={project.status} />}
          </div>
          {project ? (
            <p className={`mt-1 ${mutedClass}`}>
              {project.done}/{project.total} jalons ·{' '}
              <Link href={`/projects/${project.slug}`} className="underline">
                Détail du projet
              </Link>
            </p>
          ) : (
            app.project_slug && <p className={`mt-1 ${mutedClass}`}>Projet « {app.project_slug} » introuvable</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <IconButton label={`Monter : ${app.name}`} disabled={pending || first} onClick={() => run(() => moveApp(app.id, 'up'))}>
              ↑
            </IconButton>
            <IconButton label={`Descendre : ${app.name}`} disabled={pending || last} onClick={() => run(() => moveApp(app.id, 'down'))}>
              ↓
            </IconButton>
            <IconButton label={`Modifier : ${app.name}`} disabled={pending} onClick={() => setEditing(true)}>
              ✎
            </IconButton>
            <ConfirmDelete pending={pending} onConfirm={() => run(() => deleteApp(app.id))} label={`Supprimer : ${app.name}`} />
          </div>
          <ErrorLine error={error} />
        </>
      )}
    </li>
  );
}

function ProjectRow({ project }) {
  const { pending, error, run } = useAction();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(project.name);

  return (
    <li className={`py-2 ${pending ? 'opacity-50' : ''}`}>
      {renaming ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              const result = await renameProject(project.id, name);
              if (!result.error) setRenaming(false);
              return result;
            });
          }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <Field value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required aria-label="Nom du projet" className="flex-1" />
          <Button type="submit" disabled={pending}>
            Enregistrer
          </Button>
          <Button
            disabled={pending}
            onClick={() => {
              setName(project.name);
              setRenaming(false);
            }}
          >
            Annuler
          </Button>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/projects/${project.slug}`} className="min-w-0 break-words text-sm font-medium underline">
            {project.name}
          </Link>
          <span className={mutedClass}>{project.slug}</span>
          <IconButton label={`Renommer : ${project.name}`} disabled={pending} onClick={() => {
              setName(project.name);
              setRenaming(true);
            }}>
            ✎
          </IconButton>
          <ConfirmDelete
            pending={pending}
            question="Supprimer avec ses jalons, sessions et dépôts ?"
            label={`Supprimer le projet : ${project.name}`}
            onConfirm={() => run(() => removeProject(project.id))}
          />
        </div>
      )}
      <ErrorLine error={error} />
    </li>
  );
}

function AddProject() {
  const { pending, error, run } = useAction();
  const [name, setName] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          const result = await addProject(name);
          if (!result.error) setName('');
          return result;
        });
      }}
      className="mt-2"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <Field value={name} onChange={(e) => setName(e.target.value)} placeholder="Nouveau projet…" aria-label="Nom du nouveau projet" maxLength={100} required className="flex-1" />
        <Button type="submit" disabled={pending}>
          {pending ? 'Création…' : 'Créer le projet'}
        </Button>
      </div>
      <ErrorLine error={error} />
    </form>
  );
}

// Mes apps : tuiles (table app_links) modifiables, puis la gestion des projets.
// `projects` = [{ id, slug, name, done, total, status }] (données publiques, lues par la page).
export default function AppsPanel({ apps, state, projects }) {
  const [adding, setAdding] = useState(false);
  const bySlug = new Map(projects.map((p) => [p.slug, p]));

  return (
    <div className="space-y-4">
    <Panel title="Mes apps" count={apps?.length} state={state} file="dashboard-edit.sql">
      {apps?.length ? (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="apps-grid">
          {apps.map((a, i) => (
            <AppTile key={a.id} app={a} project={bySlug.get(a.project_slug)} projects={projects} first={i === 0} last={i === apps.length - 1} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Aucune app.</p>
      )}
      <div className="mt-3">
        {adding ? (
          <div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
            <AppForm projects={projects} onDone={() => setAdding(false)} />
          </div>
        ) : (
          <Button onClick={() => setAdding(true)}>
            Ajouter une app
          </Button>
        )}
      </div>
    </Panel>

    <Panel title="Projets" count={projects.length}>
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
        {projects.map((p) => (
          <ProjectRow key={p.id} project={p} />
        ))}
      </ul>
      <AddProject />
    </Panel>
    </div>
  );
}
