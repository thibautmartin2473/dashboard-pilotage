'use client';

import { useState } from 'react';
import { Button, ErrorLine, IconButton, useAction } from './ui';
import { saveLayout } from '@/app/edit-actions';
import { HOME_PANELS } from '@/lib/home';

// « Organiser la page » : masquer, réafficher et monter/descendre chaque panneau de l'accueil.
// Chaque clic enregistre la disposition (dashboard_settings, clé home_layout) ; `layout` vient du
// serveur, donc la page se met à jour d'elle-même après l'enregistrement.
export default function LayoutEditor({ layout, settings }) {
  const [open, setOpen] = useState(false);
  const { pending, error, run } = useAction();
  const { order, hidden } = layout;

  const save = (next) => run(() => saveLayout(next));
  const move = (id, step) => {
    const next = [...order];
    const i = next.indexOf(id);
    [next[i], next[i + step]] = [next[i + step], next[i]];
    save({ order: next, hidden });
  };
  const toggle = (id) => save({ order, hidden: hidden.includes(id) ? hidden.filter((h) => h !== id) : [...hidden, id] });

  const problem =
    settings.error === 'missing'
      ? 'Table manquante : exécuter supabase/dashboard-edit.sql pour enregistrer la disposition'
      : settings.error
        ? `Erreur : ${settings.message}`
        : null;

  return (
    <div>
      <Button aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        Organiser la page
      </Button>
      {open && (
        <ul className="mt-2 divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white p-2 dark:divide-zinc-900 dark:border-zinc-800 dark:bg-zinc-950" data-testid="layout-editor">
          {order.map((id, i) => {
            const isHidden = hidden.includes(id);
            return (
              <li key={id} className="flex flex-wrap items-center gap-2 py-1.5">
                <span className={`min-w-0 flex-1 text-sm ${isHidden ? 'text-zinc-400 line-through' : ''}`}>{HOME_PANELS[id].label}</span>
                <IconButton label={`Monter : ${HOME_PANELS[id].label}`} disabled={pending || i === 0} onClick={() => move(id, -1)}>
                  ↑
                </IconButton>
                <IconButton label={`Descendre : ${HOME_PANELS[id].label}`} disabled={pending || i === order.length - 1} onClick={() => move(id, 1)}>
                  ↓
                </IconButton>
                <Button disabled={pending} className="px-2 py-1" onClick={() => toggle(id)}>
                  {isHidden ? 'Afficher' : 'Masquer'}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      <ErrorLine error={error ?? (open ? problem : null)} />
    </div>
  );
}
