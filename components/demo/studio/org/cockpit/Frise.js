'use client';

// La frise : une colonne par jour (1, 3 ou 7), blocs dans l'ordre du temps, tâches DANS les blocs.
// Les blocs de travail sont des cibles de glisser-déposer ; tout reste en état local (Home.js).
import { cleanTitle, layoutDay, minToLabel, minutesLabel } from './lib';
import { DISPLAY, FOCUS, IconChevron, IconGrip, LABEL, MONO, catColor, catToken, tint } from './ui';

const COLS = {
  jour: 'grid-cols-1',
  trois: 'grid-cols-[repeat(3,minmax(14rem,1fr))]',
  semaine: 'grid-cols-[repeat(7,minmax(13rem,1fr))]',
};

export default function Frise({ week, view, nowMin, byBlock, open, onToggleOpen, drag, onToggleTask }) {
  const multi = view !== 'jour';
  return (
    <div className={`grid items-start gap-x-5 gap-y-6 ${COLS[view]}`}>
      {week.days.map((d) => (
        <Column key={d.day} d={d} view={view} multi={multi} nowMin={nowMin} byBlock={byBlock} open={open} onToggleOpen={onToggleOpen} drag={drag} onToggleTask={onToggleTask} />
      ))}
    </div>
  );
}

