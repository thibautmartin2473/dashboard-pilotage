import Rail from "@/components/Rail";
import "./globals.css";

// Cadran : police du système (-apple-system, SF Pro, Segoe UI sur Windows), définie dans app/globals.css.

export const metadata = {
  title: "Cadran",
  description: "Où en est chacun de mes projets, et par où je reprends.",
  applicationName: "Cadran",
};

// Un seul mode : fond bleu gris, barres en verre. La barre du navigateur prend le bleu acier du logo.
export const viewport = {
  colorScheme: "light",
  themeColor: "#3b6a9a",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col md:flex-row">
        <Rail />
        {/* Aucune largeur maximale : le Cockpit utilise tout l'écran. */}
        <main className="min-w-0 flex-1">{children}</main>
      </body>
    </html>
  );
}
