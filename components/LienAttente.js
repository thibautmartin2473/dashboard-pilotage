'use client';

import { useLinkStatus } from 'next/link';

// Indicateur d'attente d'un lien : à poser À L'INTÉRIEUR d'un <Link> (useLinkStatus ne marche que dans un
// descendant). N'existe dans le DOM que pendant la navigation (`pending`), avec `data-pending` pour que le
// lien se mette en forme lui-même (`has-[[data-pending]]:...`). Sans pictogramme : une barre ou un point
// dessiné par `className` (couleur --action). Statique si prefers-reduced-motion (règle de app/globals.css).
export default function LienAttente({ className = '' }) {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return <span aria-hidden="true" data-pending="true" className={`attente-lien ${className}`} />;
}
