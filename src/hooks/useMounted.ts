// src/hooks/useMounted.ts
"use client";

import { useSyncExternalStore } from "react";

/**
 * Retourne `true` uniquement après le montage côté client.
 * Permet de ne rendre les données dynamiques (localStorage, thème,
 * store Zustand persisté, `window`…) qu'une fois hydraté, ce qui
 * élimine les erreurs d'hydratation Next.js ("Hydration mismatch").
 *
 * Implémenté avec `useSyncExternalStore` (et non `useState` +
 * `useEffect`) : la règle `react-hooks/set-state-in-effect` interdit
 * d'appeler un setState synchrone dans un effet, et ce pattern garantit
 * aussi un rendu serveur (false) / client (true) sans mismatch.
 */
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot
  );
}