// Moteur de forces de la Constellation : JavaScript pur, sans dépendance ni accès au DOM (donc
// mesurable en Node). Même modèle que le kit : répulsion en 1/d, ressorts sur les liens, rappel au
// centre, amortissement. Deux différences de coût : la répulsion passe par une grille spatiale (seules
// les cases voisines sont visitées, au lieu de toutes les paires) et les positions sont en tableaux
// typés. La simulation refroidit (alpha) puis s'arrête : sous ALPHA_ARRET, plus aucun calcul.

export const ALPHA_ARRET = 0.02;
const DECROISSANCE = 0.985;
const PORTEE = 300; // la répulsion n'agit pas au-delà
const PORTEE2 = PORTEE * PORTEE;
const CASE_MIN = 150;

// Dossier de premier niveau, avec « 02 Domaines » déplié (même règle que le style Obsidian « cadran »).
export function themeDe(path) {
  const parts = String(path).split('/');
  if (parts[0] === '02 Domaines' && parts[1]) return parts[1];
  return parts.length > 1 ? parts[0] : 'Accueil';
}

// Signature du CONTENU du graphe (chemins, types, degrés, liens), sans la date d'envoi : le plugin
// renvoie le graphe à chaque modification du vault, et un graphe identique ne doit rien relancer.
export function signatureGraphe(graph) {
  const nodes = graph?.nodes;
  if (!nodes || !nodes.length) return '';
  const links = graph.links ?? [];
  let h = 2166136261;
  const texte = (s) => {
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= 31;
    h = Math.imul(h, 16777619);
  };
  for (const node of nodes) {
    texte(String(node.path ?? ''));
    texte(String(node.type ?? ''));
    texte(String(node.degree ?? 0));
  }
  for (const l of links) {
    h ^= l[0] | 0;
    h = Math.imul(h, 16777619);
    h ^= l[1] | 0;
    h = Math.imul(h, 16777619);
  }
  return `${nodes.length}:${links.length}:${(h >>> 0).toString(36)}`;
}

// Mémoire des positions (navigateur) : quand la simulation du fond est posée, ses positions finales sont gardées
// sous la signature du graphe ; au rechargement, si la signature est la même, on dessine directement ces
// positions au lieu de recalculer. Arrondies à 0,1 (invisible à l'écran) : environ 13 Ko pour 950 noeuds.
export function encoderPositions(sim) {
  const sortie = new Array(2 * sim.n);
  for (let i = 0; i < sim.n; i++) {
    sortie[2 * i] = Math.round(sim.x[i] * 10) / 10;
    sortie[2 * i + 1] = Math.round(sim.y[i] * 10) / 10;
  }
  return sortie;
}

// Positions lues en mémoire : valides seulement si ce sont 2 nombres finis par noeud (sinon on recalcule).
export function positionsValides(positions, n) {
  return Array.isArray(positions) && positions.length === 2 * n && positions.every((v) => typeof v === 'number' && Number.isFinite(v));
}

// Pose les positions mémorisées et refroidit la simulation : plus aucun calcul à faire.
export function appliquerPositions(sim, positions) {
  for (let i = 0; i < sim.n; i++) {
    sim.x[i] = positions[2 * i];
    sim.y[i] = positions[2 * i + 1];
  }
  sim.alpha = 0;
}

