import Constellation from '@/components/Constellation';
import RetourLien from '@/components/RetourLien';
import { loadVaultGraph } from '@/lib/vault-graph';

// Vue plein écran de la Constellation (graphe du vault) : zoom, glisser, survol qui allume les voisins,
// clic qui ouvre la note dans Obsidian. Le graphe est lu côté serveur ; null tant que rien n'a été envoyé.
// La vue recouvre tout : le rail n'y est pas rendu (components/RailClient.js) et le lien Retour prend le focus
// en premier. Le graphe se manipule à la souris ou au doigt, sans équivalent clavier : le texte le dit.
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Constellation' };

export default async function ConstellationPage() {
  const graph = await loadVaultGraph();
  return (
    <div className="fixed inset-0 z-50 bg-[#1E2433]">
      <Constellation graph={graph} mode="plein" />
      <div className="pointer-events-none absolute left-4 top-3 flex max-w-[calc(100%-2rem)] flex-wrap items-center gap-x-4 gap-y-2 sm:max-w-[60%]">
        <RetourLien
          href="/"
          className="pointer-events-auto rounded-md bg-[#252C3D]/90 px-3 py-1.5 text-sm text-[#DCE6F4] hover:bg-[#2E374C]"
        >
          Retour au Cadran
        </RetourLien>
        <p className="text-sm text-[#C9D3E6]">
          Le graphe se manipule à la souris ou au doigt : molette ou pincement pour zoomer, glisser pour se déplacer,
          clic sur un point pour ouvrir la note dans Obsidian. Il n&apos;a pas d&apos;équivalent au clavier.
        </p>
      </div>
    </div>
  );
}
