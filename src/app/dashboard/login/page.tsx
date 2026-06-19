// src/app/dashboard/login/page.tsx
import type { Metadata } from "next";
import DesignerLoginForm from "@/components/designer/DesignerLoginForm";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Espace Créateur — Connexion",
  description: "Connectez-vous à votre espace créateur AfroStyle.",
};

export default function DashboardLoginPage() {
  return (
    <div
      style={{ background: "#0F172A", minHeight: "100vh" }}
      className="flex items-center justify-center px-6 py-12"
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="font-serif text-3xl font-bold" style={{ color: "#D4AF37" }}>
            Afro<span style={{ color: "#F5F0E8", fontStyle: "italic", fontWeight: 400 }}>Style</span>
          </Link>
          <p className="text-xs tracking-widest uppercase mt-2" style={{ color: "#D4CCBA" }}>
            Espace Créateur
          </p>
        </div>

        {/* Card */}
        <div
          className="p-8"
          style={{
            background: "#1E293B",
            border: "0.5px solid rgba(212,175,55,0.15)",
            borderRadius: "4px",
          }}
        >
          <h1
            className="font-serif text-2xl mb-2 text-center"
            style={{ color: "#FDFAF4" }}
          >
            Connexion
          </h1>
          <p
            className="text-sm text-center mb-8"
            style={{ color: "#D4CCBA" }}
          >
            Accédez à votre tableau de bord créateur
          </p>

          <DesignerLoginForm />
        </div>

        {/* Lien inscription */}
        <p className="text-center text-xs mt-6" style={{ color: "#D4CCBA" }}>
          Pas encore partenaire ?{" "}
          <Link
            href="/designers/apply"
            className="underline transition-colors"
            style={{ color: "#D4AF37" }}
          >
            Soumettre ma candidature
          </Link>
        </p>
      </div>
    </div>
  );
}
