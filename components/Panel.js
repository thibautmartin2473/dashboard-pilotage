// Panneau de l'accueil. `state` = résultat { error, message } d'une lecture en
// échec : on l'affiche à la place du contenu, jamais une liste vide.
export default function Panel({ title, count, state, file, className = '', children }) {
  return (
    <section
      className={`overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 ${className}`}
    >
      <h2 className="flex items-baseline justify-between gap-2 border-b border-zinc-800 px-4 py-3 text-sm font-semibold text-zinc-100">
        {title}
        {count != null && !state?.error && (
          <span className="tabular rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 font-mono text-[11px] font-normal text-zinc-400">
            {count}
          </span>
        )}
      </h2>
      <div className="p-4">
        {state?.error === 'missing' ? (
          <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
            Table manquante : exécuter <code>supabase/{file}</code>
          </p>
        ) : state?.error ? (
          <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            Erreur : {state.message}
          </p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
