'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { construireSim, pasForces, refroidie, reveiller, signatureGraphe } from '@/lib/constellation-sim';

// Constellation : graphe en direct du vault Obsidian (données envoyées par le plugin « Constellation
// vers Cockpit », lues côté serveur par lib/vault-graph.js). Canvas sans dépendance, calculs dans le
// navigateur : aucun token, aucun appel externe.
//
// Deux modes :
//  - 'plein' : vue pour naviguer. Molette pour zoomer, glisser pour se déplacer, glisser un point pour le
//    déplacer (la simulation se réchauffe puis se repose), survol qui allume les voisins, clic qui ouvre la
//    note dans Obsidian.
//  - 'fond' : décor derrière le Cockpit. Pas d'interaction (pointer-events coupés), recadré sur toute la
//    fenêtre, opacité réglable, dérive très lente faite en CSS (compositeur, par paliers : aucun JS).
//
// Règles de coût : la simulation de forces tourne à l'ouverture et quand on interagit, refroidit, puis
// S'ARRÊTE (plus de calcul, plus de requestAnimationFrame, tant que rien ne bouge). Pause totale quand
// l'onglet est caché. prefers-reduced-motion : rendu figé directement à l'état final.
const VAULT = 'Vault';
// Charte du nouveau cap (2026-10-08) : uniquement des dégradés de bleu et de gris. Couleur du point =
// type de l'élément ; couleur du lien = thème (dossier). Mêmes règles que le style Obsidian « cadran ».
const TYPE_COLORS = {
  Hub: '#F6F8FC',
  PDF: '#CFE0F5',
  'Outil Claude': '#9DB8DC',
  Fiche: '#6C97CF',
  'Cours et cas': '#3F6FAF',
  Note: '#8E9CB4',
  Image: '#5E6678',
  'Save Instagram': '#333D52',
};
const THEME_COLORS = {
  EDHEC: '#6C97CF',
  'Carrière': '#CFE0F5',
  'Claude & Outils': '#3F6FAF',
  Finance: '#9DB8DC',
  '03 Ressources': '#5E6678',
  '01 Projets': '#8E9CB4',
};
const LINK_DEFAULT = '#3A4256';

// Marge du canvas du fond : il dépasse de 4 % de chaque côté pour que la dérive ne découvre jamais un bord.
const MARGE_FOND = 0.04;
// Un second pas de simulation dans la même image n'est lancé que si le premier a pris moins de ce budget (ms).
const BUDGET_MS = 3;
const PAS_PAR_IMAGE = 2;

// `maintenant` (ms) vient d'un état posé après le montage : l'heure n'est jamais lue pendant le rendu, sinon le
// texte du serveur et celui du navigateur diffèrent (erreur d'hydratation). Vide tant qu'il n'est pas connu.
function ago(iso, maintenant) {
  if (!iso || maintenant === null) return '';
  const s = Math.max(0, Math.round((maintenant - new Date(iso).getTime()) / 1000));
  if (s < 60) return `il y a ${s} s`;
  if (s < 3600) return `il y a ${Math.round(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.round(s / 3600)} h`;
  return `il y a ${Math.round(s / 86400)} j`;
}

// Regroupe noeuds (par couleur de type) et liens (par couleur de thème) : un seul tracé par couleur au
// lieu d'un tracé par élément, ce qui divise le coût d'une image par dix environ.
function preparerGroupes(sim) {
  const parCouleurNoeud = new Map();
  sim.nodes.forEach((p, i) => {
    p.color = TYPE_COLORS[p.type] ?? TYPE_COLORS.Note;
    if (!parCouleurNoeud.has(p.color)) parCouleurNoeud.set(p.color, []);
    parCouleurNoeud.get(p.color).push(i);
  });
  const parCouleurLien = new Map();
  for (let e = 0; e < sim.m; e++) {
    const p = sim.nodes[sim.lk[2 * e]];
    const q = sim.nodes[sim.lk[2 * e + 1]];
    const theme = p.theme === q.theme ? p.theme : p.degree >= q.degree ? p.theme : q.theme;
    const couleur = THEME_COLORS[theme] ?? LINK_DEFAULT;
    if (!parCouleurLien.has(couleur)) parCouleurLien.set(couleur, []);
    parCouleurLien.get(couleur).push(e);
  }
  sim.groupesNoeuds = [...parCouleurNoeud].map(([couleur, liste]) => ({ couleur, liste: Int32Array.from(liste) }));
  sim.groupesLiens = [...parCouleurLien].map(([couleur, liste]) => ({ couleur, liste: Int32Array.from(liste) }));
  sim.sx = new Float32Array(sim.n);
  sim.sy = new Float32Array(sim.n);
  return sim;
}

