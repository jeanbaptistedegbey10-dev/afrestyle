// src/components/theme/ThemeToggle.tsx
"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useMounted } from "@/hooks/useMounted";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  // Évite tout mismatch d'hydratation : on n'affiche l'icône
  // qu'une fois le thème résolu côté client.
  const mounted = useMounted();

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
      title={isDark ? "Mode clair" : "Mode sombre"}
      className="group relative flex w-9 h-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-text-2 transition-all duration-300 hover:border-gold hover:text-gold-dark hover:shadow-[0_0_12px_var(--gold-soft)]"
    >
      {/* Micro-animation : croix de rotation/scale entre les deux icônes */}
      <Sun
        size={15}
        className="absolute transition-all duration-300"
        style={{
          opacity: isDark ? 0 : 1,
          transform: `rotate(${isDark ? -90 : 0}deg) scale(${isDark ? 0.5 : 1})`,
        }}
      />
      <Moon
        size={15}
        className="absolute transition-all duration-300"
        style={{
          opacity: isDark ? 1 : 0,
          transform: `rotate(${isDark ? 0 : 90}deg) scale(${isDark ? 1 : 0.5})`,
        }}
      />
    </button>
  );
}