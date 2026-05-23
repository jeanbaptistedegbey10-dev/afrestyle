// src/components/home/StorySection.tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function StorySection() {
  return (
    <section
      className="grid grid-cols-1 lg:grid-cols-2"
      style={{ background: "#1E293B" }}
    >
      {/* Visuel gauche */}
      <div
        className="aspect-square lg:aspect-auto min-h-80 flex items-center justify-center"
        style={{
          background: "linear-gradient(160deg, #2a1040, #0a2010, #1a1000)",
        }}
      >
        <p
          className="text-xs tracking-widest uppercase opacity-20"
          style={{ color: "#D4AF37" }}
        >
          Photo storytelling
        </p>
      </div>

      {/* Texte droite */}
      <div className="flex flex-col justify-center gap-6 px-8 md:px-16 py-16">
        <p
          className="text-xs tracking-widest uppercase"
          style={{ color: "#D4AF37" }}
        >
          Notre mission
        </p>

        <blockquote
          className="font-serif text-2xl md:text-3xl leading-snug"
          style={{ color: "#FDFAF4" }}
        >
          "Chaque tissu porte une histoire. Chaque pièce,{" "}
          <em style={{ color: "#D4AF37", fontStyle: "normal" }}>
            une identité.
          </em>
          "
        </blockquote>

        <p className="text-sm leading-relaxed" style={{ color: "#D4CCBA" }}>
          AfroStyle naît d'une conviction : la mode africaine mérite une scène
          mondiale. Nous connectons les créateurs d'Afrique aux amateurs de mode
          authentique partout sur la planète.
        </p>

        <Link href="/about" className="btn-primary self-start">
          Notre histoire <ArrowRight size={14} />
        </Link>

        {/* Stats */}
        <div
          className="flex gap-8 pt-6"
          style={{ borderTop: "0.5px solid rgba(212,175,55,0.15)" }}
        >
          {[
            { num: "100%", label: "Fait en Afrique" },
            { num: "87", label: "Créateurs soutenus" },
            { num: "14", label: "Pays représentés" },
          ].map((s) => (
            <div key={s.label}>
              <div
                className="font-serif text-2xl font-bold"
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
