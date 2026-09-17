import { NextResponse } from 'next/server';
import { getAllProjects, projectStatus, lastActivityAt } from '@/lib/data';
import { corsHeaders } from '@/lib/cors';

// Endpoint public (pas de secret) : statut agrégé des projets, lu depuis
// Tour de Contrôle (Artifact Claude) pour la vue fusionnée vie + projets.
// Rien de sensible ici — pas de fichiers touchés, pas de contenu de notes.
export async function GET() {
  const projects = await getAllProjects();

  const summary = projects.map((project) => {
    const sessions = (project.sessions ?? [])
      .slice()
      .sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
    const lastSession = sessions[0];

    return {
      slug: project.slug,
      name: project.name,
      status: projectStatus(project),
      last_activity_at: lastActivityAt(project),
      recent_summary: lastSession?.summary ?? null,
      milestones: (project.milestones ?? [])
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((m) => ({ label: m.label, status: m.status })),
    };
  });

  return NextResponse.json({ projects: summary }, { headers: corsHeaders });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
