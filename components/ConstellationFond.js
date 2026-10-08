'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Constellation from '@/components/Constellation';

// Constellation en décor derrière le Cockpit, à poser dans le conteneur
// <div id="cadran-fond" aria-hidden="true" className="fixed inset-0 -z-10" /> :
//   <div id="cadran-fond" ...><ConstellationFond /></div>
//
// Props :
//  - graph (facultatif) : le graphe lu côté serveur (`await loadVaultGraph()`). Sans cette prop, le
//    composant se charge seul via /api/vault-graph : lecture au montage puis toutes les 5 min onglet
//    visible, avec ?since= (réponse de quelques octets si rien n'a changé). C'est le mode conseillé :
//    AutoRefresh relit la page toutes les 60 s, et passer le graphe en prop recopierait ~200 Ko du
//    serveur et de la base à chaque fois. Si `graph` est fourni, la signature du contenu évite de
//    relancer la simulation quand il n'a pas changé.
//  - opacite (0,55 par défaut) : transparence du graphe pour que les cartes restent lisibles.
//  - ouvrirAuClic (vrai par défaut) : un clic sur une zone de fond visible (ni carte, ni texte, ni
//    bouton, ni lien) ouvre /constellation.
const RAFRAICHIR_MS = 5 * 60_000;

const INTERACTIF = 'a,button,input,textarea,select,label,summary,video,canvas,img,svg,[role="button"],[role="link"],[contenteditable="true"],[tabindex]';

// Vrai si le point (x, y) tombe sur le fond lui-même : l'élément le plus haut n'est pas interactif, ne
// porte pas de texte propre, et aucun de ses parents n'a de fond (une carte, un panneau, le rail).
function surLeFond(x, y) {
  const haut = document.elementsFromPoint(x, y)[0];
  if (!haut || haut.closest(INTERACTIF)) return false;
  for (const node of haut.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) return false;
  }
  for (let el = haut; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
    if (el.id === 'cadran-fond') return true;
    const style = getComputedStyle(el);
    if (style.backgroundImage !== 'none') return false;
    const m = style.backgroundColor.match(/[\d.]+/g);
    if (m && (m.length < 4 || Number(m[3]) > 0.02)) return false;
  }
  return true;
}

export default function ConstellationFond({ graph, opacite = 0.55, ouvrirAuClic = true }) {
  const router = useRouter();
  const [distant, setDistant] = useState(null);
  const autonome = graph === undefined;

  useEffect(() => {
    if (!autonome) return undefined;
    let arrete = false;
    let since = null;
    let dernier = 0;
    const charger = async () => {
      if (document.hidden) return;
      dernier = Date.now();
      try {
        const res = await fetch(since ? `/api/vault-graph?since=${encodeURIComponent(since)}` : '/api/vault-graph', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (arrete || data.inchange || !data.nodes) return;
        since = data.updatedAt;
        setDistant(data);
      } catch {
        // Réseau ou serveur indisponible : le fond reste tel quel, aucune erreur affichée.
      }
    };
    const auRetour = () => {
      if (!document.hidden && Date.now() - dernier > 60_000) charger();
    };
    charger();
    const timer = setInterval(charger, RAFRAICHIR_MS);
    document.addEventListener('visibilitychange', auRetour);
    return () => {
      arrete = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', auRetour);
    };
  }, [autonome]);

  const g = autonome ? distant : graph;
  const ouvrable = ouvrirAuClic && Boolean(g?.nodes?.length);
  const routeur = useRef(router);
  useEffect(() => {
    routeur.current = router;
  });

  useEffect(() => {
    if (!ouvrable) return undefined;
    const surClic = (event) => {
      if (event.button !== 0 || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (window.getSelection()?.toString()) return;
      if (surLeFond(event.clientX, event.clientY)) routeur.current.push('/constellation');
    };
    document.addEventListener('click', surClic);
    return () => document.removeEventListener('click', surClic);
  }, [ouvrable]);

  return <Constellation graph={g} mode="fond" opacite={opacite} />;
}
