import Link from 'next/link';

// Index des démos vitrines (branche demo/vitrines, jamais mergée telle quelle) :
// chaque démo lit les vraies données en lecture seule et ne garde ses gestes
// qu'en mémoire locale de l'onglet. Rien n'est écrit dans Supabase.
const DEMOS = [
  { href: '/demo/studio', title: 'Le Studio : composer son dashboard', text: '4 chartes x 4 navigations x 4 organisations, en clair ou en sombre. Le panneau Composer en bas à droite fait les combinaisons.' },
  { href: '/demo/aujourdhui', title: "Ma journée, l'agenda d'abord", text: 'Les tâches vivent dans les blocs du jour, 3 priorités, le reste replié.' },
  { href: '/demo/tri', title: 'Le grand ménage', text: 'Trier les 60 tâches ouvertes une par une, au clavier, en quelques minutes.' },
  { href: '/demo/bilan', title: 'Bilan de la veille et revue de la semaine', text: 'Une seule carte par bloc d’hier au lieu de 99 « Oublié hier ? ».' },
  { href: '/demo/echeances', title: 'Échéances, relances et récurrences', text: 'Les candidatures, tests et paiements sortis de la to-do, avec compte à rebours.' },
];

export default function DemoIndex() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="font-mono text-[11px] tracking-[0.1em] text-amber-400 uppercase">Démos : rien n&apos;est enregistré</p>
      <h1 className="mt-2 text-2xl font-bold text-zinc-100">Refonte des tâches : les vitrines</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Chaque démo lit tes vraies données en lecture seule. Clique, trie, coche : tout reste dans l&apos;onglet.
        Le questionnaire (docs/refonte-taches/QUESTIONNAIRE.md) renvoie à ces pages.
      </p>
      <ul className="mt-6 grid gap-3">
        {DEMOS.map((d) => (
          <li key={d.href}>
            <Link href={d.href} className="block rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 hover:border-zinc-600">
              <div className="font-semibold text-zinc-100">{d.title}</div>
              <div className="mt-0.5 text-sm text-zinc-400">{d.text}</div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
