// src/app/admin/login/page.tsx
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Connexion" };

export default function AdminLoginPage() {
  return (
    <div
      style={{ background: "#0F172A", minHeight: "100vh" }}
      className="flex items-center justify-center px-6"
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p
            className="font-serif text-3xl mb-2"
            style={{ color: "#D4AF37" }}
          >
            AfroStyle
          </p>
          <p
            className="text-xs tracking-widest uppercase"
            style={{ color: "#D4CCBA" }}
          >
            Accès administrateur
          </p>
        </div>
        <AdminLoginForm />
      </div>
    </div>
  );
}