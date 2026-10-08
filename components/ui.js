'use client';

// Briques d'interface partagées : tout le site les utilise, un relooking se fait
// ici et nulle part ailleurs. Boutons façon Apple (components/keys.css), cartes blanches à 75 %.

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { lastSync } from '@/lib/home';
import { timeAgo } from '@/lib/format';
import LienAttente from './LienAttente';
import { CARD } from './card';
import './keys.css';

// Champs : contour --line-strong (3:1), 32 px de haut (44 px au doigt), anneau de focus --focus.
const FIELD =
  'min-h-8 rounded-lg border border-[var(--line-strong)] bg-[var(--field-bg)] px-2.5 py-1 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--focus)] [@media(pointer:coarse)]:min-h-11';

export const fieldClass = FIELD;
export const mutedClass = 'tabular font-mono text-xs text-[var(--ink-muted)]';

// Classes d'un bouton (components/keys.css) pour ceux qui ne passent pas par <Button> (liste de blocs,
// ligne cliquable...). level : primary | secondary | tertiary (trois niveaux au plus) ;
// tone : neutral | late (texte corail foncé pour Supprimer ; les autres tons n'ont plus de style).
export function keyClass({ level = 'secondary', tone = 'neutral', icon = false } = {}) {
  return [
    'key',
    level === 'primary' && 'key--primary',
    level === 'tertiary' && 'key--tertiary',
    tone === 'late' && 'key--late',
    icon && 'key--icon',
  ]
    .filter(Boolean)
    .join(' ');
}

// Infobulle d'un bouton à raccourci clavier : « Valider (V) ». Un titre déjà posé (raison d'un bouton
// désactivé) passe avant.
export function shortcutTitle(label, kbd, title) {
  if (title) return title;
  if (!kbd) return undefined;
  return label ? `${label} (${kbd})` : `Raccourci : ${kbd}`;
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
    <p role="alert" className="text-sm text-[var(--late-text)]">
      <span className="font-semibold">Erreur : </span>
      {error}
    </p>
  ) : null;
}

// Bouton façon Apple. `level` : primary (un par zone) | secondary | tertiary ;
// `tone` : late pour Supprimer ; `kbd` : lettre de raccourci, indiquée au survol (title) et aux lecteurs d'écran.
export function Button({ level = 'secondary', tone = 'neutral', kbd, className = '', type = 'button', title, children, ...props }) {
  return (
    <button
      type={type}
      className={`${keyClass({ level, tone })} ${className}`}
      title={shortcutTitle(typeof children === 'string' ? children : '', kbd, title)}
      aria-keyshortcuts={kbd}
      {...props}
    >
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

// Cadre de tous les panneaux : une carte blanche à 75 % (laisse voir le fond), titre en tête, corps
// séparé par un filet. `state` = résultat { error, message } d'une lecture en échec : on l'affiche à la place du
// contenu, jamais une liste vide. `fill` : le panneau remplit la hauteur de sa case et son corps défile à
// l'intérieur (page « tout sur un écran ») ; `bodyClassName` remplace le corps par défaut (marges, défilement).
// Titre d'une zone du Cockpit : lien discret vers sa vue plein écran (/agenda, /a-ranger, /mails).
export function FocusTitle({ href, children }) {
  return (
    <Link
      href={href}
      title="Ouvrir en plein écran"
      className="relative rounded-md hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
    >
      {children}
      {/* Barre fine sous le titre pendant la navigation (useLinkStatus). */}
      <LienAttente className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-[var(--action)]" />
    </Link>
  );
}

export function Panel({ title, titleHref, count, state, file, className = '', bodyClassName, fill = false, children }) {
  const body = bodyClassName ?? (fill ? 'min-h-0 flex-1 overflow-y-auto p-3' : 'p-4');
  return (
    <section className={`flex flex-col overflow-hidden ${CARD} ${fill ? 'min-h-0' : ''} ${className}`}>
      <h2 className="flex min-h-10 shrink-0 items-center gap-2 border-b border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink)]">
        <span className="min-w-0 flex-1 truncate">{titleHref ? <FocusTitle href={titleHref}>{title}</FocusTitle> : title}</span>
        {count != null && !state?.error && (
          <span className="tabular rounded-full bg-[var(--btn-fill)] px-2 py-0.5 text-xs font-normal text-[var(--ink)]">
            {count}
          </span>
        )}
      </h2>
      <div className={body}>
        {state?.error === 'missing' ? (
          <p className="rounded-lg border border-[var(--pending)] px-3 py-2 text-sm text-[var(--ink)]">
            <span className="font-semibold">Table manquante : </span>exécuter <code>supabase/{file}</code>
          </p>
        ) : state?.error ? (
          <p className="rounded-lg border border-[var(--late)] px-3 py-2 text-sm text-[var(--ink)]">
            <span className="font-semibold text-[var(--late-text)]">Erreur : </span>
            {state.message}
          </p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
