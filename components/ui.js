'use client';

// Briques d'interface partagées : tout le site les utilise, un relooking se fait
// ici et nulle part ailleurs. Fonctionnel seulement (pas de style soigné).

import { createContext, useContext, useOptimistic, useState, useTransition } from 'react';
import { saveLayout } from '@/app/edit-actions';
import { lastSync } from '@/lib/home';
import { timeAgo } from '@/lib/format';
import './keys.css';

// Champs : contour --line-strong (3:1), 32 px de haut (44 px au doigt), anneau de focus --focus.
const FIELD =
  'min-h-8 rounded-[5px] border border-[var(--line-strong)] bg-[var(--content-surface)] px-2 py-1 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--focus)] [@media(pointer:coarse)]:min-h-11';

export const fieldClass = FIELD;
export const mutedClass = 'tabular font-mono text-xs text-[var(--ink-muted)]';

// Classes d'une « touche de terminal » (components/keys.css) pour les boutons qui ne passent pas par
// <Button> (liste de blocs, ligne cliquable...). level : primary | secondary | tertiary ;
// tone : neutral | action | late | pending | done (couleur du trait du bas, doublée par le libellé).
export function keyClass({ level = 'secondary', tone = 'neutral', icon = false } = {}) {
  return [
    'key',
    level === 'primary' && 'key--primary',
    level === 'tertiary' && 'key--tertiary',
    tone !== 'neutral' && `key--${tone}`,
    icon && 'key--icon',
  ]
    .filter(Boolean)
    .join(' ');
}

// Lettre de raccourci encadrée, à gauche du libellé.
export function KeyCap({ children }) {
  return (
    <kbd className="key-cap" aria-hidden="true">
      {children}
    </kbd>
  );
}

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
    <p role="alert" className="text-sm text-[var(--late)]">
      <span className="font-semibold">Erreur : </span>
      {error}
    </p>
  ) : null;
}

// Bouton « touche de terminal ». `level` : primary (un par zone) | secondary | tertiary ;
// `tone` : couleur du trait du bas (late pour supprimer, pending, done) ; `kbd` : lettre de raccourci.
export function Button({ level = 'secondary', tone = 'neutral', kbd, className = '', type = 'button', children, ...props }) {
  return (
    <button type={type} className={`${keyClass({ level, tone })} ${className}`} {...props}>
      {kbd && <KeyCap>{kbd}</KeyCap>}
      {children}
    </button>
  );
}

// Bouton d'action sur une ligne (modifier, monter, descendre...) : glyphe + libellé accessible.
export function IconButton({ label, children, level = 'secondary', tone = 'neutral', className = '', ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`${keyClass({ level, tone, icon: true })} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Bouton de filtre : état actif distinct (fond d'action tinté, trait d'action) et aria-pressed.
export function ToggleButton({ pressed, className = '', ...props }) {
  return <button type="button" aria-pressed={pressed} className={`${keyClass()} ${className}`} {...props} />;
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
      <Button tone="late" aria-label={label} disabled={pending} onClick={() => setAsking(true)}>
        Supprimer
      </Button>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-sm">
      {question}
      <Button
        disabled={pending}
        tone="late"
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
      >
        Oui
      </Button>
      <Button disabled={pending} level="tertiary" onClick={() => setAsking(false)}>
        Non
      </Button>
    </span>
  );
}

// Pied de panneau des instantanés : l'âge des données, pour ne jamais les faire passer pour du direct.
export function SyncFooter({ rows, href, label, now, note = '', className = 'mt-3' }) {
  const synced = lastSync(rows);
  return (
    <p className={`flex shrink-0 flex-wrap items-baseline justify-between gap-x-3 ${className} ${mutedClass}`}>
      <span>{`${synced ? `Mis à jour ${timeAgo(synced, now)}` : 'Aucune donnée synchronisée'}${note}`}</span>
      <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-6 items-center underline hover:no-underline">
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

// Cadre de tous les panneaux : en-tête de zone en cuir (--frame-*), corps crème (--content-*), séparé
// par un filet. `state` = résultat { error, message } d'une lecture en échec : on l'affiche à la place du
// contenu, jamais une liste vide. Dans une <HomeSlot>, l'en-tête porte les boutons Étendre/Réduire et
// Replier/Déplier. `fill` : le panneau remplit la hauteur de sa case et son corps défile à l'intérieur
// (page « tout sur un écran ») ; `bodyClassName` remplace le corps par défaut (marges, défilement).
export function Panel({ title, count, state, file, className = '', bodyClassName, fill = false, children }) {
  const slot = useContext(SlotContext);
  const size = slot?.size;
  const toggle = (target) => slot.setSize(size === target ? 'compact' : target);
  const small = 'min-w-7 min-h-6 px-1.5 text-xs leading-6';
  const body =
    bodyClassName ?? (fill ? 'min-h-0 flex-1 overflow-y-auto p-3' : `p-4 ${size === 'compact' ? 'max-h-80 overflow-y-auto' : ''}`);
  return (
    <section className={`flex flex-col overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--content-surface)] text-[var(--ink)] ${fill ? 'min-h-0' : ''} ${className}`}>
      <h2 className="flex min-h-10 shrink-0 items-center gap-2 border-b border-[var(--frame-border)] bg-[var(--frame-bg)] px-4 py-2 text-sm font-semibold text-[var(--frame-text)]">
        <span className="min-w-0 flex-1 truncate">{title}</span>
        {count != null && !state?.error && (
          <span className="tabular rounded-full border border-[var(--frame-border)] bg-[var(--frame-surface)] px-2 py-0.5 font-mono text-xs font-normal text-[var(--frame-text)]">
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
              {size === 'expanded' ? 'Réduire' : 'Étendre'}
            </IconButton>
            <IconButton
              label={`${size === 'collapsed' ? 'Déplier' : 'Replier'} : ${title}`}
              aria-expanded={size !== 'collapsed'}
              className={small}
              disabled={slot.pending}
              onClick={() => toggle('collapsed')}
            >
              {size === 'collapsed' ? 'Déplier' : 'Replier'}
            </IconButton>
          </>
        )}
      </h2>
      {size !== 'collapsed' && (
        <div className={body}>
          {state?.error === 'missing' ? (
            <p className="rounded-[5px] border border-[var(--pending)] px-3 py-2 text-sm text-[var(--ink)]">
              <span className="font-semibold">Table manquante : </span>exécuter <code>supabase/{file}</code>
            </p>
          ) : state?.error ? (
            <p className="rounded-[5px] border border-[var(--late)] px-3 py-2 text-sm text-[var(--ink)]">
              <span className="font-semibold text-[var(--late)]">Erreur : </span>
              {state.message}
            </p>
          ) : (
            children
          )}
        </div>
      )}
    </section>
  );
}
