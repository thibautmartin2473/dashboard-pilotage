'use client';

import { useState } from 'react';
import { Button, Field, Panel } from '@/components/ui';
import { parseReply } from './ReviewLogic';

const letter = (i) => String.fromCharCode(97 + i);

// Texte brut de la carte (ce que la routine de midi écrirait telle quelle dans la session).
function plainCard(data) {
  const lines = [`Bilan de ${data.reviewDayLabel ?? 'la veille'}${data.usedFallback ? ' (dernier jour avec des blocs orange)' : ''}`, ''];
  data.blocks.forEach((b, i) => {
    lines.push(`${i + 1}. ${b.title} (${b.time})`);
    b.tasks.forEach((t, j) => lines.push(`   ${i + 1}${letter(j)} ${t.title}${t.done ? ' [déjà fait]' : ''}`));
  });
  lines.push('', 'Réponds en une ligne : « 1 fait, 2 pas fait, 3 en partie 3a ».', 'Ou « tout fait ». Sans réponse sous 2 jours, tout passe dans Plus tard.');
  return lines.join('\n');
}

export default function ReviewChat({ data, marks, mark, unmark, allHandled }) {
  const [text, setText] = useState('');
  const [notes, setNotes] = useState([]);
  const { blocks } = data;

  const send = () => {
    const { actions, unknown } = parseReply(text, blocks.length);
    const out = [];
    if (unknown) out.push('réponse non comprise, écris par exemple "1 fait, 2 pas fait".');
    for (const a of actions) {
      const b = blocks[a.n - 1];
      const ids = a.mode === 'partial' ? b.tasks.filter((t, j) => a.letters.includes(letter(j))).map((t) => t.id) : [];
      mark(b, a.mode, ids);
      out.push(`bloc ${a.n} "${b.title}" : ${a.mode === 'done' ? 'fait' : a.mode === 'skipped' ? 'pas fait' : `en partie (${ids.length} faite${ids.length > 1 ? 's' : ''})`}`);
    }
    setNotes(out);
    if (actions.length) setText('');
  };

  return (
    <div className="grid gap-4">
      <Panel title="Rendu 1 : dans l'application Claude (session)" count={blocks.length}>
        <div className="grid gap-3 text-sm">
          <div className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-zinc-200">
            <div className="font-mono text-[10px] tracking-[0.1em] text-zinc-500 uppercase">Routine de midi</div>
            <p className="mt-1 font-semibold">Bilan de {data.reviewDayLabel ?? 'la veille'}</p>
            {data.usedFallback && <p className="text-xs text-amber-300">Hier était vide : c&apos;est le dernier jour avec des blocs orange.</p>}
            <ol className="mt-2 grid gap-2">
              {blocks.map((b, i) => (
                <li key={b.id} className="min-w-0 break-words">
                  <span className="font-semibold">{i + 1}. {b.title}</span> <span className="font-mono text-[11px] text-zinc-400">{b.time}</span>
                  {marks[b.id] && <span className="ml-2 text-emerald-300">(traité)</span>}
                  <ul className="ml-4 list-disc text-zinc-300">
                    {b.tasks.map((t, j) => <li key={t.id}><span className="font-mono text-xs text-zinc-400">{i + 1}{letter(j)}</span> {t.title}{t.done ? ' (déjà fait)' : ''}</li>)}
                  </ul>
                </li>
              ))}
            </ol>
            <p className="mt-2 text-xs text-zinc-400">Réponses courtes possibles : « 1 fait, 2 pas fait, 3 en partie 3a » ou « tout fait ».</p>
          </div>

          <div className="min-w-0 rounded-xl border border-zinc-700 bg-zinc-800/40 p-3">
            <div className="font-mono text-[10px] tracking-[0.1em] text-zinc-500 uppercase">Ta réponse</div>
            {allHandled ? (
              <p className="mt-1 text-emerald-300">Tout est traité. Claude répond : « Noté, plus rien à te rappeler pour ce bilan. »</p>
            ) : (
              <form className="mt-2 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
                <Field value={text} onChange={(e) => setText(e.target.value)} placeholder="1 fait, 2 pas fait" aria-label="Réponse courte au bilan" className="min-w-0 flex-1 basis-48" />
                <Button type="submit">Envoyer la réponse</Button>
                <Button onClick={() => setText('tout fait')}>Écrire : tout fait</Button>
              </form>
            )}
            {notes.length > 0 && (
              <ul className="mt-2 grid gap-1 text-xs text-zinc-300">
                {notes.map((n) => <li key={n}>Claude a compris : {n}</li>)}
              </ul>
            )}
            {Object.keys(marks).length > 0 && (
              <Button className="mt-3" onClick={() => Object.keys(marks).forEach(unmark)}>Annuler toutes les réponses</Button>
            )}
          </div>
        </div>
      </Panel>

      <Panel title="Rendu 2 : texte brut (terminal ou mail)">
        <pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-300">{plainCard(data)}</pre>
        <p className="mt-2 text-xs text-zinc-400">Même contenu, sans mise en forme : c&apos;est ce que verrait une session en terminal. Les réponses courtes sont identiques.</p>
      </Panel>
    </div>
  );
}
