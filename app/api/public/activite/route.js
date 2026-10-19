import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { lignesEvenements, lignesSessions, lireDepuis } from '@/lib/activite';

// Lecture de l'activité du jour pour l'artifact « Ma journée » (connecteur Vercel, qui ne sait pas envoyer
// de Basic Auth ni d'en-tête : d'où la clé en paramètre, ACTIVITE_CLE, distincte de HOOK_SECRET qui écrit).
// GET /api/public/activite?cle=...&depuis=<ISO avec fuseau>&vue=sessions|evenements
// Renvoie { rows: [...] } : titres de session, thèmes, heures. Jamais le contenu des messages.
export const dynamic = 'force-dynamic';

const MAX_EVENEMENTS = 5000;

function cleOk(given, expected) {
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const json = (body, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  if (!process.env.ACTIVITE_CLE) return json({ error: 'ACTIVITE_CLE non définie sur Vercel' }, 503);
  if (!cleOk(params.get('cle') || '', process.env.ACTIVITE_CLE)) return json({ error: 'unauthorized' }, 401);

  const depuis = lireDepuis(params.get('depuis'));
  const vue = params.get('vue') === 'evenements' ? 'evenements' : 'sessions';

  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (err) {
    return json({ error: err.message }, 503);
  }

  const { data: evenements, error: e1 } = await supabaseAdmin
    .from('activite_evenements')
    .select('session_id, at, evenement')
    .gte('at', depuis.toISOString())
    .order('at', { ascending: true })
    .limit(MAX_EVENEMENTS);
  if (e1) return json({ error: e1.message }, 500);

  const ids = [...new Set(evenements.map((e) => e.session_id))];
  let sessions = [];
  if (ids.length) {
    const { data, error: e2 } = await supabaseAdmin
      .from('activite_sessions')
      .select('session_id, titre, dossier, routine')
      .in('session_id', ids);
    if (e2) return json({ error: e2.message }, 500);
    sessions = data;
  }

  const rows = vue === 'evenements' ? lignesEvenements(sessions, evenements) : lignesSessions(sessions, evenements);
  return json({ depuis: depuis.toISOString(), cut: evenements.length >= MAX_EVENEMENTS, rows });
}
