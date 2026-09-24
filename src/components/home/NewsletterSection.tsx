// src/components/home/NewsletterSection.tsx — Bande d'impact Obsidian & Champagne
"use client";

import { useState } from "react";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    // TODO: connecter à Klaviyo
    await new Promise((r) => setTimeout(r, 1000));
    setStatus("success");
    setEmail("");
  }

  return (
    // Bande à fort impact : fond obsidienne contrasté dans LES DEUX modes,
    // texte clair + accents or (rupture visuelle éditoriale) via tokens dédiés.
    <section className="relative overflow-hidden py-20 text-center text-band-text">
      {/* Fond obsidienne + dégradés or — indépendants du thème actif */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(135deg, var(--band) 0%, var(--band-2) 60%, var(--band-2) 100%)" }}
      />
      <div
        className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[70vw] h-[70vw] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, var(--band-gold-soft) 0%, transparent 65%)" }}
      />

      {/* Motif grille subtil */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.05,
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 30px, var(--band-gold) 30px, var(--band-gold) 31px),
            repeating-linear-gradient(90deg, transparent, transparent 30px, var(--band-gold) 30px, var(--band-gold) 31px)
          `,
        }}
      />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <p className="text-band-gold text-xs tracking-[0.25em] uppercase mb-4 flex items-center justify-center gap-3">
          <span className="h-px w-8 bg-band-gold/60 inline-block" />
          Le Cercle AfroStyle
          <span className="h-px w-8 bg-band-gold/60 inline-block" />
        </p>

        <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4 text-band-text leading-tight">
          Rejoignez la <em className="text-band-gold">communauté</em>
        </h2>
        <p className="text-sm md:text-base mb-10 text-band-text-2 max-w-md mx-auto leading-relaxed">
          Nouveautés, histoires de créateurs et offres exclusives — directement
          dans votre boîte mail.
        </p>

        {status === "success" ? (
          <div className="inline-flex items-center gap-3 px-8 py-5 border border-band-gold/40 bg-white/5 rounded-sm">
            <span className="w-8 h-8 rounded-full bg-band-gold text-band flex items-center justify-center text-sm font-bold">
              ✓
            </span>
            <p className="font-serif text-xl text-band-text">
              Merci — bienvenue au Cercle AfroStyle.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex max-w-md mx-auto bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-sm overflow-hidden transition-colors duration-300 focus-within:border-band-gold/60"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              className="flex-1 bg-transparent px-5 py-3.5 text-sm outline-none text-band-text placeholder:text-band-text-2"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-6 py-3.5 text-xs font-medium tracking-widest uppercase bg-band-gold text-band transition-all duration-300 hover:bg-band-gold-hover hover:shadow-[0_0_20px_var(--band-gold-soft)] disabled:opacity-60"
            >
              {status === "loading" ? "..." : "S'inscrire"}
            </button>
          </form>
        )}

        <p className="mt-6 text-[0.7rem] tracking-wider text-band-text-2 uppercase">
          Zéro spam — que du luxe. Désinscription en un clic.
        </p>
      </div>
    </section>
  );
}
