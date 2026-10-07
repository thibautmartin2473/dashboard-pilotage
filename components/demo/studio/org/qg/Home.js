'use client';

// Le QG Recrutement : l'accueil s'organise par CAMPAGNE (une carte par cible), avec en haut la frise
// des 30 jours, puis deux pistes (Examens, Admin et perso). Lecture seule : chaque geste est simulé
// en état local et noté dans le journal « Ce qui serait écrit ».
import { useCallback, useMemo, useState } from 'react';
import { DESTINATIONS, STAGES, buildQg, clean, fmtDay, whenLabel } from './classify';
import Campagne from './Campagne';
import Frise from './Frise';
import NonClasse from './NonClasse';
import { PisteAdmin, PisteExamens } from './Pistes';
import Socle from './Socle';
import { DISPLAY, Empty, Eyebrow, MONO, STAGE_TONE, SectionHead } from './ui';

const cut = (s, n = 80) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export default function OrgQgHome({ data, log }) {
  const [placed, setPlaced] = useState({});
  const [stageOv, setStageOv] = useState({});
  const [fait, setFait] = useState(() => new Set());
  const [openNC, setOpenNC] = useState(false);

  const qg = useMemo(
    () => buildQg({ tasks: data.tasks, done: data.done, events: data.events, today: data.today, overrides: placed, stageOv, fait }),
    [data.tasks, data.done, data.events, data.today, placed, stageOv, fait]
  );

  const onDone = useCallback(
    (item) => {
      log(`tasks : marquer fait "${cut(clean(item.title))}"${item.count > 1 ? ` (${item.count} tâches de la série)` : ''}`);
      setFait((prev) => new Set([...prev, ...(item.keys ?? [item.key])]));
    },
    [log]
  );
  const onStage = useCallback(
    (c, stageId) => {
      const label = STAGES.find((s) => s.id === stageId).label;
      if (stageId === 'clos') log(`tasks : clore la campagne "${c.target.name}" (${c.openTasks} tâches ouvertes marquées faites)`);
      else if (c.stage === 'clos') log(`tasks : rouvrir la campagne "${c.target.name}"`);
      else log(`tasks : étape de "${c.target.name}" passe à "${label}"`);
      setStageOv((prev) => ({ ...prev, [c.target.id]: stageId }));
    },
    [log]
  );
  const onPlace = useCallback(
    (item, destId) => {
      const dest = DESTINATIONS.find((d) => d.id === destId);
      log(`${item.kind === 'task' ? 'tasks' : 'calendar_events'} : classer "${cut(item.text)}" dans "${dest.name}"`);
      setPlaced((prev) => ({ ...prev, [item.key]: destId }));
    },
    [log]
  );

  const active = qg.campaigns.filter((c) => c.stage !== 'clos');
  const relanceCount = qg.campaigns.reduce((n, c) => n + c.relances.length, 0) + qg.socle.relances.length;
  const upcoming = qg.frise.chips.find((c) => ['exam', 'test', 'candidature'].includes(c.kind));
  const examNext = qg.exam.next;
  const byStage = Object.fromEntries(STAGES.map((s) => [s.id, qg.campaigns.filter((c) => c.stage === s.id)]));

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pt-6 pb-32 sm:px-6 lg:pt-8">
      <header className="flex flex-col gap-5 border-t-4 border-[var(--text)] pt-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Eyebrow>Saison de recrutement · conseil et finance · {fmtDay(data.today)}</Eyebrow>
          <h1 className={`${DISPLAY} mt-1 text-[2rem] leading-[1.05] font-semibold text-[var(--text)] sm:text-5xl`}>Le QG Recrutement</h1>
          <p className="mt-2 max-w-prose text-[14px] text-[var(--text-muted)]">
            {upcoming ? (
              <>
                Prochaine date qui compte : <strong className="font-semibold text-[var(--text)]">{upcoming.label}</strong>, le {fmtDay(upcoming.day)}
                {whenLabel(upcoming.days) ? ` (${whenLabel(upcoming.days)})` : ''}.
              </>
            ) : (
              'Aucune échéance de recrutement dans les 30 jours.'
            )}{' '}
            Tout s&apos;ordonne par cible, puis les examens et l&apos;administratif à part.
          </p>
        </div>
        <div className="flex flex-wrap items-stretch gap-2">
          <Stat value={active.length} label="Campagnes actives" />
          <Stat value={relanceCount} label="Relances à faire" />
          <Stat value={examNext ? (examNext.days > 0 ? `J-${examNext.days}` : 'Auj.') : '-'} label="Prochain examen" tone={examNext && examNext.days <= 3 ? 'var(--danger)' : undefined} />
          <button
            type="button"
            aria-expanded={openNC}
            aria-controls="non-classe"
            onClick={() => setOpenNC((v) => !v)}
            className="inline-flex min-h-[3.75rem] cursor-pointer items-center gap-2 self-stretch rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--surface)] px-3.5 text-[13px] text-[var(--text)] transition-colors hover:bg-[var(--surface-2)]"
            style={qg.unclassified.length > 0 ? { borderStyle: 'dashed' } : undefined}
          >
            Non classé : {qg.unclassified.length}
            <svg viewBox="0 0 12 12" className={`size-3 transition-transform ${openNC ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <path d="M2.5 4.5 6 8l3.5-3.5" />
            </svg>
          </button>
        </div>
      </header>

      {openNC ? (
        <div className="mt-4">
          <NonClasse items={qg.unclassified} onPlace={onPlace} onClose={() => setOpenNC(false)} />
        </div>
      ) : null}

      <div className="mt-8">
        <SectionHead index="01" title="Les 30 prochains jours" aside="Un clic sur un jour isole ses dates" />
        <Frise frise={qg.frise} today={data.today} />
      </div>

      <div className="mt-10">
        <SectionHead index="02" title="Campagnes" aside={`${active.length} cibles en cours, rangées par étape`} />
        <div className="flex flex-col gap-7">
          {STAGES.map((s, i) => {
            const list = byStage[s.id];
            return (
              <div key={s.id} className="grid gap-3 lg:grid-cols-[10.5rem_minmax(0,1fr)]">
                <div className="min-w-0 border-l-4 pl-3" style={{ borderColor: STAGE_TONE[s.id] }}>
                  <p className={`${MONO} text-[11px] text-[var(--text-faint)]`}>
                    {String(i + 1).padStart(2, '0')} · {list.length} cible{list.length > 1 ? 's' : ''}
                  </p>
                  <h3 className={`${DISPLAY} text-lg leading-tight text-[var(--text)]`}>{s.label}</h3>
                  <p className="mt-0.5 text-[12px] leading-snug text-[var(--text-muted)]">{s.hint}</p>
                </div>
                {list.length > 0 ? (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,19.5rem),1fr))] items-stretch gap-3">
                    {list.map((c) => (
                      <Campagne key={c.target.id} c={c} onStage={onStage} onDone={onDone} />
                    ))}
                  </div>
                ) : (
                  <Empty>
                    {s.id === 'clos' ? 'Rien de clos : « Clore la cible » sur une carte la range ici.' : 'Aucune cible à cette étape pour le moment.'}
                  </Empty>
                )}
              </div>
            );
          })}
          <Socle socle={qg.socle} onDone={onDone} />
        </div>
      </div>

      <div className="mt-10">
        <SectionHead index="03" title="Pistes à part" aside="Hors campagnes : leur rythme est différent" />
        <div className="grid items-start gap-3 lg:grid-cols-2">
          <PisteExamens exam={qg.exam} cours={qg.cours} />
          <PisteAdmin admin={qg.admin} onDone={onDone} />
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label, tone }) {
  return (
    <div className="min-w-[6.5rem] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 [box-shadow:var(--shadow)]">
      <p className={`${MONO} text-2xl leading-none font-semibold`} style={{ color: tone ?? 'var(--text)' }}>
        {value}
      </p>
      <p className="mt-1 text-[11px] text-[var(--text-muted)]">{label}</p>
    </div>
  );
}
