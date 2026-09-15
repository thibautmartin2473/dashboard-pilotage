'use client';

import { useCallback, useState } from 'react';
import InteractionMap from './InteractionMap';
import { getAllProjects } from '@/lib/data';
import { useRealtimeRefresh } from '@/lib/useRealtimeRefresh';

export default function InteractionMapClient({ initialProjects }) {
  const [projects, setProjects] = useState(initialProjects);

  const refresh = useCallback(async () => {
    try {
      const fresh = await getAllProjects();
      setProjects(fresh);
    } catch {
      // on garde l'état précédent si le refetch échoue
    }
  }, []);

  useRealtimeRefresh(refresh);

  return <InteractionMap projects={projects} />;
}
