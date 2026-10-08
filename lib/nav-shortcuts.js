// Raccourcis clavier de navigation « g puis une lettre » (logique pure, testée par scripts/check-nav.mjs ;
// le composant client est components/NavShortcuts.js). Seule la séquence qui commence par `g` navigue : les
// lettres seules restent aux gestes de la liste « À ranger » (V A C S P) et du rangement forcé.

// Touche suivant `g` -> page. Même ordre que le rail.
export const NAV_KEYS = {
  c: { href: '/', label: 'Cockpit' },
  r: { href: '/a-ranger', label: 'À ranger' },
  a: { href: '/agenda', label: 'Agenda' },
  m: { href: '/mails', label: 'Mails' },
  i: { href: '/brain', label: 'Idées' },
  v: { href: '/constellation', label: 'Constellation' },
};

// Délai pour taper la deuxième touche après `g` (ms).
export const SEQUENCE_MS = 1000;

// Touches qui ne comptent pas comme « la touche suivante » (un modificateur seul ne casse pas la séquence).
const MODIFICATEURS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'AltGraph', 'CapsLock']);

// Types d'<input> où l'on ne tape pas de texte : les raccourcis restent actifs si le focus y est.
const INPUT_SANS_TEXTE = new Set(['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file', 'image']);

// Vrai si la cible du clavier est un endroit où l'on saisit du texte (input texte, textarea, select,
// contenteditable). Prend un objet ressemblant à un élément : { tagName, type, isContentEditable }.
export function estSaisie(el) {
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = String(el.tagName ?? '').toUpperCase();
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') return !INPUT_SANS_TEXTE.has(String(el.type ?? 'text').toLowerCase());
  return false;
}

// Libellé du `title` d'une entrée du rail : « Agenda (G puis A) » ; le libellé seul si pas de raccourci.
export function shortcutLabel(href, label) {
  const lettre = Object.keys(NAV_KEYS).find((k) => NAV_KEYS[k].href === href);
  return lettre ? `${label} (G puis ${lettre.toUpperCase()})` : label;
}

export const ETAT_INITIAL = Object.freeze({ armeA: null });

// Machine à états d'un événement clavier. `etat` = { armeA: instant du `g` ou null }, `ev` = { key, ctrl,
// meta, alt, repeat, saisie, dialogue }, `maintenant` en ms. Renvoie { etat, href, consommer } :
//  - href : page à ouvrir (ou null) ; consommer : le composant doit faire preventDefault et stopPropagation
//    pour que la lettre n'aille pas aussi à un geste de la page.
export function suite(etat, ev, maintenant) {
  const repos = ETAT_INITIAL;
  // Pendant une saisie ou un dialogue, ou avec Ctrl/Meta/Alt : rien ne navigue et la séquence est annulée.
  if (ev.saisie || ev.dialogue || ev.ctrl || ev.meta || ev.alt) return { etat: repos, href: null, consommer: false };
  if (ev.repeat) return { etat, href: null, consommer: false }; // touche maintenue : on ignore
  if (MODIFICATEURS.has(ev.key)) return { etat, href: null, consommer: false };
  const touche = String(ev.key ?? '').toLowerCase();
  const arme = etat.armeA !== null && maintenant - etat.armeA <= SEQUENCE_MS;
  if (arme) {
    const cible = NAV_KEYS[touche];
    if (cible) return { etat: repos, href: cible.href, consommer: true };
    if (touche === 'g') return { etat: { armeA: maintenant }, href: null, consommer: true }; // `g g` : on repart
    return { etat: repos, href: null, consommer: false }; // autre touche : séquence annulée, la touche garde son effet
  }
  if (touche === 'g') return { etat: { armeA: maintenant }, href: null, consommer: false };
  return { etat: repos, href: null, consommer: false };
}
