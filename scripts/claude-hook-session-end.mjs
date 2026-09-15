#!/usr/bin/env node
// Hook Claude Code (Stop/SessionEnd) — copié tel quel dans chaque dépôt suivi
// par le dashboard. Lit le payload du hook sur stdin, extrait un résumé et les
// fichiers modifiés depuis le transcript de la session, et poste le tout vers
// /api/hooks/session-end du dashboard.
//
// Variables d'environnement requises, à définir dans ".claude/hook.env" (à
// côté de ce script, gitignored — voir .claude/hook.env.example) :
//   DASHBOARD_URL              ex: https://dashboard-pilotage.vercel.app
//   HOOK_SECRET                doit correspondre à HOOK_SECRET côté dashboard
//   DASHBOARD_PROJECT_SLUG     ex: edhec-ai / stage / spircle
// Optionnelle :
//   DASHBOARD_EXPO_USED=1      à définir dans les repos Spircle qui utilisent Expo Go
//
// Si l'une des 3 variables requises manque, le script ne fait rien (ne bloque
// jamais la fin d'une session Claude Code).

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

loadLocalEnv(path.join(path.dirname(fileURLToPath(import.meta.url)), 'hook.env'));

function loadLocalEnv(envPath) {
  if (!existsSync(envPath)) return;
  let content;
  try {
    content = readFileSync(envPath, 'utf-8');
  } catch {
    return;
  }
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && !(key in process.env)) process.env[key] = value;
  }
}

async function main() {
  const raw = await readStdin();
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    payload = {};
  }

  const dashboardUrl = process.env.DASHBOARD_URL;
  const hookSecret = process.env.HOOK_SECRET;
  const projectSlug = process.env.DASHBOARD_PROJECT_SLUG;

  if (!dashboardUrl || !hookSecret || !projectSlug) {
    process.exit(0);
  }

  const { summary, filesTouched, startedAt, endedAt } = summarizeTranscript(payload.transcript_path);

  const body = {
    project_slug: projectSlug,
    summary,
    files_touched: filesTouched,
    started_at: startedAt,
    ended_at: endedAt,
    duration_seconds:
      startedAt && endedAt ? Math.max(0, Math.round((new Date(endedAt) - new Date(startedAt)) / 1000)) : null,
    expo_used: process.env.DASHBOARD_EXPO_USED === '1',
  };

  try {
    await fetch(`${dashboardUrl.replace(/\/$/, '')}/api/hooks/session-end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-hook-secret': hookSecret },
      body: JSON.stringify(body),
    });
  } catch {
    // jamais faire échouer la session Claude Code pour un problème réseau
  }

  process.exit(0);
}

function summarizeTranscript(transcriptPath) {
  if (!transcriptPath || !existsSync(transcriptPath)) {
    return { summary: null, filesTouched: [], startedAt: null, endedAt: null };
  }

  let lines;
  try {
    lines = readFileSync(transcriptPath, 'utf-8').split('\n').filter(Boolean);
  } catch {
    return { summary: null, filesTouched: [], startedAt: null, endedAt: null };
  }

  const filesTouched = new Set();
  let startedAt = null;
  let endedAt = null;
  let lastAssistantText = null;

  for (const line of lines) {
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }

    if (entry.timestamp) {
      if (!startedAt) startedAt = entry.timestamp;
      endedAt = entry.timestamp;
    }

    const content = entry.message?.content;
    if (!Array.isArray(content)) continue;

    for (const block of content) {
      if (block.type === 'tool_use' && ['Edit', 'Write', 'NotebookEdit'].includes(block.name)) {
        const filePath = block.input?.file_path || block.input?.notebook_path;
        if (filePath) filesTouched.add(filePath);
      }
      if (entry.message?.role === 'assistant' && block.type === 'text' && block.text?.trim()) {
        lastAssistantText = block.text.trim();
      }
    }
  }

  return {
    summary: lastAssistantText ? lastAssistantText.slice(0, 400) : null,
    filesTouched: [...filesTouched],
    startedAt,
    endedAt,
  };
}

function readStdin() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      resolve('{}');
      return;
    }
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data || '{}'));
    process.stdin.on('error', () => resolve('{}'));
  });
}

main();
