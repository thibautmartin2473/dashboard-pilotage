'use client';

import { useEffect, useRef } from 'react';
import { supabase, supabaseConfigured } from './supabase';

const WATCHED_TABLES = ['projects', 'project_repos', 'milestones', 'sessions', 'activity_signals'];

// S'abonne aux changements Postgres sur les tables du dashboard et déclenche
// `onChange` — la page se recharge côté client sans rechargement complet.
export function useRealtimeRefresh(onChange) {
  // Le callback est lu depuis une ref (toujours à jour) plutôt que capturé
  // dans la closure de l'effet : garde l'effet à deps `[]` (un seul channel
  // par montage) sans dépendre de chaque appelant pour mémoriser `onChange`
  // correctement (ex: si un futur appelant le recalcule par render).
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (!supabaseConfigured) return undefined;

    const channel = supabase.channel('dashboard-changes');

    for (const table of WATCHED_TABLES) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        onChangeRef.current();
      });
    }

    channel.subscribe((status) => {
      if (status !== 'SUBSCRIBED' && status !== 'CLOSED') {
        console.warn(`[useRealtimeRefresh] channel status: ${status}`);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
