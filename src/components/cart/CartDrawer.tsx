// src/components/cart/CartDrawer.tsx — version finale avec Shopify
"use client";

import { useCart } from "@/hooks/useCart";
import { X, ShoppingBag, Plus, Minus, Trash2, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

export default function CartDrawer() {
  const {
    lines,
    isOpen,
    isLoading,
    closeCart,
    updateItem,
    removeItem,
    goToCheckout,
    cart,
  } = useCart();

  const subtotal = cart?.cost.subtotalAmount;
  const total = cart?.cost.totalAmount;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full w-full max-w-md z-50 flex flex-col transition-transform duration-300 ease-in-out"
        style={{
          backgroundColor: "#1E293B",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: "0.5px solid rgba(255,255,255,0.1)" }}
        >
          <div className="flex items-center gap-3">
            <ShoppingBag size={18} style={{ color: "#D4AF37" }} />
            <h2 className="font-serif text-lg" style={{ color: "#FDFAF4" }}>
              Votre panier
            </h2>
            {lines.length > 0 && (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: "#D4AF37", color: "#0F172A" }}
              >
                {cart?.totalQuantity}
              </span>
            )}
          </div>
          <button onClick={closeCart} style={{ color: "#D4CCBA" }}>
            <X size={18} />
          </button>
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div
            className="absolute inset-0 flex items-center justify-center z-10"
            style={{ background: "rgba(30,41,59,0.7)" }}
          >
            <Loader2 size={32} className="animate-spin" style={{ color: "#D4AF37" }} />
          </div>
        )}

        {/* Contenu */}
        {lines.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
            <ShoppingBag size={48} style={{ color: "rgba(212,175,55,0.2)" }} />
            <p className="font-serif text-xl" style={{ color: "#FDFAF4" }}>
              Votre panier est vide
            </p>
            <p className="text-sm text-center" style={{ color: "#D4CCBA" }}>
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
                  style={{ borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}
                >
                  {/* Image */}
                  <div
                    className="w-20 h-24 flex-shrink-0 overflow-hidden"
                    style={{ background: "#0F172A", borderRadius: "2px" }}
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
                        <ShoppingBag size={20} style={{ color: "rgba(212,175,55,0.2)" }} />
                      </div>
                    )}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-serif text-sm leading-tight mb-1 truncate"
                      style={{ color: "#FDFAF4" }}
                    >
                      {line.merchandise.product.title}
                    </h3>
                    {line.merchandise.title !== "Default Title" && (
                      <p className="text-xs mb-2" style={{ color: "#D4CCBA" }}>
                        {line.merchandise.title}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantité */}
                      <div
                        className="flex items-center gap-3 px-3 py-1"
                        style={{
                          border: "0.5px solid rgba(212,175,55,0.2)",
                          borderRadius: "2px",
                        }}
                      >
                        <button
                          onClick={() => updateItem(line.id, line.quantity - 1)}
                          disabled={isLoading}
                          style={{ color: "#D4CCBA" }}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs w-4 text-center" style={{ color: "#F5F0E8" }}>
                          {line.quantity}
                        </span>
                        <button
                          onClick={() => updateItem(line.id, line.quantity + 1)}
                          disabled={isLoading}
                          style={{ color: "#D4CCBA" }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Prix ligne */}
                      <span className="text-sm font-medium" style={{ color: "#D4AF37" }}>
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
                    className="self-start mt-1"
                    style={{ color: "#D4CCBA" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer checkout */}
            <div
              className="px-6 py-5 space-y-4"
              style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)" }}
            >
              {/* Sous-total */}
              {subtotal && (
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: "#D4CCBA" }}>
                    Sous-total
                  </span>
                  <span className="font-serif text-lg font-bold" style={{ color: "#FDFAF4" }}>
                    {formatPrice(subtotal.amount, subtotal.currencyCode)}
                  </span>
                </div>
              )}

              {/* Total avec taxes */}
              {total && total.amount !== subtotal?.amount && (
                <div className="flex justify-between items-center">
                  <span className="text-sm" style={{ color: "#D4CCBA" }}>
                    Total (taxes incluses)
                  </span>
                  <span className="font-medium" style={{ color: "#D4AF37" }}>
                    {formatPrice(total.amount, total.currencyCode)}
                  </span>
                </div>
              )}

              <p className="text-xs" style={{ color: "#D4CCBA" }}>
                Frais de livraison calculés au checkout
              </p>

              {/* Bouton checkout → redirige vers Shopify */}
              <button
                onClick={goToCheckout}
                disabled={isLoading || lines.length === 0}
                className="w-full py-4 text-sm font-medium tracking-widest uppercase transition-all duration-200 flex items-center justify-center gap-2"
                style={{
                  background: isLoading ? "#A8871C" : "#D4AF37",
                  color: "#0F172A",
                  borderRadius: "2px",
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Procéder au paiement →"
                )}
              </button>

              <button
                onClick={closeCart}
                className="w-full text-xs tracking-widest uppercase text-center py-2"
                style={{ color: "#D4CCBA" }}
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