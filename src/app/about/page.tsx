

// src/app/about/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { withShopifyCdnWidth } from "@/lib/assets/images";
import { getAboutEditorialCards } from "@/lib/shopify/about";

/**
 * Page /about — composante SERVEUR.
 *
 * La section « Journal des matières » est pilotée par les Metaobjects
 * `editorial_card` (Storefront API) : titre, sur-libellé, paragraphe, visuel et
 * ordre (`position`) sont lus dans Shopify Admin. Voir
 * `lib/shopify/about.ts` pour le contrat de champs et les règles de repli.
 */
export const metadata: Metadata = {
  title: "Notre Histoire",
  description: "L'histoire d'AfroStyle — la première destination premium pour la mode africaine contemporaine.",
};

/** ISR : la page est régénérée toutes les 5 min (repli si le webhook est muet). */
export const revalidate = 300;

const TIMELINE = [
  { year: "2017", title: "La vision", text: "Jb Mawubevi, fondateur d'AfroStyle, observe un paradoxe : la mode africaine est admirée dans le monde entier, mais ses créateurs restent invisibles. L'idée germe." },
  { year: "2019", title: "Les premiers créateurs", text: "AfroStyle signe ses premiers partenariats avec des créateurs au Bénin et au Sénégal. La plateforme n'est encore qu'une page Instagram — la sélection, déjà exigeante." },
  { year: "2021", title: "La boutique en ligne", text: "Lancement officiel de la boutique : chaque pièce devient commandable et expédiée directement depuis l'atelier de son créateur." },
  { year: "2023", title: "L'expansion", text: "Les collections s'ouvrent à de nouveaux pays et à de nouveaux tissus d'héritage. AfroStyle s'impose comme une référence de la mode africaine contemporaine premium." },
  { year: "2026", title: "Aujourd'hui", text: "Une nouvelle plateforme, une nouvelle ambition : offrir à la mode africaine la scène internationale qu'elle mérite." },
];

const VALUES = [
  { title: "Authenticité", icon: "✦", text: "Chaque pièce est créée par un designer africain avec des matières sourcées en Afrique. Zéro compromis sur l'origine." },
  { title: "Excellence", icon: "◆", text: "Nous ne référençons que des créateurs sélectionnés pour la qualité de leur travail, leur vision et leur éthique de production." },
  { title: "Impact", icon: "●", text: "70 % du prix de vente revient directement au créateur. Nous croyons que l'artiste doit vivre de son art." },
  { title: "Héritage", icon: "▲", text: "Nous documentons les techniques et les histoires derrière chaque tissu. La mode comme préservation culturelle." },
];


/**
 * Largeurs demandées au CDN Shopify selon l'emplacement de la carte.
 *
 * Appliquées ici (et non dans la couche de données) car la largeur utile dépend
 * de la mise en page : la 1ʳᵉ carte est pleine largeur, les suivantes sont en
 * vis-à-vis. Le CDN sert alors la bonne variante, sans jamais transférer
 * l'original.
 */
const FEATURED_CARD_IMAGE_WIDTH = 1920;
const GRID_CARD_IMAGE_WIDTH = 900;

