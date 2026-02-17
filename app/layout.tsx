import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kelen - La confiance se documente.",
  description: "Kelen répertorie les professionnels africains dont les clients ont documenté chaque projet. Cherchez un nom. Voyez son historique. Décidez en connaissance de cause.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
