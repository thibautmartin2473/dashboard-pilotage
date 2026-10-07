'use client';

// Vitrine /demo/composants : trois systèmes de composants pour Cadran (Planche de bord, Objet industriel,
// Table à cartes), chacun montré en situation (morceau du Cockpit) puis pièce par pièce. Tout vit en état
// local : rien n'est écrit en base, aucune Server Action.
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { AgendaColumn, Carried, useAgendaDrag } from './AgendaDrag';
import Palette from './Palette';
import { EmptyCard, Progress, RangerCard } from './RangerCards';
import { Fiche, Pieces, SYS_IDS, SYSTEMS } from './Sections';
import Toast from './Toasts';
import { Btn, Icon, Kbd, fmtDur, fmtHM } from './ui';
import './composants.css';

const short = (t) => (t.length > 46 ? `${t.slice(0, 45).trimEnd()}…` : t);
const estimate = (title) => (title.length <= 40 ? 30 : title.length <= 80 ? 45 : 60);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const subscribeRM = (cb) => {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const getRM = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function textFor(g, item, detail) {
  switch (g) {
    case 'validate':
      return { text: `Rangé : ${item.suggestion.label}`, sub: short(item.title) };
    case 'place':
      return { text: `Affecté : ${detail.label}`, sub: short(item.title) };
    case 'slot':
      return { text: `Posé ${fmtHM(detail.start)}-${fmtHM(detail.start + detail.dur)} (${fmtDur(detail.dur)})`, sub: short(item.title) };
    case 'done':
      return { text: 'Fait', sub: short(item.title) };
    case 'later':
      return { text: `Reporté : ${detail.label}`, sub: short(item.title) };
    default:
      return { text: 'Supprimé', sub: short(item.title) };
  }
}

const RAIL = [
  { id: 'home', label: 'Cockpit', icon: 'home', on: true },
  { id: 'cal', label: 'Agenda', icon: 'cal' },
  { id: 'inbox', label: 'À ranger', icon: 'inbox', badge: true },
  { id: 'mail', label: 'Mails', icon: 'mail' },
  { id: 'folder', label: 'Projets', icon: 'folder' },
];

export default function ComposantsLab({ data }) {
  const [sys, setSys] = useState('planche');
  const meta = SYSTEMS[sys];
  const items = data.items;
  const total = items.length;
  const [pos, setPos] = useState(0);
  const [hist, setHist] = useState([]);
  const [leaving, setLeaving] = useState(null);
  const [panel, setPanel] = useState(null);
  const [laterIdx, setLaterIdx] = useState(1);
  const [placed, setPlaced] = useState([]);
  const [toast, setToast] = useState(null);
  const [palette, setPalette] = useState(false);
  const [say, setSay] = useState('');
  const rm = useSyncExternalStore(subscribeRM, getRM, () => false);
  const busy = useRef(false);
  const lastFocus = useRef(null);
  const item = items[pos] ?? null;

  const laterChoices = useMemo(
    () => [
      { short: 'Ce soir', label: 'Ce soir, après 19h' },
      { short: 'Demain', label: 'Demain matin' },
      ...data.days.slice(1, 3).map((d) => ({ short: `${cap(d.label).slice(0, 3)}.`, label: cap(d.label) })),
      { short: '+7 j', label: 'Dans une semaine' },
    ],
    [data.days],
  );

  const flash = useCallback((text, undoable = false, sub = null) => setToast({ id: Date.now(), text, sub, undoable }), []);
  const dismiss = useCallback(() => setToast(null), []);

  const commit = useCallback(
    (g, detail = {}) => {
      if (!item || busy.current) return;
      busy.current = true;
      setPanel(null);
      setLeaving({ g, swipe: detail.swipe ?? 0 });
      const info = g === 'later' ? { ...detail, label: laterChoices[laterIdx].label } : detail;
      const delay = rm ? 60 : g === 'done' ? 300 : 180;
      setTimeout(() => {
        busy.current = false;
        setLeaving(null);
        setPos((p) => p + 1);
        setHist((h) => [...h, { kind: 'gesture', g, item }]);
        const t = textFor(g, item, info);
        setToast({ id: Date.now(), ...t, undoable: true });
        setSay(`${t.text}. ${t.sub}`);
      }, delay);
    },
    [item, rm, laterChoices, laterIdx],
  );

  const validate = useCallback(() => {
    if (!item) return;
    if (!item.suggestion.ok) flash('Pas de suggestion pour cet élément', false, 'Affecte-le ailleurs (A) ou glisse-le dans l’agenda.');
    else commit('validate');
  }, [item, commit, flash]);

  const undo = useCallback(() => {
    const last = hist[hist.length - 1];
    if (!last) {
      flash('Rien à annuler');
      return;
    }
    setHist(hist.slice(0, -1));
    if (last.kind === 'move') {
      setPlaced((p) => p.map((x) => (x.key === last.key ? { ...x, start: last.from } : x)));
    } else {
      setPos((p) => Math.max(0, p - 1));
      if (last.g === 'slot') setPlaced((p) => p.filter((x) => x.key !== last.item.key));
    }
    flash('Annulé', false, last.item ? short(last.item.title) : null);
    setSay('Dernier geste annulé.');
  }, [hist, flash]);

  const reset = useCallback(() => {
    setPos(0);
    setHist([]);
    setPlaced([]);
    setPanel(null);
    flash('Démo remise à zéro');
  }, [flash]);

  const onPanel = useCallback((p, focusId) => {
    setPanel(p);
    if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
  }, []);

  const openPalette = useCallback(() => {
    lastFocus.current = document.activeElement;
    setPanel(null);
    setPalette(true);
  }, []);
  const closePalette = useCallback(() => {
    setPalette(false);
    requestAnimationFrame(() => lastFocus.current?.focus?.());
  }, []);

  const dur = item ? estimate(item.title) : 30;
  const { colRef, drag, gripProps, blockProps } = useAgendaDrag({
    events: data.agenda.events,
    placed,
    onPlace: (start, d) => {
      if (!item) return;
      setPlaced((p) => [...p, { key: item.key, title: short(item.title), start, dur: d }]);
      commit('slot', { start, dur: d });
    },
    onMove: (key, start, from) => {
      setPlaced((p) => p.map((x) => (x.key === key ? { ...x, start } : x)));
      setHist((h) => [...h, { kind: 'move', key, from }]);
      flash(`Déplacé à ${fmtHM(start)}`, true);
    },
    onSay: setSay,
  });

  const commands = useMemo(
    () => [
      { id: 'v', label: 'Valider la suggestion', hint: item?.suggestion.ok ? item.suggestion.label : 'aucune suggestion', keys: 'Entrée', disabled: !item, run: validate },
      { id: 'a', label: 'Affecter ailleurs', hint: 'choisir un bloc', keys: 'A', disabled: !item, run: () => setPanel('menu') },
      { id: 'c', label: 'Cocher : c’est fait', keys: 'C', disabled: !item, run: () => commit('done') },
      { id: 'p', label: 'Plus tard', hint: 'choisir le jour', keys: 'P', disabled: !item, run: () => setPanel('later') },
      { id: 's', label: 'Supprimer', hint: 'annulable 5 s', keys: 'S', danger: true, disabled: !item, run: () => commit('drop') },
      { id: 'z', label: 'Annuler le dernier geste', keys: 'Ctrl Z', run: undo },
      ...SYS_IDS.map((id, i) => ({ id: `sys-${id}`, label: `Système : ${SYSTEMS[id].name}`, keys: String(i + 1), run: () => setSys(id) })),
      { id: 'reset', label: 'Recommencer la démo', hint: 'remet la colonne À ranger', run: reset },
    ],
    [item, validate, commit, undo, reset],
  );

  // Raccourcis globaux : un seul écouteur, qui lit la dernière version du gestionnaire.
  const onKeyRef = useRef(null);
  useEffect(() => {
    onKeyRef.current = (e) => {
      const t = e.target;
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      if (mod && k === 'k') {
        e.preventDefault();
        if (palette) closePalette();
        else openPalette();
        return;
      }
      if (palette) return;
      if (mod && k === 'z') {
        if (t.closest?.('input, textarea')) return;
        e.preventDefault();
        undo();
        return;
      }
      if (mod || e.altKey) return;
      if (t.closest?.('input, textarea, [role="menu"], [role="dialog"], .later')) return;
      if (k === 'escape') {
        if (panel) setPanel(null);
        return;
      }
      if (['1', '2', '3'].includes(k)) {
        setSys(SYS_IDS[Number(k) - 1]);
        return;
      }
      if (!item || leaving) return;
      const inCtl = t.closest?.('button, a, [role="slider"], [role="radio"], [tabindex]');
      if (k === 'enter' && inCtl) return;
      if (k === 'enter' || k === 'v') {
        e.preventDefault();
        validate();
      } else if (k === 'a') {
        e.preventDefault();
        setPanel('menu');
      } else if (k === 'c') {
        commit('done');
      } else if (k === 's' || k === 'delete') {
        commit('drop');
      } else if (k === 'p') {
        e.preventDefault();
        setPanel('later');
      }
    };
  });
  useEffect(() => {
    const h = (e) => onKeyRef.current?.(e);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const pickSys = (e, i) => {
    let next = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % 3;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i + 2) % 3;
    if (next === null) return;
    e.preventDefault();
    setSys(SYS_IDS[next]);
    e.currentTarget.parentElement.querySelectorAll('[role="radio"]')[next]?.focus();
  };

  const left = total - pos;
  const sourceNote =
    data.source === 'exemple'
      ? 'Éléments d’exemple : la vraie colonne n’a pas pu être lue.'
      : data.source === 'reel-remis'
        ? 'Vraies tâches ouvertes, remises « à ranger » pour la démo (lecture seule).'
        : 'Vraies données, en lecture seule.';

  return (
    <div className="cdr" data-sys={sys}>
      <div className="cdr-banner" role="note">
        <strong>Démo : rien n’est enregistré.</strong>
        <span>{sourceNote}</span>
        <Link href="/demo">Toutes les démos</Link>
      </div>
      <div className="livery" aria-hidden="true" />

      <div className="cdr-wrap">
        <header className="cdr-top">
          <div className="brand">
            <span className="brand-n">Cadran</span>
            <span className="lbl">Composants</span>
          </div>
          <div role="radiogroup" aria-label="Système de composants" className="sys-pick">
            {SYS_IDS.map((id, i) => (
              <button key={id} type="button" role="radio" aria-checked={sys === id} tabIndex={sys === id ? 0 : -1} className="sys-b" onClick={() => setSys(id)} onKeyDown={(e) => pickSys(e, i)}>
                <span className="sys-n">{i + 1}</span>
                <span className="sys-name">{SYSTEMS[id].name}</span>
                <span className="sys-sw" aria-hidden="true">
                  {SYSTEMS[id].swatches.map((c) => (
                    <i key={c} style={{ background: c }} />
                  ))}
                </span>
              </button>
            ))}
          </div>
          <Btn variant="secondary" icon="search" kbd="Ctrl K" onClick={openPalette} className="top-pal">
            Commandes
          </Btn>
        </header>

        <section className="intro" aria-labelledby="sys-title">
          <p className="lbl">{meta.kicker}</p>
          <h1 id="sys-title">{meta.name}</h1>
          <p className="intro-p">{meta.concept}</p>
        </section>

        <section className="situ" aria-labelledby="situ-h">
          <h2 id="situ-h" className="sec-h">
            <span className="lbl">01</span> En situation : le Cockpit à l’ouverture
          </h2>
          <p className="sec-p">
            Rangement forcé : la colonne se vide avant que l’agenda ne s’ouvre. Gestes au clavier (<Kbd>Entrée</Kbd> <Kbd>A</Kbd> <Kbd>C</Kbd> <Kbd>S</Kbd> <Kbd>P</Kbd>), au doigt par balayage, ou en glissant la carte par sa poignée jusqu’à un créneau.
          </p>
          <div className="cockpit">
            <nav className="rail" aria-label="Navigation (maquette)">
              {RAIL.map((r) => (
                <span key={r.id} className={`rail-b${r.on ? ' is-on' : ''}`} title={r.label}>
                  <Icon name={r.icon} />
                  <span className="sr">{r.label}</span>
                  {r.badge && left > 0 ? <span className="rail-badge">{left}</span> : null}
                </span>
              ))}
            </nav>
            <AgendaColumn dayLabel={data.agenda.dayLabel} events={data.agenda.events} placed={placed} drag={drag} colRef={colRef} blockProps={blockProps} sample={data.agenda.sample} locked={left > 0} />
            <section className="ranger" aria-label="À ranger">
              <header className="ranger-h">
                <h3 className="lbl">À ranger</h3>
              </header>
              <Progress sys={sys} done={pos} total={total} late={Boolean(item?.late)} />
              {item ? (
                <RangerCard
                  key={item.key}
                  sys={sys}
                  item={item}
                  leaving={leaving}
                  panel={panel}
                  options={data.options}
                  laterChoices={laterChoices}
                  laterIdx={laterIdx}
                  setLaterIdx={setLaterIdx}
                  onGesture={(g, d) => (g === 'validate' && !item.suggestion.ok ? validate() : commit(g, d))}
                  onPanel={onPanel}
                  gripProps={gripProps(item, dur)}
                  carrying={drag?.key === item.key}
                  suggestCaption={meta.suggest}
                />
              ) : (
                <EmptyCard onReset={reset} />
              )}
              {items[pos + 1] ? (
                <p className="next">
                  <span className="lbl">Ensuite</span> {short(items[pos + 1].title)}
                </p>
              ) : null}
            </section>
          </div>
        </section>

        <section className="sec" aria-labelledby="pieces-h">
          <h2 id="pieces-h" className="sec-h">
            <span className="lbl">02</span> Les pièces
          </h2>
          <Pieces sys={sys} onToast={(text, undoable) => flash(text, Boolean(undoable))} onPalette={openPalette} />
        </section>

        <section className="sec" aria-labelledby="fiche-h">
          <h2 id="fiche-h" className="sec-h">
            <span className="lbl">03</span> Fiche du système
          </h2>
          <Fiche meta={meta} />
          <p className="sec-p">
            Mouvement : retours sous 300 ms, courbe ease-out forte, seuls transform et opacity animés (sauf le tracé SVG de la case Carte) ; en mouvement réduit, plus aucun déplacement, les fondus restent. Aucun son.
          </p>
        </section>
      </div>

      {palette ? <Palette commands={commands} onClose={closePalette} /> : null}
      <Toast toast={toast} onUndo={undo} onDismiss={dismiss} />
      <Carried drag={drag} />
      <p className="sr" aria-live="polite">
        {say}
      </p>
    </div>
  );
}