export default async function AboutPage() {
  // ⚠️ `getAboutEditorialCards()` ne lève jamais : en cas de type non exposé,
  //    d'erreur réseau ou de boutique vide, elle renvoie les 3 cartes éditoriales
  //    locales. La section « Journal des matières » ne peut donc pas disparaître.
  const editorialCards = await getAboutEditorialCards();

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--text)" }}>

      {/* Hero */}
      <div
        className="relative py-32 px-6 text-center overflow-hidden"
        style={{ borderBottom: "1px solid var(--line)" }}
      >
        <div
          className="absolute inset-0"
          style={{
            opacity: 0.08,
            backgroundImage: `repeating-linear-gradient(135deg, var(--gold) 0px, var(--gold) 1px, transparent 1px, transparent 80px)`,
          }}
        />
        <p className="text-xs tracking-widest uppercase mb-4 relative" style={{ color: "var(--gold-dark)" }}>
          Notre histoire
        </p>
        <h1 className="font-serif text-5xl md:text-7xl mb-6 relative leading-tight" style={{ color: "var(--text)" }}>
          L’Afrique mérite<br />
          <em style={{ color: "var(--gold-dark)" }}>une scène mondiale</em>
        </h1>
        <p className="text-base max-w-xl mx-auto relative" style={{ color: "var(--text-2)" }}>
          AfroStyle est né d’une conviction simple : les créateurs africains sont parmi
          les plus talentueux du monde. Il leur manquait juste une vitrine à la hauteur
          de leur talent.
        </p>
      </div>

      {/* Mission */}
      <div
        className="py-20 px-6"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--line)" }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs tracking-widest uppercase mb-6" style={{ color: "var(--gold-dark)" }}>
            Notre mission
          </p>
          <blockquote className="font-serif text-3xl md:text-4xl leading-snug" style={{ color: "var(--text)" }}>
            « Connecter les créateurs d’Afrique aux amateurs de mode authentique
            partout sur la planète — et permettre à chaque artiste de vivre
            dignement de son art. »
          </blockquote>
        </div>
      </div>

      {/* Galerie éditoriale — cartes pilotées par les Metaobjects `editorial_card`.
          Le `key` est l'id de l'entrée : deux cartes peuvent porter le même titre. */}
      <section className="border-b border-line bg-bg-2 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-gold-dark dark:text-gold">
              Journal des matières
            </p>
            <h2 className="font-serif text-4xl md:text-5xl">
              Matières, gestes <em className="font-normal text-gold-dark dark:text-gold">&amp; silhouettes</em>
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-text-2">
              Cette sélection met en scène l’univers de la maison. Les images d’ambiance ne sont pas présentées comme un reportage d’atelier ni comme le portrait d’un créateur sans source authentifiée.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {editorialCards.map((card, index) => {
              // La 1ʳᵉ carte occupe toute la largeur (cadrage 16/9) ; les suivantes
              // se partagent une ligne en vis-à-vis (cadrage 4/5). Ce rythme
              // éditorial est independant du nombre d'entrées publiées.
              const isFeatured = index === 0;
              return (
                <figure
                  key={card.id}
                  className={`group relative overflow-hidden rounded-sm border border-line bg-surface shadow-[0_14px_36px_rgba(16,27,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_rgba(16,27,42,0.14)] ${isFeatured ? "md:col-span-2" : ""}`}
                >
                  <div className={`relative overflow-hidden ${isFeatured ? "aspect-[16/9]" : "aspect-[4/5]"}`}>
                    <SafeImage
                      src={
                        card.image
                          ? withShopifyCdnWidth(
                              card.image,
                              isFeatured ? FEATURED_CARD_IMAGE_WIDTH : GRID_CARD_IMAGE_WIDTH,
                            )
                          : null
                      }
                      alt={card.imageAlt}
                      fill
                      sizes={isFeatured ? "(max-width: 768px) 100vw, 100vw" : "(max-width: 768px) 100vw, 50vw"}
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      fallbackAlt={card.imageAlt}
                      placeholderRatio={isFeatured ? "landscape" : "portrait"}
                      placeholderLabel="Editorial AfroStyle"
                    />
                    {/* Voile dégradé : garantit le contraste du texte blanc (WCAG AAA)
                        quelle que soit la luminance du visuel publié dans Shopify. */}
                    <div className="absolute inset-0 bg-gradient-to-t from-band/90 via-band/15 to-transparent" aria-hidden="true" />
                  </div>
                  <figcaption className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">
                    {card.eyebrow ? (
                      <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-band-gold">
                        {card.eyebrow}
                      </p>
                    ) : null}
                    <h3 className="mt-2 font-serif text-2xl sm:text-3xl">{card.title}</h3>
                    {card.text ? (
                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-band-text-2">{card.text}</p>
                    ) : null}
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      </section>

      {/* Valeurs */}
      <div className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs tracking-widest uppercase mb-4 text-center" style={{ color: "var(--gold-dark)" }}>
            Nos convictions
          </p>
          <h2 className="font-serif text-4xl mb-12 text-center" style={{ color: "var(--text)" }}>
            Nos <em style={{ color: "var(--gold-dark)" }}>valeurs</em>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {VALUES.map((value) => (
              <div
                key={value.title}
                className="p-8 rounded-sm"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                }}
              >
                <span className="text-2xl mb-4 block" style={{ color: "var(--gold-dark)" }}>
                  {value.icon}
                </span>
                <h3 className="font-serif text-xl mb-3" style={{ color: "var(--text)" }}>
                  {value.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
                  {value.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="py-20 px-6" style={{ background: "var(--surface)", borderTop: "1px solid var(--line)" }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-xs tracking-widest uppercase mb-4" style={{ color: "var(--gold-dark)" }}>
            Notre parcours
          </p>
          <h2 className="font-serif text-4xl mb-12" style={{ color: "var(--text)" }}>
            De l’idée à la <em style={{ color: "var(--gold-dark)" }}>réalité</em>
          </h2>
          <div className="space-y-0">
            {TIMELINE.map((event, i) => (
              <div
                key={event.year}
                className="flex gap-8"
              >
                {/* Ligne verticale + point */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                    style={{ background: "var(--gold)" }}
                  />
                  {i < TIMELINE.length - 1 && (
                    <div
                      className="w-px flex-1 my-2"
                      style={{ background: "rgba(197,160,89,0.35)", minHeight: "3rem" }}
                    />
                  )}
                </div>
                {/* Contenu */}
                <div className="pb-10">
                  <span
                    className="text-xs tracking-widest uppercase font-medium"
                    style={{ color: "var(--gold-dark)" }}
                  >
                    {event.year}
                  </span>
                  <h3 className="font-serif text-xl mt-1 mb-2" style={{ color: "var(--text)" }}>
                    {event.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
                    {event.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Engagements — marqueurs qualitatifs et contractuels, non chiffrés */}
      <div className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { num: "100 %", label: "Confection africaine" },
            { num: "Fait main", label: "Savoir-faire d'héritage" },
            { num: "Direct", label: "Sans intermédiaire" },
            { num: "70 %", label: "Reversés aux créateurs" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="font-serif text-5xl font-bold mb-2" style={{ color: "var(--gold-dark)" }}>
                {stat.num}
              </div>
              <div className="text-xs tracking-widest uppercase" style={{ color: "var(--text-2)" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div
        className="py-20 px-6 text-center"
        style={{ background: "var(--surface)", borderTop: "1px solid var(--line)" }}
      >
        <h2 className="font-serif text-4xl mb-4" style={{ color: "var(--text)" }}>
          Rejoignez l’aventure
        </h2>
        <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: "var(--text-2)" }}>
          Que vous soyez créateur, cliente ou amoureux de la mode africaine —
          AfroStyle est votre maison.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/collections" className="btn-primary inline-flex">
            Explorer la collection <ArrowRight size={14} />
          </Link>
          <Link href="/lookbook" className="btn-outline inline-flex">
            Parcourir le lookbook
          </Link>
        </div>
      </div>

    </div>
  );
}