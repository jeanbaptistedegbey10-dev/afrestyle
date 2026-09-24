// src/app/layout.tsx
// Le layout est un Server Component — il peut appeler getUserIcon
import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/cart/CartDrawer";
import Providers from "@/components/theme/Providers";
import { getSiteUrl } from "@/lib/seo";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "AfroStyle — Haute Couture Africaine Contemporaine",
    template: "%s | AfroStyle",
  },
  description:
    "AfroStyle, Maison de haute couture africaine contemporaine : créations premium en wax, kente et bogolan, confectionnées par des designers africains d'exception.",
  keywords: [
    "mode africaine",
    "haute couture africaine",
    "wax premium",
    "kente",
    "bogolan",
    "créateurs africains",
    "AfroStyle",
  ],
  authors: [{ name: "AfroStyle" }],
  creator: "AfroStyle",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "AfroStyle",
    title: "AfroStyle — Haute Couture Africaine Contemporaine",
    description:
      "La première destination premium pour la mode africaine contemporaine. 87 créateurs, 14 pays, des pièces d'exception.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AfroStyle — Haute Couture Africaine Contemporaine",
    description:
      "La première destination premium pour la mode africaine contemporaine.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${playfair.variable} ${dmSans.variable}`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body className="bg-bg text-text font-sans antialiased min-h-screen transition-colors duration-300">
        <Providers>
          <Navbar />
          <main>{children}</main>
          <Footer />
          <CartDrawer />
          {/* Toaster pour les notifications */}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--toast-surface)",
                color: "var(--text)",
                border: "1px solid var(--gold-soft)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}