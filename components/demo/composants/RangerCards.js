'use client';

// Carte « À ranger » et ses pièces : progression du rangement forcé (rouleaux, afficheur ou couronne),
// carte avec suggestion et 5 gestes (boutons, clavier, balayage au doigt), menu « Affecter ailleurs »,
// panneau « Plus tard » (molette, touches ou règle). État local seulement, rien n'est écrit.
import { useEffect, useRef, useState } from 'react';
import { Ann, Bezel, Btn, Check, GuardSwitch, Icon, Kbd, Knob, Roll, Ruler, Seg, SevenSeg } from './ui';

export function Progress({ sys, done, total, late }) {
  const left = Math.max(0, total - done);
  const say = left ? `${left} à ranger sur ${total}` : 'Tout est rangé';
  if (sys === 'planche') {
    return (
      <div className="prog prog-planche">
        <div className="odo">
          <span className="lbl">À ranger</span>
          <Roll value={left} label={say} />
        </div>
        <div className="odo odo-small">
          <span className="lbl">Rangés</span>
          <Roll value={done} label={`${done} rangés`} />
          <span className="odo-of">/{String(total).padStart(2, '0')}</span>
        </div>
        <div className="anns">
          <Ann tone="amber" on={left > 0}>
            Rangement
          </Ann>
          <Ann tone="red" on={late && left > 0}>
            Retard
          </Ann>
          <Ann tone="green" on={left === 0}>
            Prêt
          </Ann>
        </div>
      </div>
    );
  }
  if (sys === 'objet') {
    return (
      <div className="prog prog-objet">
        <div className="lcd" role="img" aria-label={say}>
          <SevenSeg value={left} />
          <span className="lcd-u">
            <span>À ranger</span>
            <span>
              {String(done).padStart(2, '0')}/{String(total).padStart(2, '0')}
            </span>
          </span>
        </div>
        <div className="leds" aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} data-on={i < done ? 'true' : 'false'} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="prog prog-carte">
      <Bezel done={done} total={total}>
        <Roll value={left} label={say} />
        <span className="bz-cap">à ranger</span>
      </Bezel>
      <div className="prog-read">
        <span className="lbl">Point du matin</span>
        <strong>{left ? `${done} sur ${total} relevés` : 'Carte nette'}</strong>
        <span className="prog-sub">{left ? 'La couronne tourne à chaque élément rangé.' : 'Tout est rangé, l’agenda est libre.'}</span>
      </div>
    </div>
  );
}

function AffecterMenu({ options, onPick, onClose }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });
  useEffect(() => {
    ref.current?.querySelector('[role="menuitem"]')?.focus();
    const out = (e) => {
      if (ref.current && !ref.current.contains(e.target) && !e.target.closest?.('#btn-affecter')) closeRef.current(false);
    };
    document.addEventListener('pointerdown', out);
    return () => document.removeEventListener('pointerdown', out);
  }, []);
  const onKey = (e) => {
    const list = [...ref.current.querySelectorAll('[role="menuitem"]')];
    const at = list.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = e.key === 'ArrowDown' ? (at + 1) % list.length : (at - 1 + list.length) % list.length;
      list[next]?.focus();
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      onClose(true);
    } else if (/^[1-9]$/.test(e.key) && options[Number(e.key) - 1]) {
      e.preventDefault();
      onPick(options[Number(e.key) - 1]);
    }
  };
  return (
    <div className="menu" role="menu" aria-label="Affecter ailleurs" ref={ref} onKeyDown={onKey}>
      <div className="menu-h lbl">Affecter à un bloc</div>
      {options.map((o, i) => (
        <button key={o.eventId} type="button" role="menuitem" tabIndex={-1} className="menu-i" onClick={() => onPick(o)}>
          <span className="menu-n">{i + 1}</span>
          <span className="menu-l">{o.label}</span>
          <span className="menu-c">{o.tasks ? `${o.tasks} tâche${o.tasks > 1 ? 's' : ''}` : 'libre'}</span>
        </button>
      ))}
    </div>
  );
}

