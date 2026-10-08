// Logos et pastilles des apps, partagés par la grille « Mes apps » (components/AppsPanel.js) et par le
// rail (components/RailClient.js). Pur, sans accès base : utilisable côté serveur et côté client.

// Logos des apps (public/logos/), par slug de projet ; sinon les initiales. Spircle et EDHEC AI sont
// copiés de leurs dépôts ; STAGE (entonnoir des candidatures, bordeaux) et Networking (réseau de
// contacts, vert Excel #107C41) choisis par Thibaut le 2026-10-08.
export const APP_LOGOS = { spircle: '/logos/spircle.svg', 'edhec-ai': '/logos/edhec-ai.png', stage: '/logos/stage.svg' };

// Apps sans projet lié (app_links.project_slug nul) : logo par nom d'app, en minuscules.
export const APP_LOGOS_BY_NAME = { networking: '/logos/networking.svg' };

// Le projet du dashboard lui-même (« Tour de Contrôle », devenu Cadran) n'a pas de carré : on y est déjà.
export const SELF_PROJECT_SLUG = 'dashboard-pilotage';

// Initiales (1-2 lettres) pour la pastille d'une app sans image.
export function initials(name) {
  const words = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase() || '?';
}

// Pastilles sans logo : des teintes de la charte (jetons de app/globals.css), texte blanc dessus
// (contraste >= 4,5:1). Bleu acier et gris seulement : le corail est réservé au retard et au conflit.
const TILE_STYLES = [
  { background: 'var(--action)', color: 'var(--action-text)' },
  { background: 'var(--ink)', color: 'var(--action-text)' },
  { background: 'var(--ink-muted)', color: 'var(--action-text)' },
];

// Style en ligne d'une pastille, stable pour un même nom.
export function tileStyle(key) {
  let h = 0;
  for (const c of String(key ?? '')) h = (h * 31 + c.charCodeAt(0)) % TILE_STYLES.length;
  return TILE_STYLES[h];
}

// Apps du rail et de la grille : les apps (app_links) puis les projets qui n'ont pas d'app liée
// (un projet lié à une app n'a qu'un seul carré, qui ouvre l'app). `apps` = lignes app_links,
// `projects` = { id, slug, name, status }.
export function buildAppTiles(apps, projects) {
  const bySlug = new Map((projects ?? []).map((p) => [p.slug, p]));
  const used = new Set();
  const tiles = (apps ?? []).map((a) => {
    const project = bySlug.get(a.project_slug);
    if (project) used.add(project.slug);
    return {
      key: `app:${a.id}`,
      name: a.name,
      href: a.url,
      external: /^https?:\/\//i.test(a.url),
      status: project?.status,
      logo: APP_LOGOS[a.project_slug] ?? APP_LOGOS_BY_NAME[String(a.name ?? '').trim().toLowerCase()],
    };
  });
  for (const p of projects ?? []) {
    if (used.has(p.slug) || p.slug === SELF_PROJECT_SLUG) continue;
    tiles.push({ key: `project:${p.id ?? p.slug}`, name: p.name, href: `/projects/${p.slug}`, external: false, status: p.status, logo: APP_LOGOS[p.slug] });
  }
  return tiles;
}
