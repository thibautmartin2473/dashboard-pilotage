import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// Appelée par Vercel Cron (voir vercel.json). Rafraîchit activity_signals à
// partir des API GitHub (commits) et Vercel (deployments) pour chaque ligne
// de project_repos.
export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 503 });
  }

  const { data: repos, error } = await supabaseAdmin
    .from('project_repos')
    .select('id, project_id, kind, ref, label');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = [];

  for (const repo of repos ?? []) {
    try {
      const signal =
        repo.kind === 'github' ? await fetchGithubSignal(repo) : repo.kind === 'vercel' ? await fetchVercelSignal(repo) : null;

      if (signal) {
        await supabaseAdmin.from('activity_signals').upsert(
          {
            project_id: repo.project_id,
            source: repo.kind,
            last_seen_at: signal.last_seen_at,
            detail: signal.detail,
          },
          { onConflict: 'project_id,source' }
        );
      }

      results.push({ repo: repo.label ?? repo.ref, ok: true });
    } catch (err) {
      results.push({ repo: repo.label ?? repo.ref, ok: false, error: err.message });
    }
  }

  return NextResponse.json({ results });
}

async function fetchGithubSignal(repo) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN missing');

  const res = await fetch(`https://api.github.com/repos/${repo.ref}/commits?per_page=1`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`GitHub API ${res.status}`);

  const commits = await res.json();
  const latest = commits[0];
  if (!latest) return null;

  return {
    last_seen_at: latest.commit.author.date,
    detail: latest.commit.message.split('\n')[0],
  };
}

async function fetchVercelSignal(repo) {
  const token = process.env.VERCEL_TOKEN;
  if (!token) throw new Error('VERCEL_TOKEN missing');

  const res = await fetch(`https://api.vercel.com/v6/deployments?projectId=${repo.ref}&limit=1`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`Vercel API ${res.status}`);

  const json = await res.json();
  const latest = json.deployments?.[0];
  if (!latest) return null;

  return {
    last_seen_at: new Date(latest.createdAt).toISOString(),
    detail: `${latest.state ?? latest.readyState ?? 'unknown'}${latest.name ? ` — ${latest.name}` : ''}`,
  };
}
