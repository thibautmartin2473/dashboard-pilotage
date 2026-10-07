'use client';

// /demo/chartes-cadran : les quatre chartes de Cadran tirées du moodboard, chacune sur une maquette fidèle du
// Cockpit réel (components/demo/chartes/Mock.js, vraies données en lecture seule), avec palette, typographie,
// logo recoloré, contrastes calculés sur le CSS rendu, signature et failles. Tout est local : rien n'est
// enregistré. Les couleurs ne sont jamais recopiées ici : elles sont relues dans le CSS (studio/chartes.css).
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { timeParis } from '@/lib/home';
import Mock from '../chartes/Mock';
import { apca, parseCssColor, readTokens, toHex, wcag } from '../chartes/color';
import Anneau from './Anneau';
import { CHARTES_CADRAN, CONTRAST_PAIRS, PALETTE_TOKENS, RECOMMANDATION } from './data';
import './cadran.css';

const MODE_LABEL = { light: 'Clair', dark: 'Sombre' };
const MODE_CHOICES = [
  { id: 'main', name: 'Mode principal de chacune' },
  { id: 'light', name: 'Clair' },
  { id: 'dark', name: 'Sombre' },
];
const fr = (n, d = 2) => n.toFixed(d).replace('.', ',');
const rgbCss = (c) => `rgb(${c[0]} ${c[1]} ${c[2]})`;

// Heure de la maquette : 14h32 Paris aujourd'hui (comme /demo/chartes), pour un rendu stable.
function simulatedNow(today) {
  for (const h of [12, 13]) {
    const iso = `${today}T${h}:32:00Z`;
    if (timeParis(iso) === '14h32') return Date.parse(iso);
  }
  return Date.parse(`${today}T12:32:00Z`);
}

function apcaTag(lc) {
  if (lc >= 75) return 'lisible en corps';
  if (lc >= 60) return 'lisible en texte courant';
  if (lc >= 45) return 'secondaire ou gros texte';
  return 'trop faible';
}

function Chip({ on, onClick, children }) {
  return (
    <button type="button" className="cd-chip" aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}

function Palette({ id, mode }) {
  const ref = useRef(null);
  const [hex, setHex] = useState({});
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const next = {};
      for (const el of ref.current?.querySelectorAll('[data-sw]') ?? []) {
        const c = parseCssColor(getComputedStyle(el).backgroundColor);
        next[el.getAttribute('data-sw')] = c ? toHex(c).toUpperCase() : '';
      }
      setHex(next);
    });
    return () => cancelAnimationFrame(raf);
  }, [id, mode]);
  return (
    <div ref={ref} className="cd-sw-grid">
      {PALETTE_TOKENS.map(([token, label]) => (
        <div key={token}>
          <div className="cd-sw-chip" data-sw={token} style={{ background: `var(${token})` }} />
          <div className="cd-sw-name">{label}</div>
          <div className="cd-sw-hex">{hex[token] || ' '}</div>
        </div>
      ))}
    </div>
  );
}

