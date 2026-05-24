// src/app/account/page.tsx
import { getCurrentCustomer } from "@/lib/actions/auth.actions";
import { redirect } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth.actions";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mon compte" };

export default async function AccountPage() {
  const customer = await getCurrentCustomer();

  // Redirige vers login si non connecté
  if (!customer) redirect("/account/login");

  return (
    <div style={{ background: "#0F172A", minHeight: "100vh" }}>

      {/* Header */}
      <div
        className="py-12 px-6"
        style={{ borderBottom: "0.5px solid rgba(212,175,55,0.1)" }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "#D4AF37" }}>
              Espace personnel
            </p>
            <h1 className="font-serif text-4xl" style={{ color: "#FDFAF4" }}>
              Bonjour, {customer.firstName} ✦
            </h1>
            <p className="text-sm mt-1" style={{ color: "#D4CCBA" }}>
              {customer.email}
            </p>
          </div>
          {/* Bouton déconnexion — Server Action */}
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-xs tracking-widest uppercase px-4 py-2 transition-colors"
              style={{
                border: "0.5px solid rgba(212,175,55,0.2)",
                color: "#D4CCBA",
                borderRadius: "2px",
              }}
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">

        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-6">
          {[
            { num: customer.orders.length, label: "Commandes" },
            { num: customer.orders.filter(o => o.fulfillmentStatus === "FULFILLED").length, label: "Livrées" },
            { num: customer.defaultAddress ? "1" : "0", label: "Adresse" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-6 text-center"
              style={{
                background: "#1E293B",
                border: "0.5px solid rgba(212,175,55,0.1)",
                borderRadius: "2px",
              }}
            >
              <div className="font-serif text-4xl font-bold mb-1" style={{ color: "#D4AF37" }}>
                {stat.num}
              </div>
              <div className="text-xs tracking-widest uppercase" style={{ color: "#D4CCBA" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Commandes */}
        <div>
          <h2 className="font-serif text-2xl mb-6" style={{ color: "#FDFAF4" }}>
            Mes commandes
          </h2>

          {customer.orders.length === 0 ? (
            <div
              className="text-center py-12"
              style={{
                background: "#1E293B",
                border: "0.5px solid rgba(212,175,55,0.1)",
                borderRadius: "2px",
              }}
            >
              <p className="font-serif text-xl mb-4" style={{ color: "#FDFAF4" }}>
                Aucune commande pour l'instant
              </p>
              <a href="/collections" className="btn-primary inline-flex">
                Découvrir la collection
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {customer.orders.map((order) => (
                <div
                  key={order.id}
                  className="p-6"
                  style={{
                    background: "#1E293B",
                    border: "0.5px solid rgba(212,175,55,0.1)",
                    borderRadius: "2px",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-serif text-lg" style={{ color: "#FDFAF4" }}>
                        Commande #{order.orderNumber}
                      </p>
                      <p className="text-xs mt-1" style={{ color: "#D4CCBA" }}>
                        {new Date(order.processedAt).toLocaleDateString("fr-FR", {
                          day: "numeric", month: "long", year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-serif text-xl font-bold" style={{ color: "#D4AF37" }}>
                        {formatPrice(
                          order.currentTotalPrice.amount,
                          order.currentTotalPrice.currencyCode
                        )}
                      </p>
                      <StatusBadge status={order.fulfillmentStatus} />
                    </div>
                  </div>

                  {/* Articles */}
                  <div className="space-y-2">
                    {order.lineItems.slice(0, 3).map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {item.variant?.image && (
                          <img
                            src={item.variant.image.url}
                            alt={item.variant.image.altText ?? item.title}
                            className="w-10 h-12 object-cover"
                            style={{ borderRadius: "2px", background: "#0F172A" }}
                          />
                        )}
                        <div>
                          <p className="text-sm" style={{ color: "#F5F0E8" }}>
                            {item.title}
                          </p>
                          <p className="text-xs" style={{ color: "#D4CCBA" }}>
                            Qté : {item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                    {order.lineItems.length > 3 && (
                      <p className="text-xs" style={{ color: "#D4CCBA" }}>
                        +{order.lineItems.length - 3} autre(s) article(s)
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Adresse */}
        <div>
          <h2 className="font-serif text-2xl mb-6" style={{ color: "#FDFAF4" }}>
            Adresse de livraison
          </h2>
          {customer.defaultAddress ? (
            <div
              className="p-6"
              style={{
                background: "#1E293B",
                border: "0.5px solid rgba(212,175,55,0.1)",
                borderRadius: "2px",
              }}
            >
              <p style={{ color: "#F5F0E8" }}>{customer.defaultAddress.address1}</p>
              {customer.defaultAddress.address2 && (
                <p style={{ color: "#F5F0E8" }}>{customer.defaultAddress.address2}</p>
              )}
              <p style={{ color: "#F5F0E8" }}>
                {customer.defaultAddress.zip} {customer.defaultAddress.city}
              </p>
              <p style={{ color: "#D4CCBA" }}>{customer.defaultAddress.country}</p>
            </div>
          ) : (
            <div
              className="p-6 text-center"
              style={{
                background: "#1E293B",
                border: "0.5px solid rgba(212,175,55,0.1)",
                borderRadius: "2px",
              }}
            >
              <p style={{ color: "#D4CCBA" }}>Aucune adresse enregistrée</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    FULFILLED:   { label: "Livré",      color: "#86efac", bg: "rgba(134,239,172,0.1)" },
    UNFULFILLED: { label: "En cours",   color: "#D4AF37", bg: "rgba(212,175,55,0.1)" },
    PARTIAL:     { label: "Partiel",    color: "#fdba74", bg: "rgba(253,186,116,0.1)" },
    IN_TRANSIT:  { label: "En transit", color: "#93c5fd", bg: "rgba(147,197,253,0.1)" },
  };
  const { label, color, bg } = config[status] ?? { label: status, color: "#D4CCBA", bg: "rgba(212,175,55,0.05)" };

  return (
    <span
      className="text-xs tracking-wider uppercase px-2 py-1 mt-1 inline-block"
      style={{ color, background: bg, borderRadius: "2px" }}
    >
      {label}
    </span>
  );
}