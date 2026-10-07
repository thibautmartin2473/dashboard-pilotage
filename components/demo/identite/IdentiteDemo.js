'use client';

// Axe Identité : nom et logo du cockpit. Démo en lecture seule : l'état (charte, mode, logo choisi, curseur)
// reste dans l'onglet, rien n'est enregistré. Les valeurs vivantes viennent des vraies données (nombre à
// ranger, jalons des projets) passées par la page serveur, et de l'heure de l'appareil.
import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { CHARTES } from '@/components/demo/studio/chartes-meta';
import { Lockup, SymbolMark, AppTile } from './Logo';
import { NamesSection, CriteriaTable } from './NameCards';
import { RailMock, BootScreen, BrowserTabs, StatesStrip, AppIcons, MonoPanels } from './Mockups';
import { NAMES } from './names';
import { tileSvg, describeState, SLIDER, EXPORT_VALUE } from './logos';

const clamp = (v) => Math.min(1, Math.max(0, v));
const DRAWN = NAMES.filter((n) => n.drawn);

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

const CONSTRUCT = {
  estime: ['Point plein : le départ de la journée (rayon 4)', 'Trace et pointillé sur une diagonale à 45 degrés : le chemin fait et le chemin estimé', 'Anneau accentué (rayon 8) : maintenant, la seule forme en couleur'],
  cadran: ['Arc de 270 degrés (rayon 24), ouvert vers le bas', 'Aiguille accentuée : de 135 à 405 degrés selon le nombre à ranger', 'Moyeu plein (rayon 6)'],
  balise: ['Losange accentué : plein (il reste à ranger) ou creux (rangé)', 'Mât vertical de 23 unités', 'Ligne de flottaison de 48 unités'],
  jalon: ['Perche de 5 bandes de 6 sur 12, espacées de 4', 'Bandes atteintes pleines et accentuées, les autres à 30 % d’opacité', 'Ligne de sol de 40 unités'],
};

function Section({ id, kicker, title, children }) {
  return (
    <section id={id} className="grid grid-cols-[minmax(0,1fr)] scroll-mt-24 gap-4">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--accent)]">{kicker}</p>
        <h2
          className="mt-1 text-[22px] leading-tight text-[var(--text)] sm:text-[26px]"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--k-title-weight)', letterSpacing: 'var(--k-title-tracking)', fontStyle: 'var(--k-title-style)' }}
        >
          {title}
        </h2>
      </header>
      {children}
    </section>
  );
}

const card = 'rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]';
const seg = (on) =>
  `rounded-[var(--radius-sm)] border px-3 py-1.5 text-[13px] ${
    on ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text)]' : 'border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]'
  }`;

function H3({ children, note }) {
  return (
    <div>
      <h3 className="text-[15px] font-semibold text-[var(--text)]">{children}</h3>
      {note && <p className="mt-0.5 text-[13px] text-[var(--text-muted)]">{note}</p>}
    </div>
  );
}

