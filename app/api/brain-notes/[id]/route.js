import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const STATUSES = ['new', 'triaged', 'done'];

// Appelée par claude.brain/pull-notes.mjs (via une session Claude Code
// locale) après avoir rangé la note au bon endroit — même secret que
// GET /api/brain-notes, car appelée depuis une machine externe.
export async function PATCH(request, { params }) {
  const secret = request.headers.get('x-hook-secret');
  if (!process.env.HOOK_SECRET || secret !== process.env.HOOK_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const { status, triaged_to } = body;
  if (!STATUSES.includes(status)) {
    return NextResponse.json({ error: 'invalid status' }, { status: 400 });
  }

  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 503 });
  }

  const { data, error } = await supabaseAdmin
    .from('brain_notes')
    .update({ status, triaged_to: triaged_to ?? null, triaged_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ note: data });
}
