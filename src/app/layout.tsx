// src/app/layout.tsx — ajoute CartDrawer
import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { Toaster } from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import CartDrawer from "@/components/cart/CartDrawer";
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
  title: {
    default: "AfroStyle — Mode Africaine Contemporaine",
    template: "%s | AfroStyle",
  },
  description:
    "La première destination premium pour la mode africaine contemporaine.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${playfair.variable} ${dmSans.variable}`}>
      <body
        className="font-sans antialiased min-h-screen"
        style={{ backgroundColor: "#0F172A", color: "#F5F0E8" }}
      >
        <Navbar />
        <main>{children}</main>
        {/* Cart Drawer global — disponible sur toutes les pages */}
        <CartDrawer />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#1E293B",
              color: "#F5F0E8",
              border: "1px solid rgba(212,175,55,0.2)",
            },
          }}
        />
      </body>
    </html>
  );
}
