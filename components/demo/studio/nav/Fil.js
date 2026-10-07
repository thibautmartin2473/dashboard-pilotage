'use client';

import { useEffect, useRef } from 'react';
import { FOCUS_IN, Mark, arrowNav } from './shared';

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Navigation « Fil » : une seule page qui empile toutes les sections (accueil d'abord), avec une
// barre d'ancres collante qui suit le défilement. onNavigate ne sert qu'à garder `current` à jour.
export default function NavFil({ sections, current, onNavigate, orgName, renderSection }) {
  const bar = useRef(null);
  const progress = useRef(null);
  const els = useRef({});
  const lastReported = useRef(null); // dernière section connue de l'observateur ou d'un clic
  const lockUntil = useRef(0); // pendant un défilement commandé, l'observateur se tait
  const onNavigateRef = useRef(onNavigate);
  const sectionsRef = useRef(sections);

  useEffect(() => {
    onNavigateRef.current = onNavigate;
    sectionsRef.current = sections;
  });

  const scrollTo = (id, instant) => {
    const el = els.current[id];
    if (!el) return;
    lockUntil.current = Date.now() + (instant || reduced() ? 400 : 1000);
    el.scrollIntoView({ behavior: instant || reduced() ? 'auto' : 'smooth', block: 'start' });
  };

  // Navigation venue de l'extérieur (un lien de l'accueil, le Composer...) : on défile jusqu'à la section.
  const first = useRef(true);
  useEffect(() => {
    if (current === lastReported.current) return;
    lastReported.current = current;
    scrollTo(current, first.current);
    first.current = false;
  }, [current]);

  // Observateur : la section qui traverse une bande près du haut devient la section courante.
  useEffect(() => {
    const scroller = bar.current?.closest('.studio') ?? null;
    const visible = new Set();
    const activate = (id) => {
      if (!id || id === lastReported.current) return;
      lastReported.current = id;
      onNavigateRef.current(id);
    };
    const decide = () => {
      if (Date.now() < lockUntil.current) return;
      const list = sectionsRef.current;
      if (scroller) {
        if (scroller.scrollTop < 8) return activate(list[0]?.id);
        if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2) return activate(list[list.length - 1]?.id);
      }
      let pick = null;
      for (const s of list) if (visible.has(s.id)) pick = s.id;
      if (pick) activate(pick);
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = e.target.dataset.filId;
          if (e.isIntersecting) visible.add(id);
          else visible.delete(id);
        }
        decide();
      },
      { root: scroller, rootMargin: '-18% 0px -70% 0px', threshold: 0 },
    );
    for (const el of Object.values(els.current)) if (el) io.observe(el);

    const onScroll = () => {
      if (scroller && progress.current) {
        const max = scroller.scrollHeight - scroller.clientHeight;
        progress.current.style.transform = `scaleX(${max > 0 ? Math.min(scroller.scrollTop / max, 1) : 0})`;
      }
      decide();
    };
    (scroller ?? window).addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      io.disconnect();
      (scroller ?? window).removeEventListener('scroll', onScroll);
    };
  }, []);

  // L'ancre courante reste visible dans la barre (défilement horizontal de la barre seule).
  useEffect(() => {
    const b = bar.current;
    const a = b?.querySelector('[aria-current]');
    if (!b || !a) return;
    const left = a.offsetLeft;
    const target = left - (b.clientWidth - a.offsetWidth) / 2;
    b.scrollTo?.({ left: Math.max(target, 0), behavior: reduced() ? 'auto' : 'smooth' });
  }, [current]);

  const click = (id) => {
    lastReported.current = id;
    onNavigate(id);
    scrollTo(id, false);
  };

  return (
    <div className="flex min-h-full flex-col">
      <div className="mx-auto flex w-full max-w-[100rem] items-center gap-3 px-4 pt-5 pb-3 sm:px-6 md:px-8">
        <Mark className="size-8" />
        <div className="min-w-0">
          <div className="text-[15px] leading-tight font-semibold [font-family:var(--font-display)]">Pilotage</div>
          <div className="truncate text-[11px] leading-tight text-[color:var(--text-faint)]">Organisation : {orgName}</div>
        </div>
        <div className="ml-auto hidden text-[11px] tracking-[0.12em] text-[color:var(--text-faint)] uppercase [font-family:var(--font-mono)] sm:block">
          {sections.length} sections, une seule page
        </div>
      </div>

      <div className="sticky top-0 z-30 border-y border-[color:var(--border)] bg-[color:var(--surface)]">
        <nav aria-label="Sections de la page" className="mx-auto w-full max-w-[100rem]">
          <ul
            ref={bar}
            className="relative flex gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none] sm:px-5 md:px-7"
            onKeyDown={(e) => arrowNav(e, 'h')}
          >
            {sections.map((s, i) => {
              const on = s.id === current;
              return (
                <li key={s.id} className="shrink-0">
                  <button
                    type="button"
                    data-nav-item
                    aria-current={on ? 'true' : undefined}
                    onClick={() => click(s.id)}
                    className={`flex items-baseline gap-2 rounded-full px-3.5 py-1.5 text-[13px] whitespace-nowrap transition-colors ${
                      on
                        ? 'bg-[color:var(--accent)] font-medium text-[color:var(--accent-contrast)]'
                        : 'text-[color:var(--text-muted)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--text)]'
                    } ${FOCUS_IN}`}
                  >
                    <span className={`text-[10px] [font-family:var(--font-mono)] ${on ? 'opacity-80' : 'text-[color:var(--text-faint)]'}`} aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {s.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <div aria-hidden="true" className="h-[2px] w-full bg-[color:var(--border)]">
          <div ref={progress} className="h-full origin-left bg-[color:var(--accent)]" style={{ transform: 'scaleX(0)' }} />
        </div>
      </div>

      <main id="studio-contenu" className="mx-auto w-full max-w-[100rem] min-w-0 flex-1 px-4 pb-40 sm:px-6 md:px-8 md:pb-24">
        {sections.map((s, i) => (
          <section
            key={s.id}
            id={`fil-${s.id}`}
            data-fil-id={s.id}
            ref={(el) => {
              els.current[s.id] = el;
            }}
            aria-labelledby={`fil-titre-${s.id}`}
            className="scroll-mt-16 py-8 md:py-10"
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="text-[11px] text-[color:var(--text-faint)] [font-family:var(--font-mono)]" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h2
                id={`fil-titre-${s.id}`}
                className="text-[12px] font-semibold tracking-[0.16em] text-[color:var(--text-muted)] uppercase [font-family:var(--font-display)]"
              >
                {s.label}
              </h2>
              <span aria-hidden="true" className="h-px flex-1 bg-[color:var(--border)]" />
            </div>
            {renderSection(s.id)}
          </section>
        ))}
      </main>
    </div>
  );
}
