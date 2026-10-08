'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ETAT_INITIAL, estSaisie, suite } from '@/lib/nav-shortcuts';

// Raccourcis « g puis une lettre » (g c Cockpit, g a Agenda, g m Mails, g r À ranger, g i Idées, g v
// Constellation). Un seul écouteur, monté dans le layout racine : actif sur toutes les pages. La logique (séquence,
// délai d'une seconde, garde de saisie) est dans lib/nav-shortcuts.js. Écoute en phase de CAPTURE : la lettre
// qui suit `g` est consommée ici et n'atteint pas les gestes de « À ranger » (V A C S P). Inactif pendant une
// saisie, avec Ctrl/Meta/Alt, et tant qu'un dialogue est ouvert (palette Ctrl+K, rangement forcé, tiroir du rail,
// détail d'un bloc de l'agenda).
const DIALOGUE = '[role="dialog"], [aria-modal="true"], [data-testid="event-detail"]';

export default function NavShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const routeur = useRef(router);
  const chemin = useRef(pathname);
  useEffect(() => {
    routeur.current = router;
    chemin.current = pathname;
  });

  useEffect(() => {
    let etat = ETAT_INITIAL;
    const surTouche = (event) => {
      const r = suite(
        etat,
        {
          key: event.key,
          ctrl: event.ctrlKey,
          meta: event.metaKey,
          alt: event.altKey,
          repeat: event.repeat,
          saisie: estSaisie(event.target) || estSaisie(document.activeElement),
          dialogue: Boolean(document.querySelector(DIALOGUE)),
        },
        performance.now(),
      );
      etat = r.etat;
      if (r.consommer) {
        event.preventDefault();
        event.stopPropagation();
      }
      if (r.href && r.href !== chemin.current) routeur.current.push(r.href);
    };
    window.addEventListener('keydown', surTouche, true);
    return () => window.removeEventListener('keydown', surTouche, true);
  }, []);

  return null;
}
