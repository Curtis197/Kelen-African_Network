import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/Toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "Kelen — Vérifiez les professionnels africains avant d'investir",
    template: "%s — Kelen",
  },
  description:
    "Registre permanent de collaborations vérifiées entre clients et professionnels. Cherchez un nom, voyez son historique, décidez en connaissance de cause.",
  keywords: [
    "clients",
    "investisseurs",
    "professionnels vérifiés",
    "vérification",
    "historique professionnel",
    "investissement sécurisé",
  ],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Kelen",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased font-sans">
        <GoogleAnalytics />
        <ServiceWorkerRegistration />
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
