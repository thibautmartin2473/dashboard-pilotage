// Côté serveur, lecture seule : transforme les vraies données (loadHomePanels) en objet léger et
// sérialisable pour la vitrine /demo/composants. Aucune écriture, aucune Server Action.
import { categoryOf, resolveCategories, todayParis } from '@/lib/home';
import { buildRangerItems, cleanBlockTitle, dayParis } from '@/lib/ranger';

// Les données réelles peuvent contenir des tirets longs : la démo les remplace par un tiret simple.
const plain = (s) => String(s ?? '').replace(/\s*[\u2014\u2013]\s*/g, ' - ');
const clamp = (raw, n) => {
  const s = plain(raw);
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
};
// La raison répète souvent le libellé du bloc : on ne garde que ce qui l'explique.
const reasonOf = (label, reason) => {
  const l = plain(label);
  const r = plain(reason);
  if (l && r.startsWith(l)) {
    const rest = r.slice(l.length).replace(/^[\s:,.-]+/, '');
    return rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : 'Premier bloc de travail libre.';
  }
  return r;
};
const HM = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const minutesOf = (iso) => {
  const [h, m] = HM.format(new Date(iso)).split(':').map(Number);
  return h * 60 + m;
};
const START = 480; // 8h
const END = 1200; // 20h

// Exemples utilisés seulement si les vraies données sont vides ou illisibles (annoncés comme tels).
const SAMPLE_ITEMS = [
  { key: 'task:s1', kind: 'task', typeLabel: 'Tâche', title: 'Envoyer la candidature au cabinet avant vendredi', ageLabel: '3 j', late: 2, dueReason: 'en retard de 2 j', projectName: 'Stage', suggestion: { ok: true, label: 'Bloc de travail, demain 14h-16h', reason: 'Premier bloc libre, assez long pour une candidature.' } },
  { key: 'idea:s2', kind: 'idea', typeLabel: 'Idée', title: 'Reprendre les fiches de valorisation du semestre', ageLabel: '5 j', late: 0, dueReason: null, projectName: null, suggestion: { ok: true, label: 'Bloc de travail, jeudi 10h-12h', reason: 'Même thème que le bloc de révision de jeudi.' } },
  { key: 'task:s3', kind: 'task', typeLabel: 'Tâche', title: 'Répondre au mail du bureau des stages', ageLabel: 'hier', late: 0, dueReason: "sans bloc, créée avant aujourd'hui", projectName: null, suggestion: { ok: true, label: "Aujourd'hui, sans bloc", reason: 'Court : à faire entre deux cours.' } },
  { key: 'notification:s4', kind: 'notification', typeLabel: 'Mail', title: 'Proposition : entretien jeudi 15h avec un associé', ageLabel: "aujourd'hui", late: 0, dueReason: null, projectName: null, suggestion: { ok: false, label: '', reason: "Aucun créneau libre jeudi à 15h : à décider toi-même." } },
  { key: 'task:s5', kind: 'task', typeLabel: 'Tâche', title: 'Préparer les questions pour le call de networking', ageLabel: '2 j', late: 0, dueReason: null, projectName: null, suggestion: { ok: true, label: 'Bloc de travail, mercredi 14h-15h30', reason: 'Le call est jeudi : il faut finir avant.' } },
  { key: 'idea:s6', kind: 'idea', typeLabel: 'Idée', title: 'Tester une mise en page plus aérée pour le CV', ageLabel: '8 j', late: 0, dueReason: null, projectName: null, suggestion: { ok: false, label: '', reason: 'Pas de bloc de travail dans les 14 prochains jours.' } },
];
const SAMPLE_OPTIONS = [
  { eventId: 'o1', label: 'Bloc de travail, mer 14h-15h30', tasks: 2 },
  { eventId: 'o2', label: 'Bloc de travail, jeu 10h-12h', tasks: 0 },
  { eventId: 'o3', label: 'Bloc de travail, ven 9h-10h30', tasks: 1 },
  { eventId: 'o4', label: 'Bloc de travail, lun 14h-16h', tasks: 0 },
];
const SAMPLE_AGENDA = {
  sample: true,
  dayLabel: 'jour type',
  events: [
    { id: 'a1', title: 'Corporate finance', start: 540, end: 720, cat: 'cours' },
    { id: 'a2', title: 'Bloc de travail', start: 840, end: 930, cat: 'tache' },
    { id: 'a3', title: 'Tennis', start: 1080, end: 1170, cat: 'autre' },
  ],
};

