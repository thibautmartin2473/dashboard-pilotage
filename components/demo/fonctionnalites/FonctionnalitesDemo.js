'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CHARTES } from '@/components/demo/studio/chartes-meta';
import Catalogue from './Catalogue';
import PanelApercu from './PanelApercu';
import PanelBudget from './PanelBudget';
import PanelFinDeVie from './PanelFinDeVie';
import PanelJournee from './PanelJournee';
import { Btn, Kbd, Label, cx } from './ui';

const TABS = [
  { id: 1, short: 'Fin de vie', long: 'Fin de vie par défaut' },
  { id: 2, short: 'Budget de temps', long: 'Tâche = budget de temps' },
  { id: 3, short: 'Plafond du jour', long: 'Journée plafonnée' },
  { id: 4, short: 'Aperçu', long: 'Claude propose, tu valides' },
];

// Pourquoi ces quatre : ce qui a décidé, et ce qui est resté dehors.
const WHY = [
  [
    'Elles forment une chaîne.',
    'La durée (2) alimente la charge (3), la charge cadre ce que Claude propose (4), et la fin de vie (1) vide le stock qui les nourrit. Prises une à une, elles ne règlent rien ; ensemble elles ferment la boucle du diagnostic.',
  ],
  [
    'Aucune n\'est déjà démontrée.',
    'Le triage, le bilan, la journée et les échéances ont leurs pages (/demo/tri, /demo/bilan, /demo/aujourdhui, /demo/echeances). Ces quatre-là n\'existaient que sur le papier.',
  ],
  [
    'On ne les juge pas sur papier.',
    'Le bon seuil de réserve, la lecture des cellules de 15 minutes, la jauge et les blocs en pointillé se décident en les manipulant, sur tes vraies tâches.',
  ],
];
const LEFT_OUT = [
  ['5, date de début', '4 h et évidente (la colonne snoozed_until existe) : une maquette n\'apprendrait rien.'],
  ['6 et 9, rituels et échéances', 'déjà maquettées dans /demo/bilan et /demo/echeances.'],
  ['7, traçabilité', 'incluse dans le panneau 4 (pourquoi, source, journal).'],
  ['8, glisser et poignée', 'une fausse version sans bibliothèque mentirait sur le tactile, qui est précisément son risque : à tester sur ton téléphone, sur branche.'],
];

const DASH = new RegExp(String.raw`\s*[${String.fromCharCode(8212, 8211)}]\s*`, 'g');
const dash = (v) => (typeof v === 'string' ? v.replace(DASH, ' - ') : v);
const cleanRows = (rows, fields) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, fields.includes(k) ? dash(v) : v])));

