'use client';

// Étape 2 de la refonte : le logo de Cadran. Cinq propositions dessinées à la main, jugées sur les mêmes
// déclinaisons (grand format, icône 64 / 32 / 16 px rastérisée pour de bon, monochrome, rail latéral,
// onglet, démarrage, version vivante). Lecture seule : l'état (charte, mode, curseurs) reste dans l'onglet.
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { CHARTES } from '@/components/demo/studio/chartes-meta';
import { Sym, Lock, Word, Tile, PixelLoupe, railSw } from './Logo';
import { RailMock, MobileBarMock, TabsMock, BootScreen, StatesStrip } from './Mockups';
import { MARKS, MARK_IDS, tileSvg, exportFiles } from './marques.js';
import { COPY, CRITERIA, REC, SLIDERS, describe, liveState, fmtMin } from './content';

const card = 'rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]';
const seg = (on) =>
  `rounded-[var(--radius-sm)] border px-3 py-1.5 text-[13px] ${
    on ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text)]' : 'border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]'
  }`;
const titleStyle = { fontFamily: 'var(--font-display)', fontWeight: 'var(--k-title-weight)', letterSpacing: 'var(--k-title-tracking)', fontStyle: 'var(--k-title-style)' };

// Heure de Paris en minutes depuis minuit ; 720 côté serveur pour que l'hydratation soit stable.
const subscribeClock = (cb) => {
  const t = setInterval(cb, 30000);
  return () => clearInterval(t);
};
const parisMinutes = () => {
  const parts = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const get = (t) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return get('hour') * 60 + get('minute');
};
const dateLabel = (day) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)));
};

function Panel({ title, note, children, className = '' }) {
  return (
    <div className={`${card} grid min-w-0 content-start gap-3 p-4 ${className}`}>
      <div>
        <h3 className="text-[14px] font-semibold text-[var(--text)]">{title}</h3>
        {note && <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--text-faint)]">{note}</p>}
      </div>
      {children}
    </div>
  );
}

