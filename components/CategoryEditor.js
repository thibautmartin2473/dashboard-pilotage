'use client';

import { useState } from 'react';
import { Button, ConfirmDelete, ErrorLine, Field, IconButton, Select, useAction } from './ui';
import { deleteCategory, moveCategory, saveCategory } from '@/app/edit-actions';
import { DEFAULT_CATEGORIES } from '@/lib/home';

const KIND_LABEL = { plage: 'Plage horaire', tache: 'Tâche / travail' };
const DEFAULT_KEYS = ['11', '9', '6'];

// Formulaire d'une catégorie (nom, couleur, type) : création (`category` absente) ou édition.
function CategoryForm({ category, onDone }) {
  const { pending, error, run } = useAction();
  const [form, setForm] = useState(category ?? { name: '', color: DEFAULT_CATEGORIES[0].color, kind: 'plage' });
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const submit = (e) => {
    e.preventDefault();
    run(async () => {
      const result = await saveCategory({ key: category?.key, ...form });
      if (!result.error) onDone();
      return result;
    });
  };
  return (
    <form onSubmit={submit} className="mt-1 flex flex-wrap items-center gap-2">
      <Field
        value={form.name}
        onChange={(e) => set({ name: e.target.value })}
        placeholder="Nom"
        aria-label="Nom de la catégorie"
        maxLength={60}
        required
        className="w-36"
      />
      <input
        type="color"
        value={form.color}
        onChange={(e) => set({ color: e.target.value })}
        aria-label="Couleur"
        className="h-9 w-9 rounded border border-zinc-700 bg-transparent p-0.5"
      />
      <Select value={form.kind} onChange={(e) => set({ kind: e.target.value })} aria-label="Type de catégorie">
        {Object.entries(KIND_LABEL).map(([k, label]) => (
          <option key={k} value={k}>
            {label}
          </option>
        ))}
      </Select>
      <Button type="submit" disabled={pending} className="px-2 py-1">
        {pending ? '…' : 'Enregistrer'}
      </Button>
      <Button disabled={pending} className="px-2 py-1" onClick={onDone}>
        Annuler
      </Button>
      <ErrorLine error={error} />
    </form>
  );
}

// Select de catégorie + lien « modifier la catégorie » (renommer/recolorer sans quitter l'agenda),
// utilisé par le formulaire d'événement (création et édition).
export function CategoryPicker({ value, categories, onChange }) {
  const [editing, setEditing] = useState(false);
  const current = categories.find((c) => c.key === value) ?? categories[0];
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Catégorie">
          {categories.map((c) => (
            <option key={c.key} value={c.key}>
              {c.name}
            </option>
          ))}
        </Select>
        <button type="button" className="text-xs underline" onClick={() => setEditing((o) => !o)}>
          modifier la catégorie
        </button>
      </div>
      {editing && <CategoryForm category={current} onDone={() => setEditing(false)} />}
    </div>
  );
}

// « Catégories » : créer, renommer, recolorer, réordonner et supprimer (dashboard_settings, clé
// agenda_categories). Les 3 catégories Google (rouge/bleu/orange) ne se suppriment pas : elles
// portent les colorId poussés par scripts/push-agenda.mjs.
// Seul : bouton « Catégories » qui déplie la liste. Piloté (`open` fourni, ex. par le menu « + » de l'agenda) :
// pas de bouton, la liste s'affiche selon `open` et se ferme par `onClose`.
export default function CategoryEditor({ categories, open: controlledOpen, onClose }) {
  const [innerOpen, setInnerOpen] = useState(false);
  const controlled = controlledOpen !== undefined;
  const open = controlled ? controlledOpen : innerOpen;
  const [editingKey, setEditingKey] = useState(null); // clé en édition, 'new', ou null
  const { pending, error, run } = useAction();

  return (
    <div className={controlled ? 'shrink-0' : ''}>
      {!controlled && (
        <Button aria-expanded={open} onClick={() => setInnerOpen((o) => !o)}>
          Catégories
        </Button>
      )}
      {open && (
        <div
          className={`rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-950 ${controlled ? 'mt-3 max-h-[40%] overflow-y-auto' : 'mt-2'}`}
          data-testid="category-editor"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              La couleur reste sur ce tableau de bord : rien n&apos;est écrit dans Google Agenda. Les blocs de l&apos;agenda
              suivent leur type (cours, examen, rendez-vous...), pas la couleur de la catégorie.
            </p>
            {controlled && (
              <Button level="tertiary" onClick={() => onClose?.()}>
                Fermer
              </Button>
            )}
          </div>
          <ul className="mt-1 divide-y divide-zinc-100 dark:divide-zinc-900">
            {categories.map((c, i) => (
              <li key={c.key} className="py-1.5">
                {editingKey === c.key ? (
                  <CategoryForm category={c} onDone={() => setEditingKey(null)} />
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} aria-hidden="true" />
                    <span className="min-w-0 flex-1 text-sm">{c.name}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{KIND_LABEL[c.kind]}</span>
                    <IconButton
                      label={`Monter : ${c.name}`}
                      disabled={pending || i === 0}
                      onClick={() => run(() => moveCategory(c.key, 'up'))}
                    >
                      ↑
                    </IconButton>
                    <IconButton
                      label={`Descendre : ${c.name}`}
                      disabled={pending || i === categories.length - 1}
                      onClick={() => run(() => moveCategory(c.key, 'down'))}
                    >
                      ↓
                    </IconButton>
                    <Button disabled={pending} className="px-2 py-1" onClick={() => setEditingKey(c.key)}>
                      Modifier
                    </Button>
                    {!DEFAULT_KEYS.includes(c.key) && (
                      <ConfirmDelete
                        pending={pending}
                        question={`Supprimer « ${c.name} » ?`}
                        onConfirm={() => run(() => deleteCategory(c.key))}
                      />
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
          {editingKey === 'new' ? (
            <CategoryForm onDone={() => setEditingKey(null)} />
          ) : (
            <Button disabled={pending} className="mt-2 px-2 py-1" onClick={() => setEditingKey('new')}>
              + Catégorie
            </Button>
          )}
          <ErrorLine error={error} />
        </div>
      )}
    </div>
  );
}
