// src/components/designer/DesignerLoginForm.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginDesigner } from "@/lib/actions/designer.actions";
import { Loader2, Eye, EyeOff, Mail, Lock } from "lucide-react";

export default function DesignerLoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await loginDesigner(formData);
      if (result.success) {
        // Redirige selon le statut
        if (result.status === "APPROVED") {
          router.push("/dashboard");
        } else {
          router.push("/dashboard/pending");
        }
        router.refresh();
      } else {
        setError(result.error ?? "Erreur de connexion");
      }
    });
  }

  const inputStyle = {
    background: "#0F172A",
    border: "0.5px solid rgba(212,175,55,0.2)",
    color: "#F5F0E8",
    borderRadius: "2px",
    width: "100%",
    padding: "0.75rem 1rem 0.75rem 2.75rem",
    fontSize: "0.875rem",
    outline: "none",
  };

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
        <div className="relative">
          <Mail
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "#D4CCBA" }}
          />
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="votre@email.com"
            style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = "#D4AF37"; }}
            onBlur={(e)  => { e.target.style.borderColor = "rgba(212,175,55,0.2)"; }}
          />
        </div>
      </div>

      {/* Mot de passe */}
      <div>
        <label
          htmlFor="password"
          className="block text-xs tracking-widest uppercase mb-2"
          style={{ color: "#D4AF37" }}
        >
          Mot de passe
        </label>
        <div className="relative">
          <Lock
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "#D4CCBA" }}
          />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="••••••••••••"
            style={{ ...inputStyle, paddingRight: "3rem" }}
            onFocus={(e) => { e.target.style.borderColor = "#D4AF37"; }}
            onBlur={(e)  => { e.target.style.borderColor = "rgba(212,175,55,0.2)"; }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "#D4CCBA" }}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div
          className="px-4 py-3 text-sm"
          style={{
            background: "rgba(220,38,38,0.08)",
            border: "0.5px solid rgba(220,38,38,0.3)",
            color: "#fca5a5",
            borderRadius: "2px",
          }}
        >
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-4 flex items-center justify-center gap-2 text-sm font-medium tracking-widest uppercase"
        style={{
          background:    isPending ? "#A8871C" : "#D4AF37",
          color:         "#0F172A",
          borderRadius:  "2px",
          cursor:        isPending ? "not-allowed" : "pointer",
          transition:    "background 0.2s",
        }}
      >
        {isPending ? (
          <><Loader2 size={16} className="animate-spin" /> Connexion...</>
        ) : (
          "Accéder à mon espace"
        )}
      </button>
    </form>
  );
}
