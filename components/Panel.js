// Panneau de l'accueil. `state` = résultat { error, message } d'une lecture en
// échec : on l'affiche à la place du contenu, jamais une liste vide.
export default function Panel({ title, count, state, file, className = '', children }) {
  return (
    <section
      className={`rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 ${className}`}
    >
      <h2 className="flex items-baseline justify-between gap-2 text-sm font-semibold">
        {title}
        {count != null && !state?.error && (
          <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">{count}</span>
        )}
      </h2>
      <div className="mt-2">
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
