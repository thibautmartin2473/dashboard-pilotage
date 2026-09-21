'use client';

import { useState } from 'react';
import Panel from './Panel';
import { ErrorLine, SyncFooter, ToggleButton, mutedClass, useAction } from './ui';
import { setMailFilter } from '@/app/edit-actions';
import { MAIL_LIMIT, formatMailDate, latestMails } from '@/lib/home';

const FILTERS = [
  ['all', 'Tous'],
  ['gmail', 'Gmail'],
  ['edhec', 'EDHEC'],
];

// Les 50 derniers mails de l'instantané (`mail_items`), du plus récent au plus ancien, sans
// aucune pondération. Lecture seule : on les traite dans Gmail. Le filtre choisi est enregistré
// (dashboard_settings, clé mail_filter) pour survivre au rechargement et suivre d'un appareil à
// l'autre ; si l'enregistrement échoue (table absente...), il reste actif en état local.
export default function MailsPanel({ state, savedFilter, settings, now }) {
  const [filter, setFilter] = useState(savedFilter);
  const [seen, setSeen] = useState(savedFilter);
  if (savedFilter !== seen) {
    setSeen(savedFilter); // valeur enregistrée depuis un autre appareil
    setFilter(savedFilter);
  }
  const { pending, error, run } = useAction();

  const rows = state.data ?? [];
  const items = latestMails(rows, filter);
  const settingsProblem =
    settings.error === 'missing'
      ? 'Filtre non enregistré : table manquante, exécuter supabase/dashboard-edit.sql'
      : settings.error
        ? `Filtre non enregistré : ${settings.message}`
        : null;

  return (
    <Panel title="Mails" count={state.data ? `${items.length}/${MAIL_LIMIT}` : undefined} state={state} file="agenda.sql">
      <div className="mb-2 flex flex-wrap gap-2" role="group" aria-label="Filtrer les mails">
        {FILTERS.map(([value, label]) => (
          <ToggleButton
            key={value}
            pressed={filter === value}
            disabled={pending}
            onClick={() => {
              setFilter(value);
              run(() => setMailFilter(value));
            }}
          >
            {label}
          </ToggleButton>
        ))}
      </div>
      <ErrorLine error={error ?? settingsProblem} />
      <p className={`mb-1 ${mutedClass}`}>Lecture seule : les mails se traitent dans Gmail.</p>
      {items.length ? (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-900" data-testid="mail-list">
          {items.map((m) => (
            <li key={m.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-1.5 text-sm">
              <span className="min-w-0 basis-40 truncate font-medium">{m.sender || 'Expéditeur inconnu'}</span>
              <span className="min-w-0 flex-1 basis-48 break-words">
                {m.unread !== false && (
                  <span className="mr-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    non lu
                  </span>
                )}
                {m.subject || '(sans objet)'}
              </span>
              <span className={`tabular-nums ${mutedClass}`}>{formatMailDate(m.received_at)}</span>
              {m.link && (
                <a href={m.link} target="_blank" rel="noopener noreferrer" className="text-xs underline">
                  Gmail
                </a>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Aucun mail{filter === 'all' ? '' : ' pour ce filtre'}.</p>
      )}
      {!state.error && <SyncFooter rows={rows} href="https://mail.google.com/" label="Ouvrir Gmail" now={now} />}
    </Panel>
  );
}
