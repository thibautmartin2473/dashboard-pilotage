'use client';

import { useEffect } from 'react';
import { supabase, supabaseConfigured } from './supabase';

const WATCHED_TABLES = ['projects', 'project_repos', 'milestones', 'sessions', 'activity_signals'];

// S'abonne aux changements Postgres sur les tables du dashboard et déclenche
// `onChange` — la page se recharge côté client sans rechargement complet.
export function useRealtimeRefresh(onChange) {
  useEffect(() => {
    if (!supabaseConfigured) return undefined;

    const channel = supabase.channel('dashboard-changes');

    for (const table of WATCHED_TABLES) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        onChange();
      });
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
