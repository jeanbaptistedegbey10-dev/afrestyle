// src/components/product/ProductForm.tsx
"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/store/cart.store";
import { Heart, ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/shopify/types";

export default function ProductForm({ product }: { product: Product }) {
  const [selectedVariantId, setSelectedVariantId] = useState(
    product.variants[0]?.id ?? "",
  );
  const [isAdding, setIsAdding] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { addItem } = useCartStore();

  const selectedVariant = product.variants.find(
    (v) => v.id === selectedVariantId,
  );

  async function handleAddToCart() {
    if (!selectedVariant) return;
    setIsAdding(true);

    addItem({
      variantId: selectedVariant.id,
      productHandle: product.handle,
      title: product.title,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price.amount,
      currencyCode: selectedVariant.price.currencyCode,
      image: product.images[0]?.url ?? null,
      quantity: 1,
    });

    await new Promise((r) => setTimeout(r, 1200));
    setIsAdding(false);
  }

  // Grouper les options (Taille, Couleur)
  const optionNames = [
    ...new Set(
      product.variants.flatMap((v) => v.selectedOptions.map((o) => o.name)),
    ),
  ];

  return (
    <div className="space-y-5">
      {/* Sélecteur de variantes */}
      {optionNames.map((optionName) => {
        const values = [
          ...new Set(
            product.variants
              .filter((v) => v.availableForSale)
              .flatMap((v) =>
                v.selectedOptions
                  .filter((o) => o.name === optionName)
                  .map((o) => o.value),
              ),
          ),
        ];

        if (values.length <= 1 && values[0] === "Default Title") return null;

        return (
          <div key={optionName}>
            <p
              className="text-xs tracking-widest uppercase mb-3"
              style={{ color: "#D4AF37" }}
            >
              {optionName}
            </p>
            <div className="flex flex-wrap gap-2">
              {values.map((value) => {
                const variant = product.variants.find((v) =>
                  v.selectedOptions.some(
                    (o) => o.name === optionName && o.value === value,
                  ),
                );
                const isSelected = variant?.id === selectedVariantId;
                const isAvailable = variant?.availableForSale;

                return (
                  <button
                    key={value}
                    onClick={() => variant && setSelectedVariantId(variant.id)}
                    disabled={!isAvailable}
                    className="min-w-[3rem] px-4 py-2 text-sm border rounded-sm transition-all duration-200"
                    style={
                      isSelected
                        ? {
                            background: "#D4AF37",
                            color: "#0F172A",
                            borderColor: "#D4AF37",
                          }
                        : !isAvailable
                          ? {
                              background: "transparent",
                              color: "#334155",
                              borderColor: "#334155",
                              cursor: "not-allowed",
                            }
                          : {
                              background: "transparent",
                              color: "#F5F0E8",
                              borderColor: "rgba(212,175,55,0.3)",
                            }
                    }
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Boutons action */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleAddToCart}
          disabled={isAdding || !product.availableForSale}
          className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium tracking-widest uppercase rounded-sm transition-all duration-200"
          style={
            isAdding
              ? { background: "#16a34a", color: "white" }
              : { background: "#D4AF37", color: "#0F172A" }
          }
        >
          <ShoppingBag size={16} />
          {!product.availableForSale
            ? "Épuisé"
            : isAdding
              ? "✓ Ajouté au panier !"
              : "Ajouter au panier"}
        </button>

        <button
          onClick={() => setIsWishlisted(!isWishlisted)}
          aria-label="Ajouter aux favoris"
          className="w-14 flex items-center justify-center border rounded-sm transition-all duration-200"
          style={{
            borderColor: isWishlisted ? "#D4AF37" : "rgba(212,175,55,0.3)",
            color: isWishlisted ? "#D4AF37" : "#D4CCBA",
          }}
        >
          <Heart size={18} fill={isWishlisted ? "#D4AF37" : "none"} />
        </button>
      </div>
    </div>
  );
}
