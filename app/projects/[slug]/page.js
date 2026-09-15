import { notFound } from 'next/navigation';
import ProjectDetailClient from '@/components/ProjectDetailClient';
import { getProjectBySlug } from '@/lib/data';

export default async function ProjectPage({ params }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) notFound();

  return <ProjectDetailClient initialProject={project} />;
}
