import {
  Fraunces,
  Geist,
  Geist_Mono,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Instrument_Sans,
  Inter,
  Inter_Tight,
  JetBrains_Mono,
  Mona_Sans,
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

export default function DemoLayout({ children }) {
  return (
    <div
      className={`${inter.variable} ${fraunces.variable} ${geist.variable} ${geistMono.variable} ${plex.variable} ${plexMono.variable} ${interTight.variable} ${jetbrains.variable} ${mona.variable} ${instrument.variable}`}
    >
      {children}
    </div>
  );
}
