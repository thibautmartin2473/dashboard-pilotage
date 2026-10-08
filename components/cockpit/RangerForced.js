'use client';

// Rangement forcé : à l'ouverture de l'accueil, une feuille façon iOS (elle monte du bas, animation courte,
// réduite à rien si prefers-reduced-motion) présente un par un les éléments « dus »
// (en retard, bloc terminé, créés avant aujourd'hui, reports arrivés). Il n'a ni bouton fermer ni Échap :
// il se ferme quand tout est traité (« Plus tard » compte comme traité). La file est figée au montage :
// AutoRefresh relit la page toutes les 60 s sans jamais la réinitialiser. Jamais de blocage sans issue :
// un élément déjà traité ailleurs est retiré de la file, et un geste qui échoue offre « Passer pour l'instant ».
import { useEffect, useRef, useState } from 'react';
import { ElsewherePicker, Gestures, ItemMeta, SuggestionBox, TypeBadge, btnClass, primaryBtn } from './RangerParts';
import { keyClass } from '../ui';
import { rangerApply, rangerUndo } from '@/app/ranger-actions';
import { gesturesFor } from '@/lib/ranger';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function Dialog({ initial, options, ready, today, onClose }) {
  const [byKey] = useState(() => new Map(initial.map((i) => [i.key, i])));
  const total = initial.length;
  const [queue, setQueue] = useState(() => initial.map((i) => i.key));
  const [history, setHistory] = useState([]); // [{ keys, tokens }], le dernier geste en dernier
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null); // information sans gravité (élément déjà traité ailleurs)
  const [failedKeys, setFailedKeys] = useState([]); // éléments dont un geste a échoué (autre erreur que « déjà traité »)
  const [passed, setPassed] = useState([]); // éléments passés pour l'instant : ils restent en fin de file, hors du parcours
  const [picker, setPicker] = useState(false);
  const [series, setSeries] = useState(false);
  const box = useRef(null);

  const live = queue.filter((k) => !passed.includes(k));
  const stuck = queue.length - live.length; // éléments passés qui n'ont pas pu être rangés
  const current = live.length ? byKey.get(live[0]) : null;
  const group = current ? live.map((k) => byKey.get(k)).filter((i) => i.series === current.series) : [];
  const g = current ? gesturesFor(current, { ready }) : null;
  const finished = !current && busy === 0;

  // Applique un geste à l'élément courant (ou à toute sa série) : il quitte la file tout de suite. Si le
  // serveur dit qu'il a déjà été traité ailleurs, il reste retiré (message court) ; pour toute autre erreur
  // il revient en tête, avec « Passer pour l'instant ».
  const handle = async (gesture, target) => {
    if (!current) return;
    const wanted = series && group.length > 1 ? group : [current];
    const targets = wanted.filter((i) => {
      const gi = gesturesFor(i, { ready });
      return gesture === 'place' ? (target ? gi.elsewhere : gi.validate) : gesture === 'drop' ? gi.drop : gesture === 'later' ? gi.later : true;
    });
    if (!targets.length) return;
    const keys = targets.map((i) => i.key);
    setQueue((q) => q.filter((k) => !keys.includes(k)));
    setSeries(false);
    setPicker(false);
    setError(null);
    setNotice(null);
    setBusy((b) => b + 1);
    let results = [];
    let failure = null;
    try {
      const res = await rangerApply({
        gesture,
        refs: targets.map((i) => ({ kind: i.kind, id: i.id, ...(gesture === 'place' ? { target: target ?? i.suggestion.target } : {}) })),
      });
      results = res.results ?? [];
      failure = res.error ?? null;
    } catch (err) {
      failure = err.message;
    }
    const ok = results.filter((r) => r.token);
    const okKeys = ok.map((r) => r.key);
    if (ok.length) setHistory((h) => [...h, { keys: okKeys, tokens: ok.map((r) => r.token) }]);
    const goneKeys = keys.filter((k) => results.some((r) => r.key === k && r.gone));
    const failed = keys.filter((k) => !okKeys.includes(k) && !goneKeys.includes(k));
    if (goneKeys.length) setNotice(goneKeys.length > 1 ? `Déjà traités ailleurs, passés (${goneKeys.length})` : 'Déjà traité ailleurs, passé');
    if (failed.length) {
      setQueue((q) => [...failed, ...q]);
      setFailedKeys((f) => [...new Set([...f, ...failed])]);
      setError(failure ?? 'Geste refusé par le serveur.');
    }
    setBusy((b) => b - 1);
  };

  // « Passer pour l'instant » : l'élément en erreur va en fin de file et sort du parcours. L'écran se termine
  // quand il ne reste que des éléments passés ; ils restent dans la liste « À ranger ».
  const skip = () => {
    if (!current) return;
    const key = current.key;
    setQueue((q) => [...q.filter((k) => k !== key), key]);
    setPassed((p) => [...p, key]);
    setSeries(false);
    setPicker(false);
    setError(null);
    setNotice(null);
  };
  // Z : annule le dernier geste réussi (et toute sa série), tant que l'écran est ouvert.
  const undo = async () => {
    if (busy > 0 || !history.length) return;
    const last = history[history.length - 1];
    setBusy((b) => b + 1);
    setError(null);
    setNotice(null);
    let failure = null;
    try {
      const res = await rangerUndo(last.tokens);
      failure = res.error ?? null;
    } catch (err) {
      failure = err.message;
    }
    if (failure) setError(failure);
    else {
      setHistory((h) => h.slice(0, -1));
      setQueue((q) => [...last.keys, ...q]);
      setPicker(false);
    }
    setBusy((b) => b - 1);
  };

  const onKey = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault(); // pas de fermeture par Échap ; il ferme seulement le sélecteur
      e.stopPropagation();
      setPicker(false);
      return;
    }
    if (e.key === 'Tab') {
      const nodes = [...(box.current?.querySelectorAll(FOCUSABLE) ?? [])].filter((n) => n.offsetParent !== null);
      if (!nodes.length) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!box.current.contains(document.activeElement) || (e.shiftKey && document.activeElement === first)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = e.target?.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if (e.repeat) {
      e.preventDefault(); // une touche maintenue ne range pas dix éléments d'un coup
      return;
    }
    const key = e.key.toLowerCase();
    if (finished && (e.key === 'Enter' || key === ' ')) {
      if (document.activeElement?.tagName === 'BUTTON') return; // le bouton focalisé réagit seul
      e.preventDefault();
      onClose();
      return;
    }
    if (key === 'z') {
      e.preventDefault();
      undo();
      return;
    }
    if (!current) return;
    if (picker && /^[0-9]$/.test(key)) {
      const option = options[(Number(key) + 9) % 10];
      if (option) {
        e.preventDefault();
        handle('place', { type: 'block', eventId: option.eventId });
      }
      return;
    }
    if (key === 'v' && g.validate) handle('place');
    else if (key === 'a' && g.elsewhere) setPicker((p) => !p);
    else if (key === 'c') handle('done');
    else if (key === 's' && g.drop) handle('drop');
    else if (key === 'p' && g.later) handle('later');
    else return;
    e.preventDefault();
  };
  // Écouteur en phase de capture, ré-enregistré à chaque rendu pour lire l'état à jour.
  useEffect(() => {
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  // Le reste de la page est inerte et ne défile plus tant que l'écran est ouvert ; le focus reste dedans.
  useEffect(() => {
    const page = document.getElementById('cockpit-content');
    if (page) page.inert = true;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    box.current?.focus();
    return () => {
      if (page) page.inert = false;
      document.body.style.overflow = overflow;
      // La feuille disparaît avec le focus dedans : on le rend à la première ligne de « À ranger », sinon au
      // contenu principal (rendu focalisable le temps du focus).
      const active = document.activeElement;
      if (active && active !== document.body) return;
      const target = document.querySelector('#a-ranger [data-row]') ?? page;
      if (!target) return;
      if (!target.matches('button, a, input, [tabindex]')) target.tabIndex = -1;
      target.focus();
    };
  }, []);
  const currentKey = current?.key;
  useEffect(() => {
    if (box.current && !box.current.contains(document.activeElement)) box.current.focus();
  }, [currentKey, finished]);

  const position = Math.min(total, total - live.length + 1);
  const stuckText = `${stuck} élément${stuck > 1 ? "s n'ont" : " n'a"} pas pu être rangé${stuck > 1 ? 's' : ''}, recharge la page`;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center text-[var(--ink)]" data-testid="ranger-forced">
      {/* Voile : la page derrière reste visible mais inerte (pas de fermeture au clic : on range d'abord). */}
      <div className="anim-fade absolute inset-0 bg-[var(--ink)]/35 backdrop-blur-[3px]" aria-hidden="true" />
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ranger-forced-title"
        tabIndex={-1}
        className="anim-sheet relative flex max-h-[92dvh] w-full max-w-2xl flex-col gap-4 overflow-y-auto rounded-t-3xl border border-b-0 border-[var(--card-border)] bg-[var(--card-solid)] px-4 pb-8 pt-3 shadow-2xl outline-none sm:px-6"
      >
        <div className="mx-auto h-1.5 w-10 shrink-0 rounded-full bg-[var(--line-strong)]/50" aria-hidden="true" />
        <header className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="ranger-forced-title" className="text-xl font-semibold tracking-tight">
              {finished ? (stuck ? 'Rangement terminé' : 'Tout est rangé') : 'Rangement du jour'}
            </h2>
            {!finished && (
              <span className="tabular text-sm text-[var(--ink-muted)]" data-testid="ranger-progress" aria-label={`Élément ${position} sur ${total}`}>
                {`${position} / ${total}`}
              </span>
            )}
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[var(--line)]" role="presentation">
            <div className="h-full rounded-full bg-[var(--action)] transition-[width] duration-200 ease-out motion-reduce:transition-none" style={{ width: `${((total - live.length) / total) * 100}%` }} />
          </div>
        </header>

        {finished ? (
          <section className="space-y-4">
            <p className="text-base">{`${history.reduce((n, h) => n + h.keys.length, 0)} élément(s) traité(s).${stuck ? '' : " Rien ne reste d'avant aujourd'hui."}`}</p>
            {stuck > 0 && (
              <p role="alert" className="text-sm font-medium text-[var(--ink)]" data-testid="ranger-stuck">
                {stuckText}
              </p>
            )}
            {notice && (
              <p role="status" className="text-sm text-[var(--ink-muted)]">
                {notice}
              </p>
            )}
            {error && (
              <p role="alert" className="text-sm text-[var(--late-text)]">
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button type="button" className={primaryBtn} onClick={onClose} data-testid="ranger-close">
                Ouvrir le cockpit
              </button>
              <button type="button" className={btnClass} disabled={!history.length || busy > 0} onClick={undo} title="Annuler le dernier geste (Z)" aria-keyshortcuts="Z">
                Annuler le dernier geste
              </button>
            </div>
          </section>
        ) : current ? (
          <section className="space-y-3">
            <div className="space-y-2 rounded-2xl bg-[var(--card-inset)] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <TypeBadge item={current} />
                {current.dueReason && <span className="text-xs font-semibold text-[var(--late-text)]">{current.dueReason}</span>}
              </div>
              <p className="text-xl font-semibold break-words">{current.title}</p>
              {current.detail && <p className="text-sm break-words text-[var(--ink-muted)]">{current.detail}</p>}
              <ItemMeta item={current} />
            </div>

            <SuggestionBox item={current} large />

            {picker ? (
              <ElsewherePicker options={options} today={today} futureDays={ready} numbered onPick={(t) => handle('place', t)} onCancel={() => setPicker(false)} />
            ) : (
              <Gestures
                g={g}
                label="Gestes"
                on={{
                  place: () => handle('place'),
                  elsewhere: () => setPicker(true),
                  done: () => handle('done'),
                  drop: () => handle('drop'),
                  later: () => handle('later'),
                }}
              />
            )}

            <div className="flex flex-wrap items-center gap-2">
              {group.length > 1 && (
                <button type="button" aria-pressed={series} className={btnClass} onClick={() => setSeries((s) => !s)}>
                  {`Appliquer à la série (${group.length})`}
                </button>
              )}
              <button
                type="button"
                className={keyClass({ level: 'tertiary' })}
                disabled={!history.length || busy > 0}
                onClick={undo}
                title="Annuler le dernier geste (Z)"
                aria-keyshortcuts="Z"
              >
                Annuler le dernier geste
              </button>
            </div>
            {series && group.length > 1 && (
              <p className="text-sm text-[var(--ink)]">{`Le prochain geste s'applique aux ${group.length} éléments de cette série.`}</p>
            )}
            {!ready && <p className="text-xs text-[var(--ink-muted)]">Supprimer et Plus tard demandent supabase/ranger.sql.</p>}
            {notice && (
              <p role="status" className="text-sm text-[var(--ink-muted)]" data-testid="ranger-notice">
                {notice}
              </p>
            )}
            {error && (
              <p role="alert" className="text-sm text-[var(--late-text)]">
                {error}
              </p>
            )}
            {failedKeys.includes(current.key) && (
              <button type="button" className={btnClass} onClick={skip} data-testid="ranger-skip">
                {"Passer pour l'instant"}
              </button>
            )}
            <p className="text-xs text-[var(--ink-muted)]">Plus tard compte comme traité. Cet écran se ferme quand tout est rangé.</p>
          </section>
        ) : (
          <p className="text-sm text-[var(--ink-muted)]" role="status">
            Enregistrement en cours...
          </p>
        )}
      </div>
    </div>
  );
}

export default function RangerForced({ items, options, ready, today }) {
  // File figée au premier rendu : les rafraîchissements de la page ne la touchent pas.
  const [initial] = useState(() => items);
  const [closed, setClosed] = useState(initial.length === 0);
  if (closed) return null;
  return <Dialog initial={initial} options={options} ready={ready} today={today} onClose={() => setClosed(true)} />;
}
