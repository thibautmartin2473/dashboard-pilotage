import { Fraunces, Geist, Geist_Mono, IBM_Plex_Mono, IBM_Plex_Sans, Inter } from 'next/font/google';
import './studio/chartes.css';

// Polices et chartes de toutes les démos (/demo/*), exposées en variables CSS ; chaque charte
// (chartes.css) choisit les siennes pour --font-display / --font-body / --font-mono.
const inter = Inter({ variable: '--f-inter', subsets: ['latin'] });
const fraunces = Fraunces({ variable: '--f-fraunces', subsets: ['latin'], style: ['normal', 'italic'] });
const geist = Geist({ variable: '--f-geist', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--f-geist-mono', subsets: ['latin'] });
const plex = IBM_Plex_Sans({ variable: '--f-plex', subsets: ['latin'], weight: ['400', '500', '600', '700'] });
const plexMono = IBM_Plex_Mono({ variable: '--f-plex-mono', subsets: ['latin'], weight: ['400', '500'] });

export default function DemoLayout({ children }) {
  return (
    <div
      className={`${inter.variable} ${fraunces.variable} ${geist.variable} ${geistMono.variable} ${plex.variable} ${plexMono.variable}`}
    >
      {children}
    </div>
  );
}
