import { IBM_Plex_Sans, IBM_Plex_Mono, Libre_Caslon_Text } from "next/font/google";
import Rail from "@/components/Rail";
import "./globals.css";

// Cadran : IBM Plex Sans pour toute l'interface, IBM Plex Mono pour les chiffres et les heures
// (tabulaires), Libre Caslon Text uniquement dans le logotype « Cadran » (components/RailClient.js).
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const caslon = Libre_Caslon_Text({
  variable: "--font-caslon",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata = {
  title: "Cadran",
  description: "Où en est chacun de mes projets, et par où je reprends.",
  applicationName: "Cadran",
};

// Un seul mode : cadre cuir, contenu crème. La couleur de la barre du navigateur est le cuir.
export const viewport = {
  colorScheme: "light",
  themeColor: "#4a372f",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="fr"
      className={`${plexSans.variable} ${plexMono.variable} ${caslon.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 md:flex-row">
        <Rail />
        {/* Aucune largeur maximale : le Cockpit utilise tout l'écran. */}
        <main className="min-w-0 flex-1">{children}</main>
      </body>
    </html>
  );
}
