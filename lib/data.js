import { supabase, supabaseConfigured } from './supabase';
import { MOCK_PROJECTS, getMockProject } from './mock-data';

// Couche d'accès aux données : lit Supabase quand il est configuré, sinon
// retombe sur les données de démo (lib/mock-data.js) pour que le site reste
// utilisable avant la création du projet Supabase dédié.

function throwFirst(...errors) {
  const first = errors.find(Boolean);
  if (first) throw first;
}

export async function getAllProjects() {
  if (!supabaseConfigured) return MOCK_PROJECTS;

  const [
    { data: projects, error: projectsError },
    { data: repos, error: reposError },
    { data: milestones, error: milestonesError },
    { data: sessions, error: sessionsError },
    { data: signals, error: signalsError },
  ] = await Promise.all([
    supabase.from('projects').select('*').order('name'),
    supabase.from('project_repos').select('*'),
    supabase.from('milestones').select('*').order('position'),
    supabase.from('sessions').select('*').order('started_at', { ascending: false }),
    supabase.from('activity_signals').select('*'),
  ]);

  // Un throw ici plutôt qu'un `?? []` silencieux : sinon une requête en
  // échec (RLS, colonne renommée, pool épuisé) devient indiscernable d'un
  // projet qui n'a vraiment aucun repo/jalon/session.
  throwFirst(projectsError, reposError, milestonesError, sessionsError, signalsError);

  return (projects ?? []).map((project) => hydrateProject(project, { repos, milestones, sessions, signals }));
}

export async function getProjectBySlug(slug) {
  if (!supabaseConfigured) return getMockProject(slug);

  const { data: project, error } = await supabase.from('projects').select('*').eq('slug', slug).single();
  // PGRST116 = "0 rows" (single() sur une requête vide) : vrai 404.
  // Toute autre erreur (RLS, panne réseau, colonne renommée) doit remonter
  // plutôt que de se faire passer pour un projet inexistant.
  if (error && error.code !== 'PGRST116') throw error;
  if (!project) return null;

  const [
    { data: repos, error: reposError },
    { data: milestones, error: milestonesError },
    { data: sessions, error: sessionsError },
    { data: signals, error: signalsError },
  ] = await Promise.all([
    supabase.from('project_repos').select('*').eq('project_id', project.id),
    supabase.from('milestones').select('*').eq('project_id', project.id).order('position'),
    supabase.from('sessions').select('*').eq('project_id', project.id).order('started_at', { ascending: false }),
    supabase.from('activity_signals').select('*').eq('project_id', project.id),
  ]);

  throwFirst(reposError, milestonesError, sessionsError, signalsError);

  return {
    ...project,
    repos: repos ?? [],
    milestones: milestones ?? [],
    sessions: sessions ?? [],
    activity_signals: signals ?? [],
  };
}

function hydrateProject(project, { repos, milestones, sessions, signals }) {
  return {
    ...project,
    repos: (repos ?? []).filter((r) => r.project_id === project.id),
    milestones: (milestones ?? []).filter((m) => m.project_id === project.id),
    sessions: (sessions ?? []).filter((s) => s.project_id === project.id),
    activity_signals: (signals ?? []).filter((a) => a.project_id === project.id),
  };
}

export function lastActivityAt(project) {
  const timestamps = (project.activity_signals ?? [])
    .map((s) => s.last_seen_at)
    .filter(Boolean)
    .map((t) => new Date(t).getTime());
  if (timestamps.length === 0) return null;
  return new Date(Math.max(...timestamps)).toISOString();
}

export function projectStatus(project) {
  const statuses = (project.milestones ?? []).map((m) => m.status);
  if (statuses.length === 0) return 'todo';
  if (statuses.includes('blocked')) return 'blocked';
  if (statuses.every((s) => s === 'done')) return 'done';
  if (statuses.some((s) => s === 'in_progress' || s === 'done')) return 'in_progress';
  return 'todo';
}
