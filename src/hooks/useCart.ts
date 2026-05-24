// src/hooks/useCart.ts
// Ce hook centralise toute la logique du panier
// En entretien: "J'extrait la logique métier dans des hooks custom
// pour garder les composants UI légers et testables."
"use client";

import { useCallback } from "react";
import { useCartStore } from "@/lib/store/cart.store";
import {
  createCart,
  addToCart,
  updateCartLine,
  removeCartLine,
} from "@/lib/shopify/cart";
import toast from "react-hot-toast";

export function useCart() {
  const {
    shopifyCart,
    isOpen,
    isLoading,
    setShopifyCart,
    openCart,
    closeCart,
    setLoading,
    clearCart,
    totalItems,
    lines,
    checkoutUrl,
  } = useCartStore();

  /**
   * Ajoute un produit au panier
   * Crée le panier Shopify si c'est le premier item
   */
  const addItem = useCallback(
    async (variantId: string, quantity: number = 1) => {
      setLoading(true);
      try {
        let updatedCart;

        if (!shopifyCart) {
          // Premier item — crée un nouveau panier Shopify
          updatedCart = await createCart(variantId, quantity);
        } else {
          // Panier existant — ajoute la ligne
          updatedCart = await addToCart(shopifyCart.id, variantId, quantity);
        }

        setShopifyCart(updatedCart);
        openCart();
        toast.success("Ajouté au panier !", {
          icon: "✦",
          style: {
            background: "#1E293B",
            color: "#F5F0E8",
            border: "1px solid rgba(212,175,55,0.3)",
          },
        });
      } catch (error) {
        toast.error("Erreur lors de l'ajout au panier");
        console.error("addItem error:", error);
      } finally {
        setLoading(false);
      }
    },
    [shopifyCart, setShopifyCart, openCart, setLoading]
  );

  /**
   * Met à jour la quantité d'une ligne
   * Si quantity === 0, supprime la ligne
   */
  const updateItem = useCallback(
    async (lineId: string, quantity: number) => {
      if (!shopifyCart) return;
      setLoading(true);
      try {
        let updatedCart;
        if (quantity === 0) {
          updatedCart = await removeCartLine(shopifyCart.id, lineId);
        } else {
          updatedCart = await updateCartLine(shopifyCart.id, lineId, quantity);
        }
        setShopifyCart(updatedCart);
      } catch (error) {
        toast.error("Erreur lors de la mise à jour");
        console.error("updateItem error:", error);
      } finally {
        setLoading(false);
      }
    },
    [shopifyCart, setShopifyCart, setLoading]
  );

  /**
   * Supprime une ligne du panier
   */
  const removeItem = useCallback(
    async (lineId: string) => {
      if (!shopifyCart) return;
      setLoading(true);
      try {
        const updatedCart = await removeCartLine(shopifyCart.id, lineId);
        setShopifyCart(updatedCart);
        toast.success("Article retiré", {
          style: {
            background: "#1E293B",
            color: "#F5F0E8",
            border: "1px solid rgba(212,175,55,0.3)",
          },
        });
      } catch (error) {
        toast.error("Erreur lors de la suppression");
        console.error("removeItem error:", error);
      } finally {
        setLoading(false);
      }
    },
    [shopifyCart, setShopifyCart, setLoading]
  );

  /**
   * Redirige vers le checkout Shopify
   */
  const goToCheckout = useCallback(() => {
    const url = checkoutUrl();
    if (!url) {
      toast.error("Votre panier est vide");
      return;
    }
    // Redirection vers checkout.shopify.com
    window.location.href = url;
  }, [checkoutUrl]);

  return {
    cart: shopifyCart,
    lines: lines(),
    totalItems: totalItems(),
    checkoutUrl: checkoutUrl(),
    isOpen,
    isLoading,
    openCart,
    closeCart,
    addItem,
    updateItem,
    removeItem,
    goToCheckout,
    clearCart,
  };
}