function LaterPanel({ sys, choices, idx, setIdx, onCommit, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.querySelector('[role="slider"], [role="radio"][aria-checked="true"]')?.focus();
  }, []);
  const onKey = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose(true);
    } else if (e.key === 'Enter' && e.target.getAttribute('role') === 'radio') {
      e.preventDefault();
      onCommit();
    }
  };
  return (
    <div className="later" role="group" aria-label="Reporter à plus tard" ref={ref} onKeyDown={onKey}>
      <div className="later-ctl">
        {sys === 'planche' ? (
          <Knob choices={choices} value={idx} onChange={setIdx} onCommit={onCommit} label="Jour du report" />
        ) : sys === 'objet' ? (
          <Seg label="Jour du report" options={choices.map((c, i) => ({ id: i, label: c.short }))} value={idx} onChange={setIdx} className="seg-later" />
        ) : (
          <Ruler choices={choices} value={idx} onChange={setIdx} onCommit={onCommit} label="Jour du report" />
        )}
      </div>
      <div className="later-act">
        <span className="later-read" aria-live="polite">
          {choices[idx].label}
        </span>
        <Btn variant="primary" fn="yellow" icon="clock" onClick={onCommit} kbd="Entrée" silk="Entrée">
          Reporter
        </Btn>
        <Btn variant="quiet" onClick={() => onClose(true)} kbd="Échap" silk="Échap">
          Fermer
        </Btn>
      </div>
    </div>
  );
}

const ZONES = { done: 'Cocher', validate: 'Valider', later: 'Plus tard', drop: 'Supprimer' };

