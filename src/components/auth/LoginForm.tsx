// src/components/auth/LoginForm.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/lib/actions/auth.actions";
import { Eye, EyeOff, Loader2 } from "lucide-react";

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

      {/* Password */}
      <div>
        <label
          htmlFor="password"
          className="block text-xs tracking-widest uppercase mb-2"
          style={{ color: "#D4AF37" }}
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
            className="w-full px-4 py-3 pr-12 text-sm outline-none transition-all"
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
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2"
            style={{ color: "#D4CCBA" }}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
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
          <><Loader2 size={16} className="animate-spin" /> Connexion...</>
        ) : (
          "Se connecter"
        )}
      </button>

    </form>
  );
}