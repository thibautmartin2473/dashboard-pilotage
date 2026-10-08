import { CARD } from '../card';

// Écrans d'attente des vues du Cockpit (les `loading.js` de app/(cadran)/*). Ils se posent dans le cadre commun
// (app/(cadran)/layout.js : fond, rail, hauteur de fenêtre), donc le clic change l'écran tout de suite et le
// fond ne bouge pas. Même disposition que la vraie vue : bandeau de verre en haut, cartes à 75 % aux mêmes
// emplacements (mêmes classes de grille que les pages), quelques barres grises qui pulsent très doucement
// (`.sq-bar`, app/globals.css ; statiques si prefers-reduced-motion). Composants serveur, sans donnée : rien
// ici ne doit attendre la base.

function Bar({ w = 'w-full', h = 'h-3', className = '' }) {
  return <div className={`sq-bar ${w} ${h} ${className}`} />;
}

// Cadre : même conteneur que CockpitShell, avec le bandeau « Maintenant » en barres.
function Cadre({ label, children }) {
  return (
    <div id="cockpit-content" aria-busy="true" className="flex min-h-0 flex-1 flex-col gap-3 p-3">
      <p role="status" className="sr-only">
        {label}
      </p>
      <div className="glass flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl px-4 py-2 xl:h-14 xl:flex-nowrap xl:py-0" aria-hidden="true">
        <div className="min-w-0 flex-1 basis-60 xl:max-w-[36rem]">
          <Bar w="w-3/4" h="h-3.5" />
        </div>
        <div className="min-w-0 flex-1 basis-52 xl:max-w-[32rem] xl:border-l xl:border-[var(--glass-border)] xl:pl-6">
          <Bar w="w-2/3" />
        </div>
        <div className="ml-auto w-24 shrink-0">
          <Bar h="h-4" />
        </div>
      </div>
      {children}
    </div>
  );
}

// Carte : titre réel (connu d'avance) puis corps en barres.
function Carte({ titre, className = '', children }) {
  return (
    <section className={`flex min-h-0 flex-col overflow-hidden ${CARD} xl:h-full ${className}`} aria-hidden="true">
      <h2 className="flex min-h-10 shrink-0 items-center gap-2 border-b border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--ink)]">
        <span className="min-w-0 flex-1 truncate">{titre}</span>
      </h2>
      <div className="min-h-0 flex-1 overflow-hidden p-3">{children}</div>
    </section>
  );
}

// Lignes de liste (mails, éléments à ranger) : deux barres par ligne.
function Lignes({ n = 6, wide = false }) {
  const largeurs = ['w-4/5', 'w-3/5', 'w-11/12', 'w-2/3', 'w-3/4', 'w-1/2'];
  return (
    <ul className="space-y-3">
      {Array.from({ length: n }, (_, i) => (
        <li key={i} className="flex items-center gap-3">
          {wide && <Bar w="w-24" className="shrink-0" />}
          <div className="min-w-0 flex-1 space-y-1.5">
            <Bar w={largeurs[i % largeurs.length]} />
            {!wide && <Bar w="w-1/3" h="h-2.5" />}
          </div>
          <Bar w="w-10" h="h-2.5" className="shrink-0" />
        </li>
      ))}
    </ul>
  );
}

// Frise de l'agenda : une colonne par jour, quelques blocs de hauteurs différentes.
function Frise({ jours }) {
  const hauteurs = [
    ['h-16', 'h-10', 'h-20'],
    ['h-12', 'h-24'],
    ['h-20', 'h-14', 'h-10'],
    ['h-10', 'h-16'],
    ['h-24', 'h-12'],
    ['h-14', 'h-10', 'h-16'],
    ['h-12', 'h-20'],
  ];
  return (
    <div className="flex h-full min-h-48 flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between gap-4">
        <Bar w="w-40" h="h-5" />
        <Bar w="w-24" h="h-5" />
      </div>
      <div className="grid min-h-0 flex-1 gap-2 overflow-hidden" style={{ gridTemplateColumns: `repeat(${jours}, minmax(0, 1fr))` }}>
        {hauteurs.slice(0, jours).map((blocs, i) => (
          <div key={i} className="min-w-0 space-y-2">
            <Bar w="w-2/3" h="h-3.5" />
            {blocs.map((h, j) => (
              <Bar key={j} h={h} className="rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SqueletteCockpit() {
  return (
    <Cadre label="Chargement du Cockpit">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_24rem] xl:grid-rows-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-h-0 min-w-0 xl:col-start-1 xl:row-span-2 xl:row-start-1">
          <Carte titre="Agenda" className="max-xl:h-96">
            <Frise jours={5} />
          </Carte>
        </div>
        <div className="min-h-0 min-w-0 xl:col-start-2 xl:row-start-1">
          <Carte titre="À ranger">
            <Lignes n={5} />
          </Carte>
        </div>
        <div className="min-h-0 min-w-0 xl:col-start-2 xl:row-start-2">
          <Carte titre="Mails">
            <Lignes n={5} />
          </Carte>
        </div>
      </div>
    </Cadre>
  );
}

export function SqueletteAgenda() {
  return (
    <Cadre label="Chargement de l'agenda">
      <div className="min-h-0 min-w-0 flex-1">
        <Carte titre="Agenda" className="max-xl:h-96">
          <Frise jours={7} />
        </Carte>
      </div>
    </Cadre>
  );
}

export function SqueletteRanger() {
  return (
    <Cadre label="Chargement de la liste À ranger">
      <div className="min-h-0 min-w-0 flex-1">
        <Carte titre="À ranger" className="mx-auto w-full max-w-[56rem]">
          <Lignes n={7} />
        </Carte>
      </div>
    </Cadre>
  );
}

export function SqueletteMails() {
  return (
    <Cadre label="Chargement des mails">
      <div className="min-h-0 min-w-0 flex-1">
        <Carte titre="Mails">
          <Lignes n={9} wide />
        </Carte>
      </div>
    </Cadre>
  );
}

export function SqueletteIdees() {
  return (
    <Cadre label="Chargement des idées">
      <section className={`${CARD} min-h-0 min-w-0 flex-1 overflow-hidden p-4 sm:p-6`} aria-hidden="true">
        <h2 className="mb-2 text-lg font-semibold tracking-tight">Claude Brain</h2>
        <div className="mb-6 max-w-3xl space-y-2">
          <Bar w="w-full" />
          <Bar w="w-2/3" />
        </div>
        <Bar w="w-full" h="h-10" className="mb-8 max-w-3xl rounded-lg" />
        <div className="max-w-3xl">
          <Lignes n={5} />
        </div>
      </section>
    </Cadre>
  );
}
