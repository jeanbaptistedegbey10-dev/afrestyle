// src/components/cart/CartDrawer.tsx — version finale avec Shopify
// Thème clair éditorial + checkout Shopify en nouvel onglet.
"use client";

import { useCart } from "@/hooks/useCart";
import { X, ShoppingBag, Plus, Minus, Trash2, Loader2, ExternalLink } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { useMounted } from "@/hooks/useMounted";

export default function CartDrawer() {
  // L'état du panier vient du store Zustand persisté dans localStorage :
  // au premier rendu client, la persistance n'est pas encore réhydratée
  // (SSR : panier vide). On ne rend le contenu dynamique qu'après le
  // montage pour éviter tout mismatch d'hydratation.
  const isMounted = useMounted();
  const {
    lines,
    isOpen,
    isLoading,
    closeCart,
    updateItem,
    removeItem,
    checkoutUrl,
    cart,
  } = useCart();

  const subtotal = cart?.cost.subtotalAmount;
  const total = cart?.cost.totalAmount;
  const canCheckout = Boolean(checkoutUrl) && lines.length > 0;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full w-full max-w-md z-50 flex flex-col transition-transform duration-300 ease-in-out"
        style={{
          backgroundColor: "#FAF8F5",
          color: "#1A1A1A",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.08)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center gap-3">
            <ShoppingBag size={18} style={{ color: "#B8860B" }} />
            <h2 className="font-serif text-lg" style={{ color: "#1A1A1A" }}>
              Votre panier
            </h2>
            {lines.length > 0 && (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: "#C5A059", color: "#FFFFFF" }}
              >
                {cart?.totalQuantity}
              </span>
            )}
          </div>
          <button onClick={closeCart} aria-label="Fermer le panier" style={{ color: "#4A4A44" }}>
            <X size={18} />
          </button>
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div
            className="absolute inset-0 flex items-center justify-center z-10"
            style={{ background: "rgba(250,248,245,0.7)" }}
          >
            <Loader2 size={32} className="animate-spin" style={{ color: "#C5A059" }} />
          </div>
        )}

        {/* Contenu — rendu seulement après montage (persistance Zustand) */}
        {!isMounted || lines.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
            <ShoppingBag size={48} style={{ color: "rgba(197,160,89,0.4)" }} />
            <p className="font-serif text-xl" style={{ color: "#1A1A1A" }}>
              Votre panier est vide
            </p>
            <p className="text-sm text-center" style={{ color: "#4A4A44" }}>
              Découvrez nos créateurs et trouvez la pièce unique qui vous ressemble.
            </p>
            <Link href="/collections" onClick={closeCart} className="btn-primary mt-2">
              Explorer la collection
            </Link>
          </div>
        ) : (
          <>
            {/* Liste lignes */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {lines.map((line) => (
                <div
                  key={line.id}
                  className="flex gap-4 pb-4"
                  style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
                >
                  {/* Image */}
                  <div
                    className="w-20 h-24 flex-shrink-0 overflow-hidden"
                    style={{ background: "#F0ECE4", borderRadius: "2px" }}
                  >
                    {line.merchandise.image ? (
                      <Image
                        src={line.merchandise.image.url}
                        alt={line.merchandise.image.altText ?? line.merchandise.product.title}
                        width={80}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={20} style={{ color: "rgba(197,160,89,0.5)" }} />
                      </div>
                    )}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-serif text-sm leading-tight mb-1 truncate"
                      style={{ color: "#1A1A1A" }}
                    >
                      {line.merchandise.product.title}
                    </h3>
                    {line.merchandise.title !== "Default Title" && (
                      <p className="text-xs mb-2" style={{ color: "#8A857A" }}>
                        {line.merchandise.title}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantité */}
                      <div
                        className="flex items-center gap-3 px-3 py-1"
                        style={{
                          border: "1px solid rgba(0,0,0,0.08)",
                          borderRadius: "2px",
                        }}
                      >
                        <button
                          onClick={() => updateItem(line.id, line.quantity - 1)}
                          disabled={isLoading}
                          aria-label="Diminuer la quantité"
                          style={{ color: "#4A4A44" }}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs w-4 text-center" style={{ color: "#1A1A1A" }}>
                          {line.quantity}
                        </span>
                        <button
                          onClick={() => updateItem(line.id, line.quantity + 1)}
                          disabled={isLoading}
                          aria-label="Augmenter la quantité"
                          style={{ color: "#4A4A44" }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Prix ligne */}
                      <span className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                        {formatPrice(
                          String(parseFloat(line.merchandise.price.amount) * line.quantity),
                          line.merchandise.price.currencyCode
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Supprimer */}
                  <button
                    onClick={() => removeItem(line.id)}
                    disabled={isLoading}
                    aria-label="Retirer l'article"
                    className="self-start mt-1"
                    style={{ color: "#8A857A" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer checkout */}
            <div
              className="px-6 py-5 space-y-4"
              style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
            >
              {/* Sous-total */}
              {subtotal && (
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: "#4A4A44" }}>
                    Sous-total
                  </span>
                  <span className="font-serif text-lg font-bold" style={{ color: "#1A1A1A" }}>
                    {formatPrice(subtotal.amount, subtotal.currencyCode)}
                  </span>
                </div>
              )}

              {/* Total avec taxes */}
              {total && total.amount !== subtotal?.amount && (
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: "#4A4A44" }}>
                    Total (taxes incluses)
                  </span>
                  <span className="font-medium" style={{ color: "#B8860B" }}>
                    {formatPrice(total.amount, total.currencyCode)}
                  </span>
                </div>
              )}

              <p className="text-xs" style={{ color: "#8A857A" }}>
                Frais de livraison calculés au checkout
              </p>

              {/* Bouton checkout → ouvre le checkout Shopify dans un NOUVEL ONGLET */}
              <a
                href={canCheckout ? checkoutUrl : undefined}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (!canCheckout) e.preventDefault();
                }}
                aria-disabled={!canCheckout}
                className="w-full py-4 text-sm font-medium tracking-widest uppercase transition-all duration-200 flex items-center justify-center gap-2 no-underline"
                style={{
                  background: canCheckout ? "#1A1A1A" : "#D8D4CC",
                  color: canCheckout ? "#FAF8F5" : "#8A857A",
                  borderRadius: "2px",
                  cursor: canCheckout ? "pointer" : "not-allowed",
                }}
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    Procéder au paiement
                    <ExternalLink size={14} />
                  </>
                )}
              </a>

              <button
                onClick={closeCart}
                className="w-full text-xs tracking-widest uppercase text-center py-2"
                style={{ color: "#4A4A44" }}
              >
                Continuer mes achats
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}