export default function IdentiteDemo({ live }) {
  const rootRef = useRef(null);
  const [charte, setCharte] = useState('graphite');
  const [mode, setMode] = useState('dark');
  const [sel, setSel] = useState('estime');
  const [manual, setManual] = useState(null);
  const [grid, setGrid] = useState(true);
  const minutes = useSyncExternalStore(subscribeClock, parisMinutes, () => 720);
  const themeKey = `${charte}-${mode}`;

  const focus =
    [...live.projects].filter((p) => p.total > 0).sort((a, b) => (b.status === 'in_progress') - (a.status === 'in_progress') || b.total - a.total)[0] ?? null;
  const liveV = {
    estime: clamp((minutes - 420) / 960),
    cadran: clamp(live.toRanger / 10),
    balise: live.toRanger > 0 ? 1 : 0,
    jalon: focus ? focus.done / focus.total : EXPORT_VALUE.jalon,
  };
  const val = (id) => (id === sel && manual !== null ? manual : liveV[id]);
  const vSel = val(sel);
  const nameSel = NAMES.find((n) => n.id === sel);
  const pick = (id) => {
    setSel(id);
    setManual(null);
  };
  const date = dateLabel(live.today);

  // Le vrai onglet de ce navigateur prend le favicon (carré plein, lisible sur tout fond) du logo choisi.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const cs = getComputedStyle(root);
    const colors = { ink: cs.getPropertyValue('--text').trim(), accent: cs.getPropertyValue('--accent').trim(), bg: cs.getPropertyValue('--bg').trim() };
    const href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(tileSvg(sel, vSel, colors, { small: true, pad: 0.06 }))}`;
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
  }, [sel, vSel, themeKey]);

  const slider = SLIDER[sel];
  const sliderValue = manual ?? liveV[sel];

  return (
    <div
      ref={rootRef}
      className="studio min-h-screen bg-[var(--bg)] text-[var(--text)]"
      data-charte={charte}
      data-mode={mode}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <div className="z-20 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur sm:sticky sm:top-0">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--warning)]">Démo : rien n’est enregistré</p>
          <Link href="/demo" className="text-[13px] text-[var(--text-muted)] underline underline-offset-4 hover:text-[var(--text)]">
            Retour aux démos
          </Link>
          <div className="ml-auto flex flex-wrap items-center gap-2" role="group" aria-label="Charte et mode">
            <label className="flex items-center gap-2 text-[13px] text-[var(--text-muted)]">
              Charte
              <select
                value={charte}
                onChange={(e) => setCharte(e.target.value)}
                className="rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-1.5 text-[13px] text-[var(--text)]"
              >
                {CHARTES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <span className="mx-1 hidden h-5 w-px bg-[var(--border-strong)] sm:block" aria-hidden="true" />
            {[
              ['dark', 'Sombre'],
              ['light', 'Clair'],
            ].map(([m, label]) => (
              <button key={m} type="button" onClick={() => setMode(m)} aria-pressed={mode === m} className={seg(mode === m)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto grid grid-cols-[minmax(0,1fr)] max-w-6xl gap-14 px-4 py-8 sm:py-12">
        {/* ---------- ouverture ---------- */}
        <header className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--accent)]">Axe identité : nom et logo</p>
            <h1
              className="mt-2 text-[34px] leading-[1.05] sm:text-[48px]"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--k-title-weight)', letterSpacing: 'var(--k-title-tracking)', fontStyle: 'var(--k-title-style)' }}
            >
              Un nom et un signe pour le cockpit
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-[var(--text-muted)]">
              Aujourd’hui l’outil s’appelle « Pilotage » et porte un P dans un carré : c’est une étiquette, pas une identité. Voici six noms vérifiés contre les
              collisions et quatre logos dessinés à la main, trait par trait. Chacun porte une information vivante (l’heure, le nombre à ranger, les jalons) : le logo se lit, il ne
              décore pas.
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-[var(--text-faint)]">
              Registre retenu : instrument de bord, sobre, durable, d’après tes saves (tailoring, pièces qui durent, objets techniques) et les outils rapides de la recherche. Aucune de tes saves ne parle de nom ou
              de logo : ce choix est une inférence, pas un goût déclaré.
            </p>
          </div>
          <div className={`${card} flex items-center gap-3 p-4`}>
            <span className="flex size-10 items-center justify-center rounded-lg bg-[var(--accent)] text-[15px] font-bold text-[var(--accent-contrast)]" aria-hidden="true">
              P
            </span>
            <div>
              <p className="text-[15px] font-semibold">Pilotage</p>
              <p className="text-[12px] text-[var(--text-faint)]">Existant : une lettre dans un carré, aucune information</p>
            </div>
          </div>
        </header>

        {/* ---------- les quatre logos d'un coup d'oeil ---------- */}
        <Section id="coup-d-oeil" kicker="Le choix en un regard" title="Quatre logos, quatre idées">
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
            {DRAWN.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => {
                    pick(n.id);
                    document.getElementById('logo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`${card} group flex h-full w-full flex-col gap-4 p-5 text-left hover:bg-[var(--surface-2)]`}
                  style={{ boxShadow: sel === n.id ? 'inset 0 0 0 1px var(--accent)' : 'var(--shadow)' }}
                >
                  <span className="flex items-center justify-between gap-3 text-[var(--text)]">
                    <Lockup id={n.id} name={n.name.toLowerCase()} v={val(n.id)} height={52} />
                    <AppTile id={n.id} v={val(n.id)} size={44} className="hidden sm:inline-flex" />
                  </span>
                  <span className="text-[14px] leading-snug text-[var(--text-muted)]">{n.pitch}</span>
                  <span className="font-mono text-[11px] text-[var(--text-faint)]">Vivant : {n.liveSource}. {describeState(n.id, val(n.id), { project: focus?.name })}</span>
                </button>
              </li>
            ))}
          </ul>
        </Section>

        {/* ---------- noms ---------- */}
        <Section id="noms" kicker="Axe 1, partie 1" title="Six noms, classés">
          <NamesSection onPick={(id) => {
            pick(id);
            document.getElementById('logo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }} sel={sel} />
        </Section>

        {/* ---------- logo détaillé ---------- */}
        <Section id="logo" kicker="Axe 1, partie 2" title={`Le logo de ${nameSel.name}`}>
          <div role="tablist" aria-label="Choisir un logo" className="flex flex-wrap gap-2">
            {DRAWN.map((n) => (
              <button key={n.id} type="button" role="tab" aria-selected={sel === n.id} onClick={() => pick(n.id)} className={seg(sel === n.id)}>
                {n.name}
              </button>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className={`${card} flex flex-col items-center gap-4 p-5 text-[var(--text)]`}>
              <SymbolMark id={sel} v={vSel} size={280} grid={grid} title={`Symbole ${nameSel.name}`} className="max-w-full" />
              <button type="button" onClick={() => setGrid((g) => !g)} aria-pressed={grid} className={seg(grid)}>
                {grid ? 'Masquer la grille de construction' : 'Afficher la grille de construction'}
              </button>
            </div>

            <div className={`${card} grid content-start gap-5 p-5`}>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-faint)]">Ce qu’il dit</p>
                <p className="mt-1 text-[14px] leading-relaxed text-[var(--text-muted)]">{nameSel.symbol}</p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-faint)]">Construction</p>
                <p className="mt-1 text-[13px] text-[var(--text-muted)]">Grille de 4, trait unique de 4 (6 en variante petite), trois formes, extrémités plates, aucun dégradé ni lettre.</p>
                <ul className="mt-2 grid gap-1 text-[13px] text-[var(--text-muted)]">
                  {CONSTRUCT[sel].map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
              <div>
                <label htmlFor="etat" className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-faint)]">
                  {slider.label}
                </label>
                <input
                  id="etat"
                  type="range"
                  min="0"
                  max="1"
                  step={slider.step}
                  value={sliderValue}
                  onChange={(e) => setManual(Number(e.target.value))}
                  className="mt-2 w-full accent-[var(--accent)]"
                />
                <p className="mt-1 text-[13px] text-[var(--text)]" aria-live="polite">
                  {describeState(sel, vSel, { project: focus?.name })}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => setManual(null)} className={seg(manual === null)}>
                    Valeur du jour
                  </button>
                  <span className="text-[12px] text-[var(--text-faint)]">
                    Source : {nameSel.liveSource}
                    {sel === 'cadran' || sel === 'balise' ? ` (${live.toRanger} à ranger aujourd’hui)` : ''}
                    {sel === 'jalon' && focus ? ` (${focus.name} : ${focus.done}/${focus.total})` : ''}
                  </span>
                </div>
              </div>
              <p className="text-[12px] leading-relaxed text-[var(--text-faint)]">
                L’onglet de ce navigateur porte déjà le favicon de {nameSel.name} (il suit la charte, le mode et le curseur).
              </p>
            </div>
          </div>

          <div className={`${card} flex min-h-[220px] items-center justify-center p-6 text-[var(--text)] sm:p-10`}>
            <Lockup id={sel} name={nameSel.name.toLowerCase()} v={vSel} height={104} />
          </div>
        </Section>

        {/* ---------- déclinaisons ---------- */}
        <Section id="declinaisons" kicker="Axe 1, partie 3" title={`${nameSel.name} partout où il apparaît`}>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-8">
            <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
              <H3 note="Fonds de la charte choisie en haut : fond de page, surface, et accent.">Grand, sur les fonds de la charte</H3>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  ['Fond de page', 'var(--bg)', 'var(--text)', false],
                  ['Surface', 'var(--surface-2)', 'var(--text)', false],
                  ['Accent (monochrome)', 'var(--accent)', 'var(--accent-contrast)', true],
                ].map(([label, bg, fg, mono]) => (
                  <figure key={label} className="flex flex-col gap-2">
                    <div className="flex min-h-[130px] items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] px-3" style={{ background: bg, color: fg }}>
                      <Lockup id={sel} name={nameSel.name.toLowerCase()} v={vSel} mono={mono} height={52} />
                    </div>
                    <figcaption className="text-[12px] text-[var(--text-muted)]">{label}</figcaption>
                  </figure>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
              <H3 note="Icône d’application en 64 et 32 px, favicon en 16 px. Les deux dernières images sont la vraie rastérisation du navigateur, agrandie sans lissage : c’est le test des 16 px.">
                Icône d’application et favicon
              </H3>
              <div className={`${card} p-5`}>
                <AppIcons id={sel} v={vSel} themeKey={themeKey} />
              </div>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
              <H3 note="Symbole seul en monochrome : blanc sur le fond de la charte, noir sur clair, et sur l’accent.">Monochrome</H3>
              <MonoPanels id={sel} name={nameSel.name} v={vSel} />
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
              <H3 note="Maquette calquée sur le vrai rail (components/RailClient.js) avec tes vrais projets et ton vrai nombre à ranger. Déployé à gauche, replié à droite.">
                En-tête du rail latéral
              </H3>
              <div className="flex flex-wrap items-start gap-4">
                <RailMock id={sel} name={nameSel.name} v={vSel} projects={live.projects} toRanger={live.toRanger} />
                <RailMock id={sel} name={nameSel.name} v={vSel} projects={live.projects} toRanger={live.toRanger} compact />
                <div className={`${card} grid min-w-[15rem] flex-1 content-start gap-2 p-4 text-[13px] leading-relaxed text-[var(--text-muted)]`}>
                  <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-faint)]">Lecture</p>
                  <p>Déployé, le logotype remplace le mot « Pilotage » : le symbole fait 30 px de haut, trait de 2 px.</p>
                  <p>Replié, seul le symbole reste (32 px, variante petite). Le rail de gauche de cette page est le vrai, pour comparer.</p>
                  <p>
                    Le badge « À ranger » partage l’accent du logo : quand l’élément vivant et le compteur disent la même chose, la lecture est redondante, ce qui est voulu ({live.toRanger} à ranger
                    aujourd’hui).
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
              <H3 note="Ouverture du rituel de rangement forcé : le trait se dessine, puis l’élément vivant prend sa valeur du jour. Respecte « réduire les animations ».">
                Écran de démarrage
              </H3>
              <BootScreen id={sel} name={nameSel.name} v={vSel} dateLabel={date} toRanger={live.toRanger} />
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
              <H3 note="Favicon dans un onglet, sur un navigateur sombre et sur un navigateur clair.">Onglet du navigateur</H3>
              <BrowserTabs id={sel} v={vSel} name={nameSel.name} />
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
              <H3 note="L’information vivante, état par état, en 64 px (dessin), en 16 px (variante petite) et en pixels réels.">États du symbole</H3>
              <StatesStrip id={sel} themeKey={themeKey} />
            </div>
          </div>
        </Section>

        {/* ---------- verdict ---------- */}
        <Section id="verdict" kicker="Critique" title="Verdict, failles, et ce que ça demanderait en vrai">
          <CriteriaTable />

          <div className="grid gap-4 lg:grid-cols-2">
            <div className={`${card} grid content-start gap-3 p-5`}>
              <H3>Recommandation</H3>
              <ol className="grid list-decimal gap-3 pl-5 text-[14px] leading-relaxed text-[var(--text-muted)]">
                <li>
                  <span className="font-semibold text-[var(--text)]">Estime, mon choix.</span> C’est le seul nom qui dit ce que fait l’outil (estimer où en est la journée) et dont le logo lit le temps :
                  l’anneau avance avec l’heure. Conditions : dicter « ouvre Estime » trois fois à voix haute, et regarder la loupe à 16 px sur ton écran.
                </li>
                <li>
                  <span className="font-semibold text-[var(--text)]">Cadran, le repli sûr.</span> Meilleur score de dictée et de collision (8 étoiles au plus), logo compris tout de suite, mais le plus banal des quatre.
                </li>
                <li>
                  <span className="font-semibold text-[var(--text)]">Balise, à emprunter plutôt qu’à choisir.</span> Le losange plein ou creux est le meilleur signal d’état à 16 px : il peut servir de pastille d’onglet à Estime
                  ou à Cadran.
                </li>
                <li>
                  <span className="font-semibold text-[var(--text)]">Jalon, à écarter.</span> Ses projets ont déjà des jalons, et la perche à bandes se lit comme une jauge de niveau.
                </li>
              </ol>
            </div>

            <div className={`${card} grid content-start gap-3 p-5`}>
              <H3>Failles, par gravité</H3>
              <ol className="grid list-decimal gap-3 pl-5 text-[14px] leading-relaxed text-[var(--text-muted)]">
                <li>La dictée n’a jamais été testée, pour aucun des six noms : le critère I2 reste en réserve partout.</li>
                <li>Sous 24 px, Estime perd son pointillé : trace et anneau ressemblent alors à une icône d’itinéraire. Cadran, à 16 px, ne se lit plus que « plein ou vide ».</li>
                <li>L’information vivante ne vit que dans un onglet ouvert : l’icône d’application (Dock, écran d’accueil) reste figée, et un onglet en arrière-plan ralentit ses mises à jour.</li>
                <li>Les bandes de Jalon à 30 % d’opacité manquent de contraste à 16 px : regarde la loupe.</li>
                <li>Le logotype est en minuscules tracées à la main : le « s » étroit est la lettre la moins réussie, à redessiner si Estime ou Balise est retenu.</li>
                <li>Aucun nom n’a été cherché sur l’App Store, dans les marques ni côté domaines : l’absence de collision est prouvée sur GitHub et par WebSearch seulement.</li>
              </ol>
            </div>
          </div>

          <div className={`${card} grid gap-2 p-5 text-[14px] leading-relaxed text-[var(--text-muted)]`}>
            <H3>Ce qu’on utiliserait en vrai</H3>
            <p>
              Aucune dépendance installée ici : tout est rendu en React, Tailwind et CSS. En vrai, les logos restent des SVG écrits à la main (fichiers dans public/demo/logos : lockup, fond sombre,
              symbole, monochrome, favicon), sans bibliothèque d’icônes. L’écran de démarrage passerait par <span className="text-[var(--text)]">Motion</span> (33 855 étoiles, MIT, hook <span className="font-mono text-[13px]">useAnimate</span>{' '}
              de 2,3 ko) à la place de la boucle <span className="font-mono text-[13px]">requestAnimationFrame</span> de la démo, et le compteur « à ranger » par{' '}
              <span className="text-[var(--text)]">NumberFlow</span> (7 733 étoiles). Le favicon vivant n’utilise que l’API du navigateur. Sources : recherche/github.md, recherche/apps-reference.md (Cron change d’icône selon la date).
            </p>
          </div>
        </Section>
      </main>
    </div>
  );
}
