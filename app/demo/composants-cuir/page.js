import CuirLab from '@/components/demo/composants-cuir/CuirLab';

// Vitrine « Boutons de Cadran (charte Cuir) » : trois systèmes de composants (Sellerie, Planche de bord,
// Édition) sur la charte cadran-cuir. Données de démonstration figées, gestes en état local : rien n'est
// écrit en base.
export const metadata = { title: 'Boutons de Cadran (charte Cuir)' };

export default async function ComposantsCuirPage({ searchParams }) {
  const params = (await searchParams) ?? {};
  return <CuirLab initial={typeof params.systeme === 'string' ? params.systeme : 'sellerie'} />;
}
