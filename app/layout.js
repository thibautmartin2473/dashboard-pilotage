import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import Nav from "@/components/Nav";
import "./globals.css";

// Cockpit : une grotesque serrée pour les titres, un mono à chiffres tabulaires
// pour tout ce qui se compare en colonne (heures, compteurs, âges de synchro).
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Tour de Contrôle",
  description: "Où en est chacun de mes projets, et par où je reprends.",
};

// Le tableau de bord est sombre : les contrôles natifs (date, heure, barres de
// défilement) doivent suivre, sinon ils repassent en blanc sur fond sombre.
export const viewport = {
  colorScheme: "dark",
  themeColor: "#0d1017",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="fr"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950">
        <Nav />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
