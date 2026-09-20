import Link from 'next/link';

export default function Nav() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Pilotage projets
        </Link>
        <nav className="flex flex-wrap justify-end gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Accueil
          </Link>
          <Link href="/map" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Carte
          </Link>
          <Link href="/brain" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Idées
          </Link>
        </nav>
      </div>
    </header>
  );
}