function ContrastTable({ id }) {
  const lightRef = useRef(null);
  const darkRef = useRef(null);
  const [rows, setRows] = useState(null);
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const names = [...new Set(CONTRAST_PAIRS.flatMap(([, fg, bg]) => [fg, bg]))];
      const out = {};
      for (const [m, ref] of [
        ['light', lightRef],
        ['dark', darkRef],
      ]) {
        const t = readTokens(ref.current, names);
        out[m] = CONTRAST_PAIRS.map(([, fg, bg, min, kind]) => {
          const f = t[fg];
          const b = t[bg];
          return f && b ? { f, b, ratio: wcag(f, b), lc: apca(f, b), min, kind } : null;
        });
      }
      setRows(out);
    });
    return () => cancelAnimationFrame(raf);
  }, [id]);

  const fails = rows ? ['light', 'dark'].flatMap((m) => rows[m].filter((r) => r && r.ratio < r.min)).length : null;
  return (
    <div>
      {['light', 'dark'].map((m) => (
        <div key={m} className="studio" data-charte={id} data-mode={m} aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', visibility: 'hidden' }} ref={m === 'light' ? lightRef : darkRef} />
      ))}
      <div className="cd-ct" role="table" aria-label="Contrastes calculés">
        <div className="cd-ct-head" role="row">
          <span role="columnheader">Paire (texte sur fond)</span>
          <span role="columnheader">Clair</span>
          <span role="columnheader">Sombre</span>
        </div>
        {CONTRAST_PAIRS.map(([label, , , min], i) => (
          <div key={label} className="cd-ct-row" role="row">
            <span role="cell">
              {label}
              <span className="cd-note"> ({min === 3 ? '3:1, trait' : '4,5:1'})</span>
            </span>
            {['light', 'dark'].map((m) => {
              const r = rows?.[m][i];
              if (!r) return <span key={m} className="cd-ct-cell" data-mode={MODE_LABEL[m]} role="cell">Calcul en cours</span>;
              const ok = r.ratio >= r.min;
              return (
                <span key={m} className="cd-ct-cell" data-mode={MODE_LABEL[m]} role="cell">
                  <span className="cd-ct-sample" style={{ color: rgbCss(r.f), background: rgbCss(r.b) }}>
                    Aa
                  </span>
                  <span className="cd-ct-num">
                    <b className={ok ? 'cd-ct-ok' : 'cd-ct-ko'}>
                      {fr(r.ratio)}:1 {ok ? 'OK' : 'Échec'}
                    </b>
                    {r.kind !== 'trait' && (
                      <>
                        <br />
                        APCA Lc {Math.round(r.lc)}, {apcaTag(r.lc)}
                      </>
                    )}
                  </span>
                </span>
              );
            })}
          </div>
        ))}
      </div>
      <p className="cd-note">
        {fails === null ? 'Calcul en cours.' : fails === 0 ? 'Les 15 paires passent en clair comme en sombre.' : `${fails} paire(s) sous le seuil : voir les lignes marquées Échec.`} WCAG 2 : rapport de
        luminance ; APCA (méthode candidate de WCAG 3) : Lc 75 et plus pour le corps de texte, 60 pour le texte courant, 45 pour le gros ou le secondaire. Valeurs lues sur le CSS rendu.
      </p>
    </div>
  );
}

function Typo({ c, dateLabel }) {
  return (
    <div className="cd-spec">
      <p className="role">Titre du jour : {c.specimen.titre}</p>
      <p className="big">{dateLabel}</p>
      <p className="role">Texte : {c.specimen.texte}</p>
      <p className="body">Trois plages dans la journée, deux tâches posées entre elles. Le reste attend dans À ranger, avec une suggestion et cinq gestes.</p>
      <p className="role">Heures et chiffres : {c.specimen.chiffres}</p>
      <p className="mono">09h00 10h30 14h32 18h00 0123456789</p>
      {c.id === 'cadran-voyant' && (
        <>
          <p className="role">Chiffres décoratifs : Doto (matrice de points)</p>
          <p style={{ fontFamily: 'var(--font-dot)', fontWeight: 800, fontSize: '1.9rem', lineHeight: 1.1 }}>14h32 08 12 47</p>
        </>
      )}
      {c.id === 'cadran-raycast' && (
        <>
          <p className="role">Accent éditorial : Instrument Serif (une phrase par écran)</p>
          <p style={{ fontFamily: 'var(--font-accent)', fontStyle: 'italic', fontSize: '1.5rem', lineHeight: 1.15 }}>Trois choses à ranger avant midi.</p>
        </>
      )}
    </div>
  );
}

function Logos({ name }) {
  return (
    <div>
      <div className="cd-logos">
        <div className="cd-tile cd-tile-light" title="Sur le fond de la charte">
          <Anneau size={44} />
        </div>
        <div className="cd-tile" title="Version icône, fond inversé">
          <Anneau size={44} plage="var(--bg)" tache="var(--accent)" />
        </div>
        <span className="cd-brand-link">
          <Anneau size={28} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 'var(--k-title-weight)', fontSize: 20, letterSpacing: 'var(--k-title-tracking)' }}>{name}</span>
        </span>
        <span className="cd-brand-link" title="Rendu réel à 16 px">
          <Anneau size={16} />
          <span className="cd-note" style={{ margin: 0 }}>16 px</span>
        </span>
      </div>
      <p className="cd-note">Les arcs épais (plages) prennent la couleur du texte, les arcs fins et le trait de maintenant celle de l’accent. Le dessin est celui de l’anneau horaire que tu as choisi.</p>
    </div>
  );
}

