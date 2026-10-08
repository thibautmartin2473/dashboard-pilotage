'use client';

// Système B, « Planche de bord » : le tableau de bord d'une GT des années 70 (cuir, laiton, touches
// mécaniques). Chaque bouton a une course de 2 px et un voyant ; Cocher est un interrupteur à bascule qui
// allume un témoin ; Supprimer dort sous un capot de sécurité ; le jour de « Plus tard » se choisit à la
// molette crantée ; les compteurs sont à rouleaux.
import { useEffect, useRef, useState } from 'react';
import { Kbd } from './Common';
import { DAYS } from './shared';

function Check({ checked, onChange, label }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} className="cl-check pb-check" onClick={() => onChange(!checked)}>
      <span className="pb-tog" aria-hidden="true">
        <span className="pb-tog-lever" />
        <span className="pb-tog-nut" />
      </span>
      <span className="pb-lamp" aria-hidden="true" />
      {label && <span className="cl-check-label">{label}</span>}
    </button>
  );
}

function Roller({ value, digits = 3 }) {
  const s = String(value).padStart(digits, '0');
  return (
    <span className="pb-odo" aria-hidden="true">
      {[...s].map((d, i) => (
        <span key={i} className="pb-odo-win">
          <span className="pb-odo-strip" style={{ '--d': d }}>
            {'0123456789'.split('').map((n) => (
              <span key={n}>{n}</span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}

function Progress({ done, total }) {
  const p = Math.min(1, done / total);
  return (
    <div className="pb-prog" role="progressbar" aria-label="Rangement forcé" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-valuetext={`${done} rangés sur ${total}`}>
      <svg viewBox="0 0 64 38" className="pb-gauge" aria-hidden="true">
        <path d="M6 34a26 26 0 0 1 52 0" fill="none" className="pb-gauge-arc" strokeWidth="1.5" />
        {Array.from({ length: 11 }, (_, i) => {
          const a = Math.PI * (1 - i / 10);
          const r1 = i % 5 === 0 ? 19 : 22;
          return <line key={i} x1={32 + 26 * Math.cos(a)} y1={34 - 26 * Math.sin(a)} x2={32 + r1 * Math.cos(a)} y2={34 - r1 * Math.sin(a)} className="pb-gauge-tick" strokeWidth={i % 5 === 0 ? 1.6 : 1} />;
        })}
        <g className="pb-needle" style={{ '--a': `${-90 + p * 180}deg` }}>
          <line x1="32" y1="34" x2="32" y2="12" strokeWidth="1.8" strokeLinecap="round" />
        </g>
        <circle cx="32" cy="34" r="3" className="pb-gauge-hub" />
      </svg>
      <div className="pb-prog-read">
        <span className="pb-prog-lbl">Rangés</span>
        <span className="pb-prog-num">
          <Roller value={done} /> <span className="pb-prog-sep">/</span> <Roller value={total} />
        </span>
      </div>
    </div>
  );
}

// Molette crantée : molette de la souris, glisser horizontal, flèches, Origine et Fin. Un cran par jour.
function DayPicker({ value, onChange }) {
  const ref = useRef(null);
  const val = useRef(value);
  const acc = useRef(0);
  const drag = useRef(null);
  useEffect(() => {
    val.current = value;
  }, [value]);
  useEffect(() => {
    const el = ref.current;
    const onWheel = (e) => {
      e.preventDefault();
      acc.current += e.deltaY + e.deltaX;
      if (Math.abs(acc.current) < 40) return;
      const step = acc.current > 0 ? 1 : -1;
      acc.current = 0;
      onChange(Math.max(0, Math.min(DAYS.length - 1, val.current + step)));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onChange]);
  const set = (v) => onChange(Math.max(0, Math.min(DAYS.length - 1, v)));
  return (
    <div
      ref={ref}
      className="pb-wheel"
      role="slider"
      tabIndex={0}
      aria-label="Jour du report"
      aria-valuemin={0}
      aria-valuemax={DAYS.length - 1}
      aria-valuenow={value}
      aria-valuetext={DAYS[value].long}
      onKeyDown={(e) => {
        const m = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (m) {
          e.preventDefault();
          set(value + m);
        } else if (e.key === 'Home') set(0);
        else if (e.key === 'End') set(DAYS.length - 1);
      }}
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, v: value };
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* pointeur déjà relâché */
        }
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        set(drag.current.v + Math.round((drag.current.x - e.clientX) / 22));
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
    >
      <span className="pb-wheel-win" aria-hidden="true">
        <span className="pb-wheel-strip" style={{ '--i': value }}>
          {DAYS.map((d) => (
            <span key={d.id}>
              {d.short} {d.num}
            </span>
          ))}
        </span>
      </span>
      <span className="pb-wheel-drum" aria-hidden="true">
        <span className="pb-wheel-ribs" style={{ '--i': value }} />
        <span className="pb-wheel-idx" />
      </span>
    </div>
  );
}

// Capot de sécurité : le premier appui lève le capot (il retombe seul après 4 s), le second supprime.
// Au clavier, S supprime directement : le capot ne protège que du clic distrait.
function DeleteCtl({ onDelete }) {
  const [open, setOpen] = useState(false);
  const btn = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    btn.current?.focus();
    const t = setTimeout(() => setOpen(false), 4000);
    return () => clearTimeout(t);
  }, [open]);
  return (
    <span className={`pb-guard${open ? ' is-open' : ''}`}>
      <button
        ref={btn}
        type="button"
        className="pb-guard-btn"
        tabIndex={open ? 0 : -1}
        aria-hidden={!open}
        onClick={() => {
          setOpen(false);
          onDelete();
        }}
      >
        <span className="pb-guard-lamp" aria-hidden="true" />
        Supprimer
      </button>
      <button type="button" className="pb-guard-cover" aria-expanded={open} aria-label="Lever le capot de Supprimer" tabIndex={open ? -1 : 0} onClick={() => setOpen(true)}>
        <span className="pb-guard-hinge" aria-hidden="true" />
        <span className="pb-guard-txt">Supprimer</span>
        <Kbd>S</Kbd>
      </button>
    </span>
  );
}

export const PLANCHE = {
  id: 'planche',
  kicker: 'Système B',
  name: 'Planche de bord',
  tagline: 'Touches, voyants, laiton',
  concept:
    'Le Cockpit pris au mot : la planche d’une GT des années 70, cuir et laiton. Chaque bouton est une touche mécanique avec 2 px de course et un voyant qui s’allume ; les libellés sont gravés en capitales espacées ; les vues de l’agenda sont des touches de présélection d’autoradio, une seule enfoncée à la fois.',
  signature:
    'La mécanique visible. Cocher bascule un interrupteur et allume un témoin vert ; Supprimer dort sous un capot hachuré qu’il faut lever ; le jour de « Plus tard » se règle à la molette crantée ; le rangement forcé se lit sur un compteur à rouleaux et une aiguille ; le maintenant de l’agenda est une aiguille de laiton.',
  chipNote: 'Plage : plaque gravée, rectangulaire. Tâche : voyant rond allumé et libellé. La forme suffit, la couleur confirme.',
  failles: [
    'Le plus spectaculaire, donc le plus fatigant : dix heures par jour de voyants, de capots et de rouleaux, c’est beaucoup de décor pour cocher des tâches. La règle de fréquence dit zéro animation pour les gestes répétés ; ici chaque geste en a une.',
    'Le capot de sécurité est une confirmation déguisée : la recherche (critère K6) demande zéro confirmation pour une action réversible. Il ne se justifie que parce que S au clavier passe outre ; sinon, à retirer.',
    'Capitales espacées en Plex Mono à 11 px : lisibles, mais plus lentes à lire qu’une phrase en bas de casse. Bon pour des étiquettes, mauvais pour des titres de tâches (gardés en bas de casse).',
    'La molette crantée est un contrôle inhabituel : rapide à la souris et au clavier, mais la molette de la souris y capture le défilement de la page quand le pointeur passe dessus.',
    'Le risque Teenage Engineering est réel : on frôle le jouet. Le cuir et la sérif Caslon tirent vers la GT plutôt que vers le synthé, mais un voyant de trop et on bascule.',
  ],
  enVrai: 'Base UI (Slider pour la molette, Menu, Dialog), cmdk, Sonner, dnd-kit, NumberFlow pour les compteurs à rouleaux (il fait exactement ça, avec accessibilité), Motion pour l’aiguille.',
};
Object.assign(PLANCHE, { Check, Progress, DayPicker, DeleteCtl });
