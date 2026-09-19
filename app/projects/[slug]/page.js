import { notFound } from 'next/navigation';
import ProjectDetailClient from '@/components/ProjectDetailClient';
import { getProjectBySlug } from '@/lib/data';

export default async function ProjectPage({ params }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) notFound();

  // key={slug} force un remount complet au changement de projet — sans ça,
  // React réutilise l'instance (back/forward entre deux pages projet) et
  // useState(initialProject) garde l'ancien projet affiché.
  return <ProjectDetailClient key={slug} initialProject={project} />;
}