export function RangerCard({ sys, item, leaving, panel, options, laterChoices, laterIdx, setLaterIdx, onGesture, onPanel, gripProps, carrying, suggestCaption }) {
  const ok = item.suggestion.ok;
  const [dx, setDx] = useState(0);
  const [w, setW] = useState(320);
  const [swiping, setSwiping] = useState(false);
  const start = useRef(null);
  const ratio = dx / w;
  const zone = ratio > 0.55 ? 'done' : ratio > 0.22 && ok ? 'validate' : ratio < -0.55 ? 'drop' : ratio < -0.22 ? 'later' : null;

  const down = (e) => {
    if (leaving || e.target.closest('button, [role="slider"], [role="menu"], .later')) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY, lock: null };
    setW(e.currentTarget.offsetWidth || 320);
  };
  const move = (e) => {
    const s = start.current;
    if (!s) return;
    const ddx = e.clientX - s.x;
    const ddy = e.clientY - s.y;
    if (!s.lock) {
      if (Math.abs(ddx) > 8 && Math.abs(ddx) > Math.abs(ddy)) {
        s.lock = 'x';
        e.currentTarget.setPointerCapture(e.pointerId);
        setSwiping(true);
      } else if (Math.abs(ddy) > 8) {
        start.current = null;
        return;
      }
    }
    if (s.lock === 'x') setDx(ddx);
  };
  const up = () => {
    const s = start.current;
    start.current = null;
    if (!s || s.lock !== 'x') return;
    setSwiping(false);
    if (zone) onGesture(zone, { swipe: Math.sign(dx) });
    else setDx(0);
  };

  const exiting = leaving?.swipe ? `translateX(${leaving.swipe * 115}%)` : null;
  const style = exiting ? { transform: exiting } : dx ? { transform: `translateX(${dx}px)` } : undefined;

  return (
    <div className="card-zone" data-zone={zone ?? undefined}>
      <div className="swipe-bg" aria-hidden="true">
        <span className="sw sw-r">{zone === 'done' ? ZONES.done : ok ? ZONES.validate : ''}</span>
        <span className="sw sw-l">{zone === 'drop' ? ZONES.drop : ZONES.later}</span>
      </div>
      <article
        className={`card${swiping ? ' is-swiping' : ''}${carrying ? ' is-carried' : ''}`}
        data-leaving={leaving?.g}
        style={style}
        aria-label={`À ranger : ${item.title}`}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={() => {
          start.current = null;
          setSwiping(false);
          setDx(0);
        }}
      >
        <header className="card-head">
          <button type="button" className="grip" aria-label="Glisser vers l'agenda. Au clavier : Entrée pour prendre, flèches pour déplacer, Entrée pour poser" {...gripProps}>
            <Icon name="grip" size={16} />
          </button>
          <span className="card-type lbl">{item.typeLabel}</span>
          {item.projectName ? <span className="card-proj lbl">{item.projectName}</span> : null}
          <span className="card-age">{item.ageLabel}</span>
          {item.late > 0 ? (
            <Ann tone="red" on>
              Retard {item.late}&nbsp;j
            </Ann>
          ) : null}
        </header>
        <h3 className="card-title">{item.title}</h3>
        <div className="sugg" data-ok={ok ? 'true' : 'false'}>
          <span className="sugg-k lbl">{ok ? suggestCaption : 'Pas de suggestion'}</span>
          {ok ? <strong className="sugg-l">{item.suggestion.label}</strong> : null}
          <span className="sugg-r">{item.suggestion.reason}</span>
        </div>
        <div className="gestures">
          <Btn variant="primary" fn="green" icon="check" kbd="Entrée" silk="Entrée" disabled={!ok} onClick={() => onGesture('validate')}>
            Valider
          </Btn>
          <div className="pop-anchor">
            <Btn id="btn-affecter" variant="secondary" fn="blue" icon="send" kbd="A" silk="A" aria-haspopup="menu" aria-expanded={panel === 'menu'} onClick={() => onPanel(panel === 'menu' ? null : 'menu')}>
              Affecter
            </Btn>
            {panel === 'menu' ? <AffecterMenu options={options} onPick={(o) => onGesture('place', o)} onClose={(back) => onPanel(null, back ? 'btn-affecter' : null)} /> : null}
          </div>
          <Check sys={sys} checked={leaving?.g === 'done'} onChange={() => onGesture('done')} label="Cocher" kbd="C" />
          {sys === 'planche' ? (
            <GuardSwitch onFire={() => onGesture('drop')} label="Supprimer" kbd="S" />
          ) : (
            <Btn variant="danger" fn="red" icon="trash" kbd="S" silk="S" onClick={() => onGesture('drop')}>
              Supprimer
            </Btn>
          )}
          <Btn id="btn-later" variant="quiet" fn="yellow" icon="clock" kbd="P" silk="P" aria-expanded={panel === 'later'} onClick={() => onPanel(panel === 'later' ? null : 'later')}>
            Plus tard
          </Btn>
        </div>
        {panel === 'later' ? (
          <LaterPanel sys={sys} choices={laterChoices} idx={laterIdx} setIdx={setLaterIdx} onCommit={() => onGesture('later')} onClose={(back) => onPanel(null, back ? 'btn-later' : null)} />
        ) : null}
        <p className="swipe-hint">
          Au doigt : glisse à droite pour valider, loin pour cocher ; à gauche pour plus tard, loin pour supprimer.
        </p>
      </article>
    </div>
  );
}

export function EmptyCard({ onReset }) {
  return (
    <div className="card card-empty">
      <span className="lbl">Rangement terminé</span>
      <h3 className="card-title">Tout est rangé, le Cockpit s’ouvre.</h3>
      <div className="gestures">
        <Btn variant="secondary" icon="undo" onClick={onReset}>
          Recommencer la démo
        </Btn>
        <span className="hint">
          ou <Kbd>Ctrl Z</Kbd> pour annuler le dernier geste
        </span>
      </div>
    </div>
  );
}
