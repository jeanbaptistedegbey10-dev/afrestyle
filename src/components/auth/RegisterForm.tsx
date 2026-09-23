// src/components/auth/RegisterForm.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registerAction } from "@/lib/actions/auth.actions";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const inputStyle = {
  background: "#FFFFFF",
  border: "1px solid rgba(0,0,0,0.06)",
  color: "#1A1A1A",
  borderRadius: "2px",
};

function Field({
  id, name, label, type = "text", placeholder, autoComplete,
}: {
  id: string; name: string; label: string;
  type?: string; placeholder: string; autoComplete?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs tracking-widest uppercase mb-2"
        style={{ color: "#4A4A44" }}
      >
        {label}
      </label>
      <input
        id={id} name={name} type={type}
        required placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full px-4 py-3 text-sm outline-none"
        style={inputStyle}
        onFocus={(e) => { e.target.style.borderColor = "#C5A059"; }}
        onBlur={(e) => { e.target.style.borderColor = "rgba(0,0,0,0.06)"; }}
      />
    </div>
  );
}

export default function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await registerAction(formData);
      if (result.success) {
        router.push("/account");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">

      <div className="grid grid-cols-2 gap-4">
        <Field id="firstName" name="firstName" label="Prénom" placeholder="Jean" autoComplete="given-name" />
        <Field id="lastName" name="lastName" label="Nom" placeholder="Dupont" autoComplete="family-name" />
      </div>

      <Field id="email" name="email" label="Email" type="email" placeholder="votre@email.com" autoComplete="email" />

      {/* Password avec toggle */}
      <div>
        <label htmlFor="password" className="block text-xs tracking-widest uppercase mb-2" style={{ color: "#4A4A44" }}>
          Mot de passe
        </label>
        <div className="relative">
          <input
            id="password" name="password"
            type={showPassword ? "text" : "password"}
            required placeholder="Min. 8 caractères"
            autoComplete="new-password"
            className="w-full px-4 py-3 pr-12 text-sm outline-none"
            style={inputStyle}
            onFocus={(e) => { e.target.style.borderColor = "#C5A059"; }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(0,0,0,0.06)"; }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute right-4 top-1/2 -translate-y-1/2"
            style={{ color: "#8A857A" }}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p className="text-xs mt-1" style={{ color: "#8A857A" }}>
          Minimum 8 caractères
        </p>
      </div>

      {/* CGU */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox" name="terms" required
          className="mt-0.5 accent-[#C5A059]"
        />
        <span className="text-xs leading-relaxed" style={{ color: "#4A4A44" }}>
          J’accepte les{" "}
          <a href="/terms" style={{ color: "#B8860B" }}>conditions générales</a>
          {" "}et la{" "}
          <a href="/privacy" style={{ color: "#B8860B" }}>politique de confidentialité</a>
        </span>
      </label>

      {/* Erreur */}
      {error && (
        <div
          className="px-4 py-3 text-sm"
          style={{
            background: "rgba(220,38,38,0.05)",
            border: "1px solid rgba(220,38,38,0.25)",
            color: "#B91C1C",
            borderRadius: "2px",
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-4 flex items-center justify-center gap-2 text-sm font-medium tracking-widest uppercase transition-all hover:bg-[#C5A059] hover:text-white"
        style={{
          background: isPending ? "#C5A059" : "#1A1A1A",
          color: "#FAF8F5",
          borderRadius: "2px",
          cursor: isPending ? "not-allowed" : "pointer",
        }}
      >
        {isPending ? (
          <><Loader2 size={16} className="animate-spin" /> Création...</>
        ) : (
          "Créer mon compte"
        )}
      </button>
    </form>
  );
}