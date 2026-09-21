'use client';

import { useState } from 'react';
import Panel from './Panel';
import { Button, ErrorLine, Field, IconButton, mutedClass, useAction } from './ui';
import { applyCommand } from '@/app/command-actions';
import { interpret } from '@/lib/command';

// Zone Commande : une phrase en français -> aperçu des actions (interprétation locale, sans réseau ni
// modèle : lib/command.js) -> « Confirmer » applique tout. Rien n'est écrit avant la confirmation.
export default function CommandBox() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [done, setDone] = useState(null);
  const { pending, error, run } = useAction();

  const preview = (e) => {
    e.preventDefault();
    setDone(null);
    setResult(interpret(text, new Date()));
  };
  const confirm = () =>
    run(async () => {
      const { actions } = result;
      const r = await applyCommand(actions.map(({ label, ...action }) => action));
      if (!r.error) {
        setDone(`${actions.length} élément(s) ajouté(s).`);
        setResult(null);
        setText('');
      }
      return r;
    });

  return (
    <Panel title="Commande">
      <form onSubmit={preview} className="flex flex-col gap-2 sm:flex-row">
        <Field
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setResult(null);
          }}
          placeholder="Écris ce que tu veux ajouter…"
          aria-label="Commande"
          maxLength={500}
          className="flex-1"
        />
        <Button type="submit" disabled={pending || !text.trim()}>
          Interpréter
        </Button>
      </form>

      {done && (
        <p role="status" className="mt-2 text-sm text-green-700 dark:text-green-400" data-testid="command-done">
          {done}
        </p>
      )}

      {result && !result.ok && (
        <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300" data-testid="command-unclear">
          <p className="break-words">{result.message}</p>
          <p className="mt-1">Par exemple :</p>
          <ul className="list-disc pl-5">
            {result.examples.map((example) => (
              <li key={example} className="break-words">
                {example}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result?.ok && (
        <div className="mt-2" data-testid="command-preview">
          {result.actions.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Plus rien à ajouter.</p>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {result.actions.map((a, i) => (
                <li key={`${a.label}-${i}`} className="flex items-start justify-between gap-2 py-2 text-sm">
                  <span className="min-w-0 break-words">{a.label}</span>
                  <IconButton
                    label={`Retirer : ${a.label}`}
                    disabled={pending}
                    onClick={() => setResult({ ...result, actions: result.actions.filter((_, k) => k !== i) })}
                  >
                    ✕
                  </IconButton>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <Button disabled={pending || result.actions.length === 0} onClick={confirm}>
              {pending ? 'Ajout…' : 'Confirmer'}
            </Button>
            <Button disabled={pending} onClick={() => setResult(null)}>
              Annuler
            </Button>
          </div>
          <p className={`mt-2 ${mutedClass}`}>
            Les événements créés ainsi sont locaux : visibles sur le tableau de bord, pas dans Google Agenda.
          </p>
        </div>
      )}
      <ErrorLine error={error} />
    </Panel>
  );
}
