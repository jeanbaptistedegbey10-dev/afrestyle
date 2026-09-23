// src/components/auth/LoginForm.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/lib/actions/auth.actions";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // useTransition = permet d'appeler une Server Action
  // sans bloquer l'UI pendant l'exécution
  // En entretien: "useTransition gère les états de chargement
  // pour les Server Actions sans useState supplémentaire"

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result.success) {
        router.push("/account");
        router.refresh(); // Rafraîchit les Server Components
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4 p-8" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "2px" }}>

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
          className="w-full px-4 py-3 text-sm outline-none field-light"
          onFocus={(e) => {
            e.target.style.borderColor = "var(--gold)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "var(--line)";
          }}
        />
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="password"
          className="block text-xs tracking-widest uppercase mb-2"
          style={{ color: "var(--text-2)" }}
        >
          Mot de passe
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full px-4 py-3 pr-12 text-sm outline-none field-light"
            onFocus={(e) => {
              e.target.style.borderColor = "var(--gold)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "var(--line)";
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute right-4 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-3)" }}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Mot de passe oublié */}
      <div className="text-right">
        <Link
          href="/account/forgot-password"
          className="text-xs tracking-widest uppercase hover:text-gold-dark dark:hover:text-gold transition-colors"
          style={{ color: "var(--text-3)" }}
        >
          Mot de passe oublié ?
        </Link>
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
          <><Loader2 size={16} className="animate-spin" /> Connexion...</>
        ) : (
          "Se connecter"
        )}
      </button>

    </form>
  );

}