// src/components/product/CollectionFilters.tsx
"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

// src/components/product/CollectionFilters.tsx
// Ajoute la section Genre et change les URLs

const FILTERS = {
  genre: [
    { label: "Femme",       value: "femme" },
    { label: "Homme",       value: "homme" },
    { label: "Accessoires", value: "accessoire" },
  ],
  pays: [
    { label: "Bénin",         value: "benin" },
    { label: "Nigeria",       value: "nigeria" },
    { label: "Sénégal",       value: "senegal" },
    { label: "Ghana",         value: "ghana" },
    { label: "Mali",          value: "mali" },
    { label: "Côte d'Ivoire", value: "cote-divoire" },
  ],
  tissu: [
    { label: "Wax",     value: "wax" },
    { label: "Kente",   value: "kente" },
    { label: "Bogolan", value: "bogolan" },
    { label: "Bazin",   value: "bazin" },
    { label: "Soie",    value: "soie" },
  ],
  style: [
    { label: "Traditionnel", value: "traditionnel" },
    { label: "Moderne",      value: "moderne" },
    { label: "Streetwear",   value: "streetwear" },
    { label: "Luxe",         value: "luxe" },
  ],
  sort: [
    { label: "Récent",           value: "recent" },
    { label: "Populaire",        value: "populaire" },
    { label: "Prix croissant",   value: "prix-asc" },
    { label: "Prix décroissant", value: "prix-desc" },
  ],
};

type ActiveFilters = {
  genre?: string;
  pays?: string;
  tissu?: string;
  style?: string;
  sort?: string;
};

export default function CollectionFilters({
  activeFilters,
}: {
  activeFilters: ActiveFilters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (params.get(key) === value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const clearAll = () => router.push(pathname);
  const hasFilters = Object.values(activeFilters).some(Boolean);

  return (
    <div className="mb-8 space-y-5">

      {/* Ligne 1 : Genre */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.genre.map((f) => (
          <button
            key={f.value}
            onClick={() => updateFilter("genre", f.value)}
            className="text-xs tracking-wider uppercase px-4 py-2 transition-all duration-200"
            style={{
              borderRadius: "2px",
              border: "1px solid",
              borderColor: activeFilters.genre === f.value ? "#D4AF37" : "rgba(212,175,55,0.2)",
              background: activeFilters.genre === f.value ? "#D4AF37" : "transparent",
              color: activeFilters.genre === f.value ? "#0F172A" : "#D4CCBA",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Ligne 2 : Pays + Tissu + Style + Sort */}
      <div className="flex flex-wrap gap-6 items-start">

        {/* Pays */}
        <div>
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "#D4AF37" }}>
            Pays
          </p>
          <div className="flex flex-wrap gap-2">
            {FILTERS.pays.map((f) => (
              <button
                key={f.value}
                onClick={() => updateFilter("pays", f.value)}
                className="text-xs tracking-wider uppercase px-3 py-1.5 transition-all duration-200"
                style={{
                  borderRadius: "2px",
                  border: "1px solid",
                  borderColor: activeFilters.pays === f.value ? "#D4AF37" : "rgba(212,175,55,0.2)",
                  background: activeFilters.pays === f.value ? "#D4AF37" : "transparent",
                  color: activeFilters.pays === f.value ? "#0F172A" : "#D4CCBA",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tissu */}
        <div>
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "#D4AF37" }}>
            Tissu
          </p>
          <div className="flex flex-wrap gap-2">
            {FILTERS.tissu.map((f) => (
              <button
                key={f.value}
                onClick={() => updateFilter("tissu", f.value)}
                className="text-xs tracking-wider uppercase px-3 py-1.5 transition-all duration-200"
                style={{
                  borderRadius: "2px",
                  border: "1px solid",
                  borderColor: activeFilters.tissu === f.value ? "#D4AF37" : "rgba(212,175,55,0.2)",
                  background: activeFilters.tissu === f.value ? "#D4AF37" : "transparent",
                  color: activeFilters.tissu === f.value ? "#0F172A" : "#D4CCBA",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Style */}
        <div>
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "#D4AF37" }}>
            Style
          </p>
          <div className="flex flex-wrap gap-2">
            {FILTERS.style.map((f) => (
              <button
                key={f.value}
                onClick={() => updateFilter("style", f.value)}
                className="text-xs tracking-wider uppercase px-3 py-1.5 transition-all duration-200"
                style={{
                  borderRadius: "2px",
                  border: "1px solid",
                  borderColor: activeFilters.style === f.value ? "#D4AF37" : "rgba(212,175,55,0.2)",
                  background: activeFilters.style === f.value ? "#D4AF37" : "transparent",
                  color: activeFilters.style === f.value ? "#0F172A" : "#D4CCBA",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="ml-auto">
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "#D4AF37" }}>
            Trier par
          </p>
          <select
            value={activeFilters.sort ?? "recent"}
            onChange={(e) => updateFilter("sort", e.target.value)}
            className="text-xs tracking-wider uppercase px-3 py-1.5 outline-none"
            style={{
              background: "#1E293B",
              color: "#F5F0E8",
              border: "1px solid rgba(212,175,55,0.2)",
              borderRadius: "2px",
            }}
          >
            {FILTERS.sort.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reset */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="text-xs tracking-widest uppercase transition-colors"
          style={{ color: "#D4CCBA" }}
        >
          ✕ Effacer les filtres
        </button>
      )}
    </div>
  );
}