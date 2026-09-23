// src/components/auth/ForgotPasswordForm.tsx
"use client";

import { useState, useTransition } from "react";
import { forgotPasswordAction } from "@/lib/actions/auth.actions";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await forgotPasswordAction(formData);
      if (result.success) {
        setSuccess("Un email de réinitialisation a été envoyé à votre adresse");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <form action={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-xs tracking-widest uppercase mb-2"
            style={{ color: "var(--text-2)" }}
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="votre@email.com"
            className="w-full px-4 py-3 text-sm outline-none transition-all"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              color: "var(--text)",
              borderRadius: "2px",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "var(--gold)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "var(--line)";
            }}
          />
        </div>

        {/* Erreur */}
        {error && (
          <div
            className="px-4 py-3 text-sm rounded-sm"
            style={{
              background: "rgba(220,38,38,0.05)",
              border: "1px solid rgba(220,38,38,0.25)",
              color: "#B91C1C",
            }}
          >
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div
            className="px-4 py-3 text-sm rounded-sm"
            style={{
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.3)",
              color: "#15803d",
            }}
          >
            {success}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-4 flex items-center justify-center gap-2 text-sm font-medium tracking-widest uppercase transition-all hover:bg-gold hover:text-white"
          style={{
            background: isPending ? "var(--gold)" : "var(--text)",
            color: "var(--bg)",
            borderRadius: "2px",
            cursor: isPending ? "not-allowed" : "pointer",
          }}
        >
          {isPending ? (
            <><Loader2 size={16} className="animate-spin" /> Envoi en cours...</>
          ) : (
            "Envoyer le lien de réinitialisation"
          )}
        </button>
      </form>

      {/* Retour */}
      <Link
        href="/account/login"
        className="inline-flex items-center gap-2 text-xs tracking-widest uppercase hover:text-gold-dark dark:hover:text-gold transition-colors"
        style={{ color: "var(--text-3)" }}
      >
        <ArrowLeft size={14} /> Retour à la connexion
      </Link>
    </div>
  );
}