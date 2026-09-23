// src/app/account/register/page.tsx
import type { Metadata } from "next";
import { getCurrentCustomer } from "@/lib/actions/auth.actions";
import { redirect } from "next/navigation";
import RegisterForm from "@/components/auth/RegisterForm";
import Link from "next/link";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function RegisterPage() {
  const customer = await getCurrentCustomer();
  if (customer) redirect("/account");

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{ background: "var(--bg)" }}
    >
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <Link href="/" className="font-serif text-3xl" style={{ color: "var(--text)" }}>
            Afro<span style={{ color: "var(--gold)", fontStyle: "italic", fontWeight: 400 }}>Style</span>
          </Link>
          <p className="text-xs tracking-widest uppercase mt-4 mb-2" style={{ color: "var(--gold-dark)" }}>
            Rejoindre la communauté
          </p>
          <h1 className="font-serif text-3xl" style={{ color: "var(--text)" }}>
            Créer un compte
          </h1>
        </div>

        <RegisterForm />

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-2)" }}>
          Déjà un compte ?{" "}
          <Link href="/account/login" className="hover:underline underline-offset-2" style={{ color: "var(--gold-dark)" }}>
            Se connecter
          </Link>
        </p>

      </div>
    </div>
  );
}