function Bullets({ items }) {
  return (
    <ul className="grid gap-1.5 text-[13px] leading-relaxed text-[var(--text-muted)]">
      {items.map((t) => (
        <li key={t} className="flex gap-2">
          <span className="mt-[0.55em] block size-1 shrink-0 rounded-full bg-[var(--text-faint)]" aria-hidden="true" />
          <span className="min-w-0">{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Proposal({ id, state, live, palette, colors, favId, onFav, slider, onSlider, base }) {
  const m = MARKS[id];
  const c = COPY[id];
  const sl = SLIDERS[id];
  const v = sl.to(state);
  const tileUri = tileSvg(id, state, { ...colors, bg: palette.tile }, { small: true, pad: 0.12 });
  const tileUri16 = tileSvg(id, state, { ...colors, bg: palette.tile }, { small: true, pad: 0.06 });
  const files = exportFiles(id);
  return (
    <section id={id} className="grid scroll-mt-24 grid-cols-[minmax(0,1fr)] gap-5 border-t border-[var(--border)] pt-10">
      <header className="max-w-3xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--accent)]">{c.kicker}</p>
        <h2 className="mt-1 text-[24px] leading-tight text-[var(--text)] sm:text-[30px]" style={titleStyle}>
          {c.title}
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-muted)]">{c.idea}</p>
      </header>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]">
        <Panel title="Le symbole, grand format" note="Sur le fond de la charte choisie en haut de la page.">
          <div className="flex min-h-[260px] items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg)] p-6 text-[var(--text)]">
            <Sym id={id} state={state} size={220} title={`Symbole ${m.name}`} />
          </div>
        </Panel>
        <Panel title="Symbole et logotype" note={c.typoNote}>
          <div className="grid gap-3">
            <div className="flex min-h-[150px] items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-[var(--bg)] p-6 text-[var(--text)]">
              <Lock id={id} state={state} height={96} />
            </div>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-[var(--radius-sm)] bg-[var(--surface-2)] px-5 py-4 text-[var(--text)]">
              <Lock id={id} state={state} height={36} />
              <span
                className="text-[26px] leading-none"
                style={{ fontFamily: m.font.css, fontWeight: m.font.weight, fontStretch: m.font.stretch, letterSpacing: m.font.tracking }}
              >
                {m.font.upper ? 'CADRAN' : 'Cadran'}
              </span>
              <span className="text-[12px] text-[var(--text-faint)]">Variante composée : {m.font.label}</span>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <Panel title="Version vivante" note="Calculée sur les vraies données en lecture seule (heure de Paris, agenda et éléments à ranger d'aujourd'hui) ; le curseur simule un autre état.">
          <div className="flex items-center gap-5 text-[var(--text)]">
            <Sym id={id} state={state} size={112} title="Symbole vivant" />
            <p className="min-w-0 text-[13px] leading-relaxed text-[var(--text-muted)]">{describe(id, state)}</p>
          </div>
          <label className="grid gap-1 text-[12px] text-[var(--text-muted)]">
            <span className="flex items-center justify-between gap-2">
              {sl.label}
              <span className="font-mono text-[var(--text)]">{sl.show(v)}</span>
            </span>
            <input type="range" min={sl.min} max={sl.max} step={sl.step} value={v} onChange={(e) => onSlider(id, sl.from(Number(e.target.value), base))} className="w-full accent-[var(--accent)]" />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={seg(false)} onClick={() => onSlider(id, null)}>
              Revenir aux données réelles
            </button>
            <button type="button" className={seg(favId === id)} aria-pressed={favId === id} onClick={() => onFav(id)}>
              {favId === id ? 'Dans le vrai onglet' : 'Mettre dans le vrai onglet'}
            </button>
          </div>
          <StatesStrip id={id} base={base} />
        </Panel>

        <Panel title="Icône d'application : 64, 32 et 16 px" note="Les deux loupes sont de vrais rendus du navigateur (canvas) à 16 et 32 px, agrandis sans lissage : c'est ce que voit l'onglet.">
          <div className="flex flex-wrap items-end gap-5">
            <Tile id={id} state={state} size={64} />
            <Tile id={id} state={state} size={32} />
            <Tile id={id} state={state} size={16} />
            <span className="font-mono text-[11px] text-[var(--text-faint)]">64 / 32 / 16</span>
          </div>
          <div className="flex flex-wrap items-end gap-5">
            <figure className="grid gap-1.5">
              <PixelLoupe svg={tileUri16} px={16} zoom={8} label={`Rendu réel à 16 px de l'icône ${m.name}`} />
              <figcaption className="font-mono text-[11px] text-[var(--text-faint)]">16 px x 8</figcaption>
            </figure>
            <figure className="grid gap-1.5">
              <PixelLoupe svg={tileUri} px={32} zoom={4} label={`Rendu réel à 32 px de l'icône ${m.name}`} />
              <figcaption className="font-mono text-[11px] text-[var(--text-faint)]">32 px x 4</figcaption>
            </figure>
          </div>
          <p className="text-[13px] leading-relaxed text-[var(--text-muted)]">
            <span className="font-medium text-[var(--text)]">Lisibilité à 16 px.</span> {c.legibility}
          </p>
        </Panel>
      </div>

      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <Panel title="Monochrome" note="Blanc sur noir et noir sur blanc, indépendants de la charte : tout doit tenir sans la couleur d'accent.">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex min-h-[170px] flex-col items-center justify-center gap-4 rounded-[var(--radius-sm)] bg-black p-4 text-white">
              <Sym id={id} state={state} size={72} mono />
              <Lock id={id} state={state} height={32} mono />
            </div>
            <div className="flex min-h-[170px] flex-col items-center justify-center gap-4 rounded-[var(--radius-sm)] bg-white p-4 text-black">
              <Sym id={id} state={state} size={72} mono />
              <Lock id={id} state={state} height={32} mono />
            </div>
          </div>
        </Panel>
        <Panel title="Fichiers SVG exportés" note="Dessinés avec le même code que cette page, états d'exemple (charte Graphite en place).">
          <ul className="grid gap-1 text-[13px]">
            {files.map((f) => (
              <li key={f.name} className="flex flex-wrap items-baseline justify-between gap-x-3">
                <a href={`/demo/logos/${f.name}`} className="font-mono text-[12px] text-[var(--accent)] underline underline-offset-2">
                  {f.name}
                </a>
                <span className="text-[12px] text-[var(--text-faint)]">{f.label}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="En-tête du vrai rail latéral" note="Calqué sur components/RailClient.js : rail de 14 rem, en-tête de 36 px et libellé de 15 px, rail replié de 4,25 rem, barre du haut sur téléphone. Le logotype passe en trait épaissi pour rester net à cette taille.">
        <div className="flex flex-wrap items-start gap-4">
          <RailMock id={id} state={state} toRanger={live.toRanger} projects={live.projects} />
          <RailMock id={id} state={state} toRanger={live.toRanger} projects={live.projects} compact />
          <div className="grid min-w-0 flex-1 content-start gap-3" style={{ minWidth: 'min(100%, 280px)' }}>
            <MobileBarMock id={id} state={state} />
            <div className="flex items-center gap-3 text-[var(--text-muted)]">
              <Word id={id} height={16} sw={railSw(id)} mono />
              <span className="text-[12px] text-[var(--text-faint)]">Logotype seul, hauteur 16 px</span>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Panel title="Favicon d'onglet" note="Rendu réel de l'icône à 16 px dans deux barres de navigateur (sombre et claire).">
          <TabsMock id={id} state={state} colors={{ ...colors, bg: palette.tile }} />
        </Panel>
        <Panel title="Écran de démarrage" note="Ouverture du rituel de rangement : le symbole se dessine, puis le logotype, la date et le nombre à ranger.">
          <BootScreen id={id} state={state} dateLabel={dateLabel(live.today)} toRanger={live.toRanger} />
        </Panel>
      </div>

      <div className="grid min-w-0 gap-4 md:grid-cols-2">
        <Panel title="Forces">
          <Bullets items={c.strengths} />
        </Panel>
        <Panel title="Failles">
          <Bullets items={c.flaws} />
        </Panel>
      </div>
    </section>
  );
}

export default function LogoDemo({ live }) {
  const rec = REC;
  const rootRef = useRef(null);
  const [charte, setCharte] = useState('graphite');
  const [mode, setMode] = useState('dark');
  const [useReal, setUseReal] = useState(true);
  const [manual, setManual] = useState({});
  const [favId, setFavId] = useState('anneau');
  const [palette, setPalette] = useState({ ink: '#e8ebf0', accent: '#8399ff', bg: '#0e1013', tile: '#1d2128' });
  const minutes = useSyncExternalStore(subscribeClock, parisMinutes, () => 720);

  const bases = useMemo(
    () =>
      Object.fromEntries(
        MARK_IDS.map((id) => [id, useReal ? liveState(id, { minutes, live }) : MARKS[id].sample]),
      ),
    [useReal, minutes, live],
  );
  const states = useMemo(() => Object.fromEntries(MARK_IDS.map((id) => [id, manual[id] ?? bases[id]])), [manual, bases]);
  const colors = useMemo(() => ({ ink: palette.ink, accent: palette.accent }), [palette]);

  // Couleurs réellement rendues de la charte (les images SVG ne lisent pas les variables CSS).
  useEffect(() => {
    const cs = getComputedStyle(rootRef.current);
    const get = (k) => cs.getPropertyValue(k).trim();
    setPalette({ ink: get('--text'), accent: get('--accent'), bg: get('--bg'), tile: get('--surface-2') });
  }, [charte, mode]);

  const favSvg = useMemo(() => tileSvg(favId, states[favId], { ...colors, bg: palette.bg }, { small: true, pad: 0.06 }), [favId, states, colors, palette.bg]);

  // Le vrai onglet de ce navigateur prend le favicon de la proposition choisie.
  useEffect(() => {
    const href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(favSvg)}`;
    const links = [...document.querySelectorAll('link[rel~="icon"]')];
    const saved = links.map((l) => [l, l.getAttribute('href'), l.getAttribute('type')]);
    links.forEach((l) => {
      l.setAttribute('href', href);
      l.setAttribute('type', 'image/svg+xml');
    });
    let added = null;
    if (!links.length) {
      added = document.createElement('link');
      added.rel = 'icon';
      added.type = 'image/svg+xml';
      added.href = href;
      document.head.appendChild(added);
    }
    return () => {
      saved.forEach(([l, h, t]) => {
        l.setAttribute('href', h ?? '');
        if (t) l.setAttribute('type', t);
        else l.removeAttribute('type');
      });
      if (added) added.remove();
    };
  }, [favSvg]);

  const onSlider = (id, value) => setManual((cur) => ({ ...cur, [id]: value === null ? undefined : value }));
  const recMark = MARKS[rec.id];

  return (
    <div ref={rootRef} className="studio min-h-screen bg-[var(--bg)] text-[var(--text)]" data-charte={charte} data-mode={mode} style={{ fontFamily: 'var(--font-body)' }}>
      <style>{`
        @keyframes cadran-draw { from { stroke-dashoffset: 1; } }
        @keyframes cadran-fade { from { opacity: 0; transform: translateY(4px); } }
        .cadran-fade { animation: cadran-fade 600ms ease-out backwards; }
        @media (prefers-reduced-motion: reduce) { .cadran-fade, .cadran-fade * , svg [style*="animation"] { animation: none !important; } }
      `}</style>
      <div className="z-20 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur sm:sticky sm:top-0">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--warning)]">Démo : rien n’est enregistré</p>
          <Link href="/demo" className="text-[13px] text-[var(--text-muted)] underline underline-offset-4 hover:text-[var(--text)]">
            Retour aux démos
          </Link>
          <div className="ml-auto flex flex-wrap items-center gap-2" role="group" aria-label="Charte, mode et données">
            <label className="flex items-center gap-2 text-[13px] text-[var(--text-muted)]">
              Charte
              <select value={charte} onChange={(e) => setCharte(e.target.value)} className="rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-1.5 text-[13px] text-[var(--text)]">
                {CHARTES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            {[
              ['dark', 'Sombre'],
              ['light', 'Clair'],
            ].map(([k, label]) => (
              <button key={k} type="button" onClick={() => setMode(k)} aria-pressed={mode === k} className={seg(mode === k)}>
                {label}
              </button>
            ))}
            <span className="mx-1 hidden h-5 w-px bg-[var(--border-strong)] sm:block" aria-hidden="true" />
            {[
              [true, 'Données réelles'],
              [false, 'Exemple'],
            ].map(([k, label]) => (
              <button key={label} type="button" onClick={() => setUseReal(k)} aria-pressed={useReal === k} className={seg(useReal === k)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-12 px-4 py-8 sm:py-12">
        <header className="grid max-w-3xl gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--accent)]">Étape 2 : le logo de Cadran</p>
            <h1 className="mt-2 text-[34px] leading-[1.05] sm:text-[48px]" style={titleStyle}>
              Cinq façons de dessiner un cadran
            </h1>
          </div>
          <p className="text-[15px] leading-relaxed text-[var(--text-muted)]">
            Le nom est choisi : Cadran, la face d’un instrument de bord. La première version (un arc de 270 degrés et une aiguille qui compte les éléments à ranger) a été jugée banale, façon compteur de vitesse :
            elle est abandonnée. Voici cinq pistes nettement différentes, dessinées à la main, trait par trait. Chacune est montrée dans les mêmes déclinaisons, avec ses forces, ses failles et son rendu réel à 16 px,
            pour que la comparaison soit honnête.
          </p>
          <p className="text-[13px] leading-relaxed text-[var(--text-faint)]">
            Le symbole de chaque proposition est vivant : il se calcule sur l’heure, l’agenda ou le nombre à ranger, en lecture seule. Le logotype est tracé lettre à lettre (aucune police à licencier, rendu identique partout), avec la
            police composée équivalente en regard.
          </p>
          <nav aria-label="Propositions" className="flex flex-wrap gap-2">
            {MARK_IDS.map((id) => (
              <a key={id} href={`#${id}`} className={seg(false)}>
                {MARKS[id].letter.toUpperCase()}. {MARKS[id].name}
              </a>
            ))}
            <a href="#recommandation" className={seg(false)}>
              Recommandation
            </a>
          </nav>
        </header>

        <section aria-label="Les cinq côte à côte" className="grid grid-cols-[minmax(0,1fr)] gap-3">
          <h2 className="text-[18px] text-[var(--text)]" style={titleStyle}>
            Les cinq côte à côte
          </h2>
          <ul className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-5">
            {MARK_IDS.map((id) => (
              <li key={id}>
                <a href={`#${id}`} className={`${card} grid h-full justify-items-center gap-4 p-4 text-[var(--text)] hover:border-[var(--border-strong)]`}>
                  <span className="self-start font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--text-faint)]">
                    {MARKS[id].letter.toUpperCase()}. {MARKS[id].name}
                  </span>
                  <Sym id={id} state={states[id]} size={104} title={MARKS[id].name} />
                  <Lock id={id} state={states[id]} height={32} />
                  <span className="flex items-end gap-3">
                    <Tile id={id} state={states[id]} size={32} />
                    <Tile id={id} state={states[id]} size={16} />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        {MARK_IDS.map((id) => (
          <Proposal
            key={id}
            id={id}
            state={states[id]}
            base={bases[id]}
            live={live}
            palette={palette}
            colors={colors}
            favId={favId}
            onFav={setFavId}
            onSlider={onSlider}
          />
        ))}

        <section id="comparatif" className="grid scroll-mt-24 grid-cols-[minmax(0,1fr)] gap-4 border-t border-[var(--border)] pt-10">
          <h2 className="text-[24px] text-[var(--text)] sm:text-[30px]" style={titleStyle}>
            Comparatif
          </h2>
          <div className={`${card} hidden md:block`}>
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                  <th className="px-3 py-2 font-medium">Critère</th>
                  {MARK_IDS.map((id) => (
                    <th key={id} className="px-3 py-2 font-medium">
                      {MARKS[id].letter.toUpperCase()}. {MARKS[id].name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CRITERIA.map(([label, cells]) => (
                  <tr key={label} className="border-b border-[var(--border)] last:border-0">
                    <th scope="row" className="px-3 py-2 font-medium text-[var(--text)]">
                      {label}
                    </th>
                    {cells.map((t, i) => (
                      <td key={MARK_IDS[i]} className="px-3 py-2 text-[var(--text-muted)]">
                        {t}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="grid gap-3 md:hidden">
            {CRITERIA.map(([label, cells]) => (
              <li key={label} className={`${card} p-4`}>
                <h3 className="text-[14px] font-semibold text-[var(--text)]">{label}</h3>
                <dl className="mt-2 grid gap-1 text-[13px]">
                  {cells.map((t, i) => (
                    <div key={MARK_IDS[i]} className="flex justify-between gap-3">
                      <dt className="text-[var(--text-muted)]">
                        {MARKS[MARK_IDS[i]].letter.toUpperCase()}. {MARKS[MARK_IDS[i]].name}
                      </dt>
                      <dd className="text-right text-[var(--text)]">{t}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
        </section>

        <section id="recommandation" className="grid scroll-mt-24 grid-cols-[minmax(0,1fr)] gap-5 border-t border-[var(--border)] pt-10">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--accent)]">Recommandation</p>
            <h2 className="mt-1 text-[24px] leading-tight text-[var(--text)] sm:text-[30px]" style={titleStyle}>
              {rec.title}
            </h2>
          </div>
          <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <div className={`${card} flex flex-col items-center justify-center gap-5 p-6 text-[var(--text)]`}>
              <Sym id={rec.id} state={states[rec.id]} size={140} title={recMark.name} />
              <Lock id={rec.id} state={states[rec.id]} height={44} />
              <span className="flex items-end gap-3">
                <Tile id={rec.id} state={states[rec.id]} size={32} />
                <Tile id={rec.id} state={states[rec.id]} size={16} />
              </span>
            </div>
            <div className="grid min-w-0 content-start gap-4">
              {rec.paragraphs.map((p) => (
                <p key={p} className="text-[15px] leading-relaxed text-[var(--text-muted)]">
                  {p}
                </p>
              ))}
              <h3 className="text-[14px] font-semibold text-[var(--text)]">À trancher avec toi</h3>
              <ol className="grid list-decimal gap-1.5 pl-5 text-[14px] leading-relaxed text-[var(--text-muted)]">
                {rec.questions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ol>
            </div>
          </div>

          <Panel title="Piste de couleur : l'accent du logo" note="Le logo suit l'accent de la charte. Pistes inspirées de l'automobile des années 70 que tu as aimée ailleurs ; les valeurs sont éclaircies pour tenir sur un fond sombre (le vert Aston #1F5141 et le bleu Martini #4C78A8 bruts s'y effacent), le rouge reste réservé aux alertes.">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Bleu de la charte', null],
                ['Bleu Martini', '#6f9bd1'],
                ['Vert Aston éclairci', '#3fa07c'],
                ['Giallo', '#e0b04a'],
              ].map(([label, hex]) => (
                <li key={label} className="grid justify-items-center gap-3 rounded-[var(--radius-sm)] bg-[var(--bg)] p-4 text-[var(--text)]" style={hex ? { '--accent': hex } : undefined}>
                  <Sym id={rec.id} state={states[rec.id]} size={72} title={label} />
                  <Tile id={rec.id} state={states[rec.id]} size={32} />
                  <span className="text-center text-[12px] text-[var(--text-muted)]">{label}</span>
                  <span className="font-mono text-[11px] text-[var(--text-faint)]">{hex ?? 'var(--accent)'}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </section>

        <footer className="border-t border-[var(--border)] pt-6 text-[12px] text-[var(--text-faint)]">
          Valeurs vivantes d’aujourd’hui : {live.toRanger} élément{live.toRanger > 1 ? 's' : ''} à ranger, {live.plages.length} plage{live.plages.length > 1 ? 's' : ''} à l’agenda, {fmtMin(minutes)}. Démo en lecture seule.
        </footer>
      </main>
    </div>
  );
}
