// src/app/account/page.tsx
import { getCurrentCustomer } from "@/lib/actions/auth.actions";
import { redirect } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth.actions";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mon compte" };

export default async function AccountPage() {
  const customer = await getCurrentCustomer();

  // Redirige vers login si non connecté
  if (!customer) redirect("/account/login");

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--text)" }}>

      {/* Header */}
      <div
        className="py-12 px-6"
        style={{ borderBottom: "1px solid var(--line)" }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "var(--gold-dark)" }}>
              Espace personnel
            </p>
            <h1 className="font-serif text-4xl" style={{ color: "var(--text)" }}>
              Bonjour, {customer.firstName} ✦
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>
              {customer.email}
            </p>
          </div>
          {/* Bouton déconnexion — Server Action */}
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-xs tracking-widest uppercase px-4 py-2 transition-colors hover:border-gold hover:text-gold-dark dark:hover:text-gold"
              style={{
                border: "1px solid var(--line)",
                color: "var(--text-2)",
                borderRadius: "2px",
                background: "var(--surface)",
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
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "2px",
              }}
            >
              <div className="font-serif text-4xl font-bold mb-1" style={{ color: "var(--gold-dark)" }}>
                {stat.num}
              </div>
              <div className="text-xs tracking-widest uppercase" style={{ color: "var(--text-2)" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Commandes */}
        <div>
          <h2 className="font-serif text-2xl mb-6" style={{ color: "var(--text)" }}>
            Mes commandes
          </h2>

          {customer.orders.length === 0 ? (
            <div
              className="text-center py-12"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "2px",
              }}
            >
              <p className="font-serif text-xl mb-4" style={{ color: "var(--text)" }}>
                Aucune commande pour l’instant
              </p>
              <Link href="/collections" className="btn-primary inline-flex">
                Découvrir la collection
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {customer.orders.map((order) => (
                <div
                  key={order.id}
                  className="p-6"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    borderRadius: "2px",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-serif text-lg" style={{ color: "var(--text)" }}>
                        Commande #{order.orderNumber}
                      </p>
                      <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
                        {new Date(order.processedAt).toLocaleDateString("fr-FR", {
                          day: "numeric", month: "long", year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-serif text-xl font-bold" style={{ color: "var(--gold-dark)" }}>
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
                          <Image
                            src={item.variant.image.url}
                            alt={item.variant.image.altText ?? item.title}
                            width={40}
                            height={48}
                            className="w-10 h-12 object-cover"
                            style={{ borderRadius: "2px", background: "var(--surface-2)" }}
                          />
                        )}
                        <div>
                          <p className="text-sm" style={{ color: "var(--text)" }}>
                            {item.title}
                          </p>
                          <p className="text-xs" style={{ color: "var(--text-3)" }}>
                            Qté : {item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                    {order.lineItems.length > 3 && (
                      <p className="text-xs" style={{ color: "var(--text-3)" }}>
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
          <h2 className="font-serif text-2xl mb-6" style={{ color: "var(--text)" }}>
            Adresse de livraison
          </h2>
          {customer.defaultAddress ? (
            <div
              className="p-6"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "2px",
              }}
            >
              <p style={{ color: "var(--text)" }}>{customer.defaultAddress.address1}</p>
              {customer.defaultAddress.address2 && (
                <p style={{ color: "var(--text)" }}>{customer.defaultAddress.address2}</p>
              )}
              <p style={{ color: "var(--text)" }}>
                {customer.defaultAddress.zip} {customer.defaultAddress.city}
              </p>
              <p style={{ color: "var(--text-3)" }}>{customer.defaultAddress.country}</p>
            </div>
          ) : (
            <div
              className="p-6 text-center"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "2px",
              }}
            >
              <p style={{ color: "var(--text-3)" }}>Aucune adresse enregistrée</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; bg: string }> = {
    FULFILLED:   { label: "Livré",      color: "#15803d", bg: "rgba(34,197,94,0.08)" },
    UNFULFILLED: { label: "En cours",   color: "var(--gold-dark)", bg: "rgba(197,160,89,0.12)" },
    PARTIAL:     { label: "Partiel",    color: "#c2410c", bg: "rgba(253,186,116,0.12)" },
    IN_TRANSIT:  { label: "En transit", color: "#1d4ed8", bg: "rgba(147,197,253,0.12)" },
  };
  const { label, color, bg } = config[status] ?? { label: status, color: "var(--text-2)", bg: "var(--line)" };

  return (
    <span
      className="text-xs tracking-wider uppercase px-2 py-1 mt-1 inline-block"
      style={{ color, background: bg, borderRadius: "2px" }}
    >
      {label}
    </span>
  );
}