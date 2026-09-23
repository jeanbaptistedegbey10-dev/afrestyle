// src/components/layout/InfoPage.tsx — Layout commun des pages d'information
// (Livraison, Retours, FAQ, Contact) — thème clair éditorial luxe.
import Link from "next/link";
import type { ReactNode } from "react";

export default function InfoPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ background: "#FAF8F5" }}>
      {/* Header éditorial */}
      <header
        className="px-6 py-16 text-center md:py-20"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
      >
        <p
          className="mb-4 text-[11px] font-medium uppercase tracking-[0.3em]"
          style={{ color: "#B8860B" }}
        >
          {eyebrow}
        </p>
        <h1 className="font-serif text-4xl leading-tight text-[#1A1A1A] md:text-6xl">
          {title}
        </h1>
        {intro && (
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-[#4A4A44]">
            {intro}
          </p>
        )}
      </header>

      {/* Contenu */}
      <div className="mx-auto max-w-3xl px-6 py-16">{children}</div>
    </div>
  );
}

/** Section encadrée type "carte" blanche à bordure ultra-discrète. */
export function InfoCard({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section
      className="mb-6 p-6 md:p-8"
      style={{
        background: "#FFFFFF",
        border: "1px solid rgba(0,0,0,0.06)",
        borderRadius: "2px",
      }}
    >
      {title && (
        <h2 className="font-serif mb-3 text-xl text-[#1A1A1A]">{title}</h2>
      )}
      <div className="space-y-3 text-sm leading-relaxed text-[#4A4A44]">
        {children}
      </div>
    </section>
  );
}

/** CTA de fin de page. */
export function InfoCta({
  href = "/collections",
  label = "Explorer la collection",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <div className="mt-10 text-center">
      <Link href={href} className="btn-primary">
        {label}
      </Link>
    </div>
  );
}
