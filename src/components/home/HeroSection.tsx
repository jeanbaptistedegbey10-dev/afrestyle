// src/components/home/HeroSection.tsx
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

const STATS = [
  { num: "87+", label: "Créateurs" },
  { num: "14", label: "Pays d'Afrique" },
  { num: "2 400+", label: "Pièces uniques" },
];

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section
      className="relative min-h-[88vh] flex items-end overflow-hidden"
      style={{ padding: "4rem 2.5rem" }}
    >
      {/* Fond */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #0F172A 0%, #1a0f2e 40%, #0F172A 100%)",
        }}
      />

      {/* Motif grille subtil */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.04,
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(212,175,55,0.5) 30px, rgba(212,175,55,0.5) 31px),
            repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(212,175,55,0.5) 30px, rgba(212,175,55,0.5) 31px)
          `,
        }}
      />

      {/* Bloc image droite asymétrique */}
      <div
        className="absolute right-0 top-0 bottom-0 hidden lg:flex items-center justify-center"
        style={{
          width: "55%",
          background: "linear-gradient(160deg, #2d1a4a, #1a2d1a, #2d2410)",
          clipPath: "polygon(12% 0, 100% 0, 100% 100%, 0 100%)",
        }}
      >
        {/* Placeholder — remplace par une vraie image de créateur */}
        <div className="text-center opacity-20">
          <p
            className="text-xs tracking-widest uppercase"
            style={{ color: "#D4AF37" }}
          >
            Photo créateur vedette
          </p>
        </div>
      </div>

      {/* Contenu */}
      <div
        className="relative z-10 max-w-xl"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.8s ease-out",
        }}
      >
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 text-xs tracking-widest uppercase mb-6 px-4 py-2"
          style={{
            color: "#D4AF37",
            border: "0.5px solid rgba(212,175,55,0.3)",
            borderRadius: "2px",
          }}
        >
          <span
            style={{
              width: 20,
              height: 1,
              background: "#D4AF37",
              display: "inline-block",
            }}
          />
          Nouvelle collection 2024
        </div>

        {/* Titre */}
        <h1
          className="font-serif leading-none mb-4"
          style={{ fontSize: "clamp(2.8rem, 5vw, 4.5rem)", color: "#FDFAF4" }}
        >
          L'Afrique
          <br />
          réinvente
          <br />
          <em style={{ color: "#D4AF37" }}>le luxe</em>
        </h1>

        <p
          className="text-base mb-10 leading-relaxed"
          style={{ color: "#D4CCBA", maxWidth: 420 }}
        >
          Des créateurs d'exception. Des tissus d'héritage. Une mode
          contemporaine qui honore ses racines.
        </p>

        {/* CTA */}
        <div className="flex items-center gap-4 flex-wrap">
          <Link href="/collections" className="btn-primary">
            Explorer la collection
            <ArrowRight size={14} />
          </Link>
          <Link href="/designers" className="btn-outline">
            Découvrir les créateurs
          </Link>
        </div>

        {/* Stats */}
        <div
          className="flex gap-8 mt-10 pt-8"
          style={{ borderTop: "0.5px solid rgba(212,175,55,0.15)" }}
        >
          {STATS.map((s) => (
            <div key={s.label}>
              <div
                className="font-serif text-3xl font-bold"
                style={{ color: "#D4AF37" }}
              >
                {s.num}
              </div>
              <div
                className="text-xs tracking-widest uppercase mt-1"
                style={{ color: "#D4CCBA" }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
