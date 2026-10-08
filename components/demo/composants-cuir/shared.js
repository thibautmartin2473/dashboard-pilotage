'use client';

// Logique commune aux trois systèmes de /demo/composants-cuir : données de démonstration figées, état local
// du rangement (gestes, annulation, toast), balayage, glisser vers l'agenda. Rien n'est écrit en base :
// chaque geste ne vit que dans l'onglet. Les trois systèmes ne diffèrent que par leurs pièces (Sellerie.js,
// Planche.js, Edition.js) et par leur feuille de style (cuir.css).
import { useCallback, useEffect, useRef, useState } from 'react';

export const HOUR_START = 8;
export const HOUR_END = 20;
export const DAY_LABEL = 'Jeudi 9 octobre';

// Plages de la journée montrée : cours, sport, et blocs de travail (catégorie de type « tâche »).
export const PLAGES = [
  { id: 'p-cas', kind: 'travail', title: 'Bloc Cas', start: 8 * 60, end: 9 * 60 + 30 },
  { id: 'p-cf', kind: 'cours', title: 'Corporate Finance', start: 10 * 60, end: 12 * 60, place: 'Salle 204' },
  { id: 'p-cand', kind: 'travail', title: 'Bloc Candidatures', start: 14 * 60, end: 17 * 60 },
  { id: 'p-tennis', kind: 'sport', title: 'Tennis', start: 18 * 60, end: 19 * 60 + 30, place: 'TC Nice' },
];

export const KIND_LABEL = { travail: 'Bloc de travail', cours: 'Cours', sport: 'Sport' };

const INITIAL_BLOCKS = [
  { id: 'b1', title: 'Cas Case Coach n°3', plage: 'p-cas', start: 8 * 60, end: 8 * 60 + 45 },
  { id: 'b2', title: 'Relire la lettre Bain', plage: 'p-cand', start: 14 * 60, end: 14 * 60 + 45 },
  { id: 'b3', title: 'Mettre à jour le CV', plage: 'p-cand', start: 14 * 60 + 45, end: 15 * 60 + 30 },
];

// File du rangement forcé : 5 éléments dus (42 déjà rangés sur 47 avant l'ouverture de la démo).
const INITIAL_QUEUE = [
  { id: 'i1', type: 'Tâche', title: 'Préparer le call BCG', meta: 'Candidatures, pour vendredi', dur: 45, target: 'p-cand', reason: 'Même thème « candidatures » et le bloc finit avant l’échéance.' },
  { id: 'i2', type: 'Idée', title: 'Fiche cas : le marché du padel', meta: 'Idée notée le 6 octobre', dur: 30, target: 'p-cas', reason: 'Thème « cas » ; il reste 45 min libres dans le bloc.' },
  { id: 'i3', type: 'Mail', title: 'Payer l’inscription au tournoi', meta: 'Proposé depuis Gmail', dur: 15, target: null, later: 'Aujourd’hui, sans bloc', reason: 'Tâche administrative courte : pour aujourd’hui, sans bloc.' },
  { id: 'i4', type: 'Tâche', title: 'Relancer Kearney', meta: 'Candidatures, en retard de 2 jours', dur: 15, target: 'p-cand', reason: 'Thème « candidatures » ; 15 min tiennent dans le bloc.' },
  { id: 'i5', type: 'Tâche', title: 'Réviser le chapitre 4', meta: 'EDHEC, sans échéance', dur: 45, target: null, later: 'Bloc Révisions, ven. 9:00', reason: 'Thème « révisions » : premier bloc adapté, demain matin.' },
];
export const FORCED_TOTAL = 47;
const FORCED_DONE_BEFORE = 42;

// Destinations de « Affecter ailleurs » (touches 1 à 8).
export const DESTS = [
  { key: '1', plage: 'p-cas', label: 'Bloc Cas', when: 'aujourd’hui' },
  { key: '2', plage: 'p-cand', label: 'Bloc Candidatures', when: 'aujourd’hui' },
  { key: '3', plage: null, label: 'Bloc Révisions', when: 'ven. 9:00' },
  { key: '4', plage: null, label: 'Bloc Cas', when: 'ven. 14:00' },
  { key: '5', plage: null, label: 'Bloc Candidatures', when: 'lun. 14:00' },
  { key: '6', plage: null, label: 'Aujourd’hui', when: 'sans bloc' },
  { key: '7', plage: null, label: 'Demain', when: 'sans bloc' },
  { key: '8', plage: null, label: 'Un autre jour', when: 'choisir', pick: true },
];

