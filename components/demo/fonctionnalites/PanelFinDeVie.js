'use client';

import { useMemo, useState } from 'react';
import { lifeItems, zoneOf } from './Logic';
import { Btn, Frame, Label, PanelHead, Phrase, Stat, Tag, cx } from './ui';

const MAX_DAY = 60;
const omit = (o, k) => Object.fromEntries(Object.entries(o).filter(([key]) => key !== k));
const ZONES = [
  { key: 'active', label: 'Actives', hint: 'visibles dans « À ranger »', color: 'var(--accent)' },
  { key: 'reserve', label: 'Réserve', hint: 'repliée, hors de la vue du jour', color: 'var(--warning)' },
  { key: 'expired', label: 'Expirées', hint: 'disparues, comptées seulement', color: 'var(--text-faint)' },
];

function Slider({ id, label, value, min, max, onChange, suffix = ' j' }) {
  return (
    <label htmlFor={id} className="block min-w-0">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] text-[var(--text)]">{label}</span>
        <span className="font-mono text-[13px] text-[var(--accent)] tabular-nums">
          {value}
          {suffix}
        </span>
      </span>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 block h-6 w-full cursor-pointer accent-[var(--accent)]"
      />
    </label>
  );
}

function Histogram({ ages, reserveAt, expireAt }) {
  const cols = MAX_DAY + 1;
  const counts = Array.from({ length: cols }, () => 0);
  for (const a of ages) counts[Math.min(MAX_DAY, a)] += 1;
  const peak = Math.max(3, ...counts);
  const pos = (d) => `${((d + 0.5) / cols) * 100}%`;
  const color = (d) => (d >= expireAt ? 'var(--text-faint)' : d >= reserveAt ? 'var(--warning)' : 'var(--accent)');
  return (
    <div className="mt-1">
      <div
        className="relative flex h-28 items-end gap-px border-b border-[var(--border-strong)]"
        role="img"
        aria-label={`Âge des éléments, de 0 à ${MAX_DAY} jours ou plus. Réserve à ${reserveAt} jours, disparition à ${expireAt} jours.`}
      >
        {counts.map((c, d) => (
          <div key={d} className="flex h-full min-w-0 flex-1 items-end">
            <div
              className="w-full rounded-t-[2px] transition-[height] duration-100 motion-reduce:transition-none"
              style={{ height: c ? `${Math.max(8, (c / peak) * 100)}%` : '0%', background: color(d) }}
            />
          </div>
        ))}
        {[reserveAt, expireAt].map((d, i) => (
          <div key={i} className="pointer-events-none absolute inset-y-0 w-px bg-[var(--text-muted)]" style={{ left: pos(d) }} />
        ))}
      </div>
      <div className="relative mt-1 h-5 font-mono text-[10.5px] text-[var(--text-muted)]">
        <span className="absolute -translate-x-full pr-1 whitespace-nowrap" style={{ left: pos(reserveAt) }}>
          réserve {reserveAt} j
        </span>
        <span className="absolute pl-1 whitespace-nowrap" style={{ left: pos(expireAt) }}>
          disparaît {expireAt} j
        </span>
        <span className="absolute left-0">0 j</span>
        <span className="absolute right-0">{MAX_DAY} j et plus</span>
      </div>
    </div>
  );
}

