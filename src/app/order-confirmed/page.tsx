// src/app/order-confirmed/page.tsx
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Commande confirmée",
};

export default function OrderConfirmedPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "#FAF8F5" }}
    >
      <div className="text-center max-w-lg">

        {/* Icône succès */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"
          style={{ background: "rgba(197,160,89,0.12)", border: "1px solid rgba(197,160,89,0.4)" }}
        >
          <span style={{ fontSize: "2rem", color: "#B8860B" }}>✦</span>
        </div>

        <p
          className="text-xs tracking-widest uppercase mb-4"
          style={{ color: "#B8860B" }}
        >
          Commande confirmée
        </p>

        <h1
          className="font-serif text-4xl mb-4"
          style={{ color: "#1A1A1A" }}
        >
          Merci pour votre commande !
        </h1>

        <p
          className="text-sm leading-relaxed mb-4"
          style={{ color: "#4A4A44" }}
        >
          Vous allez recevoir un email de confirmation avec les détails
          de votre commande et les informations de suivi.
        </p>

        <p
          className="text-sm mb-10"
          style={{ color: "#4A4A44" }}
        >
          Chaque pièce AfroStyle est préparée avec soin par notre équipe
          et expédiée directement depuis l’atelier du créateur.
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/collections" className="btn-primary inline-flex">
            Continuer mes achats
          </Link>
          <Link href="/account" className="btn-outline inline-flex">
            Mes commandes
          </Link>
        </div>

      </div>
    </div>
  );
}