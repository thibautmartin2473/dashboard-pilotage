'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { FAMILIES, REFS } from './data';

// Moodboard : chaque référence se note « J'aime » / « Pas pour moi ». État local à l'onglet, rien n'est
// enregistré. Le récapitulatif en bas se copie pour être collé dans la conversation.

function Swatch({ hex }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white py-0.5 pr-2 pl-0.5">
      <span className="h-5 w-5 shrink-0 rounded-full border border-black/15" style={{ background: hex }} />
      <span className="font-mono text-[11px] text-neutral-700">{hex}</span>
    </span>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="font-mono text-[10px] tracking-[0.1em] text-neutral-500 uppercase">{label}</div>
      <div className="mt-0.5 text-[13px] leading-relaxed text-neutral-800">{children}</div>
    </div>
  );
}

function RefCard({ r, vote, onVote }) {
  const btn = (kind, label, activeClass) => (
    <button
      type="button"
      aria-pressed={vote === kind}
      onClick={() => onVote(r.n, vote === kind ? null : kind)}
      className={`min-h-11 flex-1 rounded-lg border px-3 text-sm font-semibold transition-colors ${
        vote === kind ? activeClass : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
      }`}
    >
      {label}
    </button>
  );
  return (
    <article id={`ref-${r.n}`} className="min-w-0 overflow-hidden rounded-2xl border border-neutral-300 bg-white shadow-sm">
      <a href={r.url} target="_blank" rel="noreferrer" className="block border-b border-neutral-200 bg-neutral-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={r.image} alt={`Capture d'écran de ${r.name}`} loading="lazy" className="block h-auto w-full" />
      </a>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold break-words text-neutral-900">
              <span className="mr-2 inline-block rounded-md bg-neutral-900 px-1.5 py-0.5 align-middle font-mono text-xs text-white">{r.n}</span>
              {r.name}
            </h3>
            <a href={r.url} target="_blank" rel="noreferrer" className="font-mono text-xs break-all text-blue-700 underline">
              {r.url.replace(/^https?:\/\//, '')}
            </a>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {r.palette.map((h) => (
            <Swatch key={h} hex={h} />
          ))}
        </div>

        <Field label="Typographie">{r.typo}</Field>
        <Field label="Ce qui est beau">{r.why}</Field>
        <Field label="Transposable à Cadran">{r.transposable}</Field>
        <Field label="Pourquoi on dit que c'est beau">
          {r.proof}{' '}
          <a href={r.proofUrl} target="_blank" rel="noreferrer" className="text-blue-700 underline">
            Source
          </a>
        </Field>

        <div className="flex gap-2 pt-1">
          {btn('like', "J'aime", 'border-emerald-700 bg-emerald-700 text-white')}
          {btn('dislike', 'Pas pour moi', 'border-neutral-900 bg-neutral-900 text-white')}
        </div>
      </div>
    </article>
  );
}

export default function ReferencesPage() {
  const [votes, setVotes] = useState({});
  const [copied, setCopied] = useState(false);

  const onVote = (n, v) =>
    setVotes((prev) => {
      const next = { ...prev };
      if (v) next[n] = v;
      else delete next[n];
      return next;
    });

  const summary = useMemo(() => {
    const pick = (kind) =>
      Object.entries(votes)
        .filter(([, v]) => v === kind)
        .map(([n]) => Number(n))
        .sort((a, b) => a - b);
    const likes = pick('like');
    const dislikes = pick('dislike');
    return `J'aime : ${likes.length ? likes.join(', ') : 'aucune'} ; Pas pour moi : ${dislikes.length ? dislikes.join(', ') : 'aucune'}`;
  }, [votes]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
    } catch {
      const el = document.getElementById('recap-text');
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const rated = Object.keys(votes).length;

  return (
    <div className="min-h-screen bg-[#F4F3EF] text-neutral-900" style={{ fontFamily: 'var(--f-inter), system-ui, sans-serif' }}>
      <div className="border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-[13px] text-amber-950">
        <strong className="font-semibold">Démo : rien n&apos;est enregistré.</strong>{' '}
        <Link href="/demo" className="underline">
          Retour à /demo
        </Link>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="font-mono text-[11px] tracking-[0.1em] text-neutral-500 uppercase">Charte de Cadran : le moodboard</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Ce qui est beau</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-700">
          20 références réelles, plébiscitées, rangées en 7 familles. Ce n&apos;est pas une proposition de charte : dis seulement ce que tu trouves beau
          (J&apos;aime) ou pas (Pas pour moi). Les captures sont de vraies pages publiques ; les palettes sont relevées dessus, à 2 ou 3 teintes près. Clique une
          image pour ouvrir le site.
        </p>
        <nav aria-label="Familles" className="mt-4 flex flex-wrap gap-2">
          {FAMILIES.map((f) => (
            <a key={f.key} href={`#fam-${f.key}`} className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-800 hover:border-neutral-500">
              {f.title}
            </a>
          ))}
        </nav>

        {FAMILIES.map((f, fi) => {
          const refs = REFS.filter((r) => r.family === f.key);
          return (
            <section key={f.key} id={`fam-${f.key}`} className="mt-10 scroll-mt-4">
              <h2 className="text-xl font-bold">
                <span className="mr-2 font-mono text-sm text-neutral-500">{fi + 1}.</span>
                {f.title} <span className="font-normal text-neutral-500">({refs.length})</span>
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-neutral-700">{f.blurb}</p>
              <div className="mt-4 grid gap-5 md:grid-cols-2">
                {refs.map((r) => (
                  <RefCard key={r.n} r={r} vote={votes[r.n]} onVote={onVote} />
                ))}
              </div>
            </section>
          );
        })}

        <section className="mt-12 rounded-2xl border border-neutral-300 bg-white p-4">
          <h2 className="text-lg font-bold">Ton récapitulatif</h2>
          <p className="mt-1 text-sm text-neutral-600">
            {rated} référence{rated > 1 ? 's' : ''} notée{rated > 1 ? 's' : ''} sur {REFS.length}. Copie la ligne ci-dessous et colle-la dans la conversation.
          </p>
          <p id="recap-text" className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 font-mono text-sm break-words text-neutral-900 select-all">
            {summary}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={copy} className="min-h-11 rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white hover:bg-neutral-700">
              {copied ? 'Copié' : 'Copier le récapitulatif'}
            </button>
            <button type="button" onClick={() => setVotes({})} className="min-h-11 rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-800 hover:border-neutral-500">
              Tout effacer
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
