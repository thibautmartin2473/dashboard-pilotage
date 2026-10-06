'use client';

import { useCallback, useEffect, useState } from 'react';
import { CHARTES, NAVS, ORGS, SECTIONS } from './registry';
import { SECTION_VIEWS } from './sections';

const pick = (list, id) => list.find((x) => x.id === id) ?? list[0];

// Le Studio : un conteneur plein écran qui pose la charte (data-charte, data-mode),
// monte la navigation choisie, et lui donne à afficher l'accueil de l'organisation
// choisie ou une section commune. Tout reste en état local : le journal
// « Ce qui serait écrit » montre l'effet réel qu'aurait chaque geste.
export default function Studio({ data, initial }) {
  const [charte, setCharte] = useState(pick(CHARTES, initial.charte).id);
  const [mode, setMode] = useState(initial.mode === 'dark' ? 'dark' : 'light');
  const [navId, setNavId] = useState(pick(NAVS, initial.nav).id);
  const [orgId, setOrgId] = useState(pick(ORGS, initial.org).id);
  const [section, setSection] = useState('accueil');
  const [journal, setJournal] = useState([]);
  const [openJournal, setOpenJournal] = useState(false);
  const [openComposer, setOpenComposer] = useState(true);

  // Sur téléphone, le Composer démarre replié pour ne pas couvrir le contenu.
  useEffect(() => {
    if (window.matchMedia('(max-width: 639px)').matches) setOpenComposer(false); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  const log = useCallback((line) => setJournal((j) => [{ at: new Date().toISOString(), line }, ...j].slice(0, 50)), []);

  const syncUrl = (next) => {
    const params = new URLSearchParams({ charte, mode, nav: navId, org: orgId, ...next });
    window.history.replaceState(null, '', `?${params}`);
  };
  const choose = (setter, key) => (value) => {
    setter(value);
    syncUrl({ [key]: value });
  };

  const Nav = pick(NAVS, navId).Component;
  const org = pick(ORGS, orgId);
  const OrgHome = org.Component;
  // Rend n'importe quelle section : la navigation « Fil » s'en sert pour tout empiler.
  const renderSection = (id) => {
    const View = id === 'accueil' ? OrgHome : (org.sections?.[id] ?? SECTION_VIEWS[id]);
    return View ? <View data={data} log={log} onNavigate={setSection} /> : null;
  };

  return (
    <div
      data-charte={charte}
      data-mode={mode}
      className="studio fixed inset-0 z-50 overflow-auto bg-[var(--bg)] text-[var(--text)] [font-family:var(--font-body)]"
    >
      <Nav sections={SECTIONS} current={section} onNavigate={setSection} orgName={org.name} renderSection={renderSection}>
        {renderSection(section)}
      </Nav>

      {/* Composer : le « rayon » où Thibaut fait ses courses. Volontairement neutre. */}
      <div className="studio-composer fixed right-3 bottom-3 z-[60] max-w-[calc(100vw-1.5rem)] text-[12px]">
        {openComposer ? (
          <div className="w-[19rem] max-w-full rounded-xl border border-black/15 bg-white/95 p-3 text-zinc-900 shadow-xl backdrop-blur">
            <div className="flex items-center justify-between">
              <strong className="text-[11px] tracking-wide uppercase">Composer</strong>
              <button type="button" className="underline" onClick={() => setOpenComposer(false)}>
                Réduire
              </button>
            </div>
            <Choice label="Charte graphique" items={CHARTES} value={charte} onChange={choose(setCharte, 'charte')} />
            <Choice
              label="Mode"
              items={[{ id: 'light', name: 'Clair' }, { id: 'dark', name: 'Sombre' }]}
              value={mode}
              onChange={choose(setMode, 'mode')}
            />
            <Choice label="Navigation" items={NAVS} value={navId} onChange={choose(setNavId, 'nav')} />
            <Choice label="Organisation" items={ORGS} value={orgId} onChange={choose(setOrgId, 'org')} />
            <div className="mt-2 flex items-center justify-between border-t border-black/10 pt-2">
              <button type="button" className="underline" onClick={() => setOpenJournal((o) => !o)}>
                Ce qui serait écrit ({journal.length})
              </button>
              <a href="/demo" className="underline">
                Toutes les démos
              </a>
            </div>
            {openJournal && (
              <ol className="mt-2 max-h-40 overflow-auto font-mono text-[11px] text-zinc-600">
                {journal.length === 0 && <li>Rien pour l&apos;instant.</li>}
                {journal.map((j, i) => (
                  <li key={`${j.at}-${i}`}>{j.line}</li>
                ))}
              </ol>
            )}
            {data.errors.length > 0 && <p className="mt-2 text-[11px] text-red-700">{data.errors.join(' ; ')}</p>}
            <p className="mt-2 text-[11px] text-zinc-500">Démo : rien n&apos;est enregistré.</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpenComposer(true)}
            className="rounded-full border border-black/15 bg-white/95 px-3 py-1.5 text-zinc-900 shadow-lg"
          >
            Composer
          </button>
        )}
      </div>
    </div>
  );
}

function Choice({ label, items, value, onChange }) {
  const current = items.find((x) => x.id === value);
  return (
    <div className="mt-2">
      <div className="text-[10px] tracking-wide text-zinc-500 uppercase">{label}</div>
      <div className="mt-1 flex flex-wrap gap-1">
        {items.map((it, i) => (
          <button
            key={it.id}
            type="button"
            aria-pressed={it.id === value}
            title={it.description}
            onClick={() => onChange(it.id)}
            className={`rounded-md border px-2 py-0.5 ${it.id === value ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-black/15 hover:border-black/40'}`}
          >
            {i + 1}. {it.name}
          </button>
        ))}
      </div>
      {current?.description && <div className="mt-1 text-[11px] leading-snug text-zinc-500">{current.description}</div>}
    </div>
  );
}
