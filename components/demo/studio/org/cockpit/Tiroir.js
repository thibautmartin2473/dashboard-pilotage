'use client';

// Le tiroir « À placer » : tâches sans bloc ou dont le bloc est passé. On en fait glisser une sur un
// bloc de la frise ; le bouton fait la même chose au toucher. Déposer une tâche ici la sort de son bloc.
import { useState } from 'react';
import { BTN_SM, CARD, DISPLAY, FOCUS, IconArrow, IconChevron, IconGrip, LABEL, MONO } from './ui';

const PREVIEW = 6;

export default function Tiroir({ tray, waiting, drag, onToggleDone, onPlace }) {
  const [open, setOpen] = useState(true);
  const [all, setAll] = useState(false);
  const shown = all ? tray : tray.slice(0, PREVIEW);
  const overdue = tray.filter((x) => x.overdue).length;
  const armed = drag.id !== null;

  return (
    <section
      aria-label="À placer"
      onDragOver={(e) => { if (armed) { e.preventDefault(); drag.over('tiroir'); } }}
      onDragLeave={() => drag.over(null)}
      onDrop={(e) => { e.preventDefault(); drag.drop(null); }}
      className={`${CARD} p-3 ${armed ? 'outline-2 outline-dashed outline-[color:var(--accent)]' : ''} ${armed && drag.hover === 'tiroir' ? 'bg-[var(--accent-soft)]' : ''}`}
    >
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className={`flex w-full items-center justify-between gap-2 text-left ${FOCUS}`}>
        <span className="flex items-baseline gap-2">
          <span className={`${DISPLAY} text-[16px] font-semibold text-[var(--text)]`}>À placer</span>
          <span className={`${MONO} rounded-full bg-[var(--accent)] px-2 py-0.5 text-[11px] font-semibold text-[var(--accent-contrast)]`}>{tray.length}</span>
        </span>
        <span className="text-[var(--text-faint)]"><IconChevron open={open} /></span>
      </button>

      {open && (
        <div className="mt-1">
          <p className="text-[12px] leading-snug text-[var(--text-muted)]">
            {tray.length === 0
              ? 'Tout est dans un bloc.'
              : `${overdue > 0 ? `${overdue} en retard, ` : ''}${tray.length - overdue} sans bloc ou à recaser. Glissez sur la frise.`}
            {waiting > 0 && ` ${waiting} d'hier attendent le bilan.`}
          </p>

          {tray.length > 0 && (
            <ul className={`mt-2 space-y-1.5 ${all ? 'max-h-[26rem] overflow-y-auto pr-1' : ''}`}>
              {shown.map(({ task, reason, overdue: late }) => (
                <li
                  key={task.id}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(task.id)); e.dataTransfer.effectAllowed = 'move'; drag.start(task.id); }}
                  onDragEnd={drag.end}
                  className="group rounded-[var(--radius-sm)] border border-[color:var(--border)] bg-[var(--surface-2)] px-2 py-2"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 hidden cursor-grab text-[var(--text-faint)] opacity-60 group-hover:opacity-100 sm:block" title="Glisser sur un bloc de la frise">
                      <IconGrip />
                    </span>
                    <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2 text-[13px] leading-snug">
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => onToggleDone(task)}
                        className={`mt-[1px] size-4 shrink-0 cursor-pointer [accent-color:var(--accent)] ${FOCUS}`}
                        aria-label={`Marquer fait : ${task.title}`}
                      />
                      <span className="line-clamp-2 text-[var(--text)]">{task.title}</span>
                    </label>
                  </div>
                  <p className={`mt-1 pl-0 text-[11px] sm:pl-5 ${late ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'}`}>{reason}</p>
                  <div className="mt-1.5 sm:pl-5">
                    <button type="button" onClick={() => onPlace(task)} className={`${BTN_SM}`}>
                      Placer dans le prochain bloc <IconArrow />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {tray.length > PREVIEW && (
            <button type="button" onClick={() => setAll((a) => !a)} className={`${LABEL} mt-2 underline underline-offset-2 ${FOCUS}`}>
              {all ? 'Replier la liste' : `Voir les ${tray.length - PREVIEW} autres`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
