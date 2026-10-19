// Activité du jour (sessions Claude Code) : logique pure, sans accès base, testée par scripts/check-activite.mjs.
// Les routes app/api/hooks/activite (écriture) et app/api/public/activite (lecture) s'appuient dessus.

const MAX_TEXT = 200;
const MAX_JOURS = 3; // une lecture ne remonte pas plus loin que 3 jours

const clip = (v) => (v == null || v === '' ? null : String(v).slice(0, MAX_TEXT));

// Le thème se déduit d'abord du titre de la session (une session du dossier tests-conseil peut parler de tout),
// puis de son dossier ; « Système » par défaut.
const THEMES_TITRE = [
  ['Cours EDHEC', /\b(afa|partiels?|r[ée]vision|cours|acc ?8\d\d|financial modeling|master project|edhec)\b/i],
  ['Carrière', /\b(cas|conseil|fit|lettre|stage|cdi|networking|tests? en ligne|tests-conseil|bain|bcg|mckinsey|carri[èe]re|consultor|entretien|strategy boost)\b/i],
  ['Dashboard', /\b(cadran|dashboard|agenda|mails?)\b/i],
  ['Design', /\bdesign\b/i],
  ['Spircle', /\bspircle\b/i],
];
const THEMES_DOSSIER = [
  ['Dashboard', /[\\/](bureau-cadran|dashboard-pilotage)/i],
  ['Spircle', /[\\/]Spircle/i],
  ['Cours EDHEC', /[\\/]EDHEC AI/i],
  // Pas de règle pour tests-conseil : c'est le dossier de départ par défaut des sessions, il ne dit rien du sujet.
];

export function themeOf({ titre, dossier } = {}) {
  for (const [theme, re] of THEMES_TITRE) if (titre && re.test(titre)) return theme;
  for (const [theme, re] of THEMES_DOSSIER) if (dossier && re.test(dossier)) return theme;
  return 'Système';
}

// Dernier élément d'un chemin Windows ou POSIX : on ne renvoie jamais le chemin complet (nom d'utilisateur).
export function dossierCourt(dossier) {
  if (!dossier) return null;
  const parts = String(dossier).split(/[\\/]+/).filter(Boolean);
  const last = parts[parts.length - 1] || null;
  return /^scratch-\d{4}-\d{2}-\d{2}/.test(last || '') ? 'sans dossier' : last;
}

// Valide le corps envoyé par le hook. Renvoie { ok, valeur } ou { ok: false, erreur }.
export function lirePayload(body, now = new Date()) {
  if (!body || typeof body !== 'object') return { ok: false, erreur: 'corps JSON attendu' };
  const session = clip(body.session_id);
  if (!session || !/^[A-Za-z0-9_-]{6,80}$/.test(session)) return { ok: false, erreur: 'session_id invalide' };
  if (!['prompt', 'stop'].includes(body.evenement)) return { ok: false, erreur: 'evenement doit être prompt ou stop' };
  let at = body.at ? new Date(body.at) : now;
  // Horloge du PC décalée ou date absurde : on garde l'heure du serveur.
  if (Number.isNaN(at.getTime()) || Math.abs(at - now) > 10 * 60 * 1000) at = now;
  return {
    ok: true,
    valeur: {
      p_session: session,
      p_titre: clip(body.titre),
      p_dossier: clip(body.dossier),
      p_routine: body.routine === true,
      p_evenement: body.evenement,
      p_at: at.toISOString(),
    },
  };
}

// « depuis » de la lecture : une date ISO avec fuseau, ramenée dans [maintenant - 3 jours, maintenant].
export function lireDepuis(valeur, now = new Date()) {
  const min = new Date(now.getTime() - MAX_JOURS * 86400000);
  const d = valeur ? new Date(valeur) : null;
  if (!d || Number.isNaN(d.getTime())) return new Date(now.getTime() - 86400000);
  if (d < min) return min;
  if (d > now) return now;
  return d;
}

// Une session sans titre est un échange automatique (« Réponds juste ok ») ou une session qui n'a pas
// encore fini son premier tour : elle n'apparaît qu'une fois titrée par l'app.
const titree = (m) => !!(m && m.titre);

// Une ligne par session active depuis « depuis » : début et fin de l'activité dans la fenêtre, messages envoyés.
export function lignesSessions(sessions, evenements) {
  const parSession = new Map();
  for (const e of evenements) {
    const t = new Date(e.at).getTime();
    const s = parSession.get(e.session_id) || { debut: t, derniere: t, messages: 0 };
    s.debut = Math.min(s.debut, t);
    s.derniere = Math.max(s.derniere, t);
    if (e.evenement === 'prompt') s.messages += 1;
    parSession.set(e.session_id, s);
  }
  const meta = new Map(sessions.map((s) => [s.session_id, s]));
  return [...parSession.entries()]
    .filter(([id]) => titree(meta.get(id)))
    .map(([id, a]) => {
      const m = meta.get(id) || {};
      return {
        id,
        titre: m.titre || 'Session sans titre',
        theme: themeOf(m),
        type: m.routine ? 'routine' : 'travail',
        dossier: dossierCourt(m.dossier),
        debut: new Date(a.debut).toISOString(),
        derniere: new Date(a.derniere).toISOString(),
        messages: a.messages,
      };
    })
    .sort((x, y) => y.derniere.localeCompare(x.derniere));
}

// Une ligne par événement (pour le ruban horaire), avec le thème et le type de sa session.
export function lignesEvenements(sessions, evenements) {
  const meta = new Map(sessions.map((s) => [s.session_id, s]));
  return evenements
    .filter((e) => titree(meta.get(e.session_id)))
    .map((e) => {
      const m = meta.get(e.session_id) || {};
      return { session_id: e.session_id, at: new Date(e.at).toISOString(), evenement: e.evenement, theme: themeOf(m), type: m.routine ? 'routine' : 'travail' };
    })
    .sort((x, y) => x.at.localeCompare(y.at));
}
