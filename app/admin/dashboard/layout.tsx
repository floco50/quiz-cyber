import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

// Correction de l'erreur "Unsupported metadata themeColor"
export const metadata: Metadata = {
  title: "CyberQuiz - Admin Dashboard",
  description: "Système de gestion du quiz de cybersécurité",
};

export const viewport: Viewport = {
  themeColor: "#0f172a", // Couleur ardoise foncée correspondant à ton thème
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body 
        className={`${inter.className} bg-gray-950 text-white antialiased`}
        suppressHydrationWarning
      >
        {/* Le Toaster ici permet d'afficher les alertes sur n'importe quelle page */}
        <Toaster position="top-right" richColors closeButton />
        
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}