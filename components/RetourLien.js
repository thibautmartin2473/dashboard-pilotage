'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

// Lien « Retour » de la vue plein écran /constellation : il prend le focus à l'ouverture (React n'applique
// `autoFocus` qu'aux champs, pas aux liens), pour que le clavier arrive d'abord sur la sortie.
export default function RetourLien({ href, className, children }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <Link ref={ref} href={href} className={className}>
      {children}
    </Link>
  );
}
