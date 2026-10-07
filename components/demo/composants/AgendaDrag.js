'use client';

// Glisser une tâche vers un créneau de l'agenda : on prend la carte « À ranger » par sa poignée (souris,
// doigt, ou Entrée au clavier), un fantôme montre le créneau d'arrivée calé sur 15 min, aimanté sur les bords
// des blocs voisins (10 min de portée), et poussé « à la suite » d'une tâche plutôt que posé dessus.
// Les tâches posées se déplacent de la même façon (ou aux flèches). Pendant le glisser rien n'est animé :
// le fantôme suit le pointeur. En vrai : @atlaskit/pragmatic-drag-and-drop.
import { useEffect, useRef, useState } from 'react';
import { fmtDur, fmtHM } from './ui';

export const START = 480; // 8h
export const END = 1200; // 20h
const STEP = 15;
const MAG = 10;
export const HOUR_PX = 44;
const PPM = HOUR_PX / 60;
const y = (min) => (min - START) * PPM;

export function useAgendaDrag({ events, placed, onPlace, onMove, onSay }) {
  const colRef = useRef(null);
  const live = useRef({ events, placed, onPlace, onMove, onSay });
  const spec = useRef(null);
  const last = useRef(null);
  const [drag, setDrag] = useState(null);

  useEffect(() => {
    live.current = { events, placed, onPlace, onMove, onSay };
  });

  const solve = (raw, dur, key, dir = 1) => {
    const { events: evs, placed: pl } = live.current;
    const blocks = [
      ...evs.map((e) => ({ s: e.start, e: e.end, task: e.cat === 'tache', title: e.title })),
      ...pl.filter((p) => p.key !== key).map((p) => ({ s: p.start, e: p.start + p.dur, task: true, title: p.title })),
    ];
    let start = Math.round(raw / STEP) * STEP;
    let snap = null;
    let best = MAG;
    for (const b of blocks) {
      for (const edge of [b.s, b.e]) {
        if (Math.abs(raw - edge) < best) {
          best = Math.abs(raw - edge);
          start = edge;
          snap = edge;
        }
        if (Math.abs(raw + dur - edge) < best) {
          best = Math.abs(raw + dur - edge);
          start = edge - dur;
          snap = edge;
        }
      }
    }
    let note = null;
    const tasks = blocks.filter((b) => b.task);
    for (let n = 0; n < 12; n += 1) {
      const hit = tasks.find((t) => start < t.e && start + dur > t.s);
      if (!hit) break;
      start = dir > 0 ? hit.e : hit.s - dur;
      snap = dir > 0 ? hit.e : hit.s;
      note = `${dir > 0 ? 'à la suite de' : 'avant'} « ${hit.title} »`;
    }
    const valid = start >= START && start + dur <= END;
    const plage = blocks.find((b) => !b.task && start < b.e && start + dur > b.s);
    return { start, snap, note, valid, plage: plage?.title ?? null };
  };

  const describe = (r, dur) =>
    r.valid ? `${fmtHM(r.start)} à ${fmtHM(r.start + dur)}${r.note ? `, ${r.note}` : ''}${r.plage ? `, pendant ${r.plage}` : ''}` : 'hors de la journée';

  const update = (e) => {
    const s = spec.current;
    const col = colRef.current;
    if (!s || !col) return;
    const rect = col.getBoundingClientRect();
    const over = e.clientX > rect.left - 24 && e.clientX < rect.right + 24 && e.clientY > rect.top - 30 && e.clientY < rect.bottom + 30;
    const raw = (e.clientY - rect.top - s.grabY) / PPM + START;
    const r = solve(raw, s.dur, s.key, 1);
    const next = { ...s, ...r, over, x: e.clientX, y: e.clientY, mode: 'pointer' };
    last.current = next;
    setDrag(next);
  };

  const finish = () => {
    const d = last.current;
    spec.current = null;
    last.current = null;
    setDrag(null);
    if (!d) return;
    if (d.over && d.valid) {
      if (d.isNew) live.current.onPlace(d.start, d.dur);
      else live.current.onMove(d.key, d.start, d.from);
      live.current.onSay(`Posé : ${describe(d, d.dur)}.`);
    } else if (d.over) {
      live.current.onSay('Créneau hors de la journée : rien n’a bougé.');
    }
  };

  const cancel = (msg) => {
    spec.current = null;
    last.current = null;
    setDrag(null);
    if (msg) live.current.onSay(msg);
  };

  const pointerStart = (e, s) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    spec.current = s;
    update(e);
  };

  const keyDrag = (e, s) => {
    const d = last.current;
    if (!d || d.key !== s.key) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      e.stopPropagation();
      const r = solve(s.isNew ? 540 : s.from, s.dur, s.key, 1);
      const next = { ...s, ...r, over: true, mode: 'keys' };
      last.current = next;
      spec.current = s;
      setDrag(next);
      live.current.onSay(`Tâche en main : ${describe(r, s.dur)}. Flèches pour déplacer, Entrée pour poser, Échap pour annuler.`);
      return;
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      const dir = e.key === 'ArrowDown' ? 1 : -1;
      const raw = d.start + dir * (e.shiftKey ? 60 : STEP);
      const r = solve(raw, d.dur, d.key, dir);
      const next = { ...d, ...r };
      last.current = next;
      setDrag(next);
      live.current.onSay(describe(r, d.dur));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      finish();
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
      cancel('Glisser annulé.');
    }
  };

  // Poignée de la carte en cours : la tâche n'existe pas encore dans l'agenda.
  const gripProps = (item, dur) => {
    const s = { key: item.key, title: item.title, dur, isNew: true, grabY: (dur * PPM) / 2 };
    return {
      onPointerDown: (e) => pointerStart(e, s),
      onPointerMove: (e) => spec.current && update(e),
      onPointerUp: finish,
      onPointerCancel: () => cancel(),
      onKeyDown: (e) => keyDrag(e, s),
      onBlur: () => last.current?.mode === 'keys' && cancel(),
    };
  };

  // Tâche déjà posée : on la reprend où on l'a saisie.
  const blockProps = (p) => {
    const s = { key: p.key, title: p.title, dur: p.dur, isNew: false, from: p.start };
    return {
      onPointerDown: (e) => {
        const r = e.currentTarget.getBoundingClientRect();
        pointerStart(e, { ...s, grabY: e.clientY - r.top });
      },
      onPointerMove: (e) => spec.current && update(e),
      onPointerUp: finish,
      onPointerCancel: () => cancel(),
      onKeyDown: (e) => keyDrag(e, s),
      onBlur: () => last.current?.mode === 'keys' && cancel(),
    };
  };

  return { colRef, drag, gripProps, blockProps };
}

