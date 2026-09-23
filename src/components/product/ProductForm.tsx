// src/components/product/ProductForm.tsx
// Phase 4 — Refonte du sélecteur de variantes (Taille × Tissu × Couleur).
// L'ancien sélecteur résolvait avec `some()` (match partiel) : prix incorrects
// et combinaisons inexistantes commandables. Ici la variante est TOUJOURS une
// correspondance EXACTE sur TOUTES les options (voir lib/product/variants.ts).
"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { formatPrice } from "@/lib/utils";
import {
  findExactVariant,
  getDefaultSelectedOptions,
  getOptionValueState,
  getOptionValues,
  isSingleDefaultVariant,
} from "@/lib/product/variants";
import type {
  Product,
  SelectedOptions,
  ShopifyVariant,
} from "@/lib/shopify/types";

export const VARIANT_IMAGE_EVENT = "afrestyle:variant-change";

export type VariantChangeDetail = {
  variantId: string | null;
  imageUrl: string | null;
};

type ProductFormProps = {
  product: Product;
  onVariantChange?: (variant: ShopifyVariant | undefined) => void;
};

export default function ProductForm({ product, onVariantChange }: ProductFormProps) {
  const { addItem, isLoading: isCartLoading } = useCart();

  // NOTE : le parent remonte ce composant avec `key={product.id}` (voir
  // `app/products/[handle]/page.tsx`) : changer de produit réinitialise donc
  // `selectedOptions` / `quantity` sans setState dans un effet.
  const [selectedOptions, setSelectedOptions] = useState<SelectedOptions>(() =>
    getDefaultSelectedOptions(product),
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const selectedVariant = useMemo(
    () => findExactVariant(product.variants, selectedOptions),
    [product.variants, selectedOptions],
  );

  const isSingleVariant = useMemo(() => isSingleDefaultVariant(product), [product]);
  const inStock = selectedVariant?.availableForSale ?? false;
  const canAddToCart =
    Boolean(selectedVariant) && inStock && !isAdding && !isCartLoading;

  useEffect(() => {
    const detail: VariantChangeDetail = {
      variantId: selectedVariant?.id ?? null,
      imageUrl: selectedVariant?.image?.url ?? null,
    };
    onVariantChange?.(selectedVariant);
    window.dispatchEvent(new CustomEvent(VARIANT_IMAGE_EVENT, { detail }));
  }, [selectedVariant, onVariantChange]);

  function handleSelectOption(optionName: string, value: string) {
    setSelectedOptions((prev) => {
      if (prev[optionName] === value) return prev;
      return { ...prev, [optionName]: value };
    });
    setJustAdded(false);
  }

  async function handleAddToCart() {
    if (!selectedVariant || !selectedVariant.availableForSale) return;
    setIsAdding(true);
    try {
      await addItem(selectedVariant.id, quantity);
      setJustAdded(true);
      window.setTimeout(() => setJustAdded(false), 2500);
    } finally {
      setIsAdding(false);
    }
  }

  const currency = selectedVariant?.price.currencyCode ?? "EUR";
  const priceLabel = selectedVariant
    ? formatPrice(selectedVariant.price.amount, currency)
    : product.priceFormatted;
  const compareLabel = selectedVariant?.compareAtPrice
    ? formatPrice(selectedVariant.compareAtPrice.amount, selectedVariant.compareAtPrice.currencyCode)
    : null;
  const showPromo =
    Boolean(selectedVariant?.compareAtPrice) &&
    selectedVariant != null &&
    parseFloat(selectedVariant.compareAtPrice!.amount) >
      parseFloat(selectedVariant.price.amount);

  const maxQuantity =
    typeof selectedVariant?.quantityAvailable === "number" &&
    selectedVariant.quantityAvailable > 0
      ? Math.min(selectedVariant.quantityAvailable, 10)
      : 10;

  return (
    <div className="space-y-6">
      {/* Prix + dispo : synchronisés sur la variante exacte */}
      <div className="space-y-2" aria-live="polite">
        <div className="flex items-center gap-4">
          <span className="font-serif text-3xl font-bold" style={{ color: "var(--text)" }}>
            {priceLabel}
          </span>
          {showPromo && (
            <span className="text-lg line-through" style={{ color: "var(--text-3)" }}>
              {compareLabel}
            </span>
          )}
        </div>
        <p className="flex items-center gap-2 text-sm">
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: !selectedVariant ? "var(--text-3)" : inStock ? "#22c55e" : "#ef4444" }}
          />
          {!selectedVariant ? (
            <span style={{ color: "var(--text-3)" }}>Combinaison indisponible</span>
          ) : inStock ? (
            <span style={{ color: "#15803d" }}>En stock</span>
          ) : (
            <span style={{ color: "#b91c1c" }}>Épuisé</span>
          )}
          {selectedVariant?.sku && (
            <span className="text-xs" style={{ color: "var(--text-3)" }}>
              · Réf. {selectedVariant.sku}
            </span>
          )}
        </p>
      </div>

      <div style={{ height: "1px", background: "var(--line)" }} />

      {!isSingleVariant &&
        product.options.map((option) => {
          const values = getOptionValues(product, option.name);
          if (values.length === 0) return null;
          return (
            <fieldset key={option.name}>
              <legend className="text-xs tracking-widest uppercase mb-3" style={{ color: "var(--gold-dark)" }}>
                {option.name}
                <span className="ml-2 normal-case tracking-normal" style={{ color: "var(--text-2)" }}>
                  — {selectedOptions[option.name] ?? "à choisir"}
                </span>
              </legend>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={option.name}>
                {values.map((value) => {
                  const isSelected = selectedOptions[option.name] === value;
                  const st = getOptionValueState(product.variants, selectedOptions, option.name, value);
                  const disabled = !st.exists || !st.purchasable;
                  const soldOut = st.exists && !st.purchasable;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      disabled={disabled}
                      title={!st.exists ? `${value} : inexistante` : soldOut ? `${value} : épuisé` : value}
                      onClick={() => handleSelectOption(option.name, value)}
                      className="min-w-[3rem] px-4 py-2 text-sm border rounded-sm transition-all duration-200 disabled:cursor-not-allowed"
                      style={
                        isSelected
                          ? { background: "var(--text)", color: "var(--bg)", borderColor: "var(--text)", fontWeight: 600 }
                          : disabled
                            ? { background: "var(--surface-2)", color: "var(--text-3)", borderColor: "var(--line)", opacity: 0.7 }
                            : { background: "var(--surface)", color: "var(--text)", borderColor: "var(--line)" }
                      }
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}

      {selectedVariant && !isSingleVariant && (
        <p className="text-xs" style={{ color: "var(--text-3)" }} aria-live="polite">
          Sélection : {selectedVariant.selectedOptions.map((o) => o.value).join(" · ")}
        </p>
      )}

      {/* Quantité */}
      <div className="flex items-center gap-4">
        <span className="text-xs tracking-widest uppercase" style={{ color: "var(--gold-dark)" }}>
          Quantité
        </span>
        <div className="flex items-center border rounded-sm" style={{ borderColor: "var(--line)", background: "var(--surface)" }}>
          <button
            type="button"
            aria-label="Diminuer la quantité"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="px-3 py-2 disabled:opacity-30"
            style={{ color: "var(--text)" }}
          >
            <Minus size={14} />
          </button>
          <span className="w-8 text-center text-sm font-medium" style={{ color: "var(--text)" }}>
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Augmenter la quantité"
            onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
            disabled={quantity >= maxQuantity}
            className="px-3 py-2 disabled:opacity-30"
            style={{ color: "var(--text)" }}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Boutons action : variante exacte + quantité */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!canAddToCart}
          className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium tracking-widest uppercase rounded-sm transition-all duration-200 disabled:cursor-not-allowed"
          style={
            !selectedVariant || !inStock
              ? { background: "var(--surface-2)", color: "var(--text-3)" }
              : justAdded
                ? { background: "#16a34a", color: "white" }
                : { background: "var(--text)", color: "var(--bg)" }
          }
        >
          <ShoppingBag size={16} />
          {!selectedVariant
            ? "Sélection indisponible"
            : !inStock
              ? "Épuisé"
              : isAdding || isCartLoading
                ? "Ajout en cours…"
                : justAdded
                  ? "✓ Ajouté au panier !"
                  : `Ajouter au panier — ${priceLabel}`}
        </button>

        <button
          type="button"
          onClick={() => setIsWishlisted((w) => !w)}
          aria-label="Ajouter aux favoris"
          aria-pressed={isWishlisted}
          className="w-14 flex items-center justify-center border rounded-sm transition-all duration-200"
          style={{
            borderColor: isWishlisted ? "var(--gold)" : "var(--line)",
            color: isWishlisted ? "var(--gold)" : "var(--text-2)",
            background: "var(--surface)",
          }}
        >
          <Heart size={18} fill={isWishlisted ? "var(--gold)" : "none"} />
        </button>
      </div>

      {!selectedVariant && (
        <p className="text-xs" role="alert" style={{ color: "#B45309" }}>
          Cette combinaison n&apos;existe pas. Modifiez une option pour retrouver
          une variante disponible.
        </p>
      )}
    </div>
  );
}
