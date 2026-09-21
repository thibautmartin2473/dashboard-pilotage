import Panel from './Panel';
import { lastSync, topMails } from '@/lib/home';
import { timeAgo } from '@/lib/format';

const linkClass = 'underline hover:no-underline';
const muted = 'text-xs text-zinc-500 dark:text-zinc-400';

const Ext = ({ href, children }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
    {children}
  </a>
);

// Pied de panneau : l'âge de l'instantané, pour ne jamais le faire passer pour du direct.
function Footer({ rows, href, label }) {
  const synced = lastSync(rows);
  return (
    <p className={`mt-3 flex flex-wrap items-baseline justify-between gap-x-3 ${muted}`}>
      <span>{synced ? `Mis à jour ${timeAgo(synced)}` : 'Aucune donnée synchronisée'}</span>
      <Ext href={href}>{label}</Ext>
    </p>
  );
}

// `agenda` = buildAgenda(...) calculé par la page (le résumé en réutilise les conflits).
export function AgendaPanel({ agenda, state }) {
  const rows = state.data ?? [];
  return (
    <Panel title="Agenda" state={state} file="agenda.sql">
      {agenda?.days.length ? (
        <div className="space-y-3">
          {agenda.days.map((d) => (
            <div key={d.day}>
              <h3 className="text-xs font-semibold capitalize text-zinc-500 dark:text-zinc-400">{d.label}</h3>
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {d.events.map((e) => (
                  <li key={e.id} className="flex gap-3 py-1.5 text-sm">
                    <span className="w-28 shrink-0 tabular-nums text-zinc-600 dark:text-zinc-400">{e.when}</span>
                    <span className="min-w-0 flex-1 break-words">
                      {e.link ? <Ext href={e.link}>{e.title}</Ext> : e.title}
                      {e.conflict && (
                        <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                          Conflit
                        </span>
                      )}
                      {e.location && <span className={`block ${muted}`}>{e.location}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Rien à l&apos;agenda ces 7 prochains jours.</p>
      )}
      {!state.error && <Footer rows={rows} href="https://calendar.google.com/" label="Ouvrir Google Agenda" />}
    </Panel>
  );
}

export function MailsPanel({ state }) {
  const rows = state.data ?? [];
  const items = topMails(rows);
  return (
    <Panel title="Non lus" count={state.data ? `${items.length}/${rows.length}` : undefined} state={state} file="agenda.sql">
      {items.length ? (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {items.map((m) => (
            <li key={m.id} className="py-1.5 text-sm">
              <p className="break-words">
                {m.important && (
                  <span className="mr-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Important
                  </span>
                )}
                {m.link ? <Ext href={m.link}>{m.subject || '(sans objet)'}</Ext> : m.subject || '(sans objet)'}
              </p>
              <p className={`truncate ${muted}`}>
                {m.sender || 'Expéditeur inconnu'}
                {m.received_at && ` · ${timeAgo(m.received_at)}`}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Aucun message non lu.</p>
      )}
      {!state.error && <Footer rows={rows} href="https://mail.google.com/" label="Ouvrir Gmail" />}
    </Panel>
  );
}