export default function FonctionnalitesDemo({ data: raw }) {
  const data = useMemo(
    () => ({
      ...raw,
      tasks: cleanRows(raw.tasks, ['title']),
      ideas: cleanRows(raw.ideas, ['content']),
      events: cleanRows(raw.events, ['title']),
    }),
    [raw]
  );
  const [charte, setCharte] = useState('graphite');
  const [mode, setMode] = useState('dark');
  const [tab, setTab] = useState(1);
  const [shared, setShared] = useState({ est: {}, logged: {}, locked: {}, asleep: {}, done: {} });
  const [journal, setJournal] = useState([]);
  const [openJournal, setOpenJournal] = useState(false);

  const log = useCallback((line) => setJournal((j) => [{ at: j.length, line }, ...j].slice(0, 60)), []);
  const upd = useCallback((key, id, value) => {
    setShared((s) => {
      const next = { ...s[key] };
      if (value === undefined || value === false) delete next[id];
      else next[id] = value;
      return { ...s, [key]: next };
    });
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= 4) setTab(n);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="studio min-h-screen bg-[var(--bg)] text-[var(--text)]" data-charte={charte} data-mode={mode}>
      <div className="[font-family:var(--font-body)]">
        <div className="border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 sm:px-6">
            <p className="text-[12.5px] text-[var(--warning)]">
              <strong className="font-semibold">Démo : rien n&apos;est enregistré.</strong>{' '}
              <Link href="/demo" className="text-[var(--text-muted)] underline underline-offset-2 hover:text-[var(--text)]">
                Toutes les démos
              </Link>
            </p>
            <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Charte graphique">
                <Label>Charte</Label>
                {CHARTES.map((c) => (
                  <Btn key={c.id} pressed={charte === c.id} title={c.description} onClick={() => setCharte(c.id)}>
                    {c.name}
                  </Btn>
                ))}
              </div>
              <div className="flex items-center gap-1.5" role="group" aria-label="Mode">
                <Label>Mode</Label>
                <Btn pressed={mode === 'light'} onClick={() => setMode('light')}>
                  Clair
                </Btn>
                <Btn pressed={mode === 'dark'} onClick={() => setMode('dark')}>
                  Sombre
                </Btn>
              </div>
            </div>
          </div>
        </div>

        <main className="mx-auto max-w-6xl px-4 pt-8 pb-24 sm:px-6 sm:pt-12">
          <header className="max-w-3xl">
            <Label>Axe fonctionnalités</Label>
            <h1 className="mt-3 text-[1.75rem] leading-[1.1] font-semibold tracking-[-0.02em] [font-family:var(--font-display)] sm:text-[2.5rem]">
              Les fonctionnalités à venir
            </h1>
            <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--text-muted)]">
              Treize idées en trois paniers (liste plus bas), et les quatre meilleures à essayer ici sur tes vraies tâches et ton vrai agenda.
              Tout reste dans l&apos;onglet : chaque geste ajoute seulement une ligne à « Ce qui serait écrit ».
            </p>
          </header>

          <section aria-labelledby="pourquoi" className="mt-8 grid gap-6 border-y border-[var(--border)] py-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div>
              <h2 id="pourquoi" className="text-[15px] font-semibold">
                Pourquoi ces quatre
              </h2>
              <ol className="mt-3 space-y-3">
                {WHY.map(([t, d], i) => (
                  <li key={t} className="flex gap-3 text-[13px] leading-relaxed">
                    <span className="mt-0.5 font-mono text-[12px] text-[var(--accent)] tabular-nums">{i + 1}</span>
                    <span className="min-w-0">
                      <strong className="font-medium text-[var(--text)]">{t}</strong> <span className="text-[var(--text-muted)]">{d}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h2 className="text-[15px] font-semibold">Restées dehors, et pourquoi</h2>
              <ul className="mt-3 space-y-2.5">
                {LEFT_OUT.map(([k, v]) => (
                  <li key={k} className="text-[12.5px] leading-relaxed text-[var(--text-muted)]">
                    <strong className="font-medium text-[var(--text)]">{k}</strong> : {v}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4" role="tablist" aria-label="Fonctionnalités maquettées">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={cx(
                  'flex min-h-14 items-center gap-3 rounded-[var(--radius-sm)] border px-3 py-2 text-left transition-colors duration-100 motion-reduce:transition-none',
                  tab === t.id ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]'
                )}
              >
                <Kbd>{t.id}</Kbd>
                <span className="min-w-0 text-[13px] leading-tight font-medium">
                  <span className="sm:hidden">{t.short}</span>
                  <span className="hidden sm:inline">{t.long}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4" role="tabpanel">
            {tab === 1 && <PanelFinDeVie data={data} log={log} />}
            {tab === 2 && <PanelBudget data={data} shared={shared} upd={upd} log={log} />}
            {tab === 3 && <PanelJournee data={data} shared={shared} log={log} />}
            {tab === 4 && <PanelApercu data={data} shared={shared} log={log} />}
          </div>

          <section className="mt-6 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)]">
            <button
              type="button"
              aria-expanded={openJournal}
              onClick={() => setOpenJournal((o) => !o)}
              className="flex min-h-12 w-full items-center gap-3 px-4 text-left sm:px-5"
            >
              <span className="text-[13.5px] font-medium">Ce qui serait écrit</span>
              <span className="font-mono text-[12px] text-[var(--text-muted)] tabular-nums">{journal.length}</span>
              <span className="ml-auto font-mono text-[11px] text-[var(--text-muted)]" aria-hidden>
                {openJournal ? '−' : '+'}
              </span>
            </button>
            {openJournal && (
              <ol className="max-h-64 space-y-1 overflow-auto border-t border-[var(--border)] px-4 py-3 font-mono text-[11.5px] leading-relaxed text-[var(--text-muted)] sm:px-5">
                {journal.length === 0 && <li>Rien pour l&apos;instant : manipule un panneau.</li>}
                {journal.map((j) => (
                  <li key={j.at} className="break-words">
                    {j.line}
                  </li>
                ))}
              </ol>
            )}
          </section>
          {data.errors.length > 0 && <p className="mt-3 text-[12px] text-[var(--danger)]">Lecture partielle : {data.errors.join(' ; ')}</p>}

          <Catalogue />

          <p className="mt-10 max-w-3xl text-[12px] leading-relaxed text-[var(--text-faint)]">
            Limites de la maquette : les durées sont devinées du titre (la table n&apos;a pas de colonne durée) ; l&apos;âge d&apos;une tâche est
            celui de sa création faute de date de dernière modification ; la capacité suppose 9h-12h et 14h-19h tous les jours. Le détail, les
            sources et les heures sont dans docs/refonte-taches/FONCTIONNALITES.md.
          </p>
        </main>
      </div>
    </div>
  );
}
