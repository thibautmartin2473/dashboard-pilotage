'use client';

// /demo/charte-cuir : « Cuir et bordeaux » en UN seul mode (ni clair ni sombre), en trois niveaux d'équilibre,
// vignettes côte à côte puis chaque niveau en grand sur la maquette fidèle du Cockpit (vraies données en
// lecture seule). Les couleurs ne sont jamais recopiées : palette, contrastes et écarts de teinte sont relus
// dans le CSS rendu (app/demo/studio/chartes.css). Rien n'est enregistré.
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { timeParis } from '@/lib/home';
import Mock from '../chartes/Mock';
import { apca, parseCssColor, readTokens, toHex, wcag } from '../chartes/color';
import Anneau from '../chartes-cadran/Anneau';
import { ETATS, NIVEAUX, PAIRS_CUIR, PALETTE_CUIR, RECO } from './data';
import '../chartes-cadran/cadran.css';
import './charte-cuir.css';

const fr = (n, d = 2) => n.toFixed(d).replace('.', ',');
const rgbCss = (c) => `rgb(${c[0]} ${c[1]} ${c[2]})`;

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

// Teinte OKLCH (degrés) d'une couleur sRGB 8 bits.
function hueOf([r, g, b]) {
  const lin = (c) => ((c / 255) <= 0.04045 ? c / 255 / 12.92 : (((c / 255) + 0.055) / 1.055) ** 2.4);
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const b2 = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return ((Math.atan2(b2, a) * 180) / Math.PI + 360) % 360;
}
const hueGap = (a, b) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

// Sonde : un nœud caché qui porte les jetons du niveau, pour lire les couleurs réellement rendues.
function useTokens(id, names) {
  const probe = useRef(null);
  const [tokens, setTokens] = useState(null);
  const key = names.join('|');
  useEffect(() => {
    const raf = requestAnimationFrame(() => setTokens(readTokens(probe.current, names)));
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, key]);
  const node = (
    <div ref={probe} className="studio" data-charte={id} data-mode="dark" aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', visibility: 'hidden' }} />
  );
  return [tokens, node];
}

function Palette({ id }) {
  const [tokens, probe] = useTokens(id, PALETTE_CUIR.map(([t]) => t));
  return (
    <div className="cd-sw-grid">
      {probe}
      {PALETTE_CUIR.map(([token, label]) => (
        <div key={token}>
          <div className="cd-sw-chip" style={{ background: `var(${token})` }} />
          <div className="cd-sw-name">{label}</div>
          <div className="cd-sw-hex">{tokens?.[token] ? toHex(tokens[token]).toUpperCase() : ' '}</div>
        </div>
      ))}
    </div>
  );
}

function Contrasts({ id }) {
  const names = [...new Set(PAIRS_CUIR.flatMap(([, f, b]) => [f, b]))];
  const [t, probe] = useTokens(id, names);
  const rows = t ? PAIRS_CUIR.map(([label, fg, bg, min, kind]) => ({ label, min, kind, f: t[fg], b: t[bg], ratio: wcag(t[fg], t[bg]), lc: apca(t[fg], t[bg]) })) : null;
  const fails = rows ? rows.filter((r) => r.ratio < r.min).length : null;
  return (
    <div>
      {probe}
      <div className="cc-ct" role="table" aria-label="Contrastes calculés">
        {(rows ?? PAIRS_CUIR.map(([label]) => ({ label }))).map((r) => (
          <div key={r.label} className="cc-ct-row" role="row">
            <span className="cc-ct-label" role="cell">
              {r.label}
              {r.min ? <span className="cd-note"> ({r.min === 3 ? '3:1, trait' : r.min === 1 ? 'information' : '4,5:1'})</span> : null}
            </span>
            {r.f ? (
              <span className="cc-ct-val" role="cell">
                <span className="cd-ct-sample" style={{ color: rgbCss(r.f), background: rgbCss(r.b) }}>
                  Aa
                </span>
                <span className="cd-ct-num">
                  <b className={r.ratio >= r.min ? 'cd-ct-ok' : 'cd-ct-ko'}>
                    {fr(r.ratio)}:1 {r.min === 1 ? '' : r.ratio >= r.min ? 'OK' : 'Échec'}
                  </b>
                  {r.kind !== 'trait' && (
                    <>
                      <br />
                      APCA Lc {Math.round(r.lc)}, {apcaTag(r.lc)}
                    </>
                  )}
                </span>
              </span>
            ) : (
              <span className="cc-ct-val" role="cell">Calcul en cours</span>
            )}
          </div>
        ))}
      </div>
      <p className="cd-note">
        {fails === null ? 'Calcul en cours.' : fails === 0 ? `Les ${PAIRS_CUIR.length - 1} paires à seuil passent.` : `${fails} paire(s) sous le seuil : voir les lignes marquées Échec.`} Lecture sur le CSS rendu ; WCAG 2 (rapport de luminance) et APCA
        (Lc 75 corps, 60 texte courant, 45 secondaire). Le bordeaux plein est donné à titre d’information : il n’a pas de seuil, il tient par sa teinte.
      </p>
    </div>
  );
}

