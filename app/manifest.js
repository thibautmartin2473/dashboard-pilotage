// Installation sur l'écran d'accueil (téléphone, tablette).
export default function manifest() {
  return {
    name: 'Cadran',
    short_name: 'Cadran',
    description: "Où en est chacun de mes projets, et par où je reprends.",
    start_url: '/',
    display: 'standalone',
    background_color: '#8e9cb4',
    theme_color: '#3b6a9a',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/logo/cadran-icone-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/logo/cadran-icone-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
