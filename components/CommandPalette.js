'use client';

// Zone Commande en fenêtre façon Spotlight : retirée de l'écran, ouverte par Cmd+K ou Ctrl+K (ou par le
// bouton « Commande » du bandeau « Maintenant », qui envoie OPEN_COMMAND_EVENT). Dialogue centré en verre,
// focus piégé, Échap ferme et rend le focus à l'élément d'où l'on vient. CommandBox est réutilisé tel quel
// à l'intérieur (compact : une ligne, l'aperçu s'ouvre dessous).
import { useCallback, useEffect, useRef, useState } from 'react';
import CommandBox from './CommandBox';

export const OPEN_COMMAND_EVENT = 'cadran:commande';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function CommandPalette({ data }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const from = useRef(null);

  const show = useCallback(() => {
    // Pas par-dessus le rangement forcé : il bloque le reste de la page tant qu'il est ouvert.
    if (document.querySelector('[data-testid="ranger-forced"]')) return;
    from.current = document.activeElement;
    setOpen(true);
  }, []);
  const hide = useCallback(() => {
    setOpen(false);
    const el = from.current;
    from.current = null;
    // Après le démontage de la fenêtre.
    setTimeout(() => el?.isConnected && el.focus?.(), 0);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (open) hide();
        else show();
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_COMMAND_EVENT, show);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_COMMAND_EVENT, show);
    };
  }, [open, show, hide]);

  useEffect(() => {
    if (!open) return undefined;
    box.current?.querySelector('input')?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        hide();
        return;
      }
      if (e.key !== 'Tab' || !box.current) return;
      const nodes = [...box.current.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (!box.current.contains(document.activeElement) || (e.shiftKey && document.activeElement === first)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, hide]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[14vh]">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Fermer la Commande"
        onClick={hide}
        className="anim-fade absolute inset-0 cursor-default bg-[var(--ink)]/25 backdrop-blur-[3px]"
      />
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-label="Commande"
        className="glass-strong anim-pop relative w-full max-w-xl rounded-2xl p-3 shadow-2xl"
      >
        <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
          <h2 className="text-sm font-semibold">Commande</h2>
          <span className="text-xs text-[var(--glass-muted)]">Échap pour fermer</span>
        </div>
        <CommandBox compact data={data} />
      </div>
    </div>
  );
}
