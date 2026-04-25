import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Manrope, Inter } from "next/font/google";
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

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '700', '800'],
  display: 'swap',
  variable: '--font-manrope',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-inter',
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
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} ${inter.variable}`}>
      <head>
        {/* Performance: Pre-connect to high-latency origins */}
        <link rel="preconnect" href="https://maps.googleapis.com" />
        <link rel="preconnect" href="https://maps.gstatic.com" />
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
