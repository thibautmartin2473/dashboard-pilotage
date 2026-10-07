// Logique pure de la démo « Échéances » : classer les tâches ouvertes et les événements
// par mots-clés. Aucun accès base. Les jours sont des chaînes AAAA-MM-JJ (heure de Paris).

const plain = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const normSpaces = (s) => plain(s).replace(/['’]/g, ' ').replace(/\s+/g, ' ').trim();
// Le mot doit commencer un mot du texte (« rendre » ne doit pas matcher « reprendre »).
const has = (text, words) => words.some((w) => text.includes(` ${w}`) || text.startsWith(w));

// Nature d'une échéance : le premier type qui correspond gagne (ordre = priorité).
export const DEADLINE_KINDS = [
  { key: 'candidature', label: 'Candidature', words: ['candidater', 'candidature', 'postuler'] },
  { key: 'test', label: 'Test en ligne', words: ['oliver wyman', 'gorilla', 'test'] },
  { key: 'exam', label: 'Examen', words: ['final exam', 'exam', 'partiel'] },
  { key: 'depot', label: 'Dépôt', words: ['rendre', 'deposer', 'depot', 'cv + lettre', 'cv et lettre', 'envoyer le cv', 'envoyer cv'] },
];

export const RELANCE_VERBS = ['appeler', 'rappeler', 'ecrire a', 'remercier', 'relancer', 'message a', 'recontacter', 'contacter'];
export const RECURRENCE_NAMES = [
  { key: 'loyer', label: 'Loyer', words: ['loyer'] },
  { key: 'edhec', label: 'Paiement EDHEC', words: ['payer l edhec', 'payer edhec', 'frais edhec', 'scolarite'] },
];

export function deadlineKind(title) {
  const t = normSpaces(title);
  for (const k of DEADLINE_KINDS) if (has(t, k.words)) return k;
  return null;
}

export function recurrenceName(title) {
  const t = normSpaces(title);
  if (!/(payer|paiement|virement|regler)/.test(t) && !t.includes('loyer')) return null;
  for (const r of RECURRENCE_NAMES) if (has(t, r.words)) return r;
  return null;
}

export function isRelance(title) {
  return has(normSpaces(title), RELANCE_VERBS);
}

// Premier nom propre après « à » ou le verbe : meilleure approximation, null si rien de net.
export function personOf(title) {
  const m = String(title ?? '').match(
    /(?:\b[àa]\s+|remercier\s+|relancer\s+|rappeler\s+|appeler\s+)(?:M\.?\s+|Mme\s+)?([A-ZÉÈÀ][\p{L}'’-]+(?:\s+[A-ZÉÈÀ][\p{L}'’-]+)?)/u
  );
  return m ? m[1] : null;
}

const pad = (n) => String(n).padStart(2, '0');
export const ymd = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const utc = (day) => Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)));
// Nombre de jours de `a` à `b` (positif si b est après a).
export const diffDays = (b, a) => Math.round((utc(b) - utc(a)) / 86400000);
export function addDays(day, n) {
  const d = new Date(utc(day) + n * 86400000);
  return ymd(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}
export const shortDate = (day) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;
export const dayOfEvent = (iso) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });

// « 02/11 » dans le titre : date explicite (année courante, suivante si passée depuis plus de 60 jours).
export function dateInTitle(title, today) {
  const m = String(title ?? '').match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  if (d < 1 || d > 31 || mo < 1 || mo > 12) return null;
  let y = m[3] ? Number(m[3].length === 2 ? `20${m[3]}` : m[3]) : Number(today.slice(0, 4));
  let iso = ymd(y, mo, d);
  if (!m[3] && diffDays(iso, today) < -60) iso = ymd(++y, mo, d);
  return iso;
}

// Bloc de préparation = bloc orange (colorId 6) ou titre « [bloc planifié] ».
export const isPrepBlock = (e) =>
  String(e.color_id ?? '') === '6' || /bloc planifi|^(r[ée]vis|drill|pr[ée]pa|entra[iî]n|cas )/i.test(e.title ?? '');

const STOP = new Set(['payer', 'faire', 'pour', 'avec', 'dans', 'sans', 'chez', 'rendre', 'candidater', 'postuler', 'deposer', 'bloc', 'planifie', 'avant', 'sur', 'les', 'des', 'une', 'aux', 'lettre']);
export function keywords(title) {
  return [
    ...new Set(
      normSpaces(title)
        .replace(/[^a-z0-9 ]/g, ' ')
        .split(' ')
        .filter((w) => w.length >= 4 && !STOP.has(w) && !/^\d+$/.test(w))
    ),
  ];
}
const sameWord = (a, b) => a === b || (a.length >= 5 && b.length >= 5 && a.slice(0, 5) === b.slice(0, 5));
export const sharesKeyword = (a, b) => keywords(a).some((x) => keywords(b).some((y) => sameWord(x, y)));

