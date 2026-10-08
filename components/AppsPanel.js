'use client';

import Link from 'next/link';
import { useState } from 'react';
import Panel from './Panel';
import { buildAppTiles, initials, tileStyle } from '@/lib/app-logos';
import { Button, ConfirmDelete, ErrorLine, Field, Select, mutedClass, useAction } from './ui';
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

function AppRow({ app, projects, first, last }) {
  const { pending, error, run } = useAction();
  const [editing, setEditing] = useState(false);

  return (
    <li className={`rounded-xl border border-zinc-800 p-3 ${pending ? 'opacity-50' : ''}`}>
      {editing ? (
        <AppForm app={app} projects={projects} onDone={() => setEditing(false)} />
      ) : (
        <>
          <div className="flex min-w-0 items-center justify-between gap-2">
            <span className="min-w-0 truncate text-sm font-medium">{app.name}</span>
          </div>
          <p className={`mt-0.5 truncate ${mutedClass}`}>{app.url}{app.project_slug ? ` · ${app.project_slug}` : ''}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <Button level="tertiary" aria-label={`Monter : ${app.name}`} disabled={pending || first} onClick={() => run(() => moveApp(app.id, 'up'))}>
              Monter
            </Button>
            <Button level="tertiary" aria-label={`Descendre : ${app.name}`} disabled={pending || last} onClick={() => run(() => moveApp(app.id, 'down'))}>
              Descendre
            </Button>
            <Button level="tertiary" aria-label={`Modifier : ${app.name}`} disabled={pending} onClick={() => setEditing(true)}>
              Modifier
            </Button>
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
          <Button
            level="tertiary"
            aria-label={`Renommer : ${project.name}`}
            disabled={pending}
            onClick={() => {
              setName(project.name);
              setRenaming(true);
            }}
          >
            Renommer
          </Button>
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

const STATUS_DOT = { blocked: 'bg-red-500', in_progress: 'bg-amber-500' };
const STATUS_WORD = { blocked: 'Bloqué', in_progress: 'En cours' };

// Un carré cliquable façon écran d'accueil : pastille + nom, statut en pastille doublée d'un mot si notable.
function Square({ href, external, name, status, logo }) {
  const dot = STATUS_DOT[status];
  const content = (
    <>
      <span
        className="relative flex size-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold"
        style={logo ? undefined : tileStyle(name)}
      >
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" width={40} height={40} className="size-10 rounded-2xl object-cover" />
        ) : (
          initials(name)
        )}
        {dot && <span className={`absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-zinc-900 ${dot}`} />}
      </span>
      <span className="line-clamp-2 w-full break-words text-center text-[12px] leading-tight text-zinc-200">{name}</span>
      {dot && <span className="sr-only">{STATUS_WORD[status]}</span>}
    </>
  );
  const className = 'flex flex-col items-center gap-1.5 rounded-xl border border-zinc-800 p-2 text-center hover:border-[var(--color-accent)] hover:bg-zinc-800/60';
  const title = dot ? `${name} (${STATUS_WORD[status]})` : name;
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" title={title} className={className}>
      {content}
    </a>
  ) : (
    <Link href={href} title={title} className={className}>
      {content}
    </Link>
  );
}

// Mes apps : une grille de carrés (apps et projets fusionnés, un projet qui a une app liée
// (app_links.project_slug) n'a qu'un seul carré, qui ouvre l'app). Bouton « Modifier » pour
// retrouver l'édition complète (tuiles détaillées, modifier, monter, descendre, supprimer, formulaires d'ajout).
export default function AppsPanel({ apps, state, projects }) {
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const list = apps ?? [];
  const tiles = buildAppTiles(list, projects);

  return (
    <Panel title="Mes apps" count={tiles.length} state={state} file="dashboard-edit.sql">
      <div className="mb-3 flex justify-end">
        <Button onClick={() => setEditing((v) => !v)}>{editing ? 'Terminer' : 'Modifier'}</Button>
      </div>

      {!editing ? (
        tiles.length ? (
          <ul className="grid grid-cols-1 gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))' }} data-testid="apps-grid">
            {tiles.map((t) => (
              <li key={t.key}>
                <Square href={t.href} external={t.external} name={t.name} status={t.status} logo={t.logo} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Aucune app ni projet.</p>
        )
      ) : (
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Apps</h3>
            {list.length ? (
              <ul className="mt-2 space-y-2">
                {list.map((a, i) => (
                  <AppRow key={a.id} app={a} projects={projects} first={i === 0} last={i === list.length - 1} />
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Aucune app.</p>
            )}
            <div className="mt-3">
              {adding ? (
                <div className="rounded-xl border border-zinc-800 p-3">
                  <AppForm projects={projects} onDone={() => setAdding(false)} />
                </div>
              ) : (
                <Button onClick={() => setAdding(true)}>Ajouter une app</Button>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Projets</h3>
            <ul className="divide-y divide-zinc-900">
              {projects.map((p) => (
                <ProjectRow key={p.id} project={p} />
              ))}
            </ul>
            <AddProject />
          </div>
        </div>
      )}
    </Panel>
  );
}