export default function Constellation({ graph, mode = 'plein', height, opacite = 0.55 }) {
  const fond = mode === 'fond';
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const simRef = useRef(null);
  const ctlRef = useRef(null);
  const graphRef = useRef(graph);
  const [hover, setHover] = useState(null);
  const [maintenant, setMaintenant] = useState(null); // ms, connu après le montage seulement (voir ago)

  // Signature du contenu : AutoRefresh renvoie un objet neuf toutes les 60 s, la simulation ne repart que
  // si le graphe a réellement changé.
  const signature = useMemo(() => signatureGraphe(graph), [graph]);
  const aGraphe = signature !== '';

  useEffect(() => {
    graphRef.current = graph;
  });

  // Heure de la ligne « synchronisé il y a... » : lue après le montage, puis toutes les 30 s (vue plein seulement).
  useEffect(() => {
    if (fond) return undefined;
    const maj = () => setMaintenant(Date.now());
    const premier = setTimeout(maj, 0);
    const horloge = setInterval(maj, 30000);
    return () => {
      clearTimeout(premier);
      clearInterval(horloge);
    };
  }, [fond]);

  // Moteur d'affichage : canvas, vue, boucle d'animation, interactions.
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return undefined;
    const ctx = canvas.getContext('2d');
    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const view = { kx: 0.9, ky: 0.9, x: 0, y: 0 };
    const taille = { w: 0, h: 0 };
    let raf = 0;
    let sale = true; // il y a quelque chose à redessiner
    let utilisateurABouge = false;
    let survole = null;
    let drag = null;
    let detruit = false;

    const dimensionner = () => {
      const box = wrap.getBoundingClientRect();
      if (!box.width || !box.height) return false;
      const ratio = Math.min(window.devicePixelRatio || 1, fond ? 1.5 : 2);
      taille.w = box.width;
      taille.h = box.height;
      canvas.width = Math.round(box.width * ratio);
      canvas.height = Math.round(box.height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      return true;
    };

    // Recadrage : percentiles 2 à 98 % pour que quelques points isolés ne dézooment pas tout le graphe.
    // Plein : échelle uniforme. Fond : le graphe remplit la fenêtre (échelles x et y distinctes, c'est un décor).
    const cadrer = () => {
      const sim = simRef.current;
      if (!sim || !taille.w) return;
      const xs = Float64Array.from(sim.x).sort();
      const ys = Float64Array.from(sim.y).sort();
      const q = (arr, f) => arr[Math.floor(f * (arr.length - 1))];
      const w = q(xs, 0.98) - q(xs, 0.02) || 1;
      const h = q(ys, 0.98) - q(ys, 0.02) || 1;
      if (fond) {
        const marge = 1 + 2 * MARGE_FOND;
        view.kx = Math.min(6, (0.92 * taille.w) / marge / w);
        view.ky = Math.min(6, (0.92 * taille.h) / marge / h);
      } else {
        view.kx = view.ky = Math.min(4, 0.9 * Math.min(taille.w / w, taille.h / h));
      }
      view.x = -((q(xs, 0.02) + q(xs, 0.98)) / 2) * view.kx;
      view.y = -((q(ys, 0.02) + q(ys, 0.98)) / 2) * view.ky;
    };

    const dessiner = () => {
      const sim = simRef.current;
      if (!sim || !taille.w) return;
      const { w: W, h: H } = taille;
      if (fond) {
        ctx.clearRect(0, 0, W, H);
      } else {
        const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) / 1.4);
        g.addColorStop(0, '#252C3D');
        g.addColorStop(0.6, '#1E2433');
        g.addColorStop(1, '#181D2A');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
      const { n, x, y, sx, sy, lk, nodes } = sim;
      const ox = W / 2 + view.x;
      const oy = H / 2 + view.y;
      for (let i = 0; i < n; i++) {
        sx[i] = ox + x[i] * view.kx;
        sy[i] = oy + y[i] * view.ky;
      }
      const echelle = Math.sqrt(view.kx * view.ky);
      const lit = survole === null ? null : sim.voisinsSurvol;

      // Liens : un tracé par couleur de thème.
      ctx.lineWidth = fond ? 0.9 : 0.7;
      for (const groupe of sim.groupesLiens) {
        ctx.strokeStyle = groupe.couleur;
        ctx.globalAlpha = lit ? 0.08 : 0.35;
        ctx.beginPath();
        for (const e of groupe.liste) {
          const s = lk[2 * e];
          const t = lk[2 * e + 1];
          if (lit && (s === survole || t === survole)) continue;
          ctx.moveTo(sx[s], sy[s]);
          ctx.lineTo(sx[t], sy[t]);
        }
        ctx.stroke();
      }
      if (lit) {
        ctx.strokeStyle = '#F6F8FC';
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        for (const v of lit) {
          ctx.moveTo(sx[survole], sy[survole]);
          ctx.lineTo(sx[v], sy[v]);
        }
        ctx.stroke();
      }

      // Points : un tracé par couleur de type (deux si un survol assombrit les non-voisins).
      const rayon = (p) => (fond ? Math.min(7, p.radius * echelle) : p.radius * echelle);
      const passe = (groupe, alpha, garder) => {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = groupe.couleur;
        ctx.beginPath();
        for (const i of groupe.liste) {
          if (!garder(i)) continue;
          const r = rayon(nodes[i]);
          ctx.moveTo(sx[i] + r, sy[i]);
          ctx.arc(sx[i], sy[i], r, 0, Math.PI * 2);
        }
        ctx.fill();
      };
      for (const groupe of sim.groupesNoeuds) {
        if (!lit) {
          passe(groupe, 0.95, () => true);
        } else {
          const proche = (i) => i === survole || lit.has(i);
          passe(groupe, 0.2, (i) => !proche(i));
          passe(groupe, 0.95, proche);
        }
      }

      // Étiquettes (vue plein seulement, échelle uniforme).
      if (!fond) {
        ctx.fillStyle = '#DCE6F4';
        ctx.font = '11px system-ui, sans-serif';
        for (let i = 0; i < n; i++) {
          const p = nodes[i];
          const proche = lit && (i === survole || lit.has(i));
          if ((view.kx > 1.6 && p.degree > 6 && (!lit || proche)) || i === survole || (proche && view.kx > 1)) {
            ctx.globalAlpha = 0.9;
            ctx.fillText(p.name, sx[i] + rayon(p) + 3, sy[i] + 3);
          }
        }
      }
      ctx.globalAlpha = 1;
    };

    // Boucle : tourne tant que la simulation est chaude ou qu'il y a quelque chose à redessiner, puis plus rien.
    const planifier = () => {
      if (raf || detruit || document.hidden) return;
      raf = requestAnimationFrame(image);
    };

    const image = () => {
      raf = 0;
      if (detruit || document.hidden) return;
      const sim = simRef.current;
      if (!sim) return;
      if (!refroidie(sim)) {
        const debut = performance.now();
        let pas = 0;
        do {
          pasForces(sim);
          pas++;
        } while (pas < PAS_PAR_IMAGE && !refroidie(sim) && performance.now() - debut < BUDGET_MS);
        if (fond || !utilisateurABouge) cadrer();
        dessiner();
        sale = false;
        if (!refroidie(sim)) {
          planifier();
        } else {
          // Vient de se poser : dernier recadrage propre, dernier dessin, puis arrêt complet.
          if (fond || !utilisateurABouge) cadrer();
          dessiner();
        }
        return;
      }
      if (sale) {
        sale = false;
        dessiner();
      }
    };

    // Rendu figé directement à l'état final (prefers-reduced-motion).
    const figer = () => {
      const sim = simRef.current;
      if (!sim) return;
      while (!refroidie(sim)) pasForces(sim);
      cadrer();
      dessiner();
    };

    const redessiner = () => {
      sale = true;
      planifier();
    };

    const surReprise = (alpha) => {
      const sim = simRef.current;
      if (!sim) return;
      reveiller(sim, alpha);
      if (reduit) {
        figer();
        return;
      }
      sale = true;
      planifier();
    };

    const surVisibilite = () => {
      canvas.style.animationPlayState = document.hidden ? 'paused' : 'running';
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else {
        redessiner();
      }
    };

    let tempoResize = 0;
    const surResize = () => {
      cancelAnimationFrame(tempoResize);
      tempoResize = requestAnimationFrame(() => {
        if (!dimensionner()) return;
        if (fond || !utilisateurABouge) cadrer();
        redessiner();
      });
    };

    // Interactions (vue plein seulement).
    const mondeDe = (event) => {
      const box = canvas.getBoundingClientRect();
      return [(event.clientX - box.left - taille.w / 2 - view.x) / view.kx, (event.clientY - box.top - taille.h / 2 - view.y) / view.ky];
    };
    const trouver = (event) => {
      const sim = simRef.current;
      if (!sim) return null;
      const [wx, wy] = mondeDe(event);
      let best = null;
      let bestD = Infinity;
      for (let i = 0; i < sim.n; i++) {
        const d = (sim.x[i] - wx) ** 2 + (sim.y[i] - wy) ** 2;
        const lim = (sim.nodes[i].radius + 4 / view.kx) ** 2;
        if (d < bestD && d < lim) {
          best = i;
          bestD = d;
        }
      }
      return best;
    };
    const definirSurvol = (i) => {
      const sim = simRef.current;
      survole = i;
      if (i === null) {
        sim.voisinsSurvol = null;
        setHover(null);
        canvas.style.cursor = 'grab';
      } else {
        sim.voisinsSurvol = new Set(sim.adj.subarray(sim.debut[i], sim.debut[i + 1]));
        setHover(sim.nodes[i]);
        canvas.style.cursor = 'pointer';
      }
      redessiner();
    };
    const surMolette = (event) => {
      event.preventDefault();
      utilisateurABouge = true;
      const box = canvas.getBoundingClientRect();
      const mx = event.clientX - box.left - taille.w / 2;
      const my = event.clientY - box.top - taille.h / 2;
      const facteur = event.deltaY > 0 ? 0.88 : 1.14;
      view.x = mx - (mx - view.x) * facteur;
      view.y = my - (my - view.y) * facteur;
      view.kx = view.ky = Math.min(8, Math.max(0.2, view.kx * facteur));
      redessiner();
    };
    const surAppui = (event) => {
      if (event.button !== 0) return;
      drag = { x: event.clientX, y: event.clientY, x0: event.clientX, y0: event.clientY, moved: false, node: trouver(event) };
    };
    const surMouvement = (event) => {
      const sim = simRef.current;
      if (!sim) return;
      if (drag) {
        const dx = event.clientX - drag.x;
        const dy = event.clientY - drag.y;
        if (!drag.moved && Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
        if (!drag.moved) return;
        if (drag.node !== null) {
          // On déplace le point : la simulation se réchauffe pour que le reste suive, puis se repose.
          const [wx, wy] = mondeDe(event);
          sim.epingle = drag.node;
          sim.x[drag.node] = wx;
          sim.y[drag.node] = wy;
          surReprise(0.3);
        } else {
          utilisateurABouge = true;
          view.x += dx;
          view.y += dy;
          drag.x = event.clientX;
          drag.y = event.clientY;
          redessiner();
        }
        return;
      }
      const trouve = trouver(event);
      if (trouve !== survole) definirSurvol(trouve);
    };
    const surRelache = (event) => {
      const sim = simRef.current;
      const etat = drag;
      drag = null;
      if (!etat || !sim) return;
      if (event.type === 'pointercancel') {
        sim.epingle = -1; // geste interrompu : on lâche le point, sans jamais ouvrir de note
        return;
      }
      // Relâché loin de l'appui (même sans mouvement intermédiaire) : c'est un glissement, pas un clic.
      const loin = Math.abs(event.clientX - etat.x0) + Math.abs(event.clientY - etat.y0) > 3;
      if (etat.node !== null && etat.moved) {
        sim.epingle = -1;
        return;
      }
      if (etat.moved || loin) return;
      const trouve = trouver(event);
      if (trouve !== null) {
        const file = sim.nodes[trouve].path.replace(/\.md$/, '');
        window.location.href = `obsidian://open?vault=${encodeURIComponent(VAULT)}&file=${encodeURIComponent(file)}`;
      }
    };

    dimensionner();
    window.addEventListener('resize', surResize);
    document.addEventListener('visibilitychange', surVisibilite);
    if (!fond) {
      canvas.addEventListener('wheel', surMolette, { passive: false });
      canvas.addEventListener('pointerdown', surAppui);
      window.addEventListener('pointermove', surMouvement);
      window.addEventListener('pointerup', surRelache);
      window.addEventListener('pointercancel', surRelache); // geste interrompu (appel, geste système) : même fin qu'un relâchement
    }

    ctlRef.current = {
      // Graphe nouveau ou modifié : dessin immédiat, puis simulation si elle est chaude.
      nouveau: () => {
        const sim = simRef.current;
        if (!sim) return;
        if (survole !== null) setHover(null);
        survole = null;
        if (reduit) {
          figer();
          return;
        }
        if (fond || !utilisateurABouge) cadrer();
        redessiner();
      },
    };
    if (simRef.current) ctlRef.current.nouveau();

    return () => {
      detruit = true;
      ctlRef.current = null;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(tempoResize);
      window.removeEventListener('resize', surResize);
      document.removeEventListener('visibilitychange', surVisibilite);
      if (!fond) {
        canvas.removeEventListener('wheel', surMolette);
        canvas.removeEventListener('pointerdown', surAppui);
        window.removeEventListener('pointermove', surMouvement);
        window.removeEventListener('pointerup', surRelache);
        window.removeEventListener('pointercancel', surRelache);
      }
    };
  }, [fond, aGraphe, height]);

  // Données : (re)construit la simulation en gardant les positions des noeuds déjà connus.
  useEffect(() => {
    if (!signature) {
      simRef.current = null;
      return;
    }
    simRef.current = preparerGroupes(construireSim(graphRef.current, simRef.current));
    ctlRef.current?.nouveau();
  }, [signature]);

  if (!aGraphe) {
    // Fond : rien à dessiner, aucune erreur. Plein : l'état d'attente.
    if (fond) return null;
    return (
      <div style={{ height: height ?? '100%', minHeight: 120, background: '#1E2433', color: '#8E9CB4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
        En attente de la première synchronisation d&apos;Obsidian.
      </div>
    );
  }

  if (fond) {
    return (
      <div ref={wrapRef} aria-hidden="true" style={{ position: 'absolute', left: `${-MARGE_FOND * 100}%`, top: `${-MARGE_FOND * 100}%`, width: `${(1 + 2 * MARGE_FOND) * 100}%`, height: `${(1 + 2 * MARGE_FOND) * 100}%`, pointerEvents: 'none' }}>
        <style>{`@keyframes constellation-derive{from{transform:translate3d(-10px,6px,0) rotate(-1.2deg)}to{transform:translate3d(10px,-6px,0) rotate(1.2deg)}}@media (prefers-reduced-motion:reduce){.constellation-fond{animation:none!important}}`}</style>
        <canvas
          ref={canvasRef}
          className="constellation-fond"
          style={{ width: '100%', height: '100%', display: 'block', opacity: opacite, pointerEvents: 'none', animation: 'constellation-derive 160s steps(320) infinite alternate', willChange: 'transform' }}
        />
      </div>
    );
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height: height ?? '100%' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', cursor: 'grab', touchAction: 'none' }} />
      <div style={{ position: 'absolute', left: 12, bottom: 10, fontSize: 12, color: '#8E9CB4', pointerEvents: 'none' }}>
        {`${graph.nodes.length} notes, ${graph.links.length} liens${ago(graph.updatedAt, maintenant) ? `, synchronisé ${ago(graph.updatedAt, maintenant)}` : ''}`}
      </div>
      {hover && (
        <div style={{ position: 'absolute', right: 12, top: 10, fontSize: 12, color: '#ECEBE6', background: 'rgba(20,22,23,0.85)', padding: '4px 10px', borderRadius: 6, pointerEvents: 'none' }}>
          {`${hover.name} : ${hover.type ?? 'Note'}, ${hover.theme} (${hover.degree} liens), clic pour l'ouvrir`}
        </div>
      )}
    </div>
  );
}
