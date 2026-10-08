import 'server-only';
import { getAllProjects, projectStatus } from './data';
import { loadHomePanels } from './home-data';
import { buildWeek, resolveCategories, resolveKindOverrides, todayParis } from './home';
import { buildRangerItems } from './ranger';

// Chargement partagé par le Cockpit (`/`) et ses vues plein écran (`/agenda`, `/a-ranger`, `/mails`) : une seule
// logique pour les panneaux, les catégories, la frise de l'agenda et la liste « À ranger », pour que les quatre
// pages restent d'accord (compteurs du bandeau « Maintenant », mêmes suggestions).
// `projects: false` évite de lire les projets quand la page n'affiche pas leurs noms (agenda, mails) ; la liste
// « À ranger » sert alors seulement à compter (bandeau « Maintenant »).
export async function loadCockpitData({ projects: withProjects = true } = {}) {
  const [projects, panels] = await Promise.all([withProjects ? getAllProjects() : [], loadHomePanels()]);
  const { tasks, ideas, events, mails, settings, notifications, done, ranger } = panels;
  const now = new Date();
  const today = todayParis(now);
  const setting = (key) => settings.data?.find((row) => row.key === key)?.value;
  const categories = resolveCategories(setting('agenda_categories'));
  const kindOverrides = resolveKindOverrides(setting('agenda_kind_overrides')); // types de blocs choisis à la main
  const week = events.data ? buildWeek(events.data, now, categories, 0, undefined, kindOverrides) : null;
  // Tâches reportées (« Plus tard », jour futur) : ni dans la fenêtre Commande ni dans l'agenda avant leur jour.
  // La liste « À ranger » reçoit tout : elle gère elle-même les reports (lib/ranger.js).
  const allTasks = tasks.data ?? [];
  const activeTasks = allTasks.filter((t) => !(t.snoozed_until && t.snoozed_until > today));

  // Données publiques des projets, allégées pour le client (les sessions n'ont rien à faire dans les props).
  const slim = projects.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    done: p.milestones.filter((m) => m.status === 'done').length,
    total: p.milestones.length,
    status: projectStatus(p),
  }));

  // Liste « À ranger » : tâches sans bloc à venir, idées, propositions des mails (lib/ranger.js).
  const list = buildRangerItems({
    tasks: allTasks,
    ideas: ideas.data ?? [],
    notifications: notifications.data ?? [],
    events: events.data ?? [],
    categories,
    now,
    projectNames: Object.fromEntries(slim.map((p) => [p.slug, p.name])),
  });
  const problems = [
    tasks.error && 'Tâches indisponibles',
    ideas.error && 'Idées indisponibles',
    events.error && 'Agenda indisponible : les suggestions de blocs sont limitées',
    notifications.error === 'error' && 'Propositions des mails indisponibles',
  ].filter(Boolean);

  return {
    now,
    today,
    tasks,
    ideas,
    events,
    mails,
    done,
    ranger,
    categories,
    kindOverrides,
    week,
    allTasks,
    activeTasks,
    list,
    problems,
    lateCount: list.items.filter((i) => i.isDue).length,
  };
}
