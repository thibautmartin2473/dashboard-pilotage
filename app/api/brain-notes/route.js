import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { corsHeaders } from '@/lib/cors';

// GET est appelé par le script local claude.brain/pull-notes.mjs (protégé
// par le même secret que le hook de fin de session, car il lit des notes
// personnelles depuis une machine externe).
export async function GET(request) {
  const secret = request.headers.get('x-hook-secret');
  if (!process.env.HOOK_SECRET || secret !== process.env.HOOK_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get('status');

  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 503 });
  }

  let query = supabaseAdmin.from('brain_notes').select('*').order('created_at', { ascending: true });
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ notes: data ?? [] });
}

// POST est appelé depuis l'UI du dashboard (même origine, pas de secret
// requis — même logique que PATCH /api/milestones/[id]).
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const { content, project_slug } = body;
  if (!content || !content.trim()) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 503 });
  }

  const { data, error } = await supabaseAdmin
    .from('brain_notes')
    .insert({ content: content.trim(), project_slug: project_slug || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ note: data }, { headers: corsHeaders });
}

// Appelée par le navigateur avant le POST cross-origin depuis un Artifact
// Claude (Tour de Contrôle, Spircle Control).
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
