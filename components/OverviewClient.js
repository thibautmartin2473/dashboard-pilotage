'use client';

import { useCallback, useState } from 'react';
import ProjectCard from './ProjectCard';
import { getAllProjects } from '@/lib/data';
import { useRealtimeRefresh } from '@/lib/useRealtimeRefresh';

export default function OverviewClient({ initialProjects, compact = false }) {
  const [projects, setProjects] = useState(initialProjects);

  const refresh = useCallback(async () => {
    try {
      const fresh = await getAllProjects();
      setProjects(fresh);
    } catch (err) {
      // on laisse l'état précédent affiché si le refetch échoue
      console.error('overview refresh failed', err);
    }
  }, []);

  useRealtimeRefresh(refresh);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} compact={compact} />
      ))}
    </div>
  );
}
