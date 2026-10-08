// Cadre de carte partagé (sans 'use client' : les pages serveur peuvent l'importer). Panel (components/ui.js) et
// les pages /brain et /projects/[slug] s'en servent : tout texte posé sur le fond de page nu (#8E9CB4) passe sous
// 4,5:1, il va donc dans une carte (blanc à 75 %, texte --ink-muted à 4,9:1 dessus).
export const CARD = 'rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--ink)]';
export const cardClass = `${CARD} p-4`;
