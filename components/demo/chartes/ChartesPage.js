'use client';

// /demo/chartes : les quatre chartes « Graphite avancées » comparées sur une maquette fidèle du Cockpit
// réel (vraies données, lecture seule), avec les contrastes calculés sur le CSS rendu et un démonstrateur
// « 3 variables » (teinte de base, teinte d'accent, contraste). Tout est local : rien n'est enregistré.
import { useEffect, useMemo, useRef, useState } from 'react';
import { timeParis } from '@/lib/home';
import { CHARTES } from '../studio/chartes-meta';
import Audit, { hexOf } from './Audit';
import Mock from './Mock';
import { oklabL, parseCssColor } from './color';

const ADVANCED = CHARTES.filter((c) => c.famille === 'avancee');
const MODES = [
  { id: 'dark', name: 'Sombre' },
  { id: 'light', name: 'Clair' },
];
const VIEWS = [
  { id: 'detail', name: 'Détail' },
  { id: 'compare', name: 'Comparer les quatre' },
];
const SIMS = [
  { id: 'none', name: 'Vision normale', filter: 'none' },
  { id: 'gray', name: 'Niveaux de gris', filter: 'grayscale(1)' },
  { id: 'deut', name: 'Deutéranopie', filter: 'url(#cx-deut)' },
  { id: 'prot', name: 'Protanopie', filter: 'url(#cx-prot)' },
];
const N_ROLES = ['Rail', 'Fond', 'Surface', 'Surface haute', 'Flottant', 'Survol', 'Filet', 'Contrôle 3:1', 'Neutre plein', 'Discret', 'Secondaire', 'Texte'];
const A_ROLES = ['Fond teinté', 'Fond subtil', 'Soft', 'Survol', 'Actif', 'Bordure douce', 'Bordure', 'Anneau', 'Plein', 'Plein survol', 'Texte', 'Texte fort'];
const SEMANTICS = [
  ['--accent-solid', 'Accent'],
  ['--success', 'Fait'],
  ['--warning', 'Alerte'],
  ['--danger', 'Retard'],
  ['--cat-cours', 'Plage'],
  ['--cat-tache', 'Tâche'],
  ['--cat-autre', 'Autre'],
];

const frNum = (n, d = 3) => n.toFixed(d).replace('.', ',');

function simulatedNow(today) {
  for (const h of [12, 13]) {
    const iso = `${today}T${h}:32:00Z`;
    if (timeParis(iso) === '14h32') return Date.parse(iso);
  }
  return Date.parse(`${today}T12:32:00Z`);
}

const btnClass = (on) =>
  `inline-flex min-h-9 items-center rounded-[var(--radius-sm)] border px-3 text-[12.5px] font-medium transition-colors duration-100 sm:min-h-8 ${
    on
      ? 'border-[color:var(--accent-line,var(--accent))] bg-[var(--surface-3,var(--surface-2))] text-[color:var(--text)]'
      : 'border-[color:var(--border-strong)] bg-[var(--surface)] text-[color:var(--text-muted)] hover:bg-[var(--hover,var(--surface-2))] hover:text-[color:var(--text)]'
  }`;

