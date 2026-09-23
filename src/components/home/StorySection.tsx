// src/components/home/StorySection.tsx — Section Histoire, 100 % thème dynamique
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { IMAGES } from "@/constants/images";
import SafeImage from "@/components/ui/SafeImage";

const STORY_STATS = [
  { num: "100%", label: "Fait en Afrique" },
  { num: "87", label: "Créateurs soutenus" },
  { num: "14", label: "Pays représentés" },
];

export default function StorySection() {
  return (
    <section className="border-y border-line bg-surface py-16 lg:py-24">
      {/* Conteneur standardisé */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Layout 2 colonnes équilibré sur desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Visuel gauche — panneau arrondi, dégradé thématique */}
          <div className="relative w-full aspect-[4/5] sm:aspect-[4/3] rounded-2xl overflow-hidden border border-line shadow-[0_16px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.4)]">
            {/* Visuel gauche — photo storytelling (Unsplash HD, fallback local) */}
            <SafeImage
              src={IMAGES.story}
              alt="Tenue complète en Pagne / Iro portée avec élégance — collection spéciale AfroStyle"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            {/* Voile subtil — cohérence dorée + relief de la carte */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>

          {/* Texte droite */}
          <div className="flex flex-col justify-center gap-6">
            <p className="text-xs tracking-widest uppercase text-gold-dark dark:text-gold">
              Notre mission
            </p>

            <blockquote className="font-serif text-2xl md:text-3xl leading-snug text-text">
              &quot;Chaque tissu porte une histoire. Chaque pièce,{" "}
              <em className="not-italic text-gold-dark dark:text-gold">
                une identité.
              </em>
              &quot;
            </blockquote>

            <p className="text-sm md:text-base leading-relaxed text-text-2">
              AfroStyle naît d&apos;une conviction : la mode africaine mérite une
              scène mondiale. Nous connectons les créateurs d&apos;Afrique aux
              amateurs de mode authentique partout sur la planète.
            </p>

            <Link href="/about" className="btn-primary self-start">
              Notre histoire <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Statistiques — centrées en bas du bloc */}
        <div className="mt-12 border-t border-line pt-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 text-center">
            {STORY_STATS.map((s) => (
              <div key={s.label}>
                <div className="font-serif text-3xl font-bold text-gold-dark dark:text-gold">
                  {s.num}
                </div>
                <div className="text-xs tracking-widest uppercase mt-1 text-text-2">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
