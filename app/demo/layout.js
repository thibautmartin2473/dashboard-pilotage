import {
  Fraunces,
  Geist,
  Geist_Mono,
  Doto,
  Hanken_Grotesk,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Instrument_Sans,
  Instrument_Serif,
  Inter,
  Inter_Tight,
  JetBrains_Mono,
  Libre_Caslon_Text,
  Mona_Sans,
  Newsreader,
} from 'next/font/google';
import './studio/chartes.css';

// Polices et chartes de toutes les démos (/demo/*), exposées en variables CSS ; chaque charte
// (chartes.css) choisit les siennes pour --font-display / --font-body / --font-mono.
const inter = Inter({ variable: '--f-inter', subsets: ['latin'] });
const fraunces = Fraunces({ variable: '--f-fraunces', subsets: ['latin'], style: ['normal', 'italic'] });
const geist = Geist({ variable: '--f-geist', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--f-geist-mono', subsets: ['latin'] });
const plex = IBM_Plex_Sans({ variable: '--f-plex', subsets: ['latin'], weight: ['400', '500', '600', '700'] });
const plexMono = IBM_Plex_Mono({ variable: '--f-plex-mono', subsets: ['latin'], weight: ['400', '500'] });
// Chartes « Graphite » avancées : Inter Tight (compact) + JetBrains Mono, Mona Sans (largeur variable) et
// Instrument Sans (largeur variable). Geist et Geist Mono servent déjà à Graphite Lumière et Acier.
const interTight = Inter_Tight({ variable: '--f-inter-tight', subsets: ['latin'] });
const jetbrains = JetBrains_Mono({ variable: '--f-jetbrains', subsets: ['latin'] });
const mona = Mona_Sans({ variable: '--f-mona', subsets: ['latin'], axes: ['wdth'] });
const instrument = Instrument_Sans({ variable: '--f-instrument', subsets: ['latin'], axes: ['wdth'] });

// Chartes de Cadran d'après le moodboard (/demo/chartes-cadran) : Newsreader + Hanken Grotesk (Papier et encre),
// Libre Caslon Text (Cuir et bordeaux, avec IBM Plex déjà chargée), Doto, police à matrice de points (Noir, blanc et
// voyant, avec Geist), Instrument Serif (Raycast chaud, avec Inter et JetBrains Mono).
const newsreader = Newsreader({ variable: '--f-newsreader', subsets: ['latin'], style: ['normal', 'italic'], axes: ['opsz'] });
const hanken = Hanken_Grotesk({ variable: '--f-hanken', subsets: ['latin'] });
const caslon = Libre_Caslon_Text({ variable: '--f-caslon', subsets: ['latin'], weight: ['400', '700'], style: ['normal', 'italic'] });
const doto = Doto({ variable: '--f-doto', subsets: ['latin'] });
const instrumentSerif = Instrument_Serif({ variable: '--f-instrument-serif', subsets: ['latin'], weight: '400', style: ['normal', 'italic'] });

export default function DemoLayout({ children }) {
  return (
    <div
      className={`${inter.variable} ${fraunces.variable} ${geist.variable} ${geistMono.variable} ${plex.variable} ${plexMono.variable} ${interTight.variable} ${jetbrains.variable} ${mona.variable} ${instrument.variable} ${newsreader.variable} ${hanken.variable} ${caslon.variable} ${doto.variable} ${instrumentSerif.variable}`}
    >
      {children}
    </div>
  );
}
