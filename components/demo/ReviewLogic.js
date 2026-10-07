// Logique pure de la démo « Bilan » (aucun accès base, aucun effet de bord).
import { todayParis } from '@/lib/home';

export const shiftDay = (day, n) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};
export const fmtDay = (day) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;
export const weekdayShort = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'short', timeZone: 'UTC' });

// Lundi suivant (début de « la semaine prochaine »).
export function nextMonday(today) {
  const dow = new Date(`${today}T12:00:00Z`).getUTCDay(); // 0 = dimanche
  return shiftDay(today, ((8 - dow) % 7) || 7);
}

const STOP = new Set(['bloc', 'planifie', 'travail', 'tache', 'taches', 'session', 'avec', 'pour', 'des', 'les', 'du', 'de', 'la', 'le']);
const words = (title) =>
  String(title ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP.has(w));

// Prochain bloc orange du même thème (mots significatifs communs dans le titre) ;
// sinon le premier bloc orange à venir. `future` est trié par date.
export function findNextBlock(block, future) {
  const mine = new Set(words(block.title));
  let best = null;
  let bestScore = 0;
  for (const f of future) {
    if (f.id === block.id) continue;
    const score = words(f.title).filter((w) => mine.has(w)).length;
    if (score > bestScore) {
      best = f;
      bestScore = score;
    }
  }
  if (best) return { block: best, sameTheme: true };
  const first = future.find((f) => f.id !== block.id);
  return first ? { block: first, sameTheme: false } : null;
}

const where = (next) =>
  next ? `bloc "${next.block.title}" du ${next.block.dayLabel} (${next.block.time})${next.sameTheme ? '' : ', aucun bloc du même thème : premier bloc orange libre'}` : null;

// Écritures réelles qu'un geste provoquerait. mode : 'done' | 'partial' | 'skipped'.
export function planWrites({ block, tasks, mode, doneIds = [], next }) {
  const open = tasks.filter((t) => !t.done);
  const doneSet = new Set(mode === 'done' ? open.map((t) => t.id) : mode === 'partial' ? doneIds : []);
  const lines = [];
  let done = 0;
  let recased = 0;
  for (const t of open) {
    if (doneSet.has(t.id)) {
      done += 1;
      lines.push(`tasks : marquer fait "${t.title}" (done_at = maintenant)`);
    } else {
      recased += 1;
      lines.push(
        next
          ? `tasks : recaser "${t.title}" dans le ${where(next)} (event_id = ${next.block.id.slice(0, 8)}...)`
          : `tasks : "${t.title}" passe dans Plus tard (aucun bloc orange à venir)`
      );
    }
  }
  if (!open.length) lines.push(`Bloc "${block.title}" sans tâche ouverte : rien à écrire`);
  lines.push(`notifications : aucune ligne "Oublié hier ?" créée pour "${block.title}"`);
  return { lines, done, recased };
}

// Réponse courte du chat : « 1 fait, 2 pas fait, 3 en partie 3a 3b » ou « tout fait ».
export function parseReply(text, blockCount) {
  const t = String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (/^\s*(tout fait|tout est fait|tous faits?)\s*\.?\s*$/.test(t)) {
    return { actions: Array.from({ length: blockCount }, (_, i) => ({ n: i + 1, mode: 'done', letters: [] })), unknown: false };
  }
  const re = /(\d+)\s*[:)-]?\s*(tout fait|pas fait|en partie|partiel|fait|rien)((?:[\s,]*(?:et\s+)?\d+[a-z]\b)*)/g;
  const actions = [];
  let m;
  while ((m = re.exec(t))) {
    const mode = m[2] === 'pas fait' || m[2] === 'rien' ? 'skipped' : m[2] === 'en partie' || m[2] === 'partiel' ? 'partial' : 'done';
    const letters = [...m[3].matchAll(/\d+([a-z])\b/g)].map((x) => x[1]);
    const n = Number(m[1]);
    if (n >= 1 && n <= blockCount) actions.push({ n, mode, letters });
  }
  return { actions, unknown: actions.length === 0 && t.trim().length > 0 };
}

// Tâches faites par jour sur les 7 derniers jours (aujourd'hui inclus).
export function weekStats(done, today) {
  const days = Array.from({ length: 7 }, (_, i) => shiftDay(today, i - 6));
  const counts = Object.fromEntries(days.map((d) => [d, 0]));
  for (const t of done ?? []) {
    if (!t.done_at) continue;
    const d = todayParis(new Date(t.done_at));
    if (d in counts) counts[d] += 1;
  }
  return days.map((d) => ({ day: d, label: `${weekdayShort(d)} ${fmtDay(d)}`, count: counts[d] }));
}

// Ce que la règle « 2 jours sans réponse = Plus tard » aurait déjà déplacé :
// tâche liée à un bloc fini depuis plus de 2 jours, ou en retard de plus de 7 jours sans bloc.
export function laterCandidates(openTasks, events, today) {
  const byId = new Map((events ?? []).map((e) => [e.id, e]));
  const out = [];
  for (const t of openTasks ?? []) {
    const e = t.event_id ? byId.get(t.event_id) : null;
    if (e) {
      const end = todayParis(new Date(e.ends_at ?? e.starts_at));
      if (end < shiftDay(today, -2)) out.push({ id: t.id, title: t.title, reason: `bloc du ${fmtDay(end)} passé sans bilan`, sort: end });
    } else if (t.due_date && t.due_date < shiftDay(today, -7)) {
      out.push({ id: t.id, title: t.title, reason: `en retard depuis le ${fmtDay(t.due_date)}`, sort: t.due_date });
    }
  }
  return out.sort((a, b) => a.sort.localeCompare(b.sort));
}
