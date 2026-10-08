'use client';

// Bandeau « Maintenant » (verre translucide, texte sombre) : une ligne avec le bloc en cours et son temps
// restant (ou, à défaut, le prochain bloc et son délai), le bloc visible qui suit, le nombre d'éléments à
// ranger et l'heure de Paris. Le serveur donne l'instant du rendu ; le client recalcule chaque minute
// (nowState, lib/home.js). Aucune couleur seule : chaque état a son mot. Un bouton ouvre la Commande
// (Cmd+K ou Ctrl+K, components/CommandPalette.js) pour l'ouvrir aussi au doigt.
import { useEffect, useState } from 'react';
import { OPEN_COMMAND_EVENT } from '../CommandPalette';
import { keyClass } from '../ui';
import { formatRemaining, nowState, timeParis } from '@/lib/home';

const LABEL = 'text-xs font-semibold tracking-wide uppercase text-[var(--glass-muted)]';

// Minute courante : se recale sur le début de chaque minute (jamais en retard de plus d'une seconde).
function useMinuteClock(initial) {
  const [now, setNow] = useState(initial);
  useEffect(() => {
    let timer;
    const tick = () => {
      setNow(Date.now());
      timer = setTimeout(tick, 60000 - (Date.now() % 60000) + 50);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);
  return now;
}

function Block({ label, block, tail }) {
  return (
    <div className="flex min-w-0 items-baseline gap-2">
      <span className={`${LABEL} shrink-0`}>{label}</span>
      <span className="min-w-0 truncate text-[15px] font-semibold" title={block.title}>
        {block.title}
      </span>
      {tail && <span className="tabular shrink-0 text-sm text-[var(--glass-muted)]">{tail}</span>}
    </div>
  );
}

export default function NowBar({ events, categories, now: serverNow, rangerCount, lateCount }) {
  const now = useMinuteClock(serverNow);
  const state = nowState(events, new Date(now), categories);
  const [first, second] = state.upcoming;

  // Bloc principal : en cours (temps restant), sinon le prochain (heure et délai).
  let main = null;
  let follow = null;
  if (state.kind === 'current') {
    const c = state.current;
    main = <Block label="En cours" block={c} tail={`${c.time}-${c.endTime} · reste ${formatRemaining(c.minutesLeft)}`} />;
    follow = first && <Block label="Ensuite" block={first} tail={`${first.time} · dans ${formatRemaining(first.minutesUntil)}`} />;
  } else if (state.kind === 'between') {
    main = <Block label="Prochain" block={first} tail={`${first.time} · dans ${formatRemaining(first.minutesUntil)}`} />;
    follow = second && <Block label="Ensuite" block={second} tail={second.time} />;
  } else {
    main = (
      <div className="flex min-w-0 items-baseline gap-2">
        <span className={`${LABEL} shrink-0`}>{state.kind === 'done' ? 'Journée finie' : 'Aujourd’hui'}</span>
        <span className="truncate text-[15px] font-semibold">{state.kind === 'done' ? 'Plus aucun bloc aujourd’hui' : 'Aucun bloc prévu'}</span>
      </div>
    );
  }

  return (
    <header
      className="glass flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl px-4 py-2 xl:h-14 xl:flex-nowrap xl:py-0"
      aria-label="Maintenant"
      data-testid="now-bar"
    >
      <h2 className="sr-only">Maintenant</h2>
      <div className="min-w-0 flex-1 basis-60 xl:max-w-[36rem]" data-testid="now-main">
        {main}
      </div>
      {follow && (
        <div className="min-w-0 flex-1 basis-52 xl:max-w-[32rem] xl:border-l xl:border-[var(--glass-border)] xl:pl-6" data-testid="now-next">
          {follow}
        </div>
      )}
      <div className="ml-auto flex shrink-0 items-center gap-5">
        <a
          href="#a-ranger"
          className="flex min-h-8 items-center gap-2 rounded-lg px-1 text-[var(--glass-text)] [@media(pointer:coarse)]:min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
          data-testid="now-ranger"
        >
          <span className={LABEL}>À ranger</span>
          <span className="tabular text-[15px] font-semibold">
            {rangerCount}
            {lateCount > 0 && <span className="ml-2 text-sm font-normal text-[var(--glass-muted)]">{`dont ${lateCount} en retard`}</span>}
          </span>
        </a>
        <button
          type="button"
          className={keyClass()}
          title="Commande (Ctrl+K ou Cmd+K)"
          aria-keyshortcuts="Control+K Meta+K"
          aria-haspopup="dialog"
          onClick={() => window.dispatchEvent(new Event(OPEN_COMMAND_EVENT))}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" className="size-4">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
          Commande
        </button>
        <div className="flex items-baseline gap-2" data-testid="now-clock">
          <span className={LABEL}>Paris</span>
          <time dateTime={new Date(now).toISOString()} className="tabular text-[15px] font-semibold">
            {timeParis(new Date(now).toISOString())}
          </time>
        </div>
      </div>
    </header>
  );
}