export function AgendaColumn({ dayLabel, events, placed, drag, colRef, blockProps, sample, locked }) {
  const hours = [];
  for (let h = START / 60; h <= END / 60; h += 1) hours.push(h);
  const height = (END - START) * PPM;
  const plages = events.filter((e) => e.cat !== 'tache');
  const tasks = events.filter((e) => e.cat === 'tache');
  return (
    <section className="agenda" aria-label={`Agenda, ${dayLabel}`}>
      <header className="ag-head">
        <span className="lbl">Agenda</span>
        <strong className="ag-day">{dayLabel}</strong>
        {sample ? <span className="ag-note">jour type</span> : null}
        {locked ? <span className="ag-lock lbl">Rangement en cours : glisse une carte ici</span> : null}
      </header>
      <div className="ag-grid">
        <div className="ag-hours" aria-hidden="true" style={{ height }}>
          {hours.map((h) => (
            <span key={h} style={{ top: y(h * 60) }}>
              {String(h).padStart(2, '0')}
            </span>
          ))}
        </div>
        <div className="ag-col" ref={colRef} style={{ height }}>
          {hours.map((h) => (
            <span key={h} className="ag-line" style={{ top: y(h * 60) }} aria-hidden="true" />
          ))}
          {plages.map((e) => (
            <div key={e.id} className="blk blk-plage" style={{ top: y(e.start), height: (e.end - e.start) * PPM }}>
              <span className="blk-t">{e.title}</span>
              <span className="blk-h">
                {fmtHM(e.start)}-{fmtHM(e.end)}
              </span>
            </div>
          ))}
          {tasks.map((e) => (
            <div key={e.id} className="blk blk-tache" style={{ top: y(e.start), height: (e.end - e.start) * PPM }}>
              <span className="blk-t">{e.title}</span>
              <span className="blk-h">
                {fmtHM(e.start)}-{fmtHM(e.end)}
              </span>
            </div>
          ))}
          {placed.map((p) => (
            <div
              key={p.key}
              role="button"
              tabIndex={0}
              aria-label={`${p.title}, ${fmtHM(p.start)} à ${fmtHM(p.start + p.dur)}. Entrée pour déplacer au clavier`}
              className={`blk blk-tache is-placed${drag?.key === p.key ? ' is-lifted' : ''}`}
              style={{ top: y(p.start), height: p.dur * PPM }}
              {...blockProps(p)}
            >
              <span className="blk-t">{p.title}</span>
              <span className="blk-h">
                {fmtHM(p.start)}-{fmtHM(p.start + p.dur)}
              </span>
            </div>
          ))}
          {drag?.over ? (
            <>
              {drag.snap != null && drag.valid ? (
                <span className="snapline" style={{ top: y(drag.snap) }} aria-hidden="true">
                  <span className="lbl">Aimanté {fmtHM(drag.snap)}</span>
                </span>
              ) : null}
              <div className="ghost" data-valid={drag.valid ? 'true' : 'false'} data-snapped={drag.snap != null ? 'true' : 'false'} style={{ top: y(Math.max(START, Math.min(END - drag.dur, drag.start))), height: drag.dur * PPM }} aria-hidden="true">
                <span className="ghost-t">{drag.valid ? `${fmtHM(drag.start)}-${fmtHM(drag.start + drag.dur)}` : 'Hors journée'}</span>
                <span className="ghost-d">{fmtDur(drag.dur)}</span>
                <span className="measure">
                  <span>{fmtDur(drag.dur)}</span>
                </span>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}

// L'objet porté sous le doigt pendant un glisser au pointeur (position fixe, suit le pointeur).
export function Carried({ drag }) {
  if (!drag || drag.mode !== 'pointer') return null;
  return (
    <div className="carried" style={{ transform: `translate3d(${drag.x + 14}px, ${drag.y - 18}px, 0)` }} aria-hidden="true">
      <span className="carried-t">{drag.title.length > 38 ? `${drag.title.slice(0, 37)}…` : drag.title}</span>
      <span className="carried-d">{fmtDur(drag.dur)}</span>
    </div>
  );
}
