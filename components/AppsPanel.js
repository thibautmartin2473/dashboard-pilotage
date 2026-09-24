'use client';

import Link from 'next/link';
import { useState } from 'react';
import Panel from './Panel';
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

// Initiales (1-2 lettres) pour la pastille d'un carré sans image.
function initials(name) {
  const words = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase() || '?';
}

const TILE_COLORS = [
  'bg-sky-900 text-sky-200', 'bg-emerald-900 text-emerald-200', 'bg-amber-900 text-amber-200',
  'bg-rose-900 text-rose-200', 'bg-violet-900 text-violet-200', 'bg-cyan-900 text-cyan-200',
];

function colorFor(key) {
  let h = 0;
  for (const c of String(key)) h = (h * 31 + c.charCodeAt(0)) % TILE_COLORS.length;
  return TILE_COLORS[h];
}

const STATUS_DOT = { blocked: 'bg-red-500', in_progress: 'bg-amber-500' };

// Un carré cliquable façon écran d'accueil : pastille colorée + nom, statut en pastille si notable.
function Square({ href, external, name, status }) {
  const dot = STATUS_DOT[status];
  const content = (
    <>
      <span className={`relative flex size-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${colorFor(name)}`}>
        {initials(name)}
        {dot && <span className={`absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-zinc-900 ${dot}`} />}
      </span>
      <span className="line-clamp-2 w-full break-words text-center text-[11px] leading-tight text-zinc-200">{name}</span>
    </>
  );
  const className = 'flex flex-col items-center gap-1.5 rounded-xl border border-zinc-800 p-2 text-center hover:border-[var(--color-accent)] hover:bg-zinc-800/60';
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  ) : (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

// Mes apps : une grille de carrés (apps et projets fusionnés, un projet qui a une app liée
// (app_links.project_slug) n'a qu'un seul carré, qui ouvre l'app). Bouton « Modifier » pour
// retrouver l'édition complète (tuiles détaillées, ✎ ↑ ↓ ✕, formulaires d'ajout).
export default function AppsPanel({ apps, state, projects }) {
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const list = apps ?? [];
  const bySlug = new Map(projects.map((p) => [p.slug, p]));

  const used = new Set();
  const tiles = list.map((a) => {
    const project = bySlug.get(a.project_slug);
    if (project) used.add(project.slug);
    const external = /^https?:\/\//i.test(a.url);
    return { key: `app:${a.id}`, name: a.name, href: a.url, external, status: project?.status };
  });
  for (const p of projects) {
    if (used.has(p.slug)) continue;
    tiles.push({ key: `project:${p.id}`, name: p.name, href: `/projects/${p.slug}`, external: false, status: p.status });
  }

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
                <Square href={t.href} external={t.external} name={t.name} status={t.status} />
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
