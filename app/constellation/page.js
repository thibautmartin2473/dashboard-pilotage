import Link from 'next/link';
import Constellation from '@/components/Constellation';
import { loadVaultGraph } from '@/lib/vault-graph';

// Vue plein écran de la Constellation (graphe du vault) : zoom, glisser, survol qui allume les voisins,
// clic qui ouvre la note dans Obsidian. Le graphe est lu côté serveur ; null tant que rien n'a été envoyé.
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Constellation' };

export default async function ConstellationPage() {
  const graph = await loadVaultGraph();
  return (
    <div className="fixed inset-0 z-50 bg-[#1E2433]">
      <Constellation graph={graph} mode="plein" />
      <Link
        href="/"
        className="absolute left-4 top-3 rounded-md bg-[#252C3D]/90 px-3 py-1.5 text-sm text-[#DCE6F4] hover:bg-[#2E374C]"
      >
        Retour au Cadran
      </Link>
    </div>
  );
}
