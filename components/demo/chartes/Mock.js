'use client';

// Maquette fidèle du Cockpit réel (rail, Zone Commande, agenda, colonne « À ranger », mails côte à côte),
// construite avec les vraies données (lecture seule) et les seuls jetons des chartes. Les gestes ne
// modifient qu'un état local : rien n'est enregistré.
import { useEffect, useMemo, useState } from 'react';
import { buildWeek, clampOffset, formatMailDate, latestMails, timeParis } from '@/lib/home';
import { buildRangerItems, cleanBlockTitle } from '@/lib/ranger';
import './mock.css';

const OFFSET_STEP = { 1: 1, 3: 3, 5: 5 };
const SPANS = [
  { id: 1, label: 'Jour' },
  { id: 3, label: '3 jours' },
  { id: 5, label: '5 jours' },
];
const NAV = [
  { id: 'cockpit', label: 'Cockpit' },
  { id: 'ranger', label: 'À ranger' },
  { id: 'agenda', label: 'Agenda' },
  { id: 'mails', label: 'Mails' },
  { id: 'idees', label: 'Idées et notes' },
];
const MAILBOXES = [
  { source: 'gmail', address: 'thibautmartin04@gmail.com' },
  { source: 'edhec', address: 'thibaut.martin95429@edhec.com', readElsewhere: true },
];
const GESTURES = [
  { id: 'validate', label: 'Valider', key: 'V', primary: true },
  { id: 'elsewhere', label: 'Affecter ailleurs', key: 'A' },
  { id: 'done', label: 'Cocher', key: 'C' },
  { id: 'delete', label: 'Supprimer', key: 'S', danger: true },
  { id: 'later', label: 'Plus tard', key: 'P', ghost: true },
];

