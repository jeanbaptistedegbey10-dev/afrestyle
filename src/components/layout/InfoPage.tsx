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
    <div className="min-h-screen bg-bg text-text">
      {/* Header éditorial */}
      <header className="border-b border-line px-6 py-16 text-center md:py-20">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.3em] text-gold-dark dark:text-gold">
          {eyebrow}
        </p>
        <h1 className="font-serif text-4xl leading-tight text-text md:text-6xl">
          {title}
        </h1>
        {intro && (
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-text-2">
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
    <section className="mb-6 rounded-sm border border-line bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-md md:p-8">
      {title && (
        <h2 className="font-serif mb-3 text-xl text-text">{title}</h2>
      )}
      <div className="space-y-3 text-sm leading-relaxed text-text-2">
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
