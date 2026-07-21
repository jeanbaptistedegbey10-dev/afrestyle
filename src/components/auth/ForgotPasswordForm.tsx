// src/components/auth/ForgotPasswordForm.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { forgotPasswordAction } from "@/lib/actions/auth.actions";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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
            style={{ color: "#D4AF37" }}
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
              background: "#1E293B",
              border: "0.5px solid rgba(212,175,55,0.2)",
              color: "#F5F0E8",
              borderRadius: "2px",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#D4AF37";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(212,175,55,0.2)";
            }}
          />
        </div>

        {/* Erreur */}
        {error && (
          <div
            className="px-4 py-3 text-sm rounded-sm"
            style={{
              background: "rgba(220,38,38,0.1)",
              border: "0.5px solid rgba(220,38,38,0.3)",
              color: "#fca5a5",
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
              background: "rgba(34,197,94,0.1)",
              border: "0.5px solid rgba(34,197,94,0.3)",
              color: "#86efac",
            }}
          >
            {success}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-4 flex items-center justify-center gap-2 text-sm font-medium tracking-widest uppercase transition-all"
          style={{
            background: isPending ? "#A8871C" : "#D4AF37",
            color: "#0F172A",
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
        className="inline-flex items-center gap-2 text-xs tracking-widest uppercase"
        style={{ color: "#D4CCBA" }}
      >
        <ArrowLeft size={14} /> Retour à la connexion
      </Link>
    </div>
  );
}