export function urgency(days) {
  if (days === null) return { key: 'none', label: 'Sans date', box: 'border-zinc-700 bg-zinc-900', text: 'text-zinc-400' };
  if (days < 0) return { key: 'late', label: 'En retard', box: 'border-red-800 bg-red-950/40', text: 'text-red-400' };
  if (days <= 3) return { key: 'urgent', label: 'Urgent', box: 'border-red-800 bg-zinc-900', text: 'text-red-400' };
  if (days <= 10) return { key: 'soon', label: 'Cette quinzaine', box: 'border-amber-700 bg-zinc-900', text: 'text-amber-400' };
  return { key: 'later', label: 'Plus tard', box: 'border-zinc-800 bg-zinc-900', text: 'text-zinc-300' };
}
export const countdown = (days) => (days === null ? 'Sans date' : days === 0 ? "Aujourd'hui" : days > 0 ? `J-${days}` : `J+${-days}`);

// Prochain jour du mois `dom` à partir d'aujourd'hui (inclus), borné au dernier jour du mois.
export function nextMonthly(dom, today) {
  let y = Number(today.slice(0, 4));
  let m = Number(today.slice(5, 7));
  for (let i = 0; i < 14; i++) {
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const iso = ymd(y, m, Math.min(dom, last));
    if (iso >= today) return iso;
    if (++m > 12) {
      m = 1;
      y++;
    }
  }
  return today;
}
export const ordinal = (n) => (n === 1 ? '1er' : String(n));

// Cœur de la démo : tout classer. Renvoie des listes prêtes à afficher.
export function classify({ tasks, events, today }) {
  const prepBlocks = events.filter(isPrepBlock);
  const deadlines = [];
  const relances = [];
  const recurring = new Map();
  const other = [];

  for (const t of tasks) {
    const rec = recurrenceName(t.title);
    if (rec) {
      const r = recurring.get(rec.key) ?? { ...rec, tasks: [], days: [] };
      r.tasks.push(t);
      if (t.due_date) r.days.push(Number(t.due_date.slice(8, 10)));
      recurring.set(rec.key, r);
      continue;
    }
    const kind = deadlineKind(t.title);
    if (kind) {
      const written = dateInTitle(t.title, today);
      deadlines.push({
        id: `t-${t.id}`,
        source: 'task',
        taskId: t.id,
        title: t.title,
        kind,
        day: written ?? t.due_date ?? null,
        from: written ? 'date écrite dans le titre' : "échéance de la tâche",
      });
      continue;
    }
    if (isRelance(t.title)) {
      relances.push({ id: t.id, title: t.title, person: personOf(t.title), due_date: t.due_date });
      continue;
    }
    other.push(t);
  }

  // Événements d'agenda qui sont eux-mêmes une échéance (examen, test), hors blocs de préparation.
  for (const e of events) {
    if (isPrepBlock(e)) continue;
    const kind = deadlineKind(e.title);
    if (!kind || kind.key === 'depot' || kind.key === 'candidature') continue;
    const day = dateInTitle(e.title, today) ?? dayOfEvent(e.starts_at);
    if (day < today) continue;
    deadlines.push({ id: `e-${e.id}`, source: 'event', title: e.title, kind, day, from: "événement de l'agenda" });
  }

  // Doublon tâche + événement le même jour et de même nature : on garde l'événement (date sûre).
  const seen = new Set(deadlines.filter((x) => x.source === 'event').map((d) => `${d.day}|${d.kind.key}`));
  const merged = deadlines.filter((d) => d.source === 'event' || !seen.has(`${d.day}|${d.kind.key}`));

  for (const d of merged) {
    d.days = d.day ? diffDays(d.day, today) : null;
    const end = d.day ?? '9999-12-31';
    d.prep = prepBlocks.filter((b) => {
      const bd = dayOfEvent(b.starts_at);
      return bd >= today && bd <= end && sharesKeyword(d.title, b.title);
    });
  }
  merged.sort((a, b) => (a.days ?? 1e9) - (b.days ?? 1e9) || a.title.localeCompare(b.title));

  const recurrences = [...recurring.values()].map((r) => {
    const counts = {};
    for (const d of r.days) counts[d] = (counts[d] ?? 0) + 1;
    const dom = Number(Object.keys(counts).sort((x, y) => counts[y] - counts[x])[0] ?? 1);
    return { ...r, dom, next: nextMonthly(dom, today) };
  });

  return { deadlines: merged, relances, recurrences, other };
}
