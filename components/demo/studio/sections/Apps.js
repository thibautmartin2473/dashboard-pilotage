'use client';

import { STATUS_LABELS } from '@/lib/constants';
import { ArrowOut, Card, Empty, Group, Page, Pill, Row, Rows } from './kit';

const host = (url) => String(url ?? '').replace(/^https?:\/\//, '').replace(/\/$/, '');
const statusTone = (s) => (s === 'done' ? 'success' : s === 'blocked' ? 'danger' : s === 'in_progress' ? 'warning' : 'muted');

// Apps et projets : les raccourcis vers les outils, puis l'état de chaque projet.
export default function AppsView({ data }) {
  return (
    <Page
      eyebrow="Raccourcis et suivi"
      title="Apps et projets"
      lead={`${data.apps.length} app${data.apps.length > 1 ? 's' : ''} et ${data.projects.length} projet${data.projects.length > 1 ? 's' : ''}.`}
    >
      <Group title="Apps" count={data.apps.length} flush>
        {data.apps.length === 0 ? (
          <Card>
            <Empty>Aucune app enregistrée.</Empty>
          </Card>
        ) : (
          <ul className="grid grid-cols-1 gap-[var(--k-gap)] sm:grid-cols-2 lg:grid-cols-3">
            {data.apps.map((a) => {
              const safe = typeof a.url === 'string' && a.url.startsWith('http');
              const body = (
                <>
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0 text-[15px] leading-snug font-medium break-words text-[color:var(--text)] [font-family:var(--font-display)]">{a.name}</span>
                    {safe && <ArrowOut className="mt-0.5 size-3.5 shrink-0 text-[color:var(--text-muted)] group-hover:text-[color:var(--accent)]" />}
                  </span>
                  <span className="mt-1 block truncate text-xs text-[color:var(--text-muted)] [font-family:var(--font-mono)]">{host(a.url)}</span>
                  {a.project_slug && (
                    <span className="mt-3 block">
                      <Pill>{a.project_slug}</Pill>
                    </span>
                  )}
                </>
              );
              const cls =
                'group block h-full rounded-[var(--radius)] border border-[color:var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow)] transition-colors hover:border-[color:var(--accent)]';
              return (
                <li key={a.id}>
                  {safe ? (
                    <a href={a.url} target="_blank" rel="noopener noreferrer" className={cls}>
                      {body}
                    </a>
                  ) : (
                    <div className={cls}>{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Group>

      <Group title="Projets" count={data.projects.length}>
        {data.projects.length === 0 ? (
          <Empty>Aucun projet.</Empty>
        ) : (
          <Rows>
            {data.projects.map((p) => (
              <Row key={p.id} className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium text-[color:var(--text)]">{p.name}</p>
                  <p className="truncate text-xs text-[color:var(--text-muted)] [font-family:var(--font-mono)]">{p.slug}</p>
                </div>
                <Pill tone={statusTone(p.status)}>{STATUS_LABELS[p.status] ?? p.status ?? 'sans statut'}</Pill>
              </Row>
            ))}
          </Rows>
        )}
      </Group>
    </Page>
  );
}