// Jours proposés par le sélecteur de « Plus tard » (dimanche suivant par défaut).
export const DAYS = [
  { id: 'ven', short: 'ven.', long: 'Vendredi 10 octobre', num: '10' },
  { id: 'sam', short: 'sam.', long: 'Samedi 11 octobre', num: '11' },
  { id: 'dim', short: 'dim.', long: 'Dimanche 12 octobre', num: '12' },
  { id: 'lun', short: 'lun.', long: 'Lundi 13 octobre', num: '13' },
  { id: 'mar', short: 'mar.', long: 'Mardi 14 octobre', num: '14' },
  { id: 'mer', short: 'mer.', long: 'Mercredi 15 octobre', num: '15' },
  { id: 'jeu', short: 'jeu.', long: 'Jeudi 16 octobre', num: '16' },
];
export const DEFAULT_DAY = 2;

export function hhmm(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

export function nextFree(plage, blocks) {
  return blocks.filter((b) => b.plage === plage.id).reduce((acc, b) => Math.max(acc, b.end), plage.start);
}

export function suggestionOf(item, blocks) {
  if (!item) return null;
  const p = PLAGES.find((x) => x.id === item.target);
  if (!p) return { label: item.later, plage: null, start: null };
  const start = nextFree(p, blocks);
  return { label: `${p.title}, ${hhmm(start)}`, plage: p.id, start, over: start + item.dur > p.end };
}

let seq = 0;
const newId = (p) => `${p}-n${(seq += 1)}`;

// État du rangement d'un système : file, blocs posés, historique d'annulation, toast.
export function useLab() {
  const [queue, setQueue] = useState(INITIAL_QUEUE);
  const [blocks, setBlocks] = useState(INITIAL_BLOCKS);
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);
  const [checking, setChecking] = useState(null);
  const timer = useRef(null);

  const say = useCallback((text, undoable = true) => {
    setToast({ id: newId('t'), text, undoable });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 5000);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  const current = queue[0] ?? null;

  const commit = useCallback(
    (item, gesture, text, block) => {
      setQueue((q) => q.filter((x) => x.id !== item.id));
      if (block) setBlocks((b) => [...b, block]);
      setHistory((h) => [...h, { item, gesture, blockId: block?.id ?? null }]);
      say(text);
    },
    [say],
  );

  const placeIn = useCallback(
    (item, plageId, start) => {
      const p = PLAGES.find((x) => x.id === plageId) ?? null;
      const s = start ?? (p ? nextFree(p, blocks) : 9 * 60);
      return { id: newId('b'), title: item.title, plage: p?.id ?? null, start: s, end: s + item.dur, fresh: true };
    },
    [blocks],
  );

  const act = useCallback(
    (gesture, opts = {}) => {
      const item = opts.item ?? current;
      if (!item) return;
      if (gesture === 'place') {
        const sug = suggestionOf(item, blocks);
        if (sug.plage) {
          const block = placeIn(item, sug.plage);
          commit(item, 'place', `Rangé dans ${sug.label}.`, block);
        } else commit(item, 'place', `Rangé : ${sug.label}.`);
      } else if (gesture === 'assign') {
        const d = opts.dest;
        if (d.plage) {
          const block = placeIn(item, d.plage);
          commit(item, 'assign', `Affecté à ${d.label}, ${hhmm(block.start)}.`, block);
        } else commit(item, 'assign', `Affecté à ${d.label}, ${d.when}.`);
      } else if (gesture === 'drop-at') {
        const inside = PLAGES.find((p) => opts.start >= p.start && opts.start < p.end);
        const block = { ...placeIn(item, inside?.id ?? null, opts.start), plage: inside?.id ?? null };
        commit(item, 'drag', `Posé à ${hhmm(opts.start)}${inside ? `, dans ${inside.title}` : ''}.`, block);
      } else if (gesture === 'done') {
        if (checking) return;
        setChecking(item.id);
        setTimeout(() => {
          setChecking(null);
          commit(item, 'done', `« ${item.title} » coché.`);
        }, 200);
      } else if (gesture === 'drop') commit(item, 'drop', `« ${item.title} » supprimé.`);
      else if (gesture === 'later') {
        const day = DAYS[opts.day ?? DEFAULT_DAY];
        commit(item, 'later', `Reporté au ${day.long.toLowerCase()}.`);
      }
    },
    [current, blocks, commit, placeIn, checking],
  );

  const undo = useCallback(() => {
    const last = history[history.length - 1];
    if (!last) return;
    setHistory((h) => h.slice(0, -1));
    setQueue((q) => [last.item, ...q.filter((x) => x.id !== last.item.id)]);
    if (last.blockId) setBlocks((b) => b.filter((x) => x.id !== last.blockId));
    setToast({ id: newId('t'), text: 'Geste annulé.', undoable: false });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2500);
  }, [history]);

  const reset = useCallback(() => {
    setQueue(INITIAL_QUEUE);
    setBlocks(INITIAL_BLOCKS);
    setHistory([]);
    setToast(null);
  }, []);

  return {
    queue,
    current,
    blocks,
    toast,
    say,
    checking,
    act,
    undo,
    reset,
    canUndo: history.length > 0,
    done: FORCED_DONE_BEFORE + history.length,
    total: FORCED_TOTAL,
    dismissToast: () => setToast(null),
  };
}

