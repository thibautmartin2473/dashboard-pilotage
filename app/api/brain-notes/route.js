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

const MAX_CONTENT_LENGTH = 4000;
const MAX_PENDING_NOTES = 200;

// POST est appelé cross-origin depuis des Artifacts Claude publics (Tour de
// Contrôle, Spircle Control) sans authentification possible — un secret ici
// serait visible dans le code source de l'artifact, donc pas une vraie
// protection. On borne plutôt la taille et le volume de notes en attente
// pour limiter l'abus (flood, coût Supabase), et on renvoie corsHeaders sur
// TOUTES les réponses (pas seulement le succès) pour que l'artifact puisse
// lire le message d'erreur réel au lieu d'un échec CORS opaque.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400, headers: corsHeaders });
  }

  const { content, project_slug } = body;
  const trimmed = typeof content === 'string' ? content.trim() : '';
  if (!trimmed) {
    return NextResponse.json({ error: 'content is required' }, { status: 400, headers: corsHeaders });
  }
  if (trimmed.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json(
      { error: `content too long (max ${MAX_CONTENT_LENGTH} chars)` },
      { status: 413, headers: corsHeaders }
    );
  }

  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 503, headers: corsHeaders });
  }

  const { count, error: countError } = await supabaseAdmin
    .from('brain_notes')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'new');

  if (countError) return NextResponse.json({ error: countError.message }, { status: 500, headers: corsHeaders });
  if ((count ?? 0) >= MAX_PENDING_NOTES) {
    return NextResponse.json(
      { error: 'too many pending notes, triage some first' },
      { status: 429, headers: corsHeaders }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('brain_notes')
    .insert({ content: trimmed, project_slug: project_slug || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });

  return NextResponse.json({ note: data }, { headers: corsHeaders });
}

// Appelée par le navigateur avant le POST cross-origin depuis un Artifact
// Claude (Tour de Contrôle, Spircle Control).
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
