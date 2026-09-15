import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// Appelée par scripts/claude-hook-session-end.mjs (copié dans chacun des dépôts
// via un hook Claude Code Stop/SessionEnd). Protégée par un secret partagé
// plutôt que par la clé service_role Supabase, pour ne pas distribuer cette
// dernière dans plusieurs dépôts de code.
export async function POST(request) {
  const secret = request.headers.get('x-hook-secret');
  if (!process.env.HOOK_SECRET || secret !== process.env.HOOK_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const {
    project_slug,
    summary,
    files_touched,
    started_at,
    ended_at,
    duration_seconds,
    milestone_updates,
    expo_used,
  } = body;

  if (!project_slug) {
    return NextResponse.json({ error: 'project_slug is required' }, { status: 400 });
  }

  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 503 });
  }

  const { data: project, error: projectError } = await supabaseAdmin
    .from('projects')
    .select('id')
    .eq('slug', project_slug)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: 'unknown project_slug' }, { status: 404 });
  }

  const nowIso = new Date().toISOString();

  const { error: sessionError } = await supabaseAdmin.from('sessions').insert({
    project_id: project.id,
    started_at: started_at ?? nowIso,
    ended_at: ended_at ?? nowIso,
    summary: summary ?? null,
    files_touched: files_touched ?? [],
    duration_seconds: duration_seconds ?? null,
  });

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  await supabaseAdmin.from('activity_signals').upsert(
    {
      project_id: project.id,
      source: 'claude_code',
      last_seen_at: nowIso,
      detail: summary ?? null,
    },
    { onConflict: 'project_id,source' }
  );

  if (expo_used) {
    await supabaseAdmin.from('activity_signals').upsert(
      {
        project_id: project.id,
        source: 'expo',
        last_seen_at: nowIso,
        detail: 'Expo Go utilisé pendant la session',
      },
      { onConflict: 'project_id,source' }
    );
  }

  if (Array.isArray(milestone_updates)) {
    for (const update of milestone_updates) {
      if (!update?.label || !update?.status) continue;
      await supabaseAdmin
        .from('milestones')
        .update({ status: update.status, updated_by: 'hook', updated_at: nowIso })
        .eq('project_id', project.id)
        .eq('label', update.label);
    }
  }

  return NextResponse.json({ ok: true });
}
