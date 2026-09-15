'use client';

import { useState } from 'react';
import { MILESTONE_STATUSES, STATUS_LABELS } from '@/lib/constants';
import StatusBadge from './StatusBadge';

const STATUS_DOT = {
  todo: 'border-zinc-400',
  in_progress: 'border-amber-500 bg-amber-500',
  blocked: 'border-red-500 bg-red-500',
  done: 'border-emerald-500 bg-emerald-500',
};

function nextStatus(status) {
  const idx = MILESTONE_STATUSES.indexOf(status);
  return MILESTONE_STATUSES[(idx + 1) % MILESTONE_STATUSES.length];
}

export default function MilestoneChecklist({ milestones, compact = false, editable = false }) {
  // Overrides optimistes le temps que l'API réponde — le prop `milestones`
  // (rafraîchi par le parent en temps réel) reste la source de vérité.
  const [overrides, setOverrides] = useState({});
  const [pendingId, setPendingId] = useState(null);

  async function cycleStatus(milestone) {
    if (!editable || pendingId) return;
    const current = overrides[milestone.id] ?? milestone.status;
    const newStatus = nextStatus(current);
    setPendingId(milestone.id);
    setOverrides((prev) => ({ ...prev, [milestone.id]: newStatus }));

    try {
      const res = await fetch(`/api/milestones/${milestone.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('update failed');
    } catch {
      setOverrides((prev) => ({ ...prev, [milestone.id]: current }));
    } finally {
      setPendingId(null);
    }
  }

  const resolved = milestones.map((m) => ({ ...m, status: overrides[m.id] ?? m.status }));
  const list = compact ? resolved.slice(0, 5) : resolved;

  return (
    <ul className={compact ? 'space-y-1.5' : 'space-y-2'}>
      {list.map((m) => (
        <li key={m.id} className="flex items-center gap-2 text-sm">
          <button
            type="button"
            disabled={!editable || pendingId === m.id}
            onClick={() => cycleStatus(m)}
            title={editable ? `Statut : ${STATUS_LABELS[m.status]} — cliquer pour changer` : STATUS_LABELS[m.status]}
            className={`h-3.5 w-3.5 shrink-0 rounded-full border-2 ${STATUS_DOT[m.status] ?? STATUS_DOT.todo} ${
              editable ? 'cursor-pointer' : 'cursor-default'
            } ${pendingId === m.id ? 'opacity-50' : ''}`}
          />
          <span className={`flex-1 truncate ${m.status === 'done' ? 'text-zinc-400 line-through' : ''}`}>
            {m.label}
          </span>
          {!compact && <StatusBadge status={m.status} />}
        </li>
      ))}
      {compact && resolved.length > 5 && (
        <li className="text-xs text-zinc-400">+ {resolved.length - 5} autres</li>
      )}
    </ul>
  );
}
