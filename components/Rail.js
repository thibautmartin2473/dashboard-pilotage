import { getAllProjects, projectStatus } from '@/lib/data';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { categoryOf, resolveCategories, todayParis } from '@/lib/home';
import RailClient from './RailClient';

const TZ = 'Europe/Paris';

// Minutes depuis minuit, heure de Paris.
function minutesParis(date) {
  const parts = new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  return get('hour') * 60 + get('minute');
}

// Journée du symbole « vivant » : plages et tâches d'aujourd'hui (minutes depuis minuit, Paris), lues dans
// calendar_events, plus l'heure serveur (le client recalcule « maintenant » à l'affichage). Lecture seule.
async function loadDay(now) {
  const today = todayParis(now);
  const db = getSupabaseAdmin();
  const from = new Date(now.getTime() - 36 * 3600 * 1000).toISOString();
  const to = new Date(now.getTime() + 36 * 3600 * 1000).toISOString();
  const [{ data: events, error }, { data: settings }] = await Promise.all([
    db.from('calendar_events').select('starts_at, ends_at, all_day, color_id').gte('starts_at', from).lte('starts_at', to).order('starts_at'),
    db.from('dashboard_settings').select('value').eq('key', 'agenda_categories'),
  ]);
  if (error) throw error;
  const categories = resolveCategories(settings?.[0]?.value);
  const plages = [];
  const taches = [];
  for (const e of events ?? []) {
    if (e.all_day || !e.starts_at) continue;
    const start = new Date(e.starts_at);
    if (start.toLocaleDateString('en-CA', { timeZone: TZ }) !== today) continue;
    const s = minutesParis(start);
    const end = e.ends_at ? new Date(e.ends_at) : null;
    const sameDay = end && end.toLocaleDateString('en-CA', { timeZone: TZ }) === today;
    const eMin = sameDay ? minutesParis(end) : end ? 1440 : s + 30;
    (categoryOf(categories, e.color_id).kind === 'tache' ? taches : plages).push([s, Math.max(eMin, s + 15)]);
  }
  return { plages, taches };
}

// Rail latéral : projets, apps et journée viennent de la base (lecture seule), le reste est dans le composant client.
export default async function Rail() {
  // Trois lectures indépendantes : l'échec de l'une (table absente, clé manquante) ne vide pas les autres.
  const [projects, apps, day] = await Promise.all([
    (async () => {
      try {
        const all = await getAllProjects();
        return (all ?? []).map((p) => ({ id: p.id, slug: p.slug, name: p.name, status: projectStatus(p) }));
      } catch {
        return [];
      }
    })(),
    (async () => {
      try {
        const { data } = await getSupabaseAdmin().from('app_links').select('id, name, url, project_slug').order('position').order('created_at');
        return data ?? [];
      } catch {
        return [];
      }
    })(),
    // Sans événements : l'anneau et l'aiguille restent affichés.
    loadDay(new Date()).catch(() => ({ plages: [], taches: [] })),
  ]);

  return <RailClient projects={projects} apps={apps} day={day} />;
}
