'use client';

// Contrastes calculés : pour chaque charte et chaque mode, on lit les jetons réellement rendus (sondes
// invisibles posées dans le document), puis on calcule WCAG 2 et APCA et on confronte les seuils de la
// grille de la recherche (RECHERCHE-PROFONDE.md, axe 2, critères C1 à C12).
import { useEffect, useMemo, useRef, useState } from 'react';
import { apca, grayOf, oklabL, parseCssColor, readTokens, toHex, wcag } from './color';
import { CHARTES } from '../studio/chartes-meta';

const RULES = {
  body: { lc: 75, w: 7, text: 'texte de corps : Lc 75 et 7:1' },
  sec: { lc: 60, w: 4.5, text: 'secondaire : Lc 60 et 4,5:1' },
  meta: { lc: 45, w: 4.5, text: 'métadonnées : Lc 45 et 4,5:1' },
  ui: { w: 3, text: 'composant : 3:1' },
  deco: { text: 'décoratif, sans seuil' },
};

// [id, libellé, premier plan, arrière-plan, règle]
const PAIRS = [
  ['txt-bg', 'Texte sur le fond', '--text', '--bg', 'body'],
  ['txt-s', 'Texte sur une surface', '--text', '--surface', 'body'],
  ['txt-s2', 'Texte sur une surface haute', '--text', '--surface-2', 'body'],
  ['txt-s3', 'Texte sur une couche flottante', '--text', '--surface-3', 'body'],
  ['sec-bg', 'Secondaire sur le fond', '--text-muted', '--bg', 'sec'],
  ['sec-s', 'Secondaire sur une surface', '--text-muted', '--surface', 'sec'],
  ['sec-s2', 'Secondaire sur une surface haute', '--text-muted', '--surface-2', 'sec'],
  ['meta-s2', 'Discret (métadonnées) sur surface haute', '--text-faint', '--surface-2', 'meta'],
  ['acc-s2', 'Accent (texte, liens) sur surface haute', '--accent', '--surface-2', 'sec'],
  ['btn', 'Texte du bouton principal', '--accent-contrast', '--accent-solid', 'sec'],
  ['bad', 'Danger (retard) sur surface haute', '--danger', '--surface-2', 'sec'],
  ['ok', 'Succès (fait) sur surface haute', '--success', '--surface-2', 'sec'],
  ['warn', 'Alerte sur surface haute', '--warning', '--surface-2', 'sec'],
  ['ctl-bg', 'Filet de contrôle sur le fond', '--border-strong', '--bg', 'ui'],
  ['ctl-s', 'Filet de contrôle sur une surface', '--border-strong', '--surface', 'ui'],
  ['ctl-s2', 'Filet de contrôle sur surface haute', '--border-strong', '--surface-2', 'ui'],
  ['hair', 'Filet décoratif sur le fond', '--border', '--bg', 'deco'],
  ['cat-c', 'Plage (cours), trait sur surface', '--cat-cours', '--surface', 'ui'],
  ['cat-t', 'Tâche, contour sur surface', '--cat-tache', '--surface', 'ui'],
  ['cat-a', 'Autre événement, trait sur surface', '--cat-autre', '--surface', 'ui'],
];
const TOKENS = [...new Set(PAIRS.flatMap((p) => [p[2], p[3]])), '--surface-0', '--cat-cours', '--cat-tache', '--cat-autre'];

export const rgbCss = (c) => `rgb(${c[0]} ${c[1]} ${c[2]})`;
const fmt = (n, d = 1) => n.toFixed(d).replace('.', ',');

