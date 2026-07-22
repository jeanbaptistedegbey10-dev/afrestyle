// src/components/admin/AdminLoginForm.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminLoginAction } from "@/lib/actions/admin.actions";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function AdminLoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await adminLoginAction(formData);
      if (result.success) {
        router.push("/admin/designers");
        router.refresh();
      } else {
        setError(result.error ?? "Erreur de connexion");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {/* Identifiant */}
      <div>
        <label
          htmlFor="username"
          className="block text-xs tracking-widest uppercase mb-2"
          style={{ color: "#D4AF37" }}
        >
          Identifiant
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          placeholder="admin"
          className="w-full px-4 py-3 text-sm outline-none"
          style={{
            background: "#1E293B",
            border: "0.5px solid rgba(212,175,55,0.2)",
            color: "#F5F0E8",
            borderRadius: "2px",
          }}
          onFocus={(e) => { e.target.style.borderColor = "#D4AF37"; }}
          onBlur={(e) => { e.target.style.borderColor = "rgba(212,175,55,0.2)"; }}
        />
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
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            placeholder="••••••••••••"
            className="w-full px-4 py-3 pr-12 text-sm outline-none"
            style={{
              background: "#1E293B",
              border: "0.5px solid rgba(212,175,55,0.2)",
              color: "#F5F0E8",
              borderRadius: "2px",
            }}
            onFocus={(e) => { e.target.style.borderColor = "#D4AF37"; }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(212,175,55,0.2)"; }}
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

      {error && (
        <div
          className="px-4 py-3 text-sm"
          style={{
            background: "rgba(220,38,38,0.1)",
            border: "0.5px solid rgba(220,38,38,0.3)",
            color: "#fca5a5",
            borderRadius: "2px",
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-4 flex items-center justify-center gap-2 text-sm font-medium tracking-widest uppercase"
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
          "Accéder au panel"
        )}
      </button>
    </form>
  );
}