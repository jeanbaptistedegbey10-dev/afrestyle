// src/app/account/login/page.tsx
import type { Metadata } from "next";
import { getCurrentCustomer } from "@/lib/actions/auth.actions";
import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import Link from "next/link";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage() {
  // Redirige si déjà connecté
  const customer = await getCurrentCustomer();
  if (customer) redirect("/account");

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "#FAF8F5" }}
    >
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-10">
          <Link
            href="/"
            className="font-serif text-3xl"
            style={{ color: "#1A1A1A" }}
          >
            Afro<span style={{ color: "#C5A059", fontStyle: "italic", fontWeight: 400 }}>Style</span>
          </Link>
          <p
            className="text-xs tracking-widest uppercase mt-4 mb-2"
            style={{ color: "#B8860B" }}
          >
            Espace client
          </p>
          <h1
            className="font-serif text-3xl"
            style={{ color: "#1A1A1A" }}
          >
            Connexion
          </h1>
        </div>

        {/* Formulaire */}
        <LoginForm />

        {/* Liens */}
        <div className="text-center mt-6 space-y-3">
          <p className="text-sm" style={{ color: "#4A4A44" }}>
            Pas encore de compte ?{" "}
            <Link
              href="/account/register"
              style={{ color: "#B8860B" }}
              className="hover:underline underline-offset-2"
            >
              Créer un compte
            </Link>
          </p>
          <Link
            href="/account/forgot-password"
            className="text-xs block hover:text-[#B8860B] transition-colors"
            style={{ color: "#8A857A" }}
          >
            Mot de passe oublié ?
          </Link>
        </div>

      </div>
    </div>
  );
}