// Construit la simulation. Si `ancienne` est fournie, les noeuds déjà connus (même chemin) gardent leur
// position : le graphe qui évolue ne repart jamais de zéro. Un noeud nouveau naît près de ses voisins.
export function construireSim(graph, ancienne) {
  const src = graph.nodes;
  const n = src.length;
  const golden = Math.PI * (3 - Math.sqrt(5));

  const connus = new Map();
  if (ancienne) {
    for (let i = 0; i < ancienne.n; i++) connus.set(ancienne.nodes[i].path, i);
  }

  const x = new Float64Array(n);
  const y = new Float64Array(n);
  const place = new Uint8Array(n);
  let reutilises = 0;
  const nodes = src.map((node, i) => {
    const deg = Number.isFinite(node.degree) ? node.degree : 0;
    const path = String(node.path ?? '');
    const j = connus.get(path);
    if (j !== undefined) {
      x[i] = ancienne.x[j];
      y[i] = ancienne.y[j];
      place[i] = 1;
      reutilises++;
    }
    return {
      path,
      name: String(node.name ?? path),
      type: node.type ?? 'Note',
      degree: deg,
      theme: themeDe(path),
      radius: Math.min(9, 1.8 + Math.sqrt(deg) * 0.6),
    };
  });

  // Liens valides, en tableau typé.
  const brut = graph.links ?? [];
  const tmp = [];
  for (const l of brut) {
    const a = l?.[0];
    const b = l?.[1];
    if (Number.isInteger(a) && Number.isInteger(b) && a >= 0 && b >= 0 && a < n && b < n && a !== b) tmp.push(a, b);
  }
  const lk = Int32Array.from(tmp);
  const m = lk.length / 2;

  // Voisinage en format compact (CSR).
  const debut = new Int32Array(n + 1);
  for (let e = 0; e < lk.length; e++) debut[lk[e] + 1]++;
  for (let i = 0; i < n; i++) debut[i + 1] += debut[i];
  const adj = new Int32Array(lk.length);
  const curseur = debut.slice(0, n);
  for (let e = 0; e < m; e++) {
    const a = lk[2 * e];
    const b = lk[2 * e + 1];
    adj[curseur[a]++] = b;
    adj[curseur[b]++] = a;
  }

  // Nouveaux noeuds : barycentre des voisins déjà placés, sinon spirale de phyllotaxie (déterministe).
  for (let i = 0; i < n; i++) {
    if (place[i]) continue;
    let sx = 0;
    let sy = 0;
    let c = 0;
    for (let e = debut[i]; e < debut[i + 1]; e++) {
      const v = adj[e];
      if (place[v]) {
        sx += x[v];
        sy += y[v];
        c++;
      }
    }
    if (c > 0 && ancienne) {
      x[i] = sx / c + (Math.random() - 0.5) * 12;
      y[i] = sy / c + (Math.random() - 0.5) * 12;
    } else {
      const r = 5 * Math.sqrt(i + 1);
      x[i] = r * Math.cos(i * golden);
      y[i] = r * Math.sin(i * golden);
    }
  }

  // Graphe modifié : on réchauffe doucement. Même noeuds : on garde la température de l'ancienne
  // simulation (froide si elle est posée, encore chaude si elle n'a pas fini : jamais de redémarrage).
  const alpha = ancienne ? (reutilises === n && ancienne.n === n ? ancienne.alpha : Math.max(0.3, ancienne.alpha)) : 1;

  return {
    n,
    m,
    nodes,
    x,
    y,
    vx: new Float64Array(n),
    vy: new Float64Array(n),
    lk,
    debut,
    adj,
    alpha,
    epingle: -1,
    // Espace de travail de la grille, réutilisé d'un pas à l'autre.
    _case: new Int32Array(n),
    _ordre: new Int32Array(n),
    _debutCase: new Int32Array(1),
    _curs: new Int32Array(1),
  };
}