function CharteSection({ c, mode, data, nowMs, dateLabel }) {
  const main = mode === c.mainMode;
  return (
    <section id={c.id} className="cd-sec studio" data-charte={c.id} data-mode={mode} aria-labelledby={`h-${c.id}`}>
      <div className="cd-sec-head">
        <h2 id={`h-${c.id}`}>
          <span className="cd-letter" aria-hidden="true">
            {c.letter}
          </span>
          {c.name}
        </h2>
        <div className="cd-meta">
          <span>Ancrée dans {c.ancrage.join(', ')}</span>
          <span className="cd-pill">Mode principal : {MODE_LABEL[c.mainMode].toLowerCase()}</span>
          <Link href={`/demo/studio?charte=${c.id}&mode=${mode}`}>Voir dans le Studio</Link>
        </div>
        <p className="cd-pitch">{c.pitch}</p>
      </div>
      <p className="cd-modebar">
        Maquette du Cockpit en mode {MODE_LABEL[mode].toLowerCase()}
        {main ? ' (le mode principal de cette charte)' : ' (le mode secondaire de cette charte)'}, avec tes vraies données.
      </p>
      <Mock
        data={data}
        nowMs={nowMs}
        brand={
          <>
            <Anneau size={22} />
            <span className="cx-brand-name">Cadran</span>
          </>
        }
      />
      <div className="cd-cards">
        <div className="cd-card">
          <h3>Palette ({MODE_LABEL[mode].toLowerCase()})</h3>
          <Palette id={c.id} mode={mode} />
        </div>
        <div className="cd-card">
          <h3>Typographie</h3>
          <Typo c={c} dateLabel={dateLabel} />
          <p className="cd-note">{c.polices.map((p) => `${p.name} : ${p.note}`).join(' ; ')}.</p>
        </div>
        <div className="cd-card">
          <h3>Le logo anneau horaire, recoloré</h3>
          <Logos name="Cadran" />
        </div>
        <div className="cd-card">
          <h3>Signature</h3>
          <div className="cd-sig">
            <strong>{c.signature.title}</strong>
            <p>{c.signature.text}</p>
          </div>
        </div>
        <div className="cd-card cd-wide">
          <h3>Contrastes calculés, clair et sombre</h3>
          <ContrastTable id={c.id} />
        </div>
        <div className="cd-card cd-wide">
          <h3>Failles (sans complaisance)</h3>
          <ol className="cd-flaws">
            {c.failles.map((f) => (
              <li key={f.slice(0, 40)}>{f}</li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export default function ChartesCadran({ data, initial = {} }) {
  const [only, setOnly] = useState(CHARTES_CADRAN.some((c) => c.id === initial.charte) ? initial.charte : 'all');
  const [modeSel, setModeSel] = useState(['light', 'dark'].includes(initial.mode) ? initial.mode : 'main');
  const nowMs = useMemo(() => simulatedNow(data.today), [data.today]);
  const dateLabel = useMemo(() => {
    const s = new Date(data.nowIso).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }, [data.nowIso]);

  const syncUrl = (next) => {
    const params = new URLSearchParams({ charte: only, mode: modeSel, ...next });
    window.history.replaceState(null, '', `?${params}`);
  };
  const pickOnly = (id) => {
    setOnly(id);
    syncUrl({ charte: id });
  };
  const pickMode = (id) => {
    setModeSel(id);
    syncUrl({ mode: id });
  };
  const shown = CHARTES_CADRAN.filter((c) => only === 'all' || c.id === only);

  return (
    <div className="cd-page">
      <div className="cd-banner">
        <strong>Démo : rien n’est enregistré.</strong> Lecture seule de tes vraies données. <Link href="/demo">Toutes les démos</Link>
      </div>
      <div className="cd-wrap">
        <header className="cd-intro">
          <h1>Chartes de Cadran, d’après ton moodboard</h1>
          <p>
            Quatre chartes nouvelles, pas des variantes de Graphite, tirées de ce que tu as aimé (Claude, Craft, Vercel, Things 3, Raycast, Nothing, Mercury, Stripe Press) et sans rien de ce que tu as écarté (pastels, dégradés vifs,
            sombres bleutés ou violets, ludique). Chacune est posée sur le vrai Cockpit, avec le logo anneau horaire recoloré, en clair et en sombre. Les contrastes sont calculés sur le CSS rendu, pas recopiés.
          </p>
          <ul className="cd-links" aria-label="Aller à une charte">
            {CHARTES_CADRAN.map((c) => (
              <li key={c.id}>
                <a href={`#${c.id}`}>
                  {c.letter}. {c.name}
                </a>
              </li>
            ))}
            <li>
              <a href="#recommandation">Ma recommandation</a>
            </li>
          </ul>
        </header>

        <div className="cd-bar">
          <div className="cd-bar-inner">
            <div className="cd-bar-group">
              <div className="cd-bar-label">Charte</div>
              <div className="cd-chips" role="group" aria-label="Charte affichée">
                <Chip on={only === 'all'} onClick={() => pickOnly('all')}>
                  Les quatre
                </Chip>
                {CHARTES_CADRAN.map((c) => (
                  <Chip key={c.id} on={only === c.id} onClick={() => pickOnly(c.id)}>
                    {c.letter}. {c.name}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="cd-bar-group">
              <div className="cd-bar-label">Mode</div>
              <div className="cd-chips" role="group" aria-label="Mode affiché">
                {MODE_CHOICES.map((m) => (
                  <Chip key={m.id} on={modeSel === m.id} onClick={() => pickMode(m.id)}>
                    {m.name}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </div>

        {shown.map((c) => (
          <CharteSection key={c.id} c={c} mode={modeSel === 'main' ? c.mainMode : modeSel} data={data} nowMs={nowMs} dateLabel={dateLabel} />
        ))}
        {data.errors.length > 0 && <p style={{ marginTop: 8, fontSize: 12 }}>{data.errors.join(' ; ')}</p>}

        <section id="recommandation" className="cd-end" aria-labelledby="h-reco">
          <h2 id="h-reco">Ma recommandation</h2>
          <p>
            <strong>{RECOMMANDATION.verdict}</strong>
          </p>
          <h3>Pourquoi</h3>
          <ul>
            {RECOMMANDATION.points.map((p) => (
              <li key={p.slice(0, 40)}>{p}</li>
            ))}
          </ul>
          <h3>Sous quelles conditions, et ce que je ne choisirais pas</h3>
          <ul>
            {RECOMMANDATION.conditions.map((p) => (
              <li key={p.slice(0, 40)}>{p}</li>
            ))}
          </ul>
          <h3>En résumé</h3>
          <table className="cd-compare">
            <thead>
              <tr>
                <th>Charte</th>
                <th>Mode principal</th>
                <th>Polices</th>
                <th>Faille principale</th>
              </tr>
            </thead>
            <tbody>
              {CHARTES_CADRAN.map((c) => (
                <tr key={c.id}>
                  <td data-l="Charte">
                    <strong>
                      {c.letter}. {c.name}
                    </strong>
                  </td>
                  <td data-l="Mode principal">{MODE_LABEL[c.mainMode]}</td>
                  <td data-l="Polices">{c.polices.map((p) => p.name).join(', ')}</td>
                  <td data-l="Faille principale">{c.failles[0]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: 12 }}>
            Prochaine étape, si tu choisis : un seul choix de charte (avec son mode principal), puis les composants (boutons, cartes, micro-interactions) dans cette charte, sur la même maquette.
          </p>
        </section>
      </div>
    </div>
  );
}
