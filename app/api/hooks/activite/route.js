import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { lirePayload } from '@/lib/activite';

// Appelée par le hook global Systeme/Hooks/activite-jour (UserPromptSubmit et Stop, toutes les sessions
// Claude Code du PC). Même garde que les autres hooks : HOOK_SECRET en x-hook-secret ou Authorization: Bearer.
const MAX_BYTES = 8 * 1024;

function secretOk(given, expected) {
  if (!expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request) {
  const bearer = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const secret = request.headers.get('x-hook-secret') || bearer;
  if (!secretOk(secret, process.env.HOOK_SECRET)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const raw = await request.text();
  if (Buffer.byteLength(raw) > MAX_BYTES) {
    return NextResponse.json({ error: 'payload too large' }, { status: 413 });
  }
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const lu = lirePayload(body);
  if (!lu.ok) return NextResponse.json({ error: lu.erreur }, { status: 400 });

  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 503 });
  }

  const { error } = await supabaseAdmin.rpc('activite_noter', lu.valeur);
  if (error) {
    // Fonction ou tables absentes : supabase/activite-jour.sql pas encore exécuté.
    const status = /activite_noter|does not exist|schema cache/i.test(error.message) ? 503 : 500;
    return NextResponse.json({ error: error.message, hint: status === 503 ? 'exécuter supabase/activite-jour.sql' : undefined }, { status });
  }
  return NextResponse.json({ ok: true });
}
