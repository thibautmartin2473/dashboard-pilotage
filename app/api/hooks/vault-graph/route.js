import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// Appelée par le plugin Obsidian « Constellation vers Cockpit » à chaque changement du vault
// (anti-rebond de 5 s côté plugin). Même garde que /api/hooks/session-end : secret partagé
// HOOK_SECRET, accepté en x-hook-secret ou en Authorization: Bearer.
const MAX_NODES = 5000;
const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(request) {
  const bearer = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const secret = request.headers.get('x-hook-secret') || bearer;
  if (!process.env.HOOK_SECRET || secret !== process.env.HOOK_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BYTES) {
    return NextResponse.json({ error: 'payload too large' }, { status: 413 });
  }

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const { nodes, links } = body || {};
  if (!Array.isArray(nodes) || !Array.isArray(links)) {
    return NextResponse.json({ error: 'nodes and links arrays are required' }, { status: 400 });
  }
  if (nodes.length > MAX_NODES) {
    return NextResponse.json({ error: 'too many nodes' }, { status: 413 });
  }

  // On ne garde que les champs du contrat, et des liens valides.
  const cleanNodes = nodes.map((n, i) => ({
    id: i,
    path: String(n?.path ?? ''),
    name: String(n?.name ?? ''),
    group: String(n?.group ?? ''),
    type: String(n?.type ?? 'Note'),
    degree: Number.isFinite(n?.degree) ? n.degree : 0,
  }));
  const cleanLinks = links.filter(
    l => Array.isArray(l) && l.length === 2 && l.every(x => Number.isInteger(x) && x >= 0 && x < cleanNodes.length)
  );

  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 503 });
  }

  const { error } = await supabaseAdmin
    .from('vault_graph')
    .upsert({ id: 'vault', nodes: cleanNodes, links: cleanLinks, updated_at: new Date().toISOString() });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, nodes: cleanNodes.length, links: cleanLinks.length });
}
