import Link from 'next/link';

// Bandeau du cockpit : marque compacte à gauche, navigation à droite. Il reste
// horizontal (et non un rail vertical comme sur la maquette) parce que le site
// est installé comme application sur le téléphone : un rail ne tiendrait pas en
// largeur mobile.
export default function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent)] text-[11px] font-bold tracking-tight text-zinc-950"
          >
            TC
          </span>
          {/* Le nom passerait sur deux lignes en largeur téléphone et pousserait
              la navigation : sous 640 px, le carré TC suffit. */}
          <span className="hidden text-sm font-bold tracking-tight text-zinc-100 sm:inline">Tour de Contrôle</span>
        </Link>
        <nav className="flex flex-wrap justify-end gap-x-1 gap-y-1 text-sm">
          <Link
            href="/"
            className="rounded-lg px-2.5 py-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
          >
            Accueil
          </Link>
          <Link
            href="/map"
            className="rounded-lg px-2.5 py-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
          >
            Carte
          </Link>
          <Link
            href="/brain"
            className="rounded-lg px-2.5 py-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
          >
            Idées
          </Link>
        </nav>
      </div>
    </header>
  );
}
