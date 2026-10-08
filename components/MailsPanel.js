'use client';

import Panel from './Panel';
import { SyncFooter, mutedClass } from './ui';
import { formatMailDate, latestMails } from '@/lib/home';

// Les deux boîtes côte à côte : à gauche ce qui arrive sur thibautmartin04@gmail.com (source `gmail`),
// à droite thibaut.martin95429@edhec.com (source `edhec`). Chaque colonne est triée par date
// décroissante sans aucune pondération (latestMails), les non lus en gras, avec son compteur de non lus.
// Exception EDHEC (règle de Thibaut, 2026-10-07) : il lit ces mails dans Outlook, ils restent « non lus »
// dans Gmail ; la colonne EDHEC n'affiche donc ni gras ni compteur de non lus.
// Empilées sur téléphone. Lecture seule : on traite les mails dans Gmail (instantané `mail_items`).
const MAILBOXES = [
  { source: 'gmail', label: 'Gmail', address: 'thibautmartin04@gmail.com' },
  { source: 'edhec', label: 'EDHEC', address: 'thibaut.martin95429@edhec.com', readElsewhere: true },
];

function Mailbox({ label, address, mails, readElsewhere = false }) {
  const unread = readElsewhere ? 0 : mails.filter((m) => m.unread !== false).length;
  return (
    <section aria-label={address} className="flex min-h-0 min-w-0 flex-col" data-testid={`mailbox-${address}`}>
      <h3 className="shrink-0 border-b border-[var(--line-strong)] pb-1.5">
        <span className="flex items-baseline justify-between gap-2 text-sm font-semibold">
          <span>{label}</span>
          {readElsewhere ? (
            <span className="font-mono text-xs font-normal text-[var(--ink-muted)]">lus dans Outlook</span>
          ) : (
            <span className="tabular font-mono text-xs font-normal text-[var(--ink-muted)]" data-testid="unread-count">
              {unread} non lu{unread > 1 ? 's' : ''}
            </span>
          )}
        </span>
        <span className="block truncate text-xs text-[var(--ink-muted)]" title={address}>
          {address}
        </span>
      </h3>
      {mails.length ? (
        <ul className="min-h-0 flex-1 divide-y divide-[var(--line)] overflow-y-auto max-xl:max-h-80" data-testid="mail-list">
          {mails.map((m) => {
            const isUnread = !readElsewhere && m.unread !== false;
            return (
              <li key={m.id} className="py-2 text-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <span className={`min-w-0 truncate ${isUnread ? 'font-bold' : 'font-medium text-[var(--ink-muted)]'}`}>
                    {m.sender || 'Expéditeur inconnu'}
                  </span>
                  <span className={`shrink-0 ${mutedClass}`}>{formatMailDate(m.received_at)}</span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className={`line-clamp-2 min-w-0 break-words ${isUnread ? 'font-bold' : 'text-[var(--ink-muted)]'}`}>
                    {m.subject || '(sans objet)'}
                  </span>
                  {m.link && (
                    <a href={m.link} target="_blank" rel="noopener noreferrer" className="-my-1 inline-flex min-h-6 shrink-0 items-center py-1 text-xs underline" aria-label={`Ouvrir dans Gmail : ${m.subject || 'sans objet'}`}>
                      Gmail
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="py-2 text-sm text-[var(--ink-muted)]">Aucun mail dans cette boîte.</p>
      )}
    </section>
  );
}

export default function MailsPanel({ state, now }) {
  const rows = state.data ?? [];
  return (
    <Panel title="Mails" state={state} file="agenda.sql" className="xl:h-full" bodyClassName="flex min-h-0 flex-1 flex-col gap-2 p-3">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
        {MAILBOXES.map(({ source, label, address, readElsewhere }) => (
          <Mailbox key={source} label={label} address={address} readElsewhere={readElsewhere} mails={latestMails(rows, source)} />
        ))}
      </div>
      {!state.error && <SyncFooter rows={rows} href="https://mail.google.com/" label="Ouvrir Gmail" now={now} className="mt-0" note=" · lecture seule" />}
    </Panel>
  );
}
