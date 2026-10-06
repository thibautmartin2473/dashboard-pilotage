'use client';

import { useMemo } from 'react';
import { formatMailDate, latestMails } from '@/lib/home';
import { ArrowOut, Card, Dot, Empty, Page, Pill, Row, Rows } from './kit';

// Mails : lecture seule, les 12 plus récents, du plus récent au plus ancien. On les traite dans Gmail.
export default function MailsView({ data }) {
  const mails = useMemo(() => latestMails(data.mails, 'all', 12), [data.mails]);
  const unread = data.mails.filter((m) => m.unread !== false).length;

  return (
    <Page
      eyebrow="Lecture seule"
      title="Mails"
      lead={
        data.mails.length === 0
          ? 'Aucun mail synchronisé.'
          : `${data.mails.length} mail${data.mails.length > 1 ? 's' : ''} synchronisé${data.mails.length > 1 ? 's' : ''}, dont ${unread} non lu${unread > 1 ? 's' : ''}. Ils se traitent dans Gmail.`
      }
    >
      <Card>
        {mails.length === 0 ? (
          <Empty>Boîte vide.</Empty>
        ) : (
          <Rows>
            {mails.map((m) => {
              const isUnread = m.unread !== false;
              const href = typeof m.link === 'string' && m.link.startsWith('http') ? m.link : null;
              return (
                <Row key={m.id} className="grid grid-cols-[0.5rem_minmax(0,1fr)] items-start gap-x-3">
                  <span className="mt-[7px]">{isUnread && <Dot color="var(--accent)" />}</span>
                  <div className="min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className={`min-w-0 truncate text-sm ${isUnread ? 'font-semibold text-[color:var(--text)]' : 'text-[color:var(--text-muted)]'}`}>
                        {m.sender || 'Expéditeur inconnu'}
                      </span>
                      <span className="shrink-0 text-xs text-[color:var(--text-muted)] [font-family:var(--font-mono)]">{formatMailDate(m.received_at)}</span>
                    </div>
                    <p className="mt-0.5 text-[15px] leading-snug break-words text-[color:var(--text)]">{m.subject || '(sans objet)'}</p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                      {m.important && <Pill tone="warning">Important</Pill>}
                      {m.source && <Pill>{m.source === 'edhec' ? 'EDHEC' : 'Gmail'}</Pill>}
                      {href && (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[color:var(--accent)] underline-offset-2 hover:underline"
                        >
                          Ouvrir
                          <ArrowOut className="size-3" />
                        </a>
                      )}
                    </p>
                  </div>
                </Row>
              );
            })}
          </Rows>
        )}
      </Card>
    </Page>
  );
}
