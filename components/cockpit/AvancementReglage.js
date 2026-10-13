'use client';

import { useState, useTransition } from 'react';
import { setAvancementMasques } from '@/app/edit-actions';
import { Button } from '@/components/ui';

// Réglage d'affichage de l'onglet Avancement : montrer ou cacher le groupe « Autre » (Spircle, EDHEC AI) et la
// ligne Master Project, masqués par défaut. Écrit dashboard_settings (Server Action) ; la page se relit toute seule.
export default function AvancementReglage({ showHidden, hidden }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState('');
  const toggle = () =>
    start(async () => {
      setError('');
      const res = await setAvancementMasques(!showHidden);
      if (res?.error) setError(res.error);
    });
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 pt-2">
      <Button level="secondary" onClick={toggle} disabled={pending} data-testid="avancement-reglage">
        {showHidden ? 'Masquer Autre et Master Project' : `Afficher Autre et Master Project (${hidden})`}
      </Button>
      <span className="text-xs text-[var(--ink-muted)]">Spircle, EDHEC AI et le Master Project sont masqués par défaut.</span>
      {error && <span className="text-xs font-semibold text-[var(--late-text)]" role="alert">{error}</span>}
    </div>
  );
}