// Un pas de la simulation. Coût : O(n) pour la grille + paires voisines + liens.
export function pasForces(sim) {
  const { n, x, y, vx, vy, lk, m } = sim;
  const a = sim.alpha;

  // Emprise et grille.
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < n; i++) {
    if (x[i] < minX) minX = x[i];
    if (x[i] > maxX) maxX = x[i];
    if (y[i] < minY) minY = y[i];
    if (y[i] > maxY) maxY = y[i];
  }
  const etendue = Math.max(maxX - minX, maxY - minY, 1);
  const taille = Math.max(CASE_MIN, etendue / 64);
  const portee = Math.ceil(PORTEE / taille);
  const gw = Math.floor((maxX - minX) / taille) + 1;
  const gh = Math.floor((maxY - minY) / taille) + 1;
  const nbCases = gw * gh;
  if (sim._debutCase.length < nbCases + 1) {
    sim._debutCase = new Int32Array(nbCases + 1);
    sim._curs = new Int32Array(nbCases + 1);
  }
  const debutCase = sim._debutCase;
  debutCase.fill(0, 0, nbCases + 1);
  const caseDe = sim._case;
  const ordre = sim._ordre;
  for (let i = 0; i < n; i++) {
    const c = Math.floor((y[i] - minY) / taille) * gw + Math.floor((x[i] - minX) / taille);
    caseDe[i] = c;
    debutCase[c + 1]++;
  }
  for (let c = 0; c < nbCases; c++) debutCase[c + 1] += debutCase[c];
  const curs = sim._curs;
  for (let c = 0; c < nbCases; c++) curs[c] = debutCase[c];
  for (let i = 0; i < n; i++) ordre[curs[caseDe[i]]++] = i;

  // Répulsion : seulement entre noeuds de cases voisines, chaque paire visitée une seule fois (demi-voisinage :
  // la suite de la ligne de cases, puis les lignes du dessous). Les noeuds sont parcourus dans l'ordre des cases.
  const k = 25 * a;
  for (let p = 0; p < n; p++) {
    const i = ordre[p];
    const xi = x[i];
    const yi = y[i];
    const ci = caseDe[i];
    const cx = ci % gw;
    const cy = (ci - cx) / gw;
    const x0 = cx - portee < 0 ? 0 : cx - portee;
    const x1 = cx + portee >= gw ? gw - 1 : cx + portee;
    const y1 = cy + portee >= gh ? gh - 1 : cy + portee;
    let vxi = vx[i];
    let vyi = vy[i];
    // gy === cy : de p + 1 jusqu'à la fin de la ligne de cases visée ; au-dessous : toute la plage x0..x1.
    for (let gy = cy; gy <= y1; gy++) {
      const ligne = gy * gw;
      const d = gy === cy ? p + 1 : debutCase[ligne + x0];
      const f = debutCase[ligne + x1 + 1];
      for (let s = d; s < f; s++) {
        const j = ordre[s];
        let dx = xi - x[j];
        let dy = yi - y[j];
        let d2 = dx * dx + dy * dy;
        if (d2 > PORTEE2) continue;
        if (d2 < 1) {
          dx = Math.random() - 0.5;
          dy = Math.random() - 0.5;
          d2 = 1;
        }
        const force = k / d2;
        vxi += dx * force;
        vyi += dy * force;
        vx[j] -= dx * force;
        vy[j] -= dy * force;
      }
    }
    vx[i] = vxi;
    vy[i] = vyi;
  }

  // Ressorts sur les liens.
  const kr = 0.04 * a;
  for (let e = 0; e < m; e++) {
    const s = lk[2 * e];
    const t = lk[2 * e + 1];
    const dx = x[t] - x[s];
    const dy = y[t] - y[s];
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const f = ((d - 40) / d) * kr;
    vx[s] += dx * f;
    vy[s] += dy * f;
    vx[t] -= dx * f;
    vy[t] -= dy * f;
  }

  // Rappel au centre, amortissement, intégration.
  const kc = 0.015 * a;
  const epingle = sim.epingle;
  for (let i = 0; i < n; i++) {
    if (i === epingle) {
      vx[i] = 0;
      vy[i] = 0;
      continue;
    }
    let ux = (vx[i] - x[i] * kc) * 0.6;
    let uy = (vy[i] - y[i] * kc) * 0.6;
    ux = ux > 8 ? 8 : ux < -8 ? -8 : ux;
    uy = uy > 8 ? 8 : uy < -8 ? -8 : uy;
    vx[i] = ux;
    vy[i] = uy;
    x[i] += ux;
    y[i] += uy;
  }
  sim.alpha = a * DECROISSANCE;
}

// Reprend le calcul (interaction, graphe modifié) sans jamais refroidir une simulation déjà plus chaude.
export function reveiller(sim, alpha = 0.3) {
  if (sim.alpha < alpha) sim.alpha = alpha;
}

export function refroidie(sim) {
  return sim.alpha <= ALPHA_ARRET;
}
