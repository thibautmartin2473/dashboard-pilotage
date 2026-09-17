import Link from 'next/link';

export default function Nav() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          Pilotage projets
        </Link>
        <nav className="flex gap-4 text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Vue d&apos;ensemble
          </Link>
          <Link href="/map" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Carte d&apos;interactions
          </Link>
          <Link href="/brain" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Claude Brain
          </Link>
        </nav>
      </div>
    </header>
  );
}
