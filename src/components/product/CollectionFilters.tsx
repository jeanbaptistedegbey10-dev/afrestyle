// src/components/product/CollectionFilters.tsx — Phase 5 Luxe & Editorial
"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

const FILTERS = {
  genre: [
    { label: "Femme", value: "femme" },
    { label: "Homme", value: "homme" },
    { label: "Accessoires", value: "accessoire" },
  ],
  pays: [
    { label: "Benin", value: "benin" },
    { label: "Nigeria", value: "nigeria" },
    { label: "Senegal", value: "senegal" },
    { label: "Ghana", value: "ghana" },
    { label: "Mali", value: "mali" },
    { label: "Cote d'Ivoire", value: "cote-divoire" },
  ],
  tissu: [
    { label: "Wax", value: "wax" },
    { label: "Kente", value: "kente" },
    { label: "Bogolan", value: "bogolan" },
    { label: "Bazin", value: "bazin" },
    { label: "Soie", value: "soie" },
  ],
  style: [
    { label: "Traditionnel", value: "traditionnel" },
    { label: "Moderne", value: "moderne" },
    { label: "Streetwear", value: "streetwear" },
    { label: "Luxe", value: "luxe" },
  ],
  sort: [
    { label: "Nouveautes", value: "recent" },
    { label: "Populaire", value: "populaire" },
    { label: "Prix croissant", value: "prix-asc" },
    { label: "Prix decroissant", value: "prix-desc" },
  ],
} as const;

type FilterKey = "genre" | "pays" | "tissu" | "style" | "sort";
type ActiveFilters = {
  genre?: string; pays?: string; tissu?: string;
  style?: string; sort?: string; q?: string;
};

function FilterGroup({ title, options, active, onSelect }: {
  title: string;
  options: readonly { label: string; value: string }[];
  active?: string; onSelect: (v: string) => void;
}) {
  return (
    <div className="border-b border-line py-6 first:pt-0 last:border-b-0">
      <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.25em] text-text-3">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((f) => {
          const isActive = active === f.value;
          return (
            <button key={f.value} type="button" onClick={() => onSelect(f.value)}
              aria-pressed={isActive}
              className={cn(
                "rounded-none border px-3 py-1.5 text-xs tracking-wide transition-colors duration-300",
                isActive
                  ? "border-text bg-text text-bg"
                  : "border-line bg-transparent text-text-2 hover:border-text hover:text-text",
              )}>{f.label}</button>
          );
        })}
      </div>
    </div>
  );
}


export default function CollectionFilters({ activeFilters }: { activeFilters: ActiveFilters }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const updateFilter = useCallback((key: FilterKey, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(key) === value) params.delete(key);
    else params.set(key, value);
    params.delete("cursor");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    setOpen(false);
  }, [pathname, router, searchParams]);

  const clearAll = useCallback(() => {
    router.push(pathname);
    setOpen(false);
  }, [pathname, router]);

  const activeCount = (["genre", "pays", "tissu", "style"] as const).filter((k) => activeFilters[k]).length;
  const sortLabel = FILTERS.sort.find((s) => s.value === (activeFilters.sort ?? "recent"))?.label;

  const body = (
    <div>
      <FilterGroup title="Genre" options={FILTERS.genre} active={activeFilters.genre} onSelect={(v) => updateFilter("genre", v)} />
      <FilterGroup title="Pays" options={FILTERS.pays} active={activeFilters.pays} onSelect={(v) => updateFilter("pays", v)} />
      <FilterGroup title="Tissu" options={FILTERS.tissu} active={activeFilters.tissu} onSelect={(v) => updateFilter("tissu", v)} />
      <FilterGroup title="Style" options={FILTERS.style} active={activeFilters.style} onSelect={(v) => updateFilter("style", v)} />
      <div className="py-6">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.25em] text-text-3">Trier par</p>
        <div className="flex flex-col gap-1">
          {FILTERS.sort.map((f) => {
            const isActive = (activeFilters.sort ?? "recent") === f.value;
            return (
              <button key={f.value} type="button" onClick={() => updateFilter("sort", f.value)} aria-pressed={isActive}
                className={cn("rounded-none px-0 py-1.5 text-left font-serif text-lg leading-snug transition-colors duration-300",
                  isActive ? "text-text underline decoration-gold underline-offset-4" : "text-text-3 hover:text-text")}>{f.label}</button>
            );
          })}
        </div>
      </div>
      {activeCount > 0 && (
        <button type="button" onClick={clearAll}
          className="mt-2 border-b border-gold pb-0.5 text-[11px] font-medium uppercase tracking-[0.2em] text-text transition-colors hover:text-gold-dark">
          Reinitialiser les filtres</button>
      )}
    </div>
  );

  return (
    <>
      <div className="mb-6 flex items-center justify-between lg:hidden">
        <button type="button" onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 border border-line px-4 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-text">
          <SlidersHorizontal size={14} />Filtres{activeCount > 0 && <span>({activeCount})</span>}</button>
        <p className="text-[11px] uppercase tracking-[0.2em] text-text-3">Trier : {sortLabel}</p>
      </div>
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-24">{body}</div>
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-sm flex-col bg-bg text-text px-6 py-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b border-line pb-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-text">Filtres</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fermer les filtres" className="text-text"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto">{body}</div>
          </div>
        </div>
      )}
    </>
  );
}