function measure(wrap) {
  const sink = wrap.querySelector('i');
  const have = TOKENS.filter((t) => getComputedStyle(wrap).getPropertyValue(t).trim() !== '');
  const tok = readTokens(sink, have);
  const pairs = PAIRS.map(([id, label, fg, bg, rule]) => {
    const a = tok[fg];
    const b = tok[bg];
    if (!a || !b) return null;
    const lc = apca(a, b);
    const w = wcag(a, b);
    const r = RULES[rule];
    const ok = rule === 'deco' ? null : (r.lc == null || lc >= r.lc) && (r.w == null || w >= r.w);
    return { id, label, fg: a, bg: b, lc, w, rule, ok };
  }).filter(Boolean);
  const levels = ['--surface-0', '--bg', '--surface', '--surface-2', '--surface-3'].map((t) => (tok[t] ? oklabL(tok[t]) : null));
  const steps = levels.slice(1).map((l, i) => (l != null && levels[i] != null ? l - levels[i] : null));
  const gray = ['--cat-cours', '--cat-tache', '--cat-autre'].map((t) => (tok[t] ? grayOf(tok[t]) : null));
  const cs = getComputedStyle(wrap);
  const radii = ['--radius', '--radius-sm'].map((t) => Number.parseFloat(cs.getPropertyValue(t)));
  const lg = Number.parseFloat(cs.getPropertyValue('--radius-lg'));
  return {
    pairs,
    steps,
    gray,
    radii: Number.isFinite(lg) ? [...radii, lg] : radii,
    tabular: cs.fontVariantNumeric.includes('tabular-nums'),
    bgL: tok['--bg'] ? oklabL(tok['--bg']) : null,
    hasRamp: cs.getPropertyValue('--n12').trim() !== '',
  };
}

const okAll = (m, ids) => ids.every((id) => m.pairs.find((p) => p.id === id)?.ok);

function criteria(id, dark, light) {
  const adv = id.startsWith('graphite-');
  const both = (ids) => okAll(dark, ids) && okAll(light, ids);
  const stepsOk = dark.steps.every((s) => s != null && s >= 0.03 && s <= 0.062);
  const grays = (m) => {
    const g = m.gray.filter((x) => x != null);
    return g.length === 3 && Math.abs(g[0] - g[1]) >= 18 && Math.abs(g[1] - g[2]) >= 18 && Math.abs(g[0] - g[2]) >= 18;
  };
  const radiiOk = dark.radii.every((r) => [6, 10, 16].includes(r));
  return [
    { id: 'C1', label: 'Texte de corps, 7:1 et Lc 75', ok: both(['txt-bg', 'txt-s', 'txt-s2']) },
    { id: 'C2', label: 'Secondaire Lc 60, discret Lc 45', ok: both(['sec-bg', 'sec-s', 'sec-s2', 'meta-s2']) },
    { id: 'C3', label: 'Filets de contrôle 3:1', ok: both(['ctl-bg', 'ctl-s', 'ctl-s2']) },
    {
      id: 'C4',
      label: 'Surfaces par la luminosité, écarts de 0,03 à 0,06 (sombre)',
      ok: stepsOk,
      detail: dark.steps.map((s) => (s == null ? 'n.d.' : fmt(s, 3))).join(' / '),
    },
    { id: 'C5', label: 'Un seul accent (échelle --a1 à --a12)', ok: adv ? true : null },
    { id: 'C6', label: 'Accent, 3 sémantiques, 3 catégories : 7 teintes', ok: adv ? true : null },
    { id: 'C7', label: 'OKLCH, régénérée par 3 variables (curseurs plus bas)', ok: dark.hasRamp },
    { id: 'C8', label: 'Plage, tâche, autre : forme et luminosité distinctes', ok: grays(dark) && grays(light), detail: `gris sombre ${dark.gray.join(' / ')}` },
    { id: 'C9', label: 'Rayons dans 6, 10, 16 px', ok: radiiOk, detail: dark.radii.join(' / ') },
    { id: 'C10', label: 'Chiffres tabulaires partout', ok: dark.tabular },
    { id: 'C11', label: 'Sans marqueur du look IA (liste manuelle plus bas)', ok: adv && dark.bgL != null && dark.bgL > 0.15 ? true : null },
    { id: 'C12', label: 'Sombre complet, clair lisible (mails)', ok: both(['txt-bg', 'sec-s', 'acc-s2', 'ctl-s']) },
  ];
}

