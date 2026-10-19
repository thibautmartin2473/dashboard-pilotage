// Liens de visio des événements de l'agenda (demande de Thibaut, 2026-10-19 : « les liens de visio que je reçois
// par mail affectés aux événements, et quand je clique dessus ça me propose de lancer la réunion »).
// Module pur, sans import : lu par le site (lib/cockpit-data.js), par scripts/push-agenda.mjs et testé par
// scripts/check-meeting.mjs. Le Bureau Cadran importe ce même fichier (https://cadran-lib.local/meeting.js,
// tools/bridge-live.js) : un fournisseur ajouté ici doit aussi entrer dans la liste blanche « openurl » de son
// hôte (host/Program.cs), sinon le Bureau refuse d'ouvrir le lien.
//
// Stockage : dashboard_settings, clé `agenda_meeting_links` = { [eventId]: { url, src, at } } (`src` = "google"
// pour un lien porté par l'événement lui-même, "mail" pour un lien trouvé dans un mail, `at` = écriture en ms).
// Pas de colonne dans calendar_events : un lien trouvé dans un mail n'existe pas dans Google, il doit survivre
// aux synchros qui réécrivent la ligne de l'événement, et rien n'est à exécuter en SQL.

export const MEETING_LINKS_KEY = 'agenda_meeting_links';
export const MEETING_LINKS_MAX = 500;

// Fournisseur reconnu d'après l'hôte de l'URL ; null = pas une visio.
const PROVIDERS = [
  ['Meet', /^meet\.google\.com$/],
  ['Teams', /^teams\.(microsoft|live)\.com$/],
  ['Zoom', /(^|\.)zoom\.(us|com)$/],
  ['Webex', /(^|\.)webex\.com$/],
  ['Jitsi', /^meet\.jit\.si$/],
  ['Whereby', /(^|\.)whereby\.com$/],
];

export function meetingProvider(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:') return null;
  const host = u.hostname.toLowerCase();
  const found = PROVIDERS.find(([, re]) => re.test(host));
  if (!found) return null;
  // Une page d'accueil du fournisseur n'est pas une réunion : il faut un chemin.
  if (u.pathname.replace(/\/+$/, '') === '') return null;
  return found[0];
}

// Première URL de visio dans un texte (lieu d'un événement, corps d'un mail). Ponctuation finale retirée.
export function extractMeetingUrl(text) {
  if (!text || typeof text !== 'string') return null;
  for (const raw of text.match(/https:\/\/[^\s<>"'()]+/gi) ?? []) {
    const url = raw.replace(/[.,;:!?\]>]+$/, '');
    if (meetingProvider(url)) return url;
  }
  return null;
}

// Réglage enregistré -> entrées valides { eventId: { url, src, at } }, le reste ignoré.
export function resolveMeetingLinks(saved) {
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};
  return Object.fromEntries(
    Object.entries(saved).flatMap(([id, v]) => {
      if (!id || !v || typeof v !== 'object' || !meetingProvider(v.url)) return [];
      return [[id, { url: v.url, src: v.src === 'mail' ? 'mail' : 'google', at: Number.isFinite(v.at) ? v.at : 0 }]];
    })
  );
}

// Lien de l'événement : celui enregistré, sinon une URL de visio écrite dans son lieu.
export function meetingUrlOf(event, links = {}) {
  return links[event?.id]?.url ?? extractMeetingUrl(event?.location) ?? null;
}

// Fusionne de nouveaux liens { eventId: { url, src } } dans le réglage. Un lien trouvé dans un mail n'est
// jamais écrasé par un lien Google vide ou absent ; un lien Google remplace un lien de mail (l'organisateur a
// mis la réunion dans l'invitation). Au plus `max` entrées, les plus anciennes (`at`) partent d'abord.
export function mergeMeetingLinks(saved, incoming, now = Date.now(), max = MEETING_LINKS_MAX) {
  const out = resolveMeetingLinks(saved);
  for (const [id, v] of Object.entries(incoming ?? {})) {
    if (!id || !v || !meetingProvider(v.url)) continue;
    const src = v.src === 'mail' ? 'mail' : 'google';
    if (out[id]?.url === v.url && out[id].src === src) continue;
    out[id] = { url: v.url, src, at: now };
  }
  const ids = Object.keys(out);
  if (ids.length > max) {
    ids
      .sort((a, b) => out[a].at - out[b].at)
      .slice(0, ids.length - max)
      .forEach((id) => delete out[id]);
  }
  return out;
}