function Column({ d, view, multi, nowMin, byBlock, open, onToggleOpen, drag, onToggleTask }) {
  const items = layoutDay(d, nowMin);
  const spine = view === 'jour';
  const tasksOfDay = d.blocks.flatMap((b) => byBlock.get(b.id) ?? []);
  const doneCount = tasksOfDay.filter((t) => t.done).length;
  return (
    <section aria-label={d.label} data-today={d.isToday ? '' : undefined} className="min-w-0">
      {multi && (
        <header className="sticky top-0 z-10 bg-[var(--bg)] pb-3"><div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-b border-[color:var(--border-strong)] pt-1 pb-2">
          <h3 className={`${DISPLAY} flex items-baseline gap-2 whitespace-nowrap text-[15px] font-semibold ${d.isPast ? 'text-[var(--text-muted)]' : 'text-[var(--text)]'}`}>
            {d.short}
            {d.isToday && (
              <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--accent-contrast)] uppercase [font-family:var(--font-body)]">
                Aujourd&apos;hui
              </span>
            )}
          </h3>
          {tasksOfDay.length > 0 && (
            <span className={`${MONO} ml-auto text-[11px] whitespace-nowrap text-[var(--text-muted)]`}>
              {doneCount}/{tasksOfDay.length} faites
            </span>
          )}
          </div>
        </header>
      )}

      {d.allDay.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-1.5" aria-label="Toute la journée">
          {d.allDay.map((e) => (
            <li
              key={e.id}
              className="max-w-full truncate rounded-[var(--radius-sm)] border border-[color:var(--border)] bg-[var(--surface-2)] px-2 py-1 text-[12px] text-[var(--text-muted)]"
              title={e.title}
            >
              <span className={`${LABEL} mr-1.5 text-[var(--text-faint)]`}>Jour entier</span>
              {cleanTitle(e.title)}
            </li>
          ))}
        </ul>
      )}

      {items.length === 0 ? (
        <p className="rounded-[var(--radius)] border border-dashed border-[color:var(--border-strong)] px-3 py-6 text-center text-[13px] text-[var(--text-muted)]">
          Journée libre.
        </p>
      ) : (
        <div>
          {items.map((it) => {
            if (it.type === 'now') return <NowRow key={it.key} spine={spine} nowMin={nowMin} />;
            if (it.type === 'gap') return <GapRow key={it.key} spine={spine} minutes={it.minutes} />;
            return (
              <BlockRow
                key={it.key}
                block={it.block}
                live={it.live}
                spine={spine}
                tasks={byBlock.get(it.block.id) ?? []}
                isOpen={open[it.block.id] ?? view === 'jour'}
                onToggleOpen={() => onToggleOpen(it.block.id, view === 'jour')}
                drag={drag}
                onToggleTask={onToggleTask}
                past={d.isPast || (d.isToday && it.block.endMin <= nowMin)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

// Rangée avec colonne d'heures à gauche (vue Jour) : l'axe du temps est le trait vertical continu.
function Row({ spine, time, sub, dot, children }) {
  if (!spine) return <div className="pb-2.5">{children}</div>;
  return (
    <div className="grid grid-cols-[3.4rem_minmax(0,1fr)] gap-x-4">
      <div className="relative border-r border-[color:var(--border-strong)] pt-3 pr-3 text-right">
        {time && <div className={`${MONO} text-[13px] leading-none font-semibold text-[var(--text)]`}>{time}</div>}
        {sub && <div className={`${MONO} mt-1 text-[11px] leading-none text-[var(--text-faint)]`}>{sub}</div>}
        {dot && <span className="absolute top-[0.95rem] -right-[4.5px] size-[8px] rounded-full" style={{ background: dot }} />}
      </div>
      <div className="min-w-0 pb-2.5">{children}</div>
    </div>
  );
}

function NowRow({ spine, nowMin }) {
  return (
    <div data-now="">
      <Row spine={spine} time={minToLabel(nowMin)} dot="var(--accent)">
        <div className="flex items-center gap-2 py-1.5" role="separator" aria-label={`Maintenant, ${minToLabel(nowMin)}`}>
          <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--accent-contrast)] uppercase">Maintenant</span>
          <span className="h-px flex-1 bg-[var(--accent)]" />
        </div>
      </Row>
    </div>
  );
}

function GapRow({ spine, minutes }) {
  const h = Math.min(20 + (minutes / 60) * 12, 64);
  return (
    <Row spine={spine}>
      <div className="flex items-center gap-2 text-[11px] text-[var(--text-faint)]" style={{ minHeight: `${h}px` }}>
        <span className="h-px w-3 border-t border-dotted border-[color:var(--border-strong)]" />
        {minutesLabel(minutes)}
      </div>
    </Row>
  );
}

function BlockRow({ block, live, spine, tasks, isOpen, onToggleOpen, drag, onToggleTask, past }) {
  const work = block.category?.kind === 'tache';
  const token = catToken(block.category);
  const start = minToLabel(block.startMin);
  const end = minToLabel(block.endMin);
  const done = tasks.filter((t) => t.done).length;
  const complete = tasks.length > 0 && done === tasks.length;
  const armed = work && drag.id !== null; // un glisser est en cours : les blocs de travail s'illuminent
  const hovered = armed && drag.hover === block.id;
  const compact = !spine;

  return (
    <Row spine={spine} time={start} sub={end} dot={catColor(block.category)}>
      <article
        data-block={block.id}
        data-live={live ? '' : undefined}
        onDragOver={work ? (e) => { if (drag.id !== null) { e.preventDefault(); drag.over(block.id); } } : undefined}
        onDragLeave={work ? () => drag.over(null) : undefined}
        onDrop={work ? (e) => { e.preventDefault(); drag.drop(block.id); } : undefined}
        className={`overflow-hidden rounded-[var(--radius)] border border-l-[5px] [box-shadow:var(--shadow)] transition-[outline-color,background-color] ${
          hovered ? 'outline-2 outline-solid outline-[color:var(--accent)]' : armed ? 'outline-2 outline-dashed outline-[color:var(--accent)]' : live ? 'outline-2 outline-solid outline-[color:var(--accent)]' : ''
        } ${past && !live ? 'opacity-80' : ''}`}
        style={{
          borderColor: 'var(--border)',
          borderLeftColor: catColor(block.category),
          background: hovered ? 'var(--accent-soft)' : work ? tint(token, 9) : 'var(--surface)',
        }}
      >
        <button
          type="button"
          onClick={work ? onToggleOpen : undefined}
          aria-expanded={work ? isOpen : undefined}
          disabled={!work}
          className={`flex w-full items-start gap-2 px-3 py-2.5 text-left ${FOCUS} ${work ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <span className="min-w-0 flex-1">
            {compact && (
              <span className={`${MONO} block text-[11px] text-[var(--text-muted)]`}>
                {start} - {end}
              </span>
            )}
            <span className={`${DISPLAY} block text-[15px] leading-snug font-semibold ${compact ? 'line-clamp-2 text-[13px]' : ''} ${work ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
              {cleanTitle(block.title)}
            </span>
            {!work && <span className="mt-0.5 block text-[11px] text-[var(--text-faint)]">{block.category?.name}</span>}
          </span>
          <span className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
            {live && <Chip tone="accent">En cours</Chip>}
            {block.conflict && <Chip tone="warning">Chevauche</Chip>}
            {hovered && <Chip tone="accent">Déposer ici</Chip>}
            {work && tasks.length > 0 && (
              <Chip tone={complete ? 'success' : 'plain'}>
                {complete ? 'Tenu' : `${done}/${tasks.length}`}
              </Chip>
            )}
            {work && <span className="text-[var(--text-faint)]"><IconChevron open={isOpen} /></span>}
          </span>
        </button>

        {work && isOpen && (
          <div className="px-3 pb-3">
            {tasks.length === 0 ? (
              <p className="rounded-[var(--radius-sm)] border border-dashed border-[color:var(--border-strong)] px-2.5 py-2 text-[12px] text-[var(--text-muted)]">
                Bloc libre. Glissez une tâche du tiroir « À placer » ici.
              </p>
            ) : (
              <ul className="space-y-0.5">
                {tasks.map((t) => (
                  <li
                    key={t.id}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(t.id)); e.dataTransfer.effectAllowed = 'move'; drag.start(t.id); }}
                    onDragEnd={drag.end}
                    className="group flex items-start gap-2 rounded-[var(--radius-sm)] px-1.5 py-1 hover:bg-[var(--surface-2)]"
                  >
                    <span className="mt-0.5 hidden cursor-grab text-[var(--text-faint)] opacity-60 group-hover:opacity-100 sm:block" title="Glisser vers un autre bloc ou vers le tiroir">
                      <IconGrip />
                    </span>
                    <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2 text-[13px] leading-snug">
                      <input
                        type="checkbox"
                        checked={t.done}
                        onChange={() => onToggleTask(t)}
                        className={`mt-[1px] size-4 shrink-0 cursor-pointer [accent-color:var(--accent)] ${FOCUS}`}
                      />
                      <span className={t.done ? 'text-[var(--text-faint)] line-through' : 'text-[var(--text)]'}>{t.title}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {work && tasks.length > 0 && (
          <div className="h-[3px] bg-[var(--border)]" aria-hidden="true">
            <div className="h-full" style={{ width: `${Math.round((done / tasks.length) * 100)}%`, background: complete ? 'var(--success)' : 'var(--accent)' }} />
          </div>
        )}
      </article>
    </Row>
  );
}

function Chip({ tone, children }) {
  const cls =
    tone === 'accent'
      ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
      : tone === 'success'
        ? 'bg-[var(--success)] text-[var(--accent-contrast)]'
        : tone === 'warning'
          ? 'border border-[color:var(--warning)] text-[var(--warning)]'
          : 'border border-[color:var(--border-strong)] text-[var(--text-muted)]';
  return <span className={`${MONO} rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${cls}`}>{children}</span>;
}