export default function Audit({ ids, mode, overrides = {}, overrideId }) {
  const refs = useRef({});
  const [res, setRes] = useState(null);
  const key = JSON.stringify([ids, overrideId, overrides]);
  const hidden = { position: 'absolute', left: -9999, top: 0, width: 1, height: 1, overflow: 'hidden', visibility: 'hidden' };

  useEffect(() => {
    let raf = 0;
    const run = () => {
      const out = {};
      for (const id of ids) {
        const d = refs.current[`${id}:dark`];
        const l = refs.current[`${id}:light`];
        if (!d || !l) continue;
        const dark = measure(d);
        const light = measure(l);
        out[id] = { dark, light, criteria: criteria(id, dark, light) };
      }
      setRes(out);
    };
    raf = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const style = (id) => (id === overrideId ? Object.fromEntries(Object.entries(overrides).map(([k, v]) => [`--${k}`, v])) : undefined);
  const nameOf = useMemo(() => Object.fromEntries(CHARTES.map((c) => [c.id, c.name])), []);

  return (
    <div>
      <div aria-hidden="true" style={hidden}>
        {ids.flatMap((id) =>
          ['dark', 'light'].map((m) => (
            <div key={`${id}:${m}`} ref={(el) => {
                refs.current[`${id}:${m}`] = el;
              }} className="studio" data-charte={id} data-mode={m} style={style(id)}>
              <i />
            </div>
          ))
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-2" data-testid="audit-grid">
        {ids.map((id) => {
          const r = res?.[id];
          const m = r?.[mode];
          const passed = r ? r.criteria.filter((c) => c.ok === true).length : 0;
          return (
            <section key={id} className="rounded-[var(--radius)] border border-[color:var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]" aria-label={`Contrastes de ${nameOf[id]}`}>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-[color:var(--border)] px-4 py-3">
                <h3 className="[font-family:var(--font-display)] text-[15px] [font-weight:var(--k-title-weight)] [letter-spacing:var(--k-title-tracking)]">{nameOf[id]}</h3>
                <span className="text-xs text-[color:var(--text-muted)]">{mode === 'dark' ? 'sombre' : 'clair'}</span>
                {r && (
                  <span className="ml-auto font-mono text-xs text-[color:var(--text-muted)]" data-testid={`audit-score-${id}`}>
                    {passed} critères sur {r.criteria.filter((c) => c.ok !== null).length} mesurés
                  </span>
                )}
              </div>
              {!m && <p className="px-4 py-6 text-sm text-[color:var(--text-muted)]">Calcul en cours...</p>}
              {m && (
                <>
                  <ul className="divide-y divide-[color:var(--border)]">
                    {m.pairs.map((p) => (
                      <li key={p.id} className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-x-3 px-4 py-1.5 text-[12.5px]">
                        <span className="inline-flex h-7 items-center justify-center rounded-[var(--radius-sm)] text-[13px] font-semibold" style={{ color: rgbCss(p.fg), background: rgbCss(p.bg), border: `1px solid ${rgbCss(p.bg === p.fg ? p.fg : p.bg)}` }} aria-hidden="true">
                          Aa
                        </span>
                        <span className="min-w-0 text-[color:var(--text)]">
                          {p.label}
                          <span className="block text-[11px] text-[color:var(--text-faint)]">{RULES[p.rule].text}</span>
                        </span>
                        <span className="text-right font-mono text-[11.5px] whitespace-nowrap">
                          <span className="text-[color:var(--text)]">{p.rule === 'ui' ? '' : `Lc ${Math.round(p.lc)} · `}{fmt(p.w)}:1</span>
                          <span className={`block ${p.ok === null ? 'text-[color:var(--text-muted)]' : p.ok ? 'text-[color:var(--success)]' : 'text-[color:var(--danger)]'}`}>
                            {p.ok === null ? 'indicatif' : p.ok ? 'atteint' : 'sous le seuil'}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-[color:var(--border-strong)] px-4 py-3">
                    <h4 className="mb-2 text-[11px] [font-weight:var(--k-label-weight)] [letter-spacing:var(--k-label-tracking)] [text-transform:var(--k-label-case)] text-[color:var(--text-muted)]">Critères de la grille (sombre et clair)</h4>
                    <ul className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
                      {r.criteria.map((c) => (
                        <li key={c.id} className="flex items-start gap-2 text-[12px]" data-testid={`crit-${id}-${c.id}`} data-ok={String(c.ok)}>
                          <span className={`mt-[3px] inline-block size-2 shrink-0 rounded-full ${c.ok === null ? 'bg-[var(--n9)]' : c.ok ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'}`} aria-hidden="true" />
                          <span className="min-w-0">
                            <span className="font-mono text-[color:var(--text-muted)]">{c.id}</span> {c.label}
                            <span className="sr-only">{c.ok === null ? ' : non mesuré' : c.ok ? ' : atteint' : ' : non atteint'}</span>
                            {c.detail && <span className="block font-mono text-[11px] text-[color:var(--text-faint)]">{c.detail}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

// Teinte de fond d'un échantillon : utilitaire exporté pour la page (rampes).
export const hexOf = (value) => {
  const c = parseCssColor(value);
  return c ? toHex(c) : '';
};
