// src/components/product/CollectionFilters.tsx
"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const FILTERS = {
  pays: [
    { label: "Bénin", value: "benin" },
    { label: "Nigeria", value: "nigeria" },
    { label: "Sénégal", value: "senegal" },
    { label: "Ghana", value: "ghana" },
    { label: "Mali", value: "mali" },
    { label: "Côte d'Ivoire", value: "cote-divoire" },
  ],
  tissu: [
    { label: "Wax", value: "wax" },
    { label: "Kente", value: "kente" },
    { label: "Bogolan", value: "bogolan" },
    { label: "Bazin", value: "bazin" },
  ],
  style: [
    { label: "Traditionnel", value: "traditionnel" },
    { label: "Moderne", value: "moderne" },
    { label: "Streetwear", value: "streetwear" },
  ],
  sort: [
    { label: "Récent", value: "recent" },
    { label: "Populaire", value: "populaire" },
    { label: "Prix croissant", value: "prix-asc" },
    { label: "Prix décroissant", value: "prix-desc" },
  ],
};

type ActiveFilters = {
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

  // Met à jour un filtre sans supprimer les autres
  // Pattern URL-driven filters — important en entretien
  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      // Toggle : si déjà actif, on supprime ; sinon on ajoute
      if (params.get(key) === value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const clearAll = () => router.push(pathname);

  const hasFilters = Object.values(activeFilters).some(Boolean);

  return (
    <div className="mb-8 space-y-4">
      {/* Ligne de filtres scrollable */}
      <div className="flex flex-wrap gap-6 items-start">
        {/* Filtre Pays */}
        <div>
          <p
            className="text-xs tracking-widest uppercase mb-2"
            style={{ color: "#D4AF37" }}
          >
            Pays
          </p>
          <div className="flex flex-wrap gap-2">
            {FILTERS.pays.map((f) => (
              <button
                key={f.value}
                onClick={() => updateFilter("pays", f.value)}
                className="text-xs tracking-wider uppercase px-3 py-1.5 rounded-sm border transition-all duration-200"
                style={
                  activeFilters.pays === f.value
                    ? {
                        background: "#D4AF37",
                        color: "#0F172A",
                        borderColor: "#D4AF37",
                      }
                    : {
                        background: "transparent",
                        color: "#D4CCBA",
                        borderColor: "rgba(212,175,55,0.2)",
                      }
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtre Tissu */}
        <div>
          <p
            className="text-xs tracking-widest uppercase mb-2"
            style={{ color: "#D4AF37" }}
          >
            Tissu
          </p>
          <div className="flex flex-wrap gap-2">
            {FILTERS.tissu.map((f) => (
              <button
                key={f.value}
                onClick={() => updateFilter("tissu", f.value)}
                className="text-xs tracking-wider uppercase px-3 py-1.5 rounded-sm border transition-all duration-200"
                style={
                  activeFilters.tissu === f.value
                    ? {
                        background: "#D4AF37",
                        color: "#0F172A",
                        borderColor: "#D4AF37",
                      }
                    : {
                        background: "transparent",
                        color: "#D4CCBA",
                        borderColor: "rgba(212,175,55,0.2)",
                      }
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtre Style */}
        <div>
          <p
            className="text-xs tracking-widest uppercase mb-2"
            style={{ color: "#D4AF37" }}
          >
            Style
          </p>
          <div className="flex flex-wrap gap-2">
            {FILTERS.style.map((f) => (
              <button
                key={f.value}
                onClick={() => updateFilter("style", f.value)}
                className="text-xs tracking-wider uppercase px-3 py-1.5 rounded-sm border transition-all duration-200"
                style={
                  activeFilters.style === f.value
                    ? {
                        background: "#D4AF37",
                        color: "#0F172A",
                        borderColor: "#D4AF37",
                      }
                    : {
                        background: "transparent",
                        color: "#D4CCBA",
                        borderColor: "rgba(212,175,55,0.2)",
                      }
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tri */}
        <div className="ml-auto">
          <p
            className="text-xs tracking-widest uppercase mb-2"
            style={{ color: "#D4AF37" }}
          >
            Trier par
          </p>
          <select
            value={activeFilters.sort ?? "recent"}
            onChange={(e) => updateFilter("sort", e.target.value)}
            className="text-xs tracking-wider uppercase px-3 py-1.5 rounded-sm border outline-none"
            style={{
              background: "#1E293B",
              color: "#F5F0E8",
              borderColor: "rgba(212,175,55,0.2)",
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

      {/* Bouton reset filtres */}
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
