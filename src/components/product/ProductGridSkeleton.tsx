// src/components/product/ProductGridSkeleton.tsx
// ────────────────────────────────────────────────────────────────────────────
//  Skeletons épurés du catalogue — ratio lookbook 3:4, angles nets.
// ────────────────────────────────────────────────────────────────────────────

export default function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      aria-busy="true"
      aria-label="Chargement de la sélection"
      className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3 lg:grid-cols-4"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[3/4] rounded-none bg-neutral-200" />
          <div className="mt-3 h-3 w-1/3 bg-neutral-200" />
          <div className="mt-2 h-4 w-3/4 bg-neutral-200" />
          <div className="mt-2 h-3 w-1/4 bg-neutral-200" />
        </div>
      ))}
    </div>
  );
}
