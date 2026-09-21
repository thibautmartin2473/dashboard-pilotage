// Installation sur l'écran d'accueil (téléphone, tablette).
export default function manifest() {
  return {
    name: 'Pilotage projets',
    short_name: 'Pilotage',
    description: "Où en est chacun de mes projets, et par où je reprends.",
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [{ src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' }],
  };
}
