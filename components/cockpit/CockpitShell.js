import CommandPalette from '@/components/CommandPalette';
import NowBar from '@/components/cockpit/NowBar';
import { supabaseConfigured } from '@/lib/supabase';

// Contenu propre à chaque vue du Cockpit (/, /agenda, /a-ranger, /mails, /brain) : bandeau « Maintenant » en
// haut, messages d'indisponibilité, puis la zone (`children`) qui occupe tout le reste, et la fenêtre Commande
// (Ctrl+K). Le cadre qui ne doit PAS se remonter d'une vue à l'autre (fond Constellation, relecture
// automatique, raccourcis, hauteur de la fenêtre) est dans `app/(cadran)/layout.js`. Ce composant reste dans
// chaque page parce que le bandeau et la fenêtre Commande ont besoin des données de la page (événements,
// tâches), relues à chaque navigation et à chaque `router.refresh()` : un layout ne se rend pas de nouveau à
// la navigation, ses données seraient périmées, et il bloquerait l'écran d'attente `loading.js`.
// `after` se rend hors de #cockpit-content (rangement forcé : le reste de la page devient inerte pendant
// qu'il est ouvert).
export default function CockpitShell({ data, title = 'Accueil', after = null, children }) {
  const { events, categories, now, list, lateCount, problems, activeTasks } = data;
  return (
    <>
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
    </>
  );
}
