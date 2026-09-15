'use client';

import { useState } from 'react';

export default function CopyCommand({ command }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable — no-op, the command is still visible/selectable
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs dark:border-zinc-800 dark:bg-zinc-900">
      <code className="flex-1 overflow-x-auto whitespace-pre text-zinc-700 dark:text-zinc-300">{command}</code>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        {copied ? 'Copié !' : 'Copier'}
      </button>
    </div>
  );
}
