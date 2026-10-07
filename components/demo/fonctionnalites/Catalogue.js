'use client';

import { Frame, Label, Tag, cx } from './ui';

// Les 13 fonctionnalités, en trois paniers. Même contenu que docs/refonte-taches/FONCTIONNALITES.md.
// demo : numéro du panneau de cette page, ou la démo déjà existante.
export const BASKETS = [
  { key: 'indispensable', label: 'Indispensables', lead: 'Elles réparent les trois problèmes du diagnostic. Sans elles, le reste retombe en cimetière.' },
  { key: 'forte', label: 'Fortes', lead: 'Elles donnent le rythme et la confiance. À faire une fois les indispensables en place.' },
  { key: 'bonus', label: 'Bonus', lead: 'Utiles, mais pas avant : elles touchent un besoin réel sans régler le diagnostic.' },
];

export const FEATURES = [
  {
    n: 1, basket: 'indispensable', name: 'Fin de vie par défaut',
    does: 'Sans vraie date, un élément passe en réserve repliée après 14 jours, disparaît après 30, et ne laisse qu\'un compteur. Les vraies échéances sont exemptées.',
    moment: 'À l\'ouverture du site, calculé chaque nuit par la routine.',
    ref: 'Linear, Arc, Things, Reclaim', proof: 'HN : jerf, stavros, ergonaught, elamje, butz ; Linear et Arc (primaires)',
    problem: 'À ranger qui grossit', effort: 6, demo: 'Panneau 1',
  },
  {
    n: 2, basket: 'indispensable', name: 'La tâche est un budget de temps',
    does: 'Une durée estimée par tâche ; les blocs de l\'agenda la consomment ; ce qui est fait hors bloc se consigne ; le reste se lit en cellules de 15 minutes.',
    moment: 'À la création (Claude estime), puis pendant la journée.',
    ref: 'Reclaim (tâches), Motion (états)', proof: 'Aide Reclaim et billet Dropbox (primaires) ; HN : krono',
    problem: 'Rappels « Oublié hier ? » ignorés', effort: 12, demo: 'Panneau 2',
  },
  {
    n: 3, basket: 'indispensable', name: 'Une journée qui a un plafond',
    does: 'Heures engagées contre heures libres, cible réglable, trois priorités au plus, alerte à l\'approche et au dépassement, décalage proposé.',
    moment: 'Le matin en posant la journée, puis à chaque ajout.',
    ref: 'Sunsama, Akiflow', proof: 'HN et Mac Power Users : geoffaire, butz ; Sunsama (primaire)',
    problem: '40 retards, 2 faites en 7 jours', effort: 7, demo: 'Panneau 3',
  },
  {
    n: 4, basket: 'indispensable', name: 'Claude propose, tu valides',
    does: 'Toute replanification passe par un aperçu en pointillé, validé ligne par ligne, avec une journée libre possible et le pourquoi de chaque ligne.',
    moment: 'Chaque fois que Claude replanifie, souvent le soir ou le dimanche.',
    ref: 'Reclaim 2.0, Akiflow (Aki)', proof: 'Aide Reclaim, billet Dropbox ; Mac Power Users : Matt_Lockett',
    problem: 'Blocs mal posés et doublons', effort: 14, demo: 'Panneau 4',
  },
  {
    n: 5, basket: 'indispensable', name: 'Date de début, distincte de l\'échéance',
    does: 'La tâche dort jusqu\'à sa date de début (colonne snoozed_until, déjà là) ; l\'échéance reste une date limite à part, sans bruit avant.',
    moment: 'À la création, puis chaque matin au réveil des tâches.',
    ref: 'Things (À venir), OmniFocus', proof: 'HN : kstrauser, koliber, Show HN « do et due » (160 pts)',
    problem: 'À ranger qui grossit', effort: 4, demo: null,
  },
  {
    n: 6, basket: 'forte', name: 'Rituels courts : matin et soir',
    does: 'Le matin en 3 étapes et moins de 2 minutes (hier, aujourd\'hui, ce qui attend) ; le soir une seule carte : fait, reporté, abandonné. Zéro questionnaire.',
    moment: 'À l\'ouverture le matin ; entre 18h30 et 22h le soir.',
    ref: 'Sunsama, Akiflow', proof: 'HN : Terretta (rituel utile) contre jbverschoor (accueil trop long) ; save nocode.joshua',
    problem: '95 rappels intacts, remplacés par 1 carte', effort: 9, demo: '/demo/bilan',
  },
  {
    n: 7, basket: 'forte', name: 'Tout ce que Claude pose est traçable',
    does: 'Chaque suggestion porte son pourquoi et sa source en un clic ; un journal « ce que Claude a changé » ; une pastille « Claude attend ta réponse ».',
    moment: 'À chaque suggestion ; relecture le soir.',
    ref: 'Reclaim 2.0 (journal), fil « AI HUDs »', proof: 'HN : afro88, fil à 979 pts ; save Anara',
    problem: 'Confiance dans les blocs posés', effort: 8, demo: 'Panneau 4 (en partie)',
  },
  {
    n: 8, basket: 'forte', name: 'Report groupé et glisser, durée par poignée',
    does: 'Décaler tout un bloc de 30 minutes ou à demain d\'un geste ; glisser une tâche sur la grille et régler la durée par une poignée au pas de 15 minutes.',
    moment: 'Quand la journée déraille, en plein travail.',
    ref: 'Akiflow (Time Slots), Things (dépôt), Todoist (report en bloc)', proof: 'HN : TheSocialAndrew, krono ; github.md : poignée de durée à écrire',
    problem: 'Retards', effort: 16, demo: null,
  },
  {
    n: 9, basket: 'forte', name: 'Échéances dures et fiche-dossier',
    does: 'Un bandeau à compte à rebours (tests Gorilla, candidatures, paiements) sans notification ; chaque échéance ouvre sa fiche : date, prépa, contacts, tâches, dernier mail.',
    moment: 'Chaque matin ; avant un test ou un entretien.',
    ref: 'Things (échéance), Due (retours d\'usage), World Monitor (save)', proof: 'HN : dealtek, jmayhugh, geoffaire, wvp ; saves Instagram 2C et 4.8',
    problem: 'Vraies dates noyées dans la liste', effort: 8, demo: '/demo/echeances',
  },
  {
    n: 10, basket: 'bonus', name: 'Mails en boîtes divisées et relances',
    does: 'Cabinets, EDHEC, candidatures, personnes à relancer ; un fil revient s\'il reste sans réponse après N jours.',
    moment: 'Chaque jour pour le tri ; le vendredi pour les relances.',
    ref: 'Superhuman', proof: 'Blog Superhuman (primaire) ; saves Instagram, famille F',
    problem: 'Networking qui retombe', effort: 10, demo: null,
  },
  {
    n: 11, basket: 'bonus', name: 'Mode partiels',
    does: 'Un contexte actif (14 au 23 octobre) qui baisse le plafond, endort tout ce qui n\'est pas examen jusqu\'au 24 et affiche le compte à rebours.',
    moment: 'Du 14 au 23 octobre, puis la semaine des tests Gorilla (26 au 30).',
    ref: 'Arc (Spaces), Things (Quand vous voulez)', proof: 'Apps de référence 2.11 ; DIAGNOSTIC (partiels du 21 au 23)',
    problem: 'Retards pendant les partiels', effort: 5, demo: null,
  },
  {
    n: 12, basket: 'bonus', name: 'Habitudes à fenêtre flexible',
    does: 'Tennis, drills et relances déclarés une fois (heures par semaine, jours, heure idéale) ; l\'habitude se déplace seule quand l\'agenda se remplit.',
    moment: 'Le dimanche, à la revue de la semaine.',
    ref: 'Reclaim (Habitudes)', proof: 'Aide Reclaim (primaire)',
    problem: 'Blocs récurrents posés à la main', effort: 11, demo: null,
  },
  {
    n: 13, basket: 'bonus', name: 'Saisie naturelle et durée au clavier',
    does: 'Taper « appeler Bruno demain 14h = 15 » ou dicter ; dates en français, durée après « = », abréviations t+1.',
    moment: 'À la capture d\'une tâche.',
    ref: 'Akiflow (jetons), Todoist, Things (saisie sous 1 s)', proof: 'HN : thornjm, raybb ; Apps de référence 2.2 et 2.13',
    problem: 'Friction de saisie (faible : il dicte à Claude)', effort: 6, demo: null,
  },
];