// Les quatre états de l'agenda, côte à côte, avec l'écart de teinte mesuré.
function Etats({ id }) {
  const [t, probe] = useTokens(id, ETATS.map((e) => e.token));
  const hues = t ? ETATS.map((e) => hueOf(t[e.token])) : null;
  let minGap = null;
  let pair = '';
  if (hues) {
    for (let i = 0; i < ETATS.length; i++) {
      for (let j = i + 1; j < ETATS.length; j++) {
        const g = hueGap(hues[i], hues[j]);
        if (minGap === null || g < minGap) {
          minGap = g;
          pair = `${ETATS[i].label} et ${ETATS[j].label}`;
        }
      }
    }
  }
  return (
    <div>
      {probe}
      <div className="cc-etats">
        {ETATS.map((e, i) => (
          <div key={e.id} className="cc-etat" data-e={e.id}>
            <div className="cc-etat-blk">
              <span className="cc-etat-t">{e.id === 'retard' ? 'Relire le cas du jour' : e.id === 'fait' ? 'Envoyer la candidature' : e.id === 'tache' ? 'Préparer le fit' : 'Cours de valorisation'}</span>
              <span className="cc-etat-m">{e.id === 'retard' ? 'en retard de 2 j' : e.id === 'fait' ? 'terminé' : e.id === 'tache' ? '10h30, 1 h' : '09h00 à 12h00'}</span>
            </div>
            <div className="cc-etat-l">
              <b>{e.label}</b>
              <span>{e.hint}</span>
              <span className="cd-note">teinte {hues ? Math.round(hues[i]) : '...'}°</span>
            </div>
          </div>
        ))}
      </div>
      <p className="cd-note">
        {minGap === null ? 'Calcul des teintes en cours.' : `Écart de teinte minimal entre états : ${Math.round(minGap)} degrés (${pair}).`} Mesure OKLCH sur les jetons rendus ; la forme (barre pleine, contour pointillé, barre hachurée, titre barré) double
        toujours la couleur.
      </p>
    </div>
  );
}

function Vignette({ n }) {
  return (
    <a className="cc-vig studio" href={`#${n.id}`} data-charte={n.id} data-mode="dark" aria-label={`Aller au ${n.name}`}>
      <div className="cc-vig-head">
        <Anneau size={22} plage="var(--text)" tache="var(--laiton)" maintenant="var(--accent)" />
        <span className="cc-vig-brand">Cadran</span>
        <span className="cc-vig-n">Niveau {n.n}</span>
      </div>
      <div className="cc-vig-body">
        <div className="cc-vig-card">
          <div className="cc-vig-day">
            <span className="cc-vig-sig" aria-hidden="true" />
            <span className="cc-vig-dn">Mercredi 8</span>
          </div>
          <div className="cc-vig-blk" data-e="plage">Cours de valorisation</div>
          <div className="cc-vig-blk" data-e="tache">Préparer le fit</div>
          <div className="cc-vig-blk" data-e="retard">Relire le cas, en retard</div>
          <div className="cc-vig-blk" data-e="fait">Envoyer la candidature</div>
        </div>
        <div className="cc-vig-row">
          <span className="cc-vig-btn">Valider</span>
          <span className="cc-vig-link">Plus tard</span>
        </div>
        <p className="cc-vig-txt">Texte, texte atténué et <span className="cc-vig-acc">accent</span> sur la surface.</p>
      </div>
      <div className="cc-vig-sw" aria-hidden="true">
        {['--bg', '--surface', '--surface-2', '--text', '--accent-solid', '--accent', '--laiton', '--cat-cours', '--cat-tache', '--danger', '--success'].map((t) => (
          <span key={t} style={{ background: `var(${t})` }} />
        ))}
      </div>
      <div className="cc-vig-lbl">{n.tagline}</div>
    </a>
  );
}

