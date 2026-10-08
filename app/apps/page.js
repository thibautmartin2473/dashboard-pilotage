import AppsPanel from '@/components/AppsPanel';
import { getAllProjects, projectStatus } from '@/lib/data';
import { loadHomePanels } from '@/lib/home-data';

// Édition des apps et des projets (carrés du rail) : ajouter, renommer, ordonner, supprimer.
export const dynamic = 'force-dynamic';

export default async function AppsPage() {
  const [projects, { apps }] = await Promise.all([getAllProjects(), loadHomePanels()]);
  const slim = projects.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    done: p.milestones.filter((m) => m.status === 'done').length,
    total: p.milestones.length,
    status: projectStatus(p),
  }));
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-4 text-lg font-semibold tracking-tight">Apps et projets</h1>
      <AppsPanel apps={apps.data} state={apps} projects={slim} />
    </main>
  );
}
