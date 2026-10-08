'use client';

// Bandeau « Maintenant » (cadre cuir, jetons --frame-*) : le bloc en cours avec son temps restant, ou à
// défaut le prochain bloc et son heure, le bloc suivant, le nombre d'éléments à ranger et l'heure de
// Paris. Le serveur donne l'instant du rendu ; le client recalcule chaque minute (nowState, lib/home.js).
// Chiffres et heures en police mono tabulaire. Aucune couleur seule : chaque état a son mot.
import { useEffect, useState } from 'react';
import { formatRemaining, nowState, timeParis } from '@/lib/home';

const LABEL = 'font-mono text-xs font-semibold tracking-wide uppercase text-[var(--frame-muted)]';

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
    <div className="min-w-0">
      <p className={LABEL}>{label}</p>
      <p className="flex min-w-0 items-baseline gap-2 text-base">
        <span className="min-w-0 truncate font-medium" title={block.title}>
          {block.title}
        </span>
        {tail && <span className="tabular shrink-0 font-mono text-sm text-[var(--frame-muted)]">{tail}</span>}
      </p>
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
      <div>
        <p className={LABEL}>{state.kind === 'done' ? 'Journée finie' : 'Aujourd’hui'}</p>
        <p className="text-base font-medium">{state.kind === 'done' ? 'Plus aucun bloc aujourd’hui' : 'Aucun bloc prévu'}</p>
      </div>
    );
  }

  return (
    <header
      className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2 border-b border-[var(--frame-border)] bg-[var(--frame-bg)] px-4 py-2 text-[var(--frame-text)] xl:h-14 xl:flex-nowrap xl:py-0"
      aria-label="Maintenant"
      data-testid="now-bar"
    >
      <h2 className="sr-only">Maintenant</h2>
      <div className="min-w-0 flex-1 basis-60 xl:max-w-[34rem]" data-testid="now-main">
        {main}
      </div>
      {follow && (
        <div className="min-w-0 flex-1 basis-52 xl:max-w-[30rem] xl:border-l xl:border-[var(--frame-border)] xl:pl-6" data-testid="now-next">
          {follow}
        </div>
      )}
      <div className="ml-auto flex shrink-0 items-center gap-6">
        <a
          href="#a-ranger"
          className="block rounded-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-on-frame)]"
          data-testid="now-ranger"
        >
          <span className={`${LABEL} block`}>À ranger</span>
          <span className="tabular font-mono text-base font-semibold">
            {rangerCount}
            {lateCount > 0 && <span className="ml-2 text-sm font-normal text-[var(--frame-muted)]">{`dont ${lateCount} en retard`}</span>}
          </span>
        </a>
        <div className="text-right" data-testid="now-clock">
          <span className={`${LABEL} block`}>Paris</span>
          <time dateTime={new Date(now).toISOString()} className="tabular font-mono text-base font-semibold">
            {timeParis(new Date(now).toISOString())}
          </time>
        </div>
      </div>
    </header>
  );
}