function pickItems(all) {
  // Un mélange lisible : jusqu'à 5 tâches, 2 idées, 2 propositions de mail, dans l'ordre de la vraie liste.
  const quota = { task: 5, idea: 2, notification: 2 };
  const out = [];
  for (const it of all) {
    if (quota[it.kind] > 0) {
      quota[it.kind] -= 1;
      out.push(it);
    }
  }
  return out;
}

function weekday(day) {
  return new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${day}T12:00:00Z`));
}

function pickAgenda(events, categories, today) {
  const byDay = new Map();
  for (const e of events ?? []) {
    if (e.all_day || !e.starts_at) continue;
    const day = dayParis(e.starts_at);
    if (day < today) continue;
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(e);
  }
  const days = [...byDay.keys()].sort();
  const day = days.find((d) => byDay.get(d).length >= 3) ?? days[0];
  if (!day) return SAMPLE_AGENDA;
  const list = [];
  for (const e of byDay.get(day)) {
    const start = minutesOf(e.starts_at);
    const end = e.ends_at ? minutesOf(e.ends_at) : start + 30;
    if (end <= START || start >= END || end <= start) continue;
    const cat = categoryOf(categories, e.color_id);
    list.push({
      id: String(e.id),
      title: clamp(cleanBlockTitle(e.title), 48),
      start: Math.max(START, start),
      end: Math.min(END, end),
      cat: cat.kind === 'tache' ? 'tache' : cat.key === '11' ? 'cours' : 'autre',
    });
  }
  if (!list.length) return SAMPLE_AGENDA;
  return { sample: false, dayLabel: weekday(day), events: list.slice(0, 9) };
}

export function prepareLab({ tasks, ideas, events, notifications, settings, projects }) {
  const now = new Date();
  const today = todayParis(now);
  const setting = (key) => settings?.data?.find((row) => row.key === key)?.value;
  const categories = resolveCategories(setting('agenda_categories'));
  let items = [];
  let options = [];
  let restaged = false;
  const build = (taskRows) =>
    buildRangerItems({
      tasks: taskRows,
      ideas: ideas?.data ?? [],
      notifications: notifications?.data ?? [],
      events: events?.data ?? [],
      categories,
      now,
      projectNames: Object.fromEntries((projects ?? []).map((p) => [p.slug, p.name])),
    });
  try {
    let built = build(tasks?.data ?? []);
    // Colonne déjà vide dans la vraie vie (tout est rangé) : la démo remet les tâches ouvertes « sans bloc »
    // pour avoir de vraies cartes à ranger. Lecture seule, rien n'est modifié en base.
    if (built.items.length < 4 && (tasks?.data ?? []).length) {
      built = build((tasks.data ?? []).map((t) => ({ ...t, event_id: null, snoozed_until: null })));
      restaged = true;
    }
    items = pickItems(built.items).map((i) => ({
      key: i.key,
      kind: i.kind,
      typeLabel: i.notifLabel ? `${i.typeLabel} : ${i.notifLabel.toLowerCase()}` : i.typeLabel,
      title: clamp(i.title || 'Sans titre', 140),
      ageLabel: i.age <= 1 ? i.ageLabel : `${i.age} j`,
      late: i.late,
      dueReason: i.dueReason ?? null,
      projectName: i.projectName ?? null,
      suggestion: { ok: Boolean(i.suggestion?.target), label: clamp(i.suggestion?.label ?? '', 90), reason: clamp(reasonOf(i.suggestion?.label ?? '', i.suggestion?.reason ?? ''), 130) },
    }));
    options = built.options.slice(0, 7).map((o) => ({ eventId: String(o.eventId), label: clamp(o.label, 64), tasks: o.tasks }));
  } catch {
    items = [];
  }
  const real = items.length > 0;
  const days = [1, 2, 3].map((n) => {
    const d = new Date(`${today}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    const iso = d.toISOString().slice(0, 10);
    return { day: iso, label: n === 1 ? 'Demain' : new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long' }).format(d) };
  });
  return {
    source: real ? (restaged ? 'reel-remis' : 'reel') : 'exemple',
    items: real ? items : SAMPLE_ITEMS,
    options: options.length ? options : SAMPLE_OPTIONS,
    days,
    agenda: events?.error || !events?.data ? SAMPLE_AGENDA : pickAgenda(events.data, categories, today),
  };
}