export const totalEffort = (basket) => FEATURES.filter((f) => !basket || f.basket === basket).reduce((s, f) => s + f.effort, 0);

export default function Catalogue() {
  return (
    <section aria-labelledby="catalogue" className="mt-12">
      <div className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 id="catalogue" className="text-xl font-semibold tracking-[-0.01em] [font-family:var(--font-display)]">
          Les 13 fonctionnalités
        </h2>
        <span className="font-mono text-[12px] text-[var(--text-muted)] tabular-nums">{totalEffort()} h au total</span>
      </div>
      <div className="space-y-8">
        {BASKETS.map((b) => {
          const list = FEATURES.filter((f) => f.basket === b.key);
          return (
            <div key={b.key}>
              <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-[15px] font-semibold">{b.label}</h3>
                <span className="font-mono text-[11.5px] text-[var(--text-muted)] tabular-nums">
                  {list.length} fonctions, {totalEffort(b.key)} h
                </span>
              </div>
              <p className="mb-3 max-w-2xl text-[12.5px] leading-relaxed text-[var(--text-muted)]">{b.lead}</p>
              <Frame>
                <ul>
                  {list.map((f) => (
                    <li key={f.n} className="grid gap-x-6 gap-y-2 border-b border-[var(--border)] px-4 py-4 last:border-b-0 sm:px-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-3">
                          <span className="font-mono text-[12px] text-[var(--accent)] tabular-nums">{String(f.n).padStart(2, '0')}</span>
                          <h4 className="min-w-0 text-[14.5px] leading-snug font-semibold">{f.name}</h4>
                          <span className="ml-auto shrink-0 font-mono text-[12px] text-[var(--text)] tabular-nums">{f.effort} h</span>
                        </div>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-muted)]">{f.does}</p>
                      </div>
                      <dl className="grid min-w-0 gap-x-4 gap-y-1.5 text-[12px] leading-snug sm:grid-cols-2 lg:grid-cols-1">
                        {[
                          ['Moment', f.moment],
                          ['Référence', f.ref],
                          ['Preuve', f.proof],
                          ['Problème réglé', f.problem],
                        ].map(([k, v]) => (
                          <div key={k} className="min-w-0">
                            <dt className="font-mono text-[10px] tracking-[0.08em] text-[var(--text-faint)] uppercase">{k}</dt>
                            <dd className="text-[var(--text-muted)]">{v}</dd>
                          </div>
                        ))}
                        <div className="sm:col-span-2 lg:col-span-1">
                          <Label>Maquette</Label>{' '}
                          <Tag tone={f.demo ? 'accent' : 'muted'} dashed={!f.demo} className={cx('ml-1')}>
                            {f.demo ?? 'non maquettée'}
                          </Tag>
                        </div>
                      </dl>
                    </li>
                  ))}
                </ul>
              </Frame>
            </div>
          );
        })}
      </div>
    </section>
  );
}
