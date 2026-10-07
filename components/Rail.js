import { getAllProjects } from '@/lib/data';
import RailClient from './RailClient';

// Rail latéral : la liste des projets vient de la base, le reste est dans le composant client.
export default async function Rail() {
  let projects = [];
  try {
    const all = await getAllProjects();
    projects = (all ?? []).map((p) => ({ slug: p.slug, name: p.name }));
  } catch {
    projects = [];
  }
  return <RailClient projects={projects} />;
}
