'use client';

import Panel from './Panel';
import { SyncFooter } from './ui';
import { formatMailDate, latestMails } from '@/lib/home';

// UNE seule liste : les deux boîtes (thibautmartin04@gmail.com = source `gmail`, thibaut.martin95429@edhec.com
// = source `edhec`) fusionnées, en tri strict par date décroissante (latestMails, sans pondération). Une ligne
// par mail (expéditeur, objet) ; la ligne entière est un lien qui ouvre le mail dans Gmail. Les mails EDHEC
// portent l'étiquette « EDHEC ».
// Exception EDHEC (règle de Thibaut, 2026-10-07) : il lit ces mails dans Outlook, ils restent « non lus »
// dans Gmail ; ils n'ont donc ni gras ni compteur de non lus. Lecture seule (instantané `mail_items`).
const PARIS = 'Europe/Paris';
const parisDay = (iso) => new Date(iso).toLocaleDateString('en-CA', { timeZone: PARIS });

// Heure du jour pour un mail d'aujourd'hui, sinon « 21/09 » ; la date complète est en infobulle.
function shortDate(iso, now) {
  if (!iso) return '';
  if (parisDay(iso) === parisDay(new Date(now).toISOString())) {
    return new Date(iso).toLocaleTimeString('fr-FR', { timeZone: PARIS, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  }
  return new Date(iso).toLocaleDateString('fr-FR', { timeZone: PARIS, day: '2-digit', month: '2-digit' });
}

function MailRow({ mail, now }) {
  const edhec = mail.source === 'edhec';
  const unread = !edhec && mail.unread !== false;
  const sender = mail.sender || 'Expéditeur inconnu';
  const subject = mail.subject || '(sans objet)';
  const content = (
    <>
      {edhec && <span className="shrink-0 rounded-md bg-[var(--action-soft)] px-1.5 py-0.5 text-xs font-medium text-[var(--action-ink)]">EDHEC</span>}
      <span className={`max-w-[38%] shrink-0 truncate text-sm ${unread ? 'font-semibold' : 'font-medium text-[var(--ink-muted)]'}`}>{sender}</span>
      <span className={`min-w-0 flex-1 truncate text-sm ${unread ? 'font-semibold' : 'text-[var(--ink-muted)]'}`}>{subject}</span>
      <span className="tabular shrink-0 text-xs text-[var(--ink-muted)]" title={formatMailDate(mail.received_at)}>
        {shortDate(mail.received_at, now)}
      </span>
    </>
  );
  const row = 'flex min-h-10 items-center gap-2 rounded-xl px-2.5 py-1.5 [@media(pointer:coarse)]:min-h-11';
  return mail.link ? (
    <a
      href={mail.link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${edhec ? 'EDHEC, ' : ''}${sender}, ${subject} (ouvre Gmail)`}
      title={`${sender} : ${subject}`}
      className={`${row} hover:bg-[var(--btn-fill)]`}
    >
      {content}
    </a>
  ) : (
    <div className={row}>{content}</div>
  );
}

export default function MailsPanel({ state, now }) {
  const rows = state.data ?? [];
  const mails = latestMails(rows);
  const unreadGmail = mails.filter((m) => (m.source ?? 'gmail') === 'gmail' && m.unread !== false).length;
  return (
    <Panel title="Mails" state={state} file="agenda.sql" className="xl:h-full" bodyClassName="flex min-h-0 flex-1 flex-col gap-2 p-2">
      {mails.length ? (
        <ul className="min-h-0 flex-1 overflow-y-auto max-xl:max-h-80" data-testid="mail-list">
          {mails.map((m) => (
            <li key={m.id}>
              <MailRow mail={m} now={now} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-2 py-2 text-sm text-[var(--ink-muted)]">Aucun mail.</p>
      )}
      {!state.error && (
        <SyncFooter
          rows={rows}
          href="https://mail.google.com/"
          label="Ouvrir Gmail"
          now={now}
          className="mt-0 px-2"
          note={` · ${unreadGmail} non lu${unreadGmail > 1 ? 's' : ''} sur Gmail`}
        />
      )}
    </Panel>
  );
}
