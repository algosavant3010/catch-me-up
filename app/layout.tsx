import type { Metadata, Viewport } from "next";
import {
  Inter,
  Geist_Mono,
  Noto_Sans_Devanagari,
  Noto_Sans_Tamil,
  Noto_Sans_Telugu,
  Noto_Sans_Bengali,
  Noto_Sans_Kannada,
  Noto_Sans_Gujarati,
  Noto_Sans_Gurmukhi,
} from "next/font/google";
import { PreferencesProvider } from "@/components/providers/preferences-provider";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});
const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  display: "swap",
});
const notoTamil = Noto_Sans_Tamil({
  variable: "--font-noto-tamil",
  subsets: ["tamil"],
  display: "swap",
});
const notoTelugu = Noto_Sans_Telugu({
  variable: "--font-noto-telugu",
  subsets: ["telugu"],
  display: "swap",
});
const notoBengali = Noto_Sans_Bengali({
  variable: "--font-noto-bengali",
  subsets: ["bengali"],
  display: "swap",
});
const notoKannada = Noto_Sans_Kannada({
  variable: "--font-noto-kannada",
  subsets: ["kannada"],
  display: "swap",
});
const notoGujarati = Noto_Sans_Gujarati({
  variable: "--font-noto-gujarati",
  subsets: ["gujarati"],
  display: "swap",
});
const notoGurmukhi = Noto_Sans_Gurmukhi({
  variable: "--font-noto-gurmukhi",
  subsets: ["gurmukhi"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Catch Me Up — a second-screen companion for cricket fans",
  description:
    "Missed a few overs? Catch Me Up gives you a verified, spoiler-safe recap of a simulated cricket match in your language, in 20 seconds.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon.svg" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Catch Me Up" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1a1733",
};

const fontVariables = [
  inter.variable,
  geistMono.variable,
  notoDevanagari.variable,
  notoTamil.variable,
  notoTelugu.variable,
  notoBengali.variable,
  notoKannada.variable,
  notoGujarati.variable,
  notoGurmukhi.variable,
].join(" ");

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${fontVariables} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-(--color-bg) text-(--color-text)">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ServiceWorkerRegistration />
        <PreferencesProvider>
          <div id="main-content" className="flex flex-1 flex-col">
            {children}
          </div>
        </PreferencesProvider>
      </body>
    </html>
  );
}
