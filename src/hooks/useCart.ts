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
  getCart,
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
            background: "var(--toast-surface)",
            color: "var(--text)",
            border: "1px solid rgba(197,160,89,0.35)",
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
            background: "var(--toast-surface)",
            color: "var(--text)",
            border: "1px solid rgba(197,160,89,0.35)",
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
   * Resynchronise le panier persisté avec la Storefront API.
   *
   * Trou d'audit (F8) : `getCart()` n'était jamais appelé. Un panier
   * expiré ou supprimé côté Shopify restait donc affiché dans le tiroir, et la
   * prochaine mutation (`cartLinesAdd`) échouait sur un `cartLinesAdd: null`
   * sans message. `syncCart()` ferme ce trou :
   *   • panier encore valide  → on rafraîchit prix / lignes / checkoutUrl ;
   *   • panier introuvable     → on PURGE le store local et on previent l'utilisateur.
   *
   * Appelé au montage de la page `/cart` et à l'ouverture du tiroir.
   */
  const syncCart = useCallback(async () => {
    const cartId = shopifyCart?.id;
    if (!cartId) return null;

    setLoading(true);
    try {
      const fresh = await getCart(cartId);

      if (!fresh) {
        // Panier expiré / supprimé chez Shopify : le local doit disparaître,
        // sinon l'UI affiche un panier fantôme non modifiable.
        clearCart();
        toast("Votre panier a expiré — il a été réinitialisé.", {
          icon: "✦",
          style: {
            background: "var(--toast-surface)",
            color: "var(--text)",
            border: "1px solid rgba(197,160,89,0.35)",
          },
        });
        return null;
      }

      setShopifyCart(fresh);
      return fresh;
    } catch (error) {
      console.error("syncCart error:", error);
      // Panneau réseau : on garde l'état local plutôt que de perdre le panier
      // d'un simple souci de connectivité.
      return null;
    } finally {
      setLoading(false);
    }
  }, [shopifyCart, setShopifyCart, clearCart, setLoading]);

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
    syncCart,
  };
}