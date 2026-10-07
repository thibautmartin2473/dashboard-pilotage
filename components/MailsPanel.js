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
  { source: 'gmail', address: 'thibautmartin04@gmail.com' },
  { source: 'edhec', address: 'thibaut.martin95429@edhec.com', readElsewhere: true },
];

function Mailbox({ address, mails, readElsewhere = false }) {
  const unread = readElsewhere ? 0 : mails.filter((m) => m.unread !== false).length;
  return (
    <section aria-label={address} className="min-w-0" data-testid={`mailbox-${address}`}>
      <h3 className="mb-1 flex flex-wrap items-baseline gap-x-2 border-b border-zinc-800 pb-1.5 text-sm font-semibold text-zinc-100">
        <span className="min-w-0 break-all">{address}</span>
        {readElsewhere ? (
          <span className="font-mono text-[11px] font-normal text-zinc-400">lus dans Outlook</span>
        ) : (
          <span className="tabular rounded-full border border-zinc-700 bg-zinc-950 px-2 py-0.5 font-mono text-[11px] font-normal text-zinc-400" data-testid="unread-count">
            {unread} non lu{unread > 1 ? 's' : ''}
          </span>
        )}
      </h3>
      {mails.length ? (
        <ul className="divide-y divide-zinc-800" data-testid="mail-list">
          {mails.map((m) => {
            const isUnread = !readElsewhere && m.unread !== false;
            return (
              <li key={m.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-1.5 text-sm">
                <span className={`min-w-0 basis-36 truncate ${isUnread ? 'font-bold text-zinc-100' : 'font-medium text-zinc-400'}`}>
                  {m.sender || 'Expéditeur inconnu'}
                </span>
                <span className={`min-w-0 flex-1 basis-48 break-words ${isUnread ? 'font-bold text-zinc-100' : 'text-zinc-400'}`}>
                  {m.subject || '(sans objet)'}
                </span>
                <span className={`tabular-nums ${mutedClass}`}>{formatMailDate(m.received_at)}</span>
                {m.link && (
                  <a href={m.link} target="_blank" rel="noopener noreferrer" className="text-xs underline">
                    Gmail
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="py-2 text-sm text-zinc-400">Aucun mail dans cette boîte.</p>
      )}
    </section>
  );
}

export default function MailsPanel({ state, now }) {
  const rows = state.data ?? [];
  return (
    <Panel title="Mails" state={state} file="agenda.sql">
      <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
        {MAILBOXES.map(({ source, address, readElsewhere }) => (
          <Mailbox key={source} address={address} readElsewhere={readElsewhere} mails={latestMails(rows, source)} />
        ))}
      </div>
      <p className={`mt-2 ${mutedClass}`}>Lecture seule : les mails se traitent dans Gmail.</p>
      {!state.error && <SyncFooter rows={rows} href="https://mail.google.com/" label="Ouvrir Gmail" now={now} />}
    </Panel>
  );
}