const minutesOf = (ms) => {
  const [h, m] = timeParis(new Date(ms).toISOString()).split('h').map(Number);
  return h * 60 + m;
};
const hm = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}h${String(min % 60).padStart(2, '0')}`;
const dur = (min) => (min >= 60 ? `${Math.floor(min / 60)} h${min % 60 ? ` ${String(min % 60).padStart(2, '0')}` : ''}` : `${min} min`);
const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;
// Jeton de couleur d'une catégorie d'agenda : 11 = cours, kind « tache » = tâche, le reste = autre.
const catToken = (cat) => (cat?.key === '11' ? 'var(--cat-cours)' : cat?.kind === 'tache' ? 'var(--cat-tache)' : 'var(--cat-autre)');

function Icon({ name }) {
  const common = { viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const paths = {
    cockpit: <path d="M2.5 2.5h4.5v4.5H2.5zM9 2.5h4.5V7H9zM2.5 9H7v4.5H2.5zM9 9h4.5v4.5H9z" />,
    ranger: <path d="M2 9.5l1.7-5.5h8.6L14 9.5M2 9.5v3.5h12V9.5M2 9.5h3.7l.8 1.5h3l.8-1.5H14" />,
    agenda: <path d="M2.5 4h11v9.5h-11zM2.5 7h11M5.5 2.5v3M10.5 2.5v3" />,
    mails: <path d="M2 3.5h12v9H2zM2.3 4l5.7 4.7L13.7 4" />,
    idees: <path d="M4 2.5h8v11H4zM6.3 5.5h3.4M6.3 8h3.4M6.3 10.5h2" />,
    prev: <path d="M10 3.5L5.5 8l4.5 4.5" />,
    next: <path d="M6 3.5L10.5 8 6 12.5" />,
    task: <path d="M2.5 2.5h11v11h-11z" strokeDasharray="2 2" />,
    idea: <path d="M8 2l5 6-5 6-5-6z" />,
    command: <path d="M3 4.5l3.5 3.5L3 11.5M8 12h5" />,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

export default function Mock({ data, nowMs }) {
  const [span, setSpan] = useState(5);
  const [offset, setOffset] = useState(0);
  const [gone, setGone] = useState(() => new Set());
  const [openKey, setOpenKey] = useState(null);
  const [limit, setLimit] = useState(5);
  const [palette, setPalette] = useState(false);

  useEffect(() => {
    if (!palette) return undefined;
    const onKey = (e) => e.key === 'Escape' && setPalette(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [palette]);

  const now = useMemo(() => new Date(nowMs), [nowMs]);
  const categories = data.categories;
  const events = useMemo(() => data.events.map((e) => ({ ...e, title: e.title ?? '' })), [data.events]);
  const week = useMemo(() => buildWeek(events, now, categories, offset, span), [events, now, categories, offset, span]);
  const nowMin = minutesOf(nowMs);
  const tasksByEvent = useMemo(() => {
    const map = new Map();
    for (const t of data.tasks) if (t.event_id) map.set(t.event_id, [...(map.get(t.event_id) ?? []), t]);
    return map;
  }, [data.tasks]);

  const ranger = useMemo(
    () =>
      buildRangerItems({
        tasks: data.tasks,
        ideas: data.ideas,
        notifications: data.notifications,
        events,
        categories,
        now,
        projectNames: Object.fromEntries(data.projects.map((p) => [p.slug, p.name])),
      }),
    [data.tasks, data.ideas, data.notifications, data.projects, events, categories, now]
  );
  // Rien à ranger en ce moment : trois exemples, signalés comme tels, pour montrer les états et les gestes.
  const sampleBlock = week.days.flatMap((d) => d.blocks.map((b) => ({ ...b, dayShort: d.short }))).find((b) => b.category.kind === 'tache');
  const sampleItems = useMemo(() => {
    const slot = sampleBlock ? `${sampleBlock.dayShort} ${hm(sampleBlock.startMin)}, ${cleanBlockTitle(sampleBlock.title)}` : 'un bloc de travail de la semaine';
    const base = { createdAt: null, due: null, project: null, projectName: null, origin: null, originTitle: null, detail: null, mailLink: null, snoozedUntil: null, notifKind: null, notifLabel: null };
    return [
      { ...base, key: 'sample:1', kind: 'task', typeLabel: 'Tâche', title: 'Exemple : relire le cas du jour avant la session', ageLabel: '3 j', late: 2, isDue: true, dueReason: 'en retard de 2 j', suggestion: { label: slot, reason: 'Bloc de travail libre le plus proche.', target: { type: 'event' } } },
      { ...base, key: 'sample:2', kind: 'idea', typeLabel: 'Idée', title: 'Exemple : tester un rappel du soir pour le bilan', ageLabel: 'hier', late: 0, isDue: false, dueReason: null, suggestion: { label: 'Noter dans Idées et notes', reason: 'Aucun bloc ne correspond au thème.', target: { type: 'note' } } },
      { ...base, key: 'sample:3', kind: 'notification', typeLabel: 'Mail', notifLabel: 'Événement proposé', title: "Exemple : proposition tirée d'un mail, à ajouter à l'agenda", ageLabel: "aujourd'hui", late: 0, isDue: false, dueReason: null, suggestion: { label: 'à sa date, jeu 18h00', reason: "Proposition tirée d'un mail : l'ajouter à l'agenda.", target: { type: 'accept' } } },
    ];
  }, [sampleBlock]);
  const isSample = ranger.items.length === 0;
  const items = (isSample ? sampleItems : ranger.items).filter((i) => !gone.has(i.key));
  const dueCount = items.filter((i) => i.isDue).length;
  const counts = ['task', 'idea', 'notification']
    .map((k) => [k, items.filter((i) => i.kind === k).length])
    .filter(([, n]) => n > 0)
    .map(([k, n]) => (k === 'task' ? plural(n, 'tâche', 'tâches') : k === 'idea' ? plural(n, 'idée', 'idées') : plural(n, 'mail', 'mails')));
  const expandedKey = openKey && items.some((i) => i.key === openKey) ? openKey : items[0]?.key;

  // Répartition du jour : minutes de plages et de tâches posées aujourd'hui.
  const today = week.days.find((d) => d.isToday) ?? null;
  const load = useMemo(() => {
    const day = week.days.find((d) => d.isToday);
    if (!day) return { p: 0, t: 0, nP: 0, nT: 0 };
    const acc = { p: 0, t: 0, nP: 0, nT: 0 };
    for (const b of day.blocks) {
      const m = b.endMin - b.startMin;
      if (b.category.kind === 'tache') {
        acc.t += m;
        acc.nT += 1;
      } else {
        acc.p += m;
        acc.nP += 1;
      }
    }
    return acc;
  }, [week]);

  const unreadGmail = data.mails.filter((m) => (m.source ?? 'gmail') === 'gmail' && m.unread !== false).length;
  const summary = [
    today ? `Aujourd'hui : ${plural(load.nP + load.nT + today.allDay.length, 'événement', 'événements')}` : 'Aujourd\'hui hors de la fenêtre',
    week.next ? `Prochain : ${week.next.time} ${week.next.title}` : 'Rien de prévu ensuite aujourd\'hui',
    week.conflicts > 0 ? `${plural(week.conflicts, 'conflit', 'conflits')} d'agenda` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const first = week.days[0];
  const last = week.days[week.days.length - 1];
  const hours = week.hourEnd - week.hourStart;
  const hourMarks = Array.from({ length: hours }, (_, i) => week.hourStart + i);

  const act = (item, gesture) => {
    if (gesture === 'elsewhere') return;
    setGone((g) => new Set([...g, item.key]));
    setOpenKey(null);
  };
  const lateOf = (item) => item.late > 0;

  return (
    <div className="cx" data-testid="cx-mock">
      <div className="cx-shell">
        <nav className="cx-rail" aria-label="Navigation principale (maquette)">
          <div className="cx-brand">
            <span className="cx-mark" aria-hidden="true" />
            <span className="cx-brand-name">Pilotage</span>
          </div>
          {NAV.map((n, i) => (
            <button key={n.id} type="button" className="cx-nav" aria-current={i === 0 ? 'page' : undefined} aria-label={n.label} title={n.label}>
              <Icon name={n.id} />
              <span className="cx-rail-label">{n.label}</span>
              {n.id === 'ranger' && items.length > 0 && <span className="cx-badge">{items.length}</span>}
              {n.id === 'mails' && unreadGmail > 0 && <span className="cx-badge">{unreadGmail}</span>}
            </button>
          ))}
          <div className="cx-rail-sec">Projets</div>
          {data.projects.slice(0, 5).map((p) => (
            <div key={p.id} className="cx-proj">
              <i aria-hidden="true" />
              <span>{p.name}</span>
            </div>
          ))}
          <div className="cx-rail-foot">
            <span className="cx-lamp" data-off={dueCount === 0 ? '' : undefined} aria-hidden="true" />
            <span className="cx-rail-foot-text">{dueCount > 0 ? `${dueCount} à ranger en priorité` : 'Tout est rangé'}</span>
          </div>
        </nav>

        <div className="cx-main">
          <div className="cx-cmd">
            <input className="cx-input" type="text" aria-label="Zone Commande" placeholder="Dis-le à Claude : un rappel, un bloc, une idée..." />
            <button type="button" className="cx-btn" aria-pressed={palette} onClick={() => setPalette((p) => !p)}>
              <Icon name="command" />
              Palette
              <span className="cx-kbd">Ctrl K</span>
            </button>
          </div>
          <p className="cx-summary" data-testid="cx-summary">
            {summary}
          </p>

          {palette && (
            <div className="cx-float" role="dialog" aria-label="Palette de commande (maquette)">
              <input className="cx-input" type="text" aria-label="Chercher une commande" placeholder="Que faire ?" defaultValue="Ranger" />
              <div style={{ marginTop: 6 }}>
                {[
                  ['Valider la suggestion de l’élément ouvert', 'V'],
                  ['Ranger les tâches du jour', 'R'],
                  ['Aller à l’agenda', 'G A'],
                  ['Afficher les mails non lus', 'G M'],
                ].map(([label, key], i) => (
                  <button key={label} type="button" className="cx-cmdrow" data-active={i === 0 ? '' : undefined} onClick={() => setPalette(false)}>
                    {label}
                    <span className="cx-kbd">{key}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="cx-grid">
            <section className="cx-panel" aria-label="Agenda">
              <div className="cx-head">
                <h2>Agenda</h2>
                <span className="cx-mono cx-muted" style={{ fontSize: 'var(--fs-xs)' }}>
                  {first.short} au {last.short}
                </span>
                <span className="cx-spacer" />
                <div className="cx-seg" role="group" aria-label="Durée affichée">
                  {SPANS.map((s) => (
                    <button key={s.id} type="button" className="cx-btn" aria-pressed={span === s.id} onClick={() => setSpan(s.id)}>
                      {s.label}
                    </button>
                  ))}
                </div>
                <button type="button" className="cx-btn" data-icon="" aria-label="Période précédente" onClick={() => setOffset((o) => clampOffset(o - OFFSET_STEP[span]))}>
                  <Icon name="prev" />
                </button>
                <button type="button" className="cx-btn" onClick={() => setOffset(0)}>
                  Aujourd&apos;hui
                </button>
                <button type="button" className="cx-btn" data-icon="" aria-label="Période suivante" onClick={() => setOffset((o) => clampOffset(o + OFFSET_STEP[span]))}>
                  <Icon name="next" />
                </button>
              </div>

              {today && (
                <div className="cx-load-wrap" style={{ paddingTop: 10 }}>
                  <div className="cx-load" role="img" aria-label={`Aujourd'hui : plages ${dur(load.p)}, tâches ${dur(load.t)}`}>
                    <i className="cx-load-p" style={{ flex: Math.max(load.p, 1) }} />
                    <i className="cx-load-t" style={{ flex: Math.max(load.t, 1) }} />
                  </div>
                  <div className="cx-load-legend">
                    <span>
                      Plages{' '}
                      <b className="cx-mono" style={{ color: 'var(--text)' }}>
                        {dur(load.p)}
                      </b>
                    </span>
                    <span>
                      Tâches{' '}
                      <b className="cx-mono" style={{ color: 'var(--text)' }}>
                        {dur(load.t)}
                      </b>
                    </span>
                  </div>
                </div>
              )}

              <div className="cx-days" data-span={span} style={{ '--days': span, '--hours': hours }}>
                <div className="cx-corner" />
                {week.days.map((d) => (
                  <div key={d.day} className={`cx-dayhead ${d.isToday ? 'is-today' : ''}`}>
                    <div className="dow">{d.short.split(' ')[0].replace('.', '')}</div>
                    <div className="dnum">{Number(d.day.slice(8, 10))}</div>
                    {d.allDay.slice(0, 1).map((e) => (
                      <div key={e.id} className="cx-allday" title={e.title}>
                        {e.title}
                      </div>
                    ))}
                  </div>
                ))}

                <div className="cx-hours" aria-hidden="true">
                  {hourMarks.map((h, i) => (
                    <span key={h} className="cx-hour" style={{ top: `${(i / hours) * 100}%` }}>
                      {String(h).padStart(2, '0')}h
                    </span>
                  ))}
                  {today?.nowTop != null && (
                    <span className="cx-nowtag" style={{ top: `${today.nowTop}%` }}>
                      {hm(nowMin)}
                    </span>
                  )}
                </div>
                {week.days.map((d) => (
                  <div key={d.day} className={`cx-col ${d.isToday ? 'is-today' : ''}`}>
                    {d.blocks.map((b) => {
                      const kind = b.category.kind === 'tache' ? 'tache' : 'plage';
                      const finished = kind === 'tache' && d.isToday && b.endMin <= nowMin;
                      const linked = tasksByEvent.get(b.id) ?? [];
                      return (
                        <div
                          key={`${b.id}-${d.day}`}
                          className={`cx-blk ${b.conflict ? 'is-conflict' : ''} ${finished ? 'is-done' : ''}`}
                          data-kind={kind}
                          style={{ '--bc': catToken(b.category), '--top': b.top, '--h': b.height, '--col': b.col, '--cols': b.cols }}
                          title={`${hm(b.startMin)} ${cleanBlockTitle(b.title)}`}
                        >
                          <div className="cx-blk-time">
                            {hm(b.startMin)}
                            {b.conflict && <span className="cx-conflict-tag"> Conflit</span>}
                          </div>
                          <div className="cx-blk-title">{cleanBlockTitle(b.title)}</div>
                          {kind === 'plage' && b.endMin - b.startMin >= 90 && linked.slice(0, 2).map((t) => (
                            <div key={t.id} className="cx-blk-task">
                              {t.title}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                    {d.nowTop != null && <div className="cx-now" style={{ '--top': d.nowTop }} aria-label="Heure actuelle" />}
                  </div>
                ))}
              </div>

              <div className="cx-legend" aria-label="Légende de l'agenda">
                <span>
                  <i className="cx-sw" data-k="plage" /> Plage (cours, événement)
                </span>
                <span>
                  <i className="cx-sw" data-k="tache" /> Tâche
                </span>
                <span>
                  <i className="cx-sw" data-k="fait" /> Fait
                </span>
                <span>
                  <i className="cx-sw" data-k="retard" /> En retard
                </span>
              </div>
            </section>

            <aside className="cx-panel cx-ranger" aria-label="À ranger">
              <div className="cx-head">
                <h2>À ranger</h2>
                <span className="cx-spacer" />
                <span className="cx-count" data-testid="cx-ranger-count">
                  <i className="cx-count-bar" style={{ '--n': Math.min(items.length, 20) }} aria-hidden="true" />
                  <b>{items.length}</b>
                </span>
              </div>
              <p className="cx-r-sum">
                {isSample && 'Rien à ranger en vrai : exemples. '}
                {items.length ? `${counts.join(', ')}${dueCount ? `, dont ${dueCount} en priorité` : ''}` : 'Tout est rangé.'}
              </p>
              <ul>
                {items.slice(0, limit).map((item) => {
                  const open = item.key === expandedKey;
                  return (
                    <li key={item.key}>
                      <button
                        type="button"
                        className="cx-r-item"
                        aria-expanded={open}
                        data-late={lateOf(item) ? '' : undefined}
                        onClick={() => setOpenKey(open ? null : item.key)}
                      >
                        <span className="cx-r-kind">
                          <Icon name={item.kind === 'task' ? 'task' : item.kind === 'idea' ? 'idea' : 'mails'} />
                          {item.typeLabel}
                          {item.notifLabel ? ` · ${item.notifLabel}` : ''}
                        </span>
                        <span className="cx-r-title">{item.title || 'Sans titre'}</span>
                        <span className="cx-r-meta cx-mono" style={{ display: 'block' }}>
                          {lateOf(item) ? <span className="cx-r-late">{item.dueReason} · </span> : item.dueReason ? `${item.dueReason} · ` : ''}
                          {item.ageLabel}
                          {item.projectName ? ` · ${item.projectName}` : ''}
                        </span>
                      </button>
                      {open && (
                        <div className="cx-r-open">
                          {item.suggestion?.label ? (
                            <div className="cx-sugg">
                              <b>Suggestion</b>
                              {item.suggestion.label}
                              <div className="cx-faint" style={{ fontSize: 'var(--fs-xs)' }}>
                                {item.suggestion.reason}
                              </div>
                            </div>
                          ) : (
                            <div className="cx-sugg">
                              <b>Suggestion</b>
                              {item.suggestion?.reason ?? 'Aucune suggestion.'}
                            </div>
                          )}
                          <div className="cx-gestures">
                            {GESTURES.map((g) => (
                              <button
                                key={g.id}
                                type="button"
                                className="cx-btn"
                                data-primary={g.primary ? '' : undefined}
                                data-danger={g.danger ? '' : undefined}
                                data-ghost={g.ghost ? '' : undefined}
                                disabled={g.id === 'validate' && !item.suggestion?.target}
                                onClick={() => act(item, g.id)}
                              >
                                {g.label}
                                <span className="cx-kbd">{g.key}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
              {items.length > limit && (
                <button type="button" className="cx-r-more" onClick={() => setLimit((l) => l + 10)}>
                  Afficher la suite ({items.length - limit})
                </button>
              )}
            </aside>
          </div>

          <div className="cx-mails">
            {MAILBOXES.map(({ source, address, readElsewhere }) => {
              const rows = latestMails(data.mails, source, 4);
              const unread = readElsewhere ? 0 : data.mails.filter((m) => (m.source ?? 'gmail') === source && m.unread !== false).length;
              return (
                <section key={source} className="cx-panel" aria-label={`Mails ${address}`}>
                  <div className="cx-head">
                    <h2>{source === 'gmail' ? 'Gmail' : 'EDHEC'}</h2>
                    <span className="cx-faint cx-mono" style={{ fontSize: 'var(--fs-xs)', overflowWrap: 'anywhere' }}>
                      {address}
                    </span>
                    <span className="cx-spacer" />
                    <span className="cx-badge">{readElsewhere ? 'lus ailleurs' : `${unread} non lu${unread > 1 ? 's' : ''}`}</span>
                  </div>
                  {rows.length === 0 && <p className="cx-r-sum">Aucun mail dans cette boîte.</p>}
                  {rows.map((m) => (
                    <div key={m.id} className="cx-mail" data-unread={!readElsewhere && m.unread !== false ? '' : undefined}>
                      <span className="from">{m.sender || 'Expéditeur inconnu'}</span>
                      <span className="subj">{m.subject || '(sans objet)'}</span>
                      <span className="date">{formatMailDate(m.received_at)}</span>
                    </div>
                  ))}
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
