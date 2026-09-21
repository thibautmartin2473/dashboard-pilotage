export function timeAgo(isoDate, now = Date.now()) {
  if (!isoDate) return 'jamais';

  const diffMs = now - new Date(isoDate).getTime();
  const diffSec = Math.round(diffMs / 1000);

  if (diffSec < 60) return "à l'instant";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `il y a ${diffHour} h`;
  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 30) return `il y a ${diffDay} j`;
  const diffMonth = Math.round(diffDay / 30);
  return `il y a ${diffMonth} mois`;
}

export function isRecent(isoDate, minutes) {
  if (!isoDate) return false;
  return Date.now() - new Date(isoDate).getTime() < minutes * 60 * 1000;
}

export function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return null;
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}
