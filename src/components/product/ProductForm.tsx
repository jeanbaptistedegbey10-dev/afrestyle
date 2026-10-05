// src/components/product/ProductForm.tsx
// Phase 4 — Refonte du sélecteur de variantes (Taille × Tissu × Couleur).
// L'ancien sélecteur résolvait avec `some()` (match partiel) : prix incorrects
// et combinaisons inexistantes commandables. Ici la variante est TOUJOURS une
// correspondance EXACTE sur TOUTES les options (voir lib/product/variants.ts).
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Heart, Minus, Plus, ShoppingBag } from "lucide-react";
import { isMockVariantId, MADE_TO_MEASURE_SIZE } from "@/constants/catalog";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
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
  /**
   * Courte description éditoriale (matières, coupe, livraison) — affichée sous
   * le prix pour respecter l'ordre de lecture : titre → note → prix → résumé.
   */
  shortDescription?: string | null;
  /** La pièce accepte une commande aux mesures du client. */
  madeToMeasure?: boolean;
};

export default function ProductForm({
  product,
  onVariantChange,
  shortDescription = null,
  madeToMeasure = false,
}: ProductFormProps) {
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
  // Wishlist PERSISTÉE (localStorage) — cohérente avec la carte produit et la
  // page `/wishlist` : un favori ajouté ici est retrouvé après rechargement.
  const { isWishlisted, toggleProduct } = useWishlist();
  const wishlisted = isWishlisted(product.handle);

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

  // Devise d'affichage harmonisée (EUR) — voir src/constants/store.ts.
  const priceLabel = selectedVariant
    ? formatPrice(selectedVariant.price.amount)
    : product.priceFormatted;
  const compareLabel = selectedVariant?.compareAtPrice
    ? formatPrice(selectedVariant.compareAtPrice.amount)
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

  // Variante issue du catalogue de référence (mode repli) : le panier Shopify
  // ne peut pas la traiter — l'interface propose une commande par contact.
  const isPlaceholderVariant = isMockVariantId(selectedVariant?.id);

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

      {/* Courte description éditoriale — placée sous le titre, la note et le
          prix, conformément à l'ordre de lecture de la fiche produit. */}
      {shortDescription && (
        <p
          className="font-serif text-base leading-relaxed"
          style={{ color: "var(--text-2)" }}
        >
          {shortDescription}
        </p>
      )}

      <div style={{ height: "1px", background: "var(--line)" }} />

      {/* Pièce sans déclinaison réelle (bijou, étole, pagne…) : on l'annonce
          explicitement au lieu de masquer le champ — le client sait ce qu'il
          achète. */}
      {isSingleVariant && (
        <div className="flex items-center gap-3">
          <span
            className="text-xs uppercase tracking-widest"
            style={{ color: "var(--gold-dark)" }}
          >
            Taille
          </span>
          <span
            className="rounded-sm border px-4 py-2 text-sm"
            style={{
              borderColor: "var(--gold)",
              color: "var(--text)",
              background:
                "color-mix(in srgb, var(--gold) 12%, var(--surface))",
            }}
          >
            Taille unique
          </span>
        </div>
      )}

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
                          ? {
                              // État actif : contour OR (#B89A62 → var(--gold))
                              // renforcé par un liseré intérieur, fond teinté.
                              background:
                                "color-mix(in srgb, var(--gold) 18%, var(--surface))",
                              color: "var(--text)",
                              borderColor: "var(--gold)",
                              boxShadow: "inset 0 0 0 1px var(--gold)",
                              fontWeight: 600,
                            }
                          : disabled
                            ? {
                                background: "var(--surface-2)",
                                color: "var(--text-3)",
                                borderColor: "var(--line)",
                                opacity: 0.7,
                                textDecoration: soldOut
                                  ? "line-through"
                                  : undefined,
                              }
                            : {
                                background: "var(--surface)",
                                color: "var(--text)",
                                borderColor: "var(--line)",
                              }
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

      {/* Confection sur-mesure — service distinct, jamais présenté comme une
          variante épuisée : la pièce est taillée aux mesures du client. */}
      {madeToMeasure && (
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>
          <Link
            href="/contact"
            className="underline underline-offset-2"
            style={{ color: "var(--gold-dark)" }}
          >
            {MADE_TO_MEASURE_SIZE}
          </Link>{" "}
          — pièce confectionnée à vos mesures : transmettez-nous vos mensurations,
          nous revenons vers vous avec le délai d&apos;atelier.
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
        {isPlaceholderVariant ? (
          // Catalogue de référence (boutique injoignable) : les identifiants de
          // variante ne viennent pas de Shopify et ne peuvent pas être envoyés
          // au panier. On propose donc une commande accompagnée plutôt qu'un
          // bouton qui échouerait à l'ajout.
          <Link
            href="/contact"
            className="btn-primary flex-1 justify-center py-4 text-sm tracking-widest uppercase"
          >
            <ShoppingBag size={16} aria-hidden="true" />
            Commander — nous contacter
          </Link>
        ) : (
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
        )}

        <button
          type="button"
          onClick={() => toggleProduct(product)}
          aria-label={
            wishlisted
              ? `Retirer ${product.title} des favoris`
              : `Ajouter ${product.title} aux favoris`
          }
          aria-pressed={wishlisted}
          className="w-14 flex items-center justify-center border rounded-sm transition-all duration-200"
          style={{
            borderColor: wishlisted ? "var(--gold)" : "var(--line)",
            color: wishlisted ? "var(--gold)" : "var(--text-2)",
            background: "var(--surface)",
          }}
        >
          <Heart size={18} fill={wishlisted ? "var(--gold)" : "none"} />
        </button>
      </div>

      {isPlaceholderVariant && (
        <p className="text-xs" style={{ color: "var(--text-3)" }}>
          Boutique momentanément injoignable : votre commande est prise en charge
          par notre équipe, au prix affiché ci-dessus.
        </p>
      )}

      {!selectedVariant && (
        <p className="text-xs" role="alert" style={{ color: "#B45309" }}>
          Cette combinaison n&apos;existe pas. Modifiez une option pour retrouver
          une variante disponible.
        </p>
      )}
    </div>
  );
}
