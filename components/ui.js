'use client';

// Briques d'interface partagées : tout le site les utilise, un relooking se fait
// ici et nulle part ailleurs. Fonctionnel seulement (pas de style soigné).

import { createContext, useContext, useOptimistic, useState, useTransition } from 'react';
import { saveLayout } from '@/app/edit-actions';
import { lastSync } from '@/lib/home';
import { timeAgo } from '@/lib/format';

const BUTTON =
  'rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm font-medium text-zinc-100 hover:border-[var(--color-accent)] hover:bg-zinc-800 disabled:opacity-50';
const FIELD =
  'rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-accent)]';

export const fieldClass = FIELD;
export const mutedClass = 'tabular font-mono text-[11px] text-zinc-400';

// Lance une Server Action : `pending` pendant l'appel, `error` si elle renvoie
// { error } ou lève. Jamais d'échec silencieux : l'erreur s'affiche avec <ErrorLine>.
export function useAction() {
  const [pending, start] = useTransition();
  const [error, setError] = useState(null);
  const run = (fn) =>
    start(async () => {
      try {
        setError((await fn())?.error ?? null);
      } catch (err) {
        setError(err.message);
      }
    });
  return { pending, error, run };
}

export function ErrorLine({ error }) {
  return error ? (
    <p role="alert" className="text-xs text-red-600 dark:text-red-400">
      {error}
    </p>
  ) : null;
}

export function Button({ className = '', type = 'button', ...props }) {
  return <button type={type} className={`${BUTTON} ${className}`} {...props} />;
}

// Bouton d'action sur une ligne (modifier, monter, descendre...) : glyphe + libellé accessible.
export function IconButton({ label, children, className = '', ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`${BUTTON} min-w-9 px-2 py-1 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Bouton de filtre : état actif distinct et aria-pressed.
export function ToggleButton({ pressed, className = '', ...props }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={`${BUTTON} ${pressed ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] font-semibold text-[var(--color-accent)]' : ''} ${className}`}
      {...props}
    />
  );
}

export function Field({ className = '', ...props }) {
  return <input className={`${FIELD} min-w-0 ${className}`} {...props} />;
}

export function Select({ className = '', ...props }) {
  return <select className={`${FIELD} min-w-0 ${className}`} {...props} />;
}

export function TextArea({ className = '', ...props }) {
  return <textarea className={`${FIELD} min-w-0 ${className}`} {...props} />;
}

// Suppression avec confirmation en ligne : « Supprimer ? Oui / Non » (jamais window.confirm).
// `onConfirm` doit lancer l'action (souvent via useAction().run).
export function ConfirmDelete({ onConfirm, pending, question = 'Supprimer ?', label = 'Supprimer' }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <IconButton label={label} disabled={pending} onClick={() => setAsking(true)}>
        ✕
      </IconButton>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-1 text-sm">
      {question}
      <Button
        disabled={pending}
        className="px-2 py-1"
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
      >
        Oui
      </Button>
      <Button disabled={pending} className="px-2 py-1" onClick={() => setAsking(false)}>
        Non
      </Button>
    </span>
  );
}

// Pied de panneau des instantanés : l'âge des données, pour ne jamais les faire passer pour du direct.
export function SyncFooter({ rows, href, label, now }) {
  const synced = lastSync(rows);
  return (
    <p className={`mt-3 flex flex-wrap items-baseline justify-between gap-x-3 ${mutedClass}`}>
      <span>{synced ? `Mis à jour ${timeAgo(synced, now)}` : 'Aucune donnée synchronisée'}</span>
      <a href={href} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
        {label}
      </a>
    </p>
  );
}

// Case d'un panneau dans la grille de l'accueil : fournit à <Panel> sa taille
// (compact par défaut, `expanded` = contenu entier sur toute la largeur, `collapsed` = en-tête seul),
// enregistrée dans home_layout.sizes (dashboard_settings) pour rester la même sur téléphone et PC.
const SlotContext = createContext(null);

export function HomeSlot({ id, layout, children }) {
  const { pending, error, run } = useAction();
  const [size, setOptimistic] = useOptimistic(layout.sizes[id] ?? 'compact');
  const setSize = (next) =>
    run(async () => {
      setOptimistic(next);
      const sizes = { ...layout.sizes, [id]: next };
      if (next === 'compact') delete sizes[id];
      // ponytail: écrit la disposition complète lue au rendu ; deux clics sur deux panneaux avant le
      // rafraîchissement peuvent s'écraser. Passer à une fusion côté serveur si ça gêne.
      return saveLayout({ ...layout, sizes });
    });
  return (
    <div className={`min-w-0 ${size === 'expanded' ? 'md:col-span-full' : ''}`}>
      <SlotContext value={{ size, setSize, pending }}>{children}</SlotContext>
      <ErrorLine error={error} />
    </div>
  );
}

// Cadre de tous les panneaux. `state` = résultat { error, message } d'une lecture en
// échec : on l'affiche à la place du contenu, jamais une liste vide. Dans une <HomeSlot>,
// l'en-tête porte les boutons Étendre/Réduire et Replier/Déplier.
export function Panel({ title, count, state, file, className = '', children }) {
  const slot = useContext(SlotContext);
  const size = slot?.size;
  const toggle = (target) => slot.setSize(size === target ? 'compact' : target);
  const small = 'min-w-7 px-1.5 py-0 text-xs leading-6';
  return (
    <section className={`overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 ${className}`}>
      <h2 className="flex items-center gap-2 border-b border-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-100">
        <span className="min-w-0 flex-1 truncate">{title}</span>
        {count != null && !state?.error && (
          <span className="tabular rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 font-mono text-[11px] font-normal text-zinc-400">
            {count}
          </span>
        )}
        {slot && (
          <>
            <IconButton
              label={`${size === 'expanded' ? 'Réduire' : 'Étendre'} : ${title}`}
              className={small}
              disabled={slot.pending}
              onClick={() => toggle('expanded')}
            >
              {size === 'expanded' ? '⤡' : '⤢'}
            </IconButton>
            <IconButton
              label={`${size === 'collapsed' ? 'Déplier' : 'Replier'} : ${title}`}
              aria-expanded={size !== 'collapsed'}
              className={small}
              disabled={slot.pending}
              onClick={() => toggle('collapsed')}
            >
              {size === 'collapsed' ? '▸' : '▾'}
            </IconButton>
          </>
        )}
      </h2>
      {size !== 'collapsed' && (
        <div className={`p-4 ${size === 'compact' ? 'max-h-80 overflow-y-auto' : ''}`}>
          {state?.error === 'missing' ? (
            <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Table manquante : exécuter <code>supabase/{file}</code>
            </p>
          ) : state?.error ? (
            <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
              Erreur : {state.message}
            </p>
          ) : (
            children
          )}
        </div>
      )}
    </section>
  );
}
