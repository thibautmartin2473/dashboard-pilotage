import { NextResponse } from 'next/server';
import { loadVaultGraph, loadVaultGraphUpdatedAt } from '@/lib/vault-graph';

// Lecture du graphe du vault pour le fond du Cadran (ConstellationFond). Protégée par le Basic Auth du
// site comme le reste (hors de /api/hooks et /api/public). Le client passe ?since=<updatedAt> : si le
// graphe n'a pas changé, on ne renvoie que {inchange:true} (une lecture de quelques octets en base au
// lieu des quelque 200 Ko du graphe).
export const dynamic = 'force-dynamic';

const SANS_CACHE = { 'Cache-Control': 'no-store' };

export async function GET(request) {
  const since = request.nextUrl.searchParams.get('since');
  if (since) {
    const courant = await loadVaultGraphUpdatedAt();
    if (courant && new Date(courant).getTime() === new Date(since).getTime()) {
      return NextResponse.json({ inchange: true }, { headers: SANS_CACHE });
    }
  }
  const graph = await loadVaultGraph();
  return NextResponse.json(graph ?? { vide: true }, { headers: SANS_CACHE });
}
