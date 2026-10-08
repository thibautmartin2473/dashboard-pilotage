import AutoRefresh from '@/components/AutoRefresh';
import CommandPalette from '@/components/CommandPalette';
import ConstellationFond from '@/components/ConstellationFond';
import NowBar from '@/components/cockpit/NowBar';
import { supabaseConfigured } from '@/lib/supabase';

// Cadre commun du Cockpit et de ses vues plein écran (/agenda, /a-ranger, /mails) : fond animé, relecture
// automatique, bandeau « Maintenant » en haut, messages d'indisponibilité, puis la zone (`children`) qui
// occupe tout le reste. Sur grand écran (>= 1280 px) la page tient dans la fenêtre (`xl:h-dvh`) et seule la
// zone défile ; en dessous, tout s'empile et la page défile. La fenêtre Commande (Ctrl+K) est ici pour que
// toutes les vues l'aient. `after` se rend hors de #cockpit-content (rangement forcé : le reste de la page
// devient inerte pendant qu'il est ouvert).
export default function CockpitShell({ data, title = 'Accueil', after = null, children }) {
  const { events, categories, now, list, lateCount, problems, activeTasks } = data;
  return (
    <div className="flex min-h-full flex-col xl:h-dvh xl:overflow-hidden">
      {/* Sans prop : le fond charge le graphe seul (/api/vault-graph, toutes les 5 min), pour ne pas
          relire 200 Ko en base à chaque rafraîchissement de 60 s de la page. */}
      <div id="cadran-fond" aria-hidden="true" className="fixed inset-0 -z-10">
        <ConstellationFond />
      </div>
      <AutoRefresh />
      <div id="cockpit-content" className="flex min-h-0 flex-1 flex-col gap-3 p-3">
        <NowBar
          events={events.data ?? []}
          categories={categories}
          now={now.getTime()}
          rangerCount={list.items.length}
          lateCount={lateCount}
        />
        <h1 className="sr-only">{title}</h1>

        {(!supabaseConfigured || problems.length > 0) && (
          <div className="shrink-0 space-y-1" role="status">
            {!supabaseConfigured && (
              <p className="rounded-xl border-l-[3px] border-[var(--pending)] bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--ink)]">
                <span className="font-semibold">Mode démo : </span>Supabase n&apos;est pas configuré (variables{' '}
                <code>NEXT_PUBLIC_SUPABASE_URL</code>/<code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>). Les projets affichés sont des exemples.
              </p>
            )}
            {problems.length > 0 && (
              <p className="rounded-xl border-l-[3px] border-[var(--late)] bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--ink)]">
                <span className="font-semibold">Indisponible : </span>
                {problems.join(' · ')}
              </p>
            )}
          </div>
        )}

        {children}
      </div>

      <CommandPalette data={{ events: events.data ?? [], tasks: activeTasks }} />
      {after}
    </div>
  );
}