// Balayage horizontal (téléphone, ou souris) : droite = Valider, gauche = Plus tard. Le geste ne démarre
// qu'au-delà de 8 px horizontaux, pour laisser défiler la page verticalement.
export function useSwipe({ onLeft, onRight, threshold = 96 }) {
  const [dx, setDx] = useState(0);
  const st = useRef(null);
  const onPointerDown = (e) => {
    if (e.button !== 0 || e.target.closest('button, a, input, [role="menu"], [role="slider"]')) return;
    st.current = { x: e.clientX, y: e.clientY, t: e.timeStamp, active: false };
  };
  const onPointerMove = (e) => {
    const s = st.current;
    if (!s) return;
    const ddx = e.clientX - s.x;
    const ddy = e.clientY - s.y;
    if (!s.active) {
      if (Math.abs(ddx) > 8 && Math.abs(ddx) > Math.abs(ddy)) {
        s.active = true;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* pointeur déjà relâché */
        }
      } else if (Math.abs(ddy) > 8) {
        st.current = null;
        return;
      } else return;
    }
    setDx(ddx);
  };
  const onPointerUp = (e) => {
    const s = st.current;
    st.current = null;
    if (!s || !s.active) return setDx(0);
    const ddx = e.clientX - s.x;
    const v = Math.abs(ddx) / Math.max(1, e.timeStamp - s.t);
    setDx(0);
    if (ddx > threshold || (ddx > 40 && v > 0.4)) onRight();
    else if (ddx < -threshold || (ddx < -40 && v > 0.4)) onLeft();
  };
  const onPointerCancel = () => {
    st.current = null;
    setDx(0);
  };
  return { dx, handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel } };
}

// Glisser une tâche de « À ranger » vers la colonne de l'agenda : pas de 15 min, aimantation à 10 min
// d'un début de plage ou de la fin de la dernière tâche d'une plage (les tâches se succèdent).
export function useAgendaDrag({ colRef, blocks, onDrop }) {
  const [drag, setDrag] = useState(null);
  const dragRef = useRef(null);

  const compute = useCallback(
    (x, y, item) => {
      const el = colRef.current;
      if (!el) return { x, y, item, over: false };
      const r = el.getBoundingClientRect();
      const over = x >= r.left - 24 && x <= r.right + 24 && y >= r.top && y <= r.bottom;
      if (!over) return { x, y, item, over: false };
      const perMin = r.height / ((HOUR_END - HOUR_START) * 60);
      let m = HOUR_START * 60 + (y - r.top) / perMin - item.dur / 2;
      m = Math.round(m / 15) * 15;
      let magnet = null;
      for (const p of PLAGES) {
        const free = nextFree(p, blocks);
        for (const [t, why] of [[p.start, `début de ${p.title}`], [free, `à la suite dans ${p.title}`]]) {
          if (Math.abs(m - t) <= 10 && (!magnet || Math.abs(m - t) < Math.abs(m - magnet.t))) magnet = { t, why };
        }
      }
      if (magnet) m = magnet.t;
      m = Math.max(HOUR_START * 60, Math.min(HOUR_END * 60 - item.dur, m));
      return { x, y, item, over: true, start: m, magnet: magnet?.why ?? null };
    },
    [colRef, blocks],
  );

  const start = (e, item) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const d = { ...compute(e.clientX, e.clientY, item), moved: false, x0: e.clientX, y0: e.clientY };
    dragRef.current = d;
    setDrag(d);
  };

  useEffect(() => {
    if (!drag) return undefined;
    const move = (e) => {
      const d0 = dragRef.current;
      const moved = d0.moved || Math.hypot(e.clientX - d0.x0, e.clientY - d0.y0) > 4;
      const d = { ...compute(e.clientX, e.clientY, d0.item), moved, x0: d0.x0, y0: d0.y0 };
      dragRef.current = d;
      setDrag(d);
    };
    const up = () => {
      const d = dragRef.current;
      dragRef.current = null;
      setDrag(null);
      if (d?.over && d.moved) onDrop(d.item, d.start);
    };
    const key = (e) => {
      if (e.key === 'Escape') {
        dragRef.current = null;
        setDrag(null);
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('keydown', key);
    };
    // Seule l'existence d'un glisser compte : la position passe par dragRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag !== null, compute, onDrop]);

  return { drag, start };
}

// Bouton qui passe en chargement : indicateur affiché après 150 ms, maintenu au moins 400 ms.
export function useLoading(ms = 1200) {
  const [loading, setLoading] = useState(false);
  const run = () => {
    if (loading) return;
    setLoading(true);
    setTimeout(() => setLoading(false), ms);
  };
  return [loading, run];
}
