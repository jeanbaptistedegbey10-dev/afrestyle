// src/lib/product/variants.ts
// Phase 4 — Machine à états de sélection des variantes (pur, testable, sans React).
//
// Modèle Shopify visé :
//   product.options = [{ name: "Taille", values: ["S","M","L"] },
//                      { name: "Tissu",  values: ["Kente","Bogolan"] }]
//   product.variants = [{ id, availableForSale, price, compareAtPrice,
//                         selectedOptions: [{name:"Taille",value:"M"}, ...],
//                         image }]
//
// Règle d'or : la variante affichée / ajoutée au panier est TOUJOURS le résultat
// d'une correspondance EXACTE sur TOUTES les options (every), jamais d'un `some()`
// partiel qui renverrait la mauvaise variante (bug F1/F2 de l'ancien ProductForm).

import type {
  Product,
  SelectedOptions,
  ShopifyVariant,
} from "@/lib/shopify/types";

/** Noms des options dans l'ordre Shopify (ex: ["Taille", "Tissu", "Couleur"]). */
export function getOptionNames(product: Product): string[] {
  return product.options.map((o) => o.name);
}

/** Valeurs d'une option (source de vérité = `product.options`, jamais filtrées sur le stock). */
export function getOptionValues(product: Product, optionName: string): string[] {
  const declared = product.options.find((o) => o.name === optionName);
  if (declared) return [...declared.values];
  // Fallback : déduplique depuis les variantes (payloads sans `options`).
  const seen = new Set<string>();
  for (const v of product.variants) {
    for (const o of v.selectedOptions) {
      if (o.name === optionName && o.value !== "Default Title") seen.add(o.value);
    }
  }
  return [...seen];
}

/**
 * Sélection initiale : la première variante disponible à la vente,
 * sinon la première variante. Garantit un état complet
 * ({ Taille: "M", Tissu: "Kente" }) dès le premier rendu.
 */
export function getDefaultSelectedOptions(product: Product): SelectedOptions {
  const seed =
    product.variants.find((v) => v.availableForSale) ?? product.variants[0];
  if (!seed) return {};
  return Object.fromEntries(
    seed.selectedOptions.map((o) => [o.name, o.value]),
  );
}

/**
 * Résout la variante EXACTE correspondant à la sélection courante.
 * Retourne `undefined` si la combinaison n'existe pas (état transitoire
 * pendant que l'utilisateur change d'option).
 */
export function findExactVariant(
  variants: ShopifyVariant[],
  selected: SelectedOptions,
): ShopifyVariant | undefined {
  const names = Object.keys(selected);
  if (names.length === 0) return variants.find((v) => v.availableForSale) ?? variants[0];
  return variants.find((v) =>
    names.every((name) =>
      v.selectedOptions.some((o) => o.name === name && o.value === selected[name]),
    ),
  );
}

/**
 * Une valeur d'option est proposée si AU MOINS une variante existe pour la
 * combinaison hypothétique `{ ...selected, [optionName]: value }`.
 * On distingue ensuite :
 *  - `exists === false` → combinaison inexistante (grisée + désactivée) ;
 *  - `exists && !purchasable` → combinaison épuisée (barrée + désactivée, tooltip).
 */
export function getOptionValueState(
  variants: ShopifyVariant[],
  selected: SelectedOptions,
  optionName: string,
  value: string,
): { exists: boolean; purchasable: boolean } {
  const hypothetical: SelectedOptions = { ...selected, [optionName]: value };
  const names = Object.keys(hypothetical);
  let exists = false;
  let purchasable = false;
  for (const v of variants) {
    const matches = names.every((name) =>
      v.selectedOptions.some((o) => o.name === name && o.value === hypothetical[name]),
    );
    if (matches) {
      exists = true;
      if (v.availableForSale) {
        purchasable = true;
        break;
      }
    }
  }
  return { exists, purchasable };
}

/** Vrai si le produit n'a qu'une variante "Default Title" (aucune option réelle). */
export function isSingleDefaultVariant(product: Product): boolean {
  return (
    product.options.length === 0 ||
    (product.variants.length === 1 &&
      product.variants[0].selectedOptions.every((o) => o.value === "Default Title"))
  );
}
