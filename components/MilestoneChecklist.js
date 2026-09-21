'use client';

import { useState } from 'react';
import { MILESTONE_STATUSES, STATUS_LABELS } from '@/lib/constants';
import { Button, ConfirmDelete, ErrorLine, Field, IconButton, Select, useAction } from './ui';
import { addMilestone, deleteMilestone, moveMilestone, updateMilestone } from '@/app/edit-actions';

function MilestoneRow({ milestone, first, last }) {
  const { pending, error, run } = useAction();
  const [renaming, setRenaming] = useState(false);
  const [label, setLabel] = useState(milestone.label);

  return (
    <li className={`py-2 ${pending ? 'opacity-50' : ''}`}>
      {renaming ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              const result = await updateMilestone({ id: milestone.id, label });
              if (!result.error) setRenaming(false);
              return result;
            });
          }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <Field value={label} onChange={(e) => setLabel(e.target.value)} maxLength={200} required aria-label="Libellé du jalon" className="flex-1" />
          <Button type="submit" disabled={pending}>
            Enregistrer
          </Button>
          <Button
            disabled={pending}
            onClick={() => {
              setLabel(milestone.label);
              setRenaming(false);
            }}
          >
            Annuler
          </Button>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={milestone.status}
            disabled={pending}
            onChange={(e) => run(() => updateMilestone({ id: milestone.id, status: e.target.value }))}
            aria-label={`Statut : ${milestone.label}`}
          >
            {MILESTONE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
          <span className={`min-w-0 flex-1 basis-40 break-words text-sm ${milestone.status === 'done' ? 'text-zinc-400 line-through' : ''}`}>
            {milestone.label}
          </span>
          <IconButton label={`Monter : ${milestone.label}`} disabled={pending || first} onClick={() => run(() => moveMilestone(milestone.id, 'up'))}>
            ↑
          </IconButton>
          <IconButton label={`Descendre : ${milestone.label}`} disabled={pending || last} onClick={() => run(() => moveMilestone(milestone.id, 'down'))}>
            ↓
          </IconButton>
          <IconButton label={`Renommer : ${milestone.label}`} disabled={pending} onClick={() => {
              setLabel(milestone.label);
              setRenaming(true);
            }}>
            ✎
          </IconButton>
          <ConfirmDelete pending={pending} onConfirm={() => run(() => deleteMilestone(milestone.id))} label={`Supprimer : ${milestone.label}`} />
        </div>
      )}
      <ErrorLine error={error} />
    </li>
  );
}

function AddMilestone({ projectId }) {
  const { pending, error, run } = useAction();
  const [label, setLabel] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          const result = await addMilestone({ project_id: projectId, label });
          if (!result.error) setLabel('');
          return result;
        });
      }}
      className="mt-3"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <Field value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Nouveau jalon…" aria-label="Nouveau jalon" maxLength={200} required className="flex-1" />
        <Button type="submit" disabled={pending}>
          {pending ? 'Ajout…' : 'Ajouter'}
        </Button>
      </div>
      <ErrorLine error={error} />
    </form>
  );
}

// Jalons d'un projet : statut, renommage, ordre et suppression, ajout. `milestones`
// (props du serveur) reste la source de vérité : la page se met à jour après chaque écriture.
export default function MilestoneChecklist({ projectId, milestones }) {
  return (
    <div>
      {milestones.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">Aucun jalon.</p>}
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
        {milestones.map((m, i) => (
          <MilestoneRow key={m.id} milestone={m} first={i === 0} last={i === milestones.length - 1} />
        ))}
      </ul>
      <AddMilestone projectId={projectId} />
    </div>
  );
}