function Niveau({ n, data, nowMs, dateLabel, reco }) {
  return (
    <section id={n.id} className="cd-sec cc-sec studio" data-charte={n.id} data-mode="dark" aria-labelledby={`h-${n.id}`}>
      <div className="cd-sec-head">
        <h2 id={`h-${n.id}`}>
          <span className="cd-letter" aria-hidden="true">
            {n.n}
          </span>
          {n.name}
        </h2>
        <div className="cd-meta">
          <span>{n.tagline}</span>
          {reco && <span className="cd-pill">Ma recommandation</span>}
          <Link href={`/demo/studio?charte=${n.id}`}>Voir dans le Studio</Link>
        </div>
        <dl className="cc-resume">
          {[
            ['Fond', n.resume.fond],
            ['Surface', n.resume.surface],
            ['Texte', n.resume.texte],
            ['Accent', n.resume.accent],
          ].map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <Mock
        data={data}
        nowMs={nowMs}
        brand={
          <>
            <Anneau size={22} plage="var(--text)" tache="var(--laiton)" maintenant="var(--accent)" />
            <span className="cx-brand-name">Cadran</span>
          </>
        }
      />
      <div className="cd-cards">
        <div className="cd-card">
          <h3>Palette</h3>
          <Palette id={n.id} />
        </div>
        <div className="cd-card">
          <h3>Plage, tâche, retard, fait : lecture d’un coup d’œil</h3>
          <Etats id={n.id} />
        </div>
        <div className="cd-card">
          <h3>Le logo anneau horaire, recoloré</h3>
          <div className="cd-logos">
            <div className="cd-tile cd-tile-light" title="Sur le fond du niveau">
              <Anneau size={44} plage="var(--text)" tache="var(--laiton)" maintenant="var(--accent)" />
            </div>
            <span className="cd-brand-link">
              <Anneau size={28} plage="var(--text)" tache="var(--laiton)" maintenant="var(--accent)" />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>Cadran</span>
            </span>
            <span className="cd-brand-link" title="Rendu réel à 16 px">
              <Anneau size={16} plage="var(--text)" tache="var(--laiton)" maintenant="var(--accent)" />
              <span className="cd-note" style={{ margin: 0 }}>16 px</span>
            </span>
          </div>
          <p className="cd-note">Plages en crème, tâches en laiton, trait de maintenant en rosé. Même dessin que l’anneau choisi.</p>
        </div>
        <div className="cd-card">
          <h3>Signature</h3>
          <div className="cd-sig">
            <strong>Le signet et la couture en laiton</strong>
            <p>Le signet bordeaux pend de l’en-tête du jour en cours, les panneaux ont une couture pointillée en laiton, et le maintenant est un trait de laiton terminé par un point.</p>
          </div>
          <p className="cd-note">
            Titres : {dateLabel} en Libre Caslon Text ; texte en IBM Plex Sans ; heures en IBM Plex Mono.
          </p>
          <p className="cc-titre">{dateLabel}</p>
        </div>
        <div className="cd-card cd-wide">
          <h3>Contrastes calculés</h3>
          <Contrasts id={n.id} />
        </div>
        <div className="cd-card">
          <h3>Ce qui change</h3>
          <ul className="cc-list">
            {n.change.map((c) => (
              <li key={c.slice(0, 40)}>{c}</li>
            ))}
          </ul>
        </div>
        <div className="cd-card">
          <h3>Failles (sans complaisance)</h3>
          <ol className="cd-flaws">
            {n.failles.map((f) => (
              <li key={f.slice(0, 40)}>{f}</li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export default function CharteCuir({ data }) {
  const nowMs = useMemo(() => simulatedNow(data.today), [data.today]);
  const dateLabel = useMemo(() => {
    const s = new Date(data.nowIso).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }, [data.nowIso]);

  return (
    <div className="cd-page">
      <div className="cd-banner">
        <strong>Démo : rien n’est enregistré.</strong> Lecture seule de tes vraies données. <Link href="/demo">Toutes les démos</Link>
      </div>
      <div className="cd-wrap">
        <header className="cd-intro">
          <h1>Cuir et bordeaux, un seul mode équilibré</h1>
          <p>
            Tu as choisi Cuir et bordeaux et demandé « un design unique, pas clair et sombre, mais un bon équilibre ». Il n’y a donc plus de bascule : un brun cuir moyen chaud, du texte crème, du bordeaux, du cuir, de l’olive et du laiton.
            Trois niveaux d’équilibre, du plus profond au plus clair, tous dans la zone médiane. Chacun est posé sur le vrai Cockpit ; contrastes et teintes sont recalculés sur le CSS rendu.
          </p>
          <ul className="cd-links" aria-label="Aller à un niveau">
            {NIVEAUX.map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`}>{n.name}</a>
              </li>
            ))}
            <li>
              <a href="#recommandation">Ma recommandation</a>
            </li>
          </ul>
        </header>

        <section aria-label="Les trois niveaux côte à côte" className="cc-vigs">
          {NIVEAUX.map((n) => (
            <Vignette key={n.id} n={n} />
          ))}
        </section>
        <p className="cd-note cc-vignote">Mêmes composants, mêmes signes, trois jeux de jetons : cadran-cuir-1, cadran-cuir (= niveau 2) et cadran-cuir-3. Clique une vignette pour aller au détail.</p>

        {NIVEAUX.map((n) => (
          <Niveau key={n.id} n={n} data={data} nowMs={nowMs} dateLabel={dateLabel} reco={n.n === 2} />
        ))}
        {data.errors.length > 0 && <p style={{ marginTop: 8, fontSize: 12 }}>{data.errors.join(' ; ')}</p>}

        <section id="recommandation" className="cd-end" aria-labelledby="h-reco">
          <h2 id="h-reco">Ma recommandation</h2>
          <p>
            <strong>{RECO.verdict}</strong>
          </p>
          <h3>Pourquoi</h3>
          <ul>
            {RECO.points.map((p) => (
              <li key={p.slice(0, 40)}>{p}</li>
            ))}
          </ul>
          <h3>Ce qui reste imparfait</h3>
          <ul>
            {RECO.restes.map((p) => (
              <li key={p.slice(0, 40)}>{p}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
