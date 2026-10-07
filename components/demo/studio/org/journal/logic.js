// Logique pure du Journal du jour (aucun accès base, aucun état React).
// Les jours sont des chaînes AAAA-MM-JJ (heure de Paris), l'heure de référence est un horodatage en ms.
import { addDays } from '@/components/demo/TodayLogic';
import { countdown, diffDays } from '@/components/demo/DeadlinesLogic';
import { timeParis, todayParis } from '@/lib/home';

export const plural = (n, one, many = `${one}s`) => `${n} ${n > 1 ? many : one}`;

export const startOf = (e) => Date.parse(e.starts_at);
// Fin d'affichage : au moins 30 minutes pour un événement sans fin.
export const endOf = (e) => {
  const s = startOf(e);
  const en = e.ends_at ? Date.parse(e.ends_at) : s;
  return en > s ? en : s + 30 * 60000;
};

// 'past' | 'current' | 'future' d'un bloc, vu depuis le jour affiché.
export function blockStatus(b, day, today, nowMs) {
  if (day < today) return 'past';
  if (day > today) return 'future';
  if (endOf(b) <= nowMs) return 'past';
  if (startOf(b) <= nowMs) return 'current';
  return 'future';
}

// Repère « maintenant » : dans un bloc en cours (progression en %), ou inséré avant le premier bloc à venir.
// null si le jour affiché n'est pas aujourd'hui. `blocks` est trié par heure de début.
export function markerFor(blocks, day, today, nowMs) {
  if (day !== today) return null;
  const inside = blocks.find((b) => startOf(b) <= nowMs && nowMs < endOf(b));
  if (inside) {
    const pct = Math.round(((nowMs - startOf(inside)) / (endOf(inside) - startOf(inside))) * 100);
    return { insideId: inside.id, pct, index: -1 };
  }
  const next = blocks.findIndex((b) => startOf(b) > nowMs);
  return { insideId: null, pct: null, index: next < 0 ? blocks.length : next };
}

export const hourParis = (nowMs) => Number(timeParis(new Date(nowMs).toISOString()).slice(0, 2));
export const clockParis = (nowMs) => timeParis(new Date(nowMs).toISOString());

const longDate = (day) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
export const titleOfDay = longDate;

// « Aujourd'hui », « Demain », « Hier », « Dans 3 jours », « Il y a 2 jours ».
export function relativeDay(day, today) {
  const n = diffDays(day, today);
  if (n === 0) return "Aujourd'hui";
  if (n === 1) return 'Demain';
  if (n === -1) return 'Hier';
  return n > 1 ? `Dans ${n} jours` : `Il y a ${-n} jours`;
}

// Le lendemain, pour le bouton « Recaser demain ».
export const nextDayWord = (day, today) => (day === today ? 'demain' : `au lendemain (${longDate(addDays(day, 1))})`);

// Brief du matin : morceaux de phrase calculés. Chaque morceau = { n, text } (n mis en avant).
export function briefPieces({ blockCount, deadlines, unread, backlog }) {
  const pieces = [{ n: String(blockCount), text: blockCount > 1 ? ' blocs' : ' bloc' }];
  const near = deadlines.filter((d) => d.days !== null && d.days >= 0 && d.days <= 14);
  if (near.length === 0) pieces.push({ n: 'aucune', text: ' échéance sous 14 jours' });
  else {
    const first = near[0].days;
    const when = first === 0 ? "aujourd'hui" : `à ${countdown(first)}`;
    pieces.push(
      near.length === 1
        ? { n: '1', text: ` échéance ${when}` }
        : { n: String(near.length), text: ` échéances, la première ${when}` }
    );
  }
  pieces.push({ n: String(unread), text: unread > 1 ? ' mails non lus' : ' mail non lu' });
  if (backlog > 0) pieces.push({ n: String(backlog), text: backlog > 1 ? ' tâches à recaser' : ' tâche à recaser' });
  return pieces;
}

// Tâches faites le jour `day` : lignes serveur (data.done) + gestes locaux de la démo.
export function doneOnDay(done, day, localDone, titleById) {
  const server = (done ?? [])
    .filter((t) => t.done_at && todayParis(new Date(t.done_at)) === day && !(t.id in localDone))
    .map((t) => ({ id: t.id, title: t.title, at: t.done_at }));
  const local = Object.entries(localDone)
    .filter(([, d]) => d === day)
    .map(([id]) => ({ id, title: titleById.get(id) ?? 'Tâche', at: null }));
  return [...local, ...server.reverse()];
}

// Libellé d'échéance d'une tâche, ou null : en retard / échéance proche.
export function dueNote(task, day, today) {
  if (!task.due_date) return null;
  if (task.due_date < today) return { late: true, text: `en retard de ${diffDays(today, task.due_date)} j` };
  if (task.due_date === day) return { late: false, text: 'pour ce jour' };
  return { late: false, text: `échéance ${task.due_date.slice(8, 10)}/${task.due_date.slice(5, 7)}` };
}
