// src/components/theme/Providers.tsx
"use client";

import { ThemeProvider } from "next-themes";

export default function Providers({ children }: { children: React.ReactNode }) {
  // next-themes est conçu pour le rendu SSR : le script inline applique la
  // classe .dark avant l'hydratation et le <html> porte déjà
  // suppressHydrationWarning (layout.tsx). Le provider est donc rendu
  // immédiatement — le retarder provoquerait au contraire un mismatch
  // chez les enfants qui lisent useTheme().
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="theme"
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
