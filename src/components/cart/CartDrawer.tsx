// src/components/cart/CartDrawer.tsx
"use client";

import { useCartStore } from "@/lib/store/cart.store";
import { X, ShoppingBag, Plus, Minus, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice } =
    useCartStore();

  return (
    <>
      {/* Overlay sombre derrière le drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md z-50 flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{ backgroundColor: "#1E293B" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <ShoppingBag size={18} style={{ color: "#D4AF37" }} />
            <h2 className="font-serif text-lg" style={{ color: "#FDFAF4" }}>
              Votre panier
            </h2>
            {items.length > 0 && (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: "#D4AF37", color: "#0F172A" }}
              >
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            aria-label="Fermer le panier"
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{ color: "#D4CCBA" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenu */}
        {items.length === 0 ? (
          /* Panier vide */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
            <ShoppingBag size={48} style={{ color: "rgba(212,175,55,0.2)" }} />
            <p className="font-serif text-xl" style={{ color: "#FDFAF4" }}>
              Votre panier est vide
            </p>
            <p className="text-sm text-center" style={{ color: "#D4CCBA" }}>
              Découvrez nos créateurs et trouvez la pièce unique qui vous
              ressemble.
            </p>
            <Link
              href="/collections"
              onClick={closeCart}
              className="btn-primary mt-2"
            >
              Explorer la collection
            </Link>
          </div>
        ) : (
          <>
            {/* Liste des items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.map((item) => (
                <div
                  key={item.variantId}
                  className="flex gap-4 pb-4 border-b"
                  style={{ borderColor: "rgba(255,255,255,0.08)" }}
                >
                  {/* Image */}
                  <div
                    className="w-20 h-24 flex-shrink-0 overflow-hidden rounded-sm"
                    style={{ background: "#0F172A" }}
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={80}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag
                          size={24}
                          style={{ color: "rgba(212,175,55,0.2)" }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-serif text-sm leading-tight mb-1 truncate"
                      style={{ color: "#FDFAF4" }}
                    >
                      {item.title}
                    </h3>
                    {item.variantTitle !== "Default Title" && (
                      <p className="text-xs mb-2" style={{ color: "#D4CCBA" }}>
                        {item.variantTitle}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      {/* Quantité */}
                      <div
                        className="flex items-center gap-2 border rounded-sm px-2 py-1"
                        style={{ borderColor: "rgba(212,175,55,0.2)" }}
                      >
                        <button
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity - 1)
                          }
                          aria-label="Diminuer"
                          style={{ color: "#D4CCBA" }}
                        >
                          <Minus size={12} />
                        </button>
                        <span
                          className="text-xs w-4 text-center"
                          style={{ color: "#F5F0E8" }}
                        >
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity + 1)
                          }
                          aria-label="Augmenter"
                          style={{ color: "#D4CCBA" }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Prix */}
                      <span
                        className="text-sm font-medium"
                        style={{ color: "#D4AF37" }}
                      >
                        {formatPrice(
                          String(parseFloat(item.price) * item.quantity),
                          item.currencyCode,
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Supprimer */}
                  <button
                    onClick={() => removeItem(item.variantId)}
                    aria-label="Supprimer"
                    className="self-start mt-1 transition-colors"
                    style={{ color: "#D4CCBA" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer — Total + Checkout */}
            <div
              className="px-6 py-5 border-t space-y-4"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              {/* Sous-total */}
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: "#D4CCBA" }}>
                  Sous-total
                </span>
                <span
                  className="font-serif text-lg font-bold"
                  style={{ color: "#FDFAF4" }}
                >
                  {formatPrice(
                    String(totalPrice()),
                    items[0]?.currencyCode ?? "EUR",
                  )}
                </span>
              </div>

              <p className="text-xs" style={{ color: "#D4CCBA" }}>
                Taxes et frais de livraison calculés au checkout
              </p>

              {/* Bouton Checkout */}
              <button className="btn-primary w-full justify-center text-sm">
                Procéder au paiement →
              </button>

              {/* Continuer les achats */}
              <button
                onClick={closeCart}
                className="w-full text-xs tracking-widest uppercase text-center transition-colors py-2"
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