export default function PanelFinDeVie({ data, log }) {
  const nowMs = Date.parse(data.nowIso);
  const [reserveAt, setReserveAt] = useState(14);
  const [expireAt, setExpireAt] = useState(30);
  const [includeLate, setIncludeLate] = useState(true);
  const [touched, setTouched] = useState({});
  const [forced, setForced] = useState({});
  const [open, setOpen] = useState({ active: true, reserve: false, expired: false });
  const [showAll, setShowAll] = useState({});

  const { items, exempt } = useMemo(
    () => lifeItems({ tasks: data.tasks, ideas: data.ideas, nowMs, today: data.today, includeLate }),
    [data.tasks, data.ideas, nowMs, data.today, includeLate]
  );
  const rule = { reserveAt, expireAt, touched, forced };
  const byZone = { active: [], reserve: [], expired: [] };
  for (const it of items) byZone[zoneOf(it, rule)].push(it);
  const exemptTotal = exempt.real + exempt.future + exempt.recurring + exempt.lateKept;

  const setReserve = (v) => {
    setReserveAt(v);
    if (expireAt < v + 7) setExpireAt(Math.min(MAX_DAY, v + 7));
  };
  const setExpire = (v) => setExpireAt(Math.max(v, reserveAt + 7));

  const act = (it, to) => {
    if (to === 'active') {
      setTouched((t) => ({ ...t, [it.id]: true }));
      setForced((f) => omit(f, it.id));
      log(`tasks : remettre l'âge à 0 sur "${it.title.slice(0, 50)}" (touchée à la main, sort de la réserve)`);
    } else {
      setForced((f) => ({ ...f, [it.id]: to }));
      setTouched((t) => omit(t, it.id));
      log(
        to === 'reserve'
          ? `${it.kind === 'idée' ? 'brain_notes' : 'tasks'} : passer en réserve "${it.title.slice(0, 50)}"`
          : `${it.kind === 'idée' ? 'brain_notes : écarter' : 'tasks : dropped_at = maintenant sur'} "${it.title.slice(0, 50)}" (${it.basis}, ${it.age} j)`
      );
    }
  };

  return (
    <Frame>
      <PanelHead
        n={1}
        title="Fin de vie par défaut"
        rule={`Tout ce qui n'a pas de vraie date meurt seul. Passé ${reserveAt} jours, un élément quitte la vue du jour pour une réserve repliée ; passé ${expireAt} jours, il disparaît et ne laisse qu'un compteur. Toucher à un élément remet son âge à zéro.`}
        problem="« À ranger » qui grossit et 40 tâches en retard : la liste est un cimetière parce que ne rien faire n'a aucun effet."
        reference="Linear (le backlog que l'on ose purger), Arc (archivage auto des onglets), Things (Un jour), Reclaim (clôture auto)."
        proof="HN : jerf, stavros, ergonaught, elamje, butz (leaky bucket, purgatoire, archiver au-delà de 1 à 2 mois). Linear, Arc : sources primaires."
        effort="6 h : les colonnes dropped_at et snoozed_until existent déjà ; reste la règle dans la routine, la réserve repliée et le compteur."
        criteria="F1 (diagnostic), F2 (règle chiffrée et compteur d'expirés)"
        lib="aucune bibliothèque pour la règle ; compteur animé avec @number-flow/react, bouton Annuler dans un Toast Base UI."
      />

      <div className="grid gap-6 px-4 py-5 sm:px-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="min-w-0 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <Slider id="reserve" label="Passe en réserve après" value={reserveAt} min={7} max={30} onChange={setReserve} />
            <Slider id="expire" label="Disparaît après" value={expireAt} min={reserveAt + 7} max={MAX_DAY} onChange={setExpire} />
          </div>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-[13px] leading-snug sm:min-h-0">
            <input
              type="checkbox"
              checked={includeLate}
              onChange={(e) => setIncludeLate(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--accent)] sm:h-4 sm:w-4"
            />
            <span>
              <span className="text-[var(--text)]">Compter aussi les retards datés</span>
              <span className="block text-[var(--text-muted)]">
                Leur date vient d&apos;un bloc posé par Claude, pas d&apos;une vraie échéance : l&apos;âge est alors le retard.
              </span>
            </span>
          </label>
          <div className="grid grid-cols-3 gap-3 border-t border-[var(--border)] pt-4">
            <Stat label="Actives" value={byZone.active.length} tone="accent" />
            <Stat label="Réserve" value={byZone.reserve.length} tone="warning" />
            <Stat label="Expirées" value={byZone.expired.length} />
          </div>
          <p className="text-[12px] leading-relaxed text-[var(--text-muted)]">
            <strong className="font-medium text-[var(--text)]">{exemptTotal} exemptées</strong> : {exempt.real} vraies échéances (candidature, test,
            examen, dépôt), {exempt.future} datées à venir, {exempt.recurring} paiements récurrents
            {exempt.lateKept ? `, ${exempt.lateKept} retards gardés (à sortir par un verbe)` : ''}.
          </p>
        </div>

        <div className="min-w-0">
          <Label>Âge des éléments soumis à la règle</Label>
          <Histogram ages={items.map((i) => (touched[i.id] ? 0 : i.age))} reserveAt={reserveAt} expireAt={expireAt} />
          <div className="mt-4 space-y-2">
            {ZONES.map((z) => {
              const list = byZone[z.key];
              const isOpen = open[z.key];
              const shown = showAll[z.key] ? list : list.slice(0, 6);
              return (
                <section key={z.key} className="rounded-[var(--radius-sm)] border border-[var(--border)]">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen((o) => ({ ...o, [z.key]: !o[z.key] }))}
                    className="flex min-h-11 w-full items-center gap-3 px-3 text-left sm:min-h-9"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: z.color }} />
                    <span className="text-[13px] font-medium">{z.label}</span>
                    <span className="font-mono text-[12px] text-[var(--text-muted)] tabular-nums">{list.length}</span>
                    <span className="ml-auto truncate text-[11.5px] text-[var(--text-faint)]">{z.hint}</span>
                    <span aria-hidden className="font-mono text-[11px] text-[var(--text-muted)]">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <ul className="border-t border-[var(--border)]">
                      {list.length === 0 && <li className="px-3 py-3 text-[12.5px] text-[var(--text-muted)]">Rien ici avec ces réglages.</li>}
                      {shown.map((it) => (
                        <li key={it.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-[var(--border)] px-3 py-2 last:border-b-0">
                          <span
                            className={cx(
                              'min-w-0 flex-1 basis-48 text-[13px] leading-snug break-words',
                              z.key === 'expired' ? 'text-[var(--text-muted)] line-through decoration-[var(--border-strong)]' : 'text-[var(--text)]'
                            )}
                          >
                            {it.title}
                          </span>
                          <Tag>{it.kind}</Tag>
                          <span className="font-mono text-[11.5px] text-[var(--text-muted)] tabular-nums" title={it.basis}>
                            {it.age} j
                          </span>
                          {z.key === 'active' ? (
                            <Btn tone="quiet" onClick={() => act(it, 'reserve')}>
                              Mettre en réserve
                            </Btn>
                          ) : (
                            <>
                              <Btn onClick={() => act(it, 'active')}>{z.key === 'reserve' ? 'Garder' : 'Réveiller'}</Btn>
                              {z.key === 'reserve' && (
                                <Btn tone="quiet" onClick={() => act(it, 'expired')}>
                                  Laisser mourir
                                </Btn>
                              )}
                            </>
                          )}
                        </li>
                      ))}
                      {list.length > 6 && (
                        <li className="px-3 py-2">
                          <Btn tone="quiet" onClick={() => setShowAll((s) => ({ ...s, [z.key]: !s[z.key] }))}>
                            {showAll[z.key] ? 'Voir moins' : `Voir les ${list.length - 6} autres`}
                          </Btn>
                        </li>
                      )}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
          <p className="mt-3 text-[12px] text-[var(--text-muted)]" aria-live="polite">
            {byZone.expired.length} expirée{byZone.expired.length > 1 ? 's' : ''} et comptée{byZone.expired.length > 1 ? 's' : ''} sans être réaffichée{byZone.expired.length > 1 ? 's' : ''} : le stock
            actif tombe à {byZone.active.length}.
            {byZone.expired.length === 0 && items.length > 0 && (
              <span className="text-[var(--text-faint)]">
                {' '}
                Ton élément le plus ancien a {Math.max(...items.map((i) => i.age))} jours : rien n&apos;expire encore à {expireAt} jours, descends le curseur pour voir l&apos;effet.
              </span>
            )}
          </p>
        </div>
      </div>
      <Phrase>Mets en réserve tout ce qui n&apos;a pas de date depuis {reserveAt} jours et laisse mourir à {expireAt} jours, sauf les candidatures.</Phrase>
    </Frame>
  );
}
