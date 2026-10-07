import { Geist, Geist_Mono } from "next/font/google";
import Rail from "@/components/Rail";
import "./globals.css";

// Graphite : Geist pour le texte, Geist Mono pour les chiffres qui se comparent
// en colonne (heures, compteurs, âges de synchro).
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Pilotage",
  description: "Où en est chacun de mes projets, et par où je reprends.",
};

// Le tableau de bord est sombre : les contrôles natifs (date, heure, barres de
// défilement) doivent suivre, sinon ils repassent en blanc sur fond sombre.
export const viewport = {
  colorScheme: "dark",
  themeColor: "#202429",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 md:flex-row">
        <Rail />
        {/* Aucune largeur maximale : le Cockpit utilise tout l'écran. */}
        <main className="min-w-0 flex-1">{children}</main>
      </body>
    </html>
  );
}
