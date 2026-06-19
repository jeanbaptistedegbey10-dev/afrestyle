// src/app/dashboard/page.tsx
// Page protégée — accessible uniquement aux créateurs validés

import { getCurrentDesigner } from "@/lib/actions/designer.actions";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getDesignerProducts } from "@/lib/shopify/products";
import DashboardClient from "@/components/designer/DashboardClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard Créateur" };

export default async function DashboardPage() {
  const designer = await getCurrentDesigner();
  if (!designer) redirect("/dashboard/login");
  if (designer.status !== "APPROVED") redirect("/dashboard/pending");

  // Récupère les produits du créateur depuis Shopify
  const shopifyData = await getDesignerProducts(designer.handle);

  return (
    <div style={{ background: "#0F172A", minHeight: "100vh" }}>

      {/* Header */}
      <div
        className="py-8 px-6"
        style={{ background: "#1E293B", borderBottom: "0.5px solid rgba(212,175,55,0.1)" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs tracking-widest uppercase mb-1" style={{ color: "#D4AF37" }}>
              Dashboard créateur
            </p>
            <h1 className="font-serif text-3xl" style={{ color: "#FDFAF4" }}>
              {designer.brandName}
            </h1>
          </div>
          
            href={`/designers/${designer.handle}`}
            className="text-xs tracking-widest uppercase px-4 py-2 transition-colors"
            style={{
              border: "0.5px solid rgba(212,175,55,0.3)",
              color: "#D4AF37",
              borderRadius: "2px",
            }}
            target="_blank"
          >
            Voir ma page publique →
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { num: shopifyData?.products.edges.length ?? 0, label: "Produits" },
            { num: "–", label: "Commandes ce mois" },
            { num: "–", label: "Revenu total" },
            { num: "–", label: "Vues profil" },
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
              <div className="font-serif text-3xl font-bold mb-1" style={{ color: "#D4AF37" }}>
                {stat.num}
              </div>
              <div className="text-xs tracking-widest uppercase" style={{ color: "#D4CCBA" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Mes produits */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl" style={{ color: "#FDFAF4" }}>
              Mes produits
            </h2>
            
              href={`https://${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN}/admin`}
              target="_blank"
              className="text-xs tracking-widest uppercase px-4 py-2"
              style={{
                background: "#D4AF37",
                color: "#0F172A",
                borderRadius: "2px",
              }}
            >
              + Ajouter un produit
            </a>
          </div>

          {!shopifyData || shopifyData.products.edges.length === 0 ? (
            <div
              className="text-center py-12"
              style={{
                background: "#1E293B",
                border: "0.5px solid rgba(212,175,55,0.1)",
                borderRadius: "2px",
              }}
            >
              <p className="font-serif text-xl mb-3" style={{ color: "#FDFAF4" }}>
                Aucun produit pour l'instant
              </p>
              <p className="text-sm mb-6" style={{ color: "#D4CCBA" }}>
                Ajoute tes créations dans Shopify Admin avec{" "}
                <strong style={{ color: "#D4AF37" }}>Vendor = "{designer.brandName}"</strong>
              </p>
              
                href={`https://${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN}/admin/products/new`}
                target="_blank"
                className="btn-primary inline-flex"
              >
                Ajouter mon premier produit
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {shopifyData.products.edges.map(({ node: product }) => (
                <div
                  key={product.id}
                  style={{
                    background: "#1E293B",
                    border: "0.5px solid rgba(212,175,55,0.1)",
                    borderRadius: "2px",
                  }}
                >
                  {product.images.edges[0] && (
                    <img
                      src={product.images.edges[0].node.url}
                      alt={product.title}
                      className="w-full object-cover"
                      style={{ aspectRatio: "3/4" }}
                    />
                  )}
                  <div className="p-3">
                    <p className="font-serif text-sm" style={{ color: "#FDFAF4" }}>
                      {product.title}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#D4AF37" }}>
                      {product.priceRange.minVariantPrice.amount}{" "}
                      {product.priceRange.minVariantPrice.currencyCode}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info importante */}
        <div
          className="p-6"
          style={{
            background: "rgba(212,175,55,0.05)",
            border: "0.5px solid rgba(212,175,55,0.2)",
            borderRadius: "2px",
          }}
        >
          <h3 className="font-serif text-lg mb-3" style={{ color: "#D4AF37" }}>
            Comment ajouter tes produits ?
          </h3>
          <ol className="space-y-2 text-sm" style={{ color: "#D4CCBA" }}>
            <li>1. Va sur Shopify Admin → Products → Add product</li>
            <li>
              2. Dans le champ <strong style={{ color: "#F5F0E8" }}>Vendor</strong>, mets exactement :{" "}
              <code
                style={{
                  background: "rgba(212,175,55,0.1)",
                  color: "#D4AF37",
                  padding: "0 4px",
                }}
              >
                {designer.brandName}
              </code>
            </li>
            <li>3. Ajoute tes tags : pays-XX, tissu-XX, style-XX, femme/homme</li>
            <li>4. Ton produit apparaît automatiquement sur ta page AfroStyle</li>
          </ol>
        </div>

      </div>
    </div>
  );
}