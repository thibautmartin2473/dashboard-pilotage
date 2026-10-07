'use client';

// Toast « Annuler » : un seul à la fois, 5 s, Annuler en un clic ou Ctrl+Z. Chaque système l'habille
// (voyant de planche, ticket imprimé qui sort d'une fente, cartouche de carte). En vrai : Sonner.
import { useEffect } from 'react';
import { Kbd } from './ui';

export default function Toast({ toast, onUndo, onDismiss }) {
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  return (
    <div className="toast-zone" aria-live="polite">
      {toast ? (
        <div key={toast.id} className="toast" role="status">
          <span className="toast-lamp" aria-hidden="true" />
          <span className="toast-tx">
            <strong>{toast.text}</strong>
            {toast.sub ? <span>{toast.sub}</span> : null}
          </span>
          {toast.undoable ? (
            <button type="button" className="toast-undo" onClick={onUndo}>
              Annuler <Kbd>Ctrl Z</Kbd>
            </button>
          ) : null}
          <span className="toast-time" aria-hidden="true" />
        </div>
      ) : null}
    </div>
  );
}
