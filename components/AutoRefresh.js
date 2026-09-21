'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Garde téléphone et PC synchrones : rafraîchit les données du serveur au retour
// sur l'onglet et toutes les 60 s tant que la page est visible. Les tables
// personnelles n'ont pas de realtime (aucune policy anon), d'où ce sondage.
export default function AutoRefresh() {
  const router = useRouter();
  useEffect(() => {
    let last = Date.now();
    const refresh = () => {
      // visibilitychange et focus arrivent ensemble : un seul rafraîchissement.
      if (document.visibilityState !== 'visible' || Date.now() - last < 2000) return;
      last = Date.now();
      router.refresh();
    };
    const timer = setInterval(refresh, 60_000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [router]);
  return null;
}