function Seg({ label, items, value, onChange }) {
  return (
    <div className="min-w-0">
      <div className="mb-1 text-[11px] [font-weight:var(--k-label-weight)] [letter-spacing:var(--k-label-tracking)] [text-transform:var(--k-label-case)] text-[color:var(--text-muted)]">{label}</div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {items.map((it) => (
          <button key={it.id} type="button" aria-pressed={it.id === value} onClick={() => onChange(it.id)} className={btnClass(it.id === value)} title={it.description}>
            {it.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function Section({ title, lead, children, id }) {
  return (
    <section className="mt-10" aria-labelledby={`h-${id}`}>
      <h2 id={`h-${id}`} className="text-xl [font-family:var(--font-display)] [font-weight:var(--k-title-weight)] [letter-spacing:var(--k-title-tracking)]">
        {title}
      </h2>
      {lead && <p className="mt-1.5 max-w-3xl text-[13.5px] leading-relaxed text-[color:var(--text-muted)]">{lead}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Swatch({ cssVar, label, info }) {
  return (
    <div className="min-w-0" data-sw={cssVar}>
      <div className="h-10 rounded-[var(--radius-sm)] border border-[color:var(--border)]" style={{ background: `var(${cssVar})` }} />
      <div className="mt-1 truncate text-[11px] text-[color:var(--text)]">{label}</div>
      <div className="font-mono text-[10.5px] text-[color:var(--text-muted)]">{info?.hex ?? ' '}</div>
      <div className="font-mono text-[10.5px] text-[color:var(--text-faint)]">{info ? `L ${info.l}` : ' '}</div>
    </div>
  );
}

function Ramps({ charte, mode, ovKey }) {
  const ref = useRef(null);
  const [info, setInfo] = useState({});
  const advanced = charte.startsWith('graphite-');
  useEffect(() => {
    if (!advanced) return undefined;
    const raf = requestAnimationFrame(() => {
      const next = {};
      for (const el of ref.current?.querySelectorAll('[data-sw]') ?? []) {
        const name = el.getAttribute('data-sw');
        const c = parseCssColor(getComputedStyle(el.firstChild).backgroundColor);
        if (c) next[name] = { hex: hexOf(getComputedStyle(el.firstChild).backgroundColor), l: frNum(oklabL(c), 3) };
      }
      setInfo(next);
    });
    return () => cancelAnimationFrame(raf);
  }, [advanced, charte, mode, ovKey]);

  if (!advanced) {
    return <p className="text-[13.5px] text-[color:var(--text-muted)]">Les rampes de 12 étapes existent pour les quatre chartes avancées : choisis l&apos;une d&apos;elles en haut.</p>;
  }
  return (
    <div ref={ref} className="grid gap-5">
      {[
        ['Neutres : 12 étapes (teinte et luminosité du mode, chroma faible)', 'n', N_ROLES],
        ['Accent : 12 étapes (une seule teinte)', 'a', A_ROLES],
      ].map(([title, p, roles]) => (
        <div key={p}>
          <h3 className="mb-2 text-[12px] font-semibold text-[color:var(--text-muted)]">{title}</h3>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12">
            {roles.map((role, i) => (
              <Swatch key={role} cssVar={`--${p}${i + 1}`} label={`${p}${i + 1} ${role}`} info={info[`--${p}${i + 1}`]} />
            ))}
          </div>
        </div>
      ))}
      <div>
        <h3 className="mb-2 text-[12px] font-semibold text-[color:var(--text-muted)]">Sémantique et agenda (jetons pleins, lisibles en texte sauf les trois catégories, qui sont des traits)</h3>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {SEMANTICS.map(([v, l]) => (
            <Swatch key={v} cssVar={v} label={l} info={info[v]} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Slider({ id, label, min, max, step, value, onChange, gradient, unit }) {
  return (
    <label htmlFor={id} className="block min-w-0">
      <span className="flex items-baseline justify-between text-[12px] text-[color:var(--text-muted)]">
        {label}
        <span className="font-mono text-[color:var(--text)]">
          {value}
          {unit}
        </span>
      </span>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full border border-[color:var(--border-strong)] [accent-color:var(--accent-solid,var(--accent))]"
        style={gradient ? { background: gradient } : { background: 'var(--surface-2)' }}
      />
    </label>
  );
}

const HUE_GRADIENT = `linear-gradient(90deg, ${[0, 60, 120, 180, 240, 300, 360].map((h) => `oklch(0.75 0.12 ${h})`).join(', ')})`;

export default function ChartesPage({ data, initial = {} }) {
  const [charte, setCharte] = useState(CHARTES.some((c) => c.id === initial.charte) ? initial.charte : 'graphite-lumiere');
  const [mode, setMode] = useState(initial.mode === 'light' ? 'light' : 'dark');
  const [view, setView] = useState('detail');
  const [sim, setSim] = useState('none');
  const [realTime, setRealTime] = useState(false);
  const [ov, setOv] = useState({});
  const [base, setBase] = useState({ nh: 262, ah: 268, ct: 1 });
  const baseRef = useRef(null);
  const meta = CHARTES.find((c) => c.id === charte);
  const advanced = charte.startsWith('graphite-');
  const nowMs = realTime ? Date.parse(data.nowIso) : simulatedNow(data.today);
  const ovKey = JSON.stringify(ov);

  // Valeurs de départ des curseurs : lues dans le CSS de la charte (jamais recopiées ici).
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const cs = getComputedStyle(baseRef.current);
      const read = (n, d) => (Number.isFinite(Number.parseFloat(cs.getPropertyValue(n))) ? Number.parseFloat(cs.getPropertyValue(n)) : d);
      setBase({ nh: read('--nh', 262), ah: read('--ah', 268), ct: read('--ct', 1) });
    });
    return () => cancelAnimationFrame(raf);
  }, [charte, mode]);

  const pickCharte = (id) => {
    setCharte(id);
    setOv({});
  };
  const style = Object.fromEntries(Object.entries(ov).map(([k, v]) => [`--${k}`, v]));
  const filter = SIMS.find((s) => s.id === sim).filter;
  const val = (k) => ov[k] ?? base[k];

  return (
    <div className="studio min-h-screen bg-[var(--bg)] text-[var(--text)] [font-family:var(--font-body)]" data-charte={charte} data-mode={mode} style={style}>
      <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
        <defs>
          <filter id="cx-deut" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0" />
          </filter>
          <filter id="cx-prot" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0" />
          </filter>
        </defs>
      </svg>
      {/* Sonde sans réglages : donne les valeurs de départ des curseurs. */}
      <div ref={baseRef} className="studio" data-charte={charte} data-mode={mode} aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', visibility: 'hidden' }} />

      <div className="border-b border-[color:var(--border)] bg-[var(--surface-0,var(--surface))] px-4 py-2 text-[12.5px] text-[color:var(--text-muted)] sm:px-6">
        <span className="font-semibold text-[color:var(--text)]">Démo : rien n&apos;est enregistré.</span> Lecture seule de tes vraies données.{' '}
        <a href="/demo" className="underline underline-offset-2">
          Toutes les démos
        </a>
        {' · '}
        <a href={`/demo/studio?charte=${charte}&mode=${mode}`} className="underline underline-offset-2">
          Voir cette charte dans le Studio
        </a>
      </div>

      <div className="mx-auto w-full max-w-[1400px] px-4 pb-24 sm:px-6">
        <header className="pt-6">
          <p className="text-[11px] [font-weight:var(--k-label-weight)] [letter-spacing:var(--k-label-tracking)] [text-transform:var(--k-label-case)] text-[color:var(--text-muted)]">Axe charte avancée, famille Graphite</p>
          <h1 className="mt-2 text-[1.75rem] leading-[1.1] [font-family:var(--font-display)] [font-weight:var(--k-title-weight)] [letter-spacing:var(--k-title-tracking)] sm:text-4xl">Chartes avancées : Graphite</h1>
          <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-[color:var(--text-muted)]">
            Quatre variantes du Graphite sombre équilibré que tu as choisi, au même squelette (échelle OKLCH de 12 étapes, contrastes corrigés, élévation par la luminosité) et à quatre
            caractères. Tout ce qui suit est rendu avec le vrai CSS ; les chiffres de contraste sont calculés sur ce rendu.
          </p>
        </header>

        <div className="mt-5 grid gap-4 rounded-[var(--radius)] border border-[color:var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow)] sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1.4fr_1fr]">
          <Seg label="Charte" items={CHARTES} value={charte} onChange={pickCharte} />
          <Seg label="Mode" items={MODES} value={mode} onChange={setMode} />
          <Seg label="Vue" items={VIEWS} value={view} onChange={setView} />
          <Seg label="Vision simulée" items={SIMS} value={sim} onChange={setSim} />
          <Seg
            label="Heure de la maquette"
            items={[
              { id: 'sim', name: 'Simulée 14h32' },
              { id: 'real', name: 'Réelle' },
            ]}
            value={realTime ? 'real' : 'sim'}
            onChange={(v) => setRealTime(v === 'real')}
          />
        </div>

        <Section id="carte" title={meta.name} lead={meta.description}>
          {advanced && (
            <dl className="grid gap-x-8 gap-y-2 text-[13px] sm:grid-cols-3">
              <div>
                <dt className="text-[11px] [font-weight:var(--k-label-weight)] [letter-spacing:var(--k-label-tracking)] [text-transform:var(--k-label-case)] text-[color:var(--text-muted)]">Signature</dt>
                <dd className="mt-0.5">{meta.signature}</dd>
              </div>
              <div>
                <dt className="text-[11px] [font-weight:var(--k-label-weight)] [letter-spacing:var(--k-label-tracking)] [text-transform:var(--k-label-case)] text-[color:var(--text-muted)]">Typographie</dt>
                <dd className="mt-0.5">{meta.police}</dd>
              </div>
              <div>
                <dt className="text-[11px] [font-weight:var(--k-label-weight)] [letter-spacing:var(--k-label-tracking)] [text-transform:var(--k-label-case)] text-[color:var(--text-muted)]">Densité</dt>
                <dd className="mt-0.5">{meta.densite}</dd>
              </div>
            </dl>
          )}
        </Section>

        <Section
          id="maquette"
          title="La maquette : le Cockpit réel"
          lead="Rail, Zone Commande, agenda (plages et tâches successives), colonne À ranger avec ses cinq gestes, boîtes mail côte à côte, palette flottante (seule couche en verre). Clique sur un élément, change la durée affichée, ouvre la palette."
        >
          <div style={{ filter }} data-testid="mock-filter">
            {view === 'detail' ? (
              <Mock data={data} nowMs={nowMs} />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2" data-testid="mock-compare">
                {ADVANCED.map((c) => (
                  <div key={c.id} className="studio rounded-[var(--radius-lg)]" data-charte={c.id} data-mode={mode} style={{ backgroundColor: 'var(--bg)' }}>
                    <div className="flex flex-wrap items-baseline gap-x-3 px-1 pb-2 text-[color:var(--text)]">
                      <h3 className="text-[15px] [font-family:var(--font-display)] [font-weight:var(--k-title-weight)] [letter-spacing:var(--k-title-tracking)]">{c.name}</h3>
                      <span className="text-[12px] text-[color:var(--text-muted)]">{c.police}</span>
                    </div>
                    <Mock data={data} nowMs={nowMs} />
                  </div>
                ))}
              </div>
            )}
          </div>
          {data.errors.length > 0 && <p className="mt-2 text-[12px] text-[color:var(--danger)]">{data.errors.join(' ; ')}</p>}
        </Section>

        <Section id="rampes" title="Rampes OKLCH" lead="Chaque pastille est lue dans le rendu (valeur sRGB 8 bits et luminosité OKLab L). Les écarts de L entre surfaces successives restent entre 0,03 et 0,06 en sombre (critère C4) : l'élévation vient de la luminosité, pas d'une ombre.">
          <Ramps charte={charte} mode={mode} ovKey={ovKey} />
        </Section>

        <Section
          id="contrastes"
          title="Contrastes calculés"
          lead="WCAG 2 (rapport) et APCA (Lc, méthode candidate de WCAG 3) sur le CSS rendu, mode choisi en haut. Les critères C1 à C12 viennent de la grille de la recherche profonde ; chaque carte les évalue en sombre et en clair. « Graphite (existante) » est la charte actuelle du Studio, gardée comme point de comparaison."
        >
          <Audit ids={[...ADVANCED.map((c) => c.id), 'graphite']} mode={mode} overrides={ov} overrideId={charte} />
        </Section>

        <Section
          id="variables"
          title="Régénérer la charte avec 3 variables"
          lead={`Toute l'échelle (neutres, accent, sémantique, contrastes) dérive de trois nombres. Bouge-les : la page entière, la maquette et le tableau de contraste de la charte « ${meta.name} » suivent. Réservé aux chartes avancées.`}
        >
          {advanced ? (
            <div className="grid gap-5 rounded-[var(--radius)] border border-[color:var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow)] md:grid-cols-[1fr_1fr_1fr_auto]">
              <Slider id="s-nh" label="Teinte de base (--nh)" min={0} max={360} step={1} value={val('nh')} onChange={(v) => setOv((o) => ({ ...o, nh: v }))} gradient={HUE_GRADIENT} unit="°" />
              <Slider id="s-ah" label="Teinte d'accent (--ah)" min={0} max={360} step={1} value={val('ah')} onChange={(v) => setOv((o) => ({ ...o, ah: v }))} gradient={HUE_GRADIENT} unit="°" />
              <Slider id="s-ct" label="Contraste (--ct)" min={0.7} max={1.4} step={0.05} value={val('ct')} onChange={(v) => setOv((o) => ({ ...o, ct: v }))} />
              <div className="flex items-end">
                <button type="button" className={btnClass(false)} onClick={() => setOv({})} disabled={Object.keys(ov).length === 0}>
                  Revenir aux valeurs de la charte
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[13.5px] text-[color:var(--text-muted)]">Choisis une des quatre chartes avancées pour régénérer sa palette.</p>
          )}
        </Section>

        <Section id="critique" title="Ce que ces chartes coûtent, et ce qu'il faut vérifier">
          <ol className="grid max-w-4xl list-decimal gap-2 pl-5 text-[13.5px] leading-relaxed marker:text-[color:var(--text-muted)]">
            <li>
              <strong>Les filets de contrôle à 3:1 sont nets.</strong> Respecter le critère WCAG 1.4.11 donne des bordures de boutons et de champs bien visibles (luminosité autour de 0,64 en sombre) : c&apos;est
              lisible, un peu plus appuyé que Linear ou Raycast. Les filets décoratifs, eux, restent à 1,5:1.
            </li>
            <li>
              <strong>Le grain d&apos;Ardoise n&apos;est pas recommandé par la recherche</strong> (anecdotique, coût sur mobile) : il est fixe, sous le fond, à 3 %, et se retire en mettant --grain à none. Le verre n&apos;existe
              que sur la palette flottante.
            </li>
            <li>
              <strong>Acier : l&apos;accent argent perd le code couleur.</strong> « Sélectionné », « principal » et « focus » se lisent par la luminosité, pas par une teinte ; sûr pour le daltonisme, moins immédiat.
              L&apos;ambre y signale seul ce qui attend.
            </li>
            <li>
              <strong>« Autre événement » devient neutre</strong> (luminosité 0,66, sans teinte) pour tenir la vision deutan : plage, tâche et autre se distinguent aussi en niveaux de gris (bouton « Vision simulée »).
            </li>
            <li>
              <strong>Encre est la plus sombre</strong> (fond à L 0,215) alors que tu voulais un graphite « un peu plus clair » : Lumière (0,262, proche de ton fond actuel) et Acier (0,275) restent dans cet esprit.
            </li>
            <li>
              <strong>À vérifier avant de choisir :</strong> Mona Sans (licence OFL, largeur variable) et Instrument Sans en auto-hébergement ; le rendu des chiffres tabulaires de Geist Mono ; sur écran sRGB, les couleurs très
              saturées sont ramenées dans le gamut par le navigateur (les chiffres de contraste en tiennent compte).
            </li>
          </ol>
          <h3 className="mt-5 text-[14px] font-semibold">Liste manuelle anti-look IA (critère C11)</h3>
          <p className="mt-1 max-w-4xl text-[13.5px] leading-relaxed text-[color:var(--text-muted)]">
            Aucun fond crème ou beige avec accent orange, aucun titre à empattement en italique, aucune carte dans une carte (les lignes de la colonne À ranger sont des rangées à filets, pas des cartes), aucune puce sur chaque ligne
            (un seul libellé de type en mono), aucun point qui pulse, aucun noir pur (fond le plus sombre : L 0,215), aucune ombre sur un élément qui ne flotte pas.
          </p>
          <h3 className="mt-5 text-[14px] font-semibold">En vrai</h3>
          <p className="mt-1 max-w-4xl text-[13.5px] leading-relaxed text-[color:var(--text-muted)]">
            Sans nouvelle dépendance : les jetons passeraient dans le bloc @theme de Tailwind 4 (déjà natif en OKLCH) et le préréglage shadcn Rhea (compact, sur Base UI) servirait de point de départ aux composants, avec ces
            jetons par-dessus. Les polices viennent de next/font (Geist déjà là ; Inter Tight, JetBrains Mono, Mona Sans et Instrument Sans pour les autres). Motion n&apos;est pas nécessaire ici : les seules transitions sont des
            fonds et des filets de 80 ms.
          </p>
        </Section>
      </div>
    </div>
  );
}
