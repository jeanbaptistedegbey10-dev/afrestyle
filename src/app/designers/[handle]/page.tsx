// src/app/designers/[handle]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

const DESIGNERS_DATA = {
  "adaeze-okafor": {
    num: "01", name: "Adaeze Okafor", country: "Bénin",
    specialty: "Couture contemporaine", pieces: 24, since: 2019,
    gradient: "linear-gradient(155deg, #2d1535, #0d2218, #251a08)",
    tags: ["Wax", "Femme", "Luxe"],
    bio: "Formée à Paris, enracinée à Cotonou. Adaeze mêle le wax traditionnel à des coupes architecturales modernes qui traversent les frontières.",
    story: `Adaeze Okafor a grandi entre deux mondes : les marchés colorés de Cotonou où sa grand-mère choisissait les plus beaux wax, et les ateliers parisiens où elle a appris la haute couture.

Après son diplôme à l'Institut Français de la Mode, elle rentre au Bénin avec une conviction : le wax n'est pas un tissu ethnique, c'est un tissu de luxe qui mérite les plus grandes scènes mondiales.

Ses créations sont aujourd'hui portées par des personnalités de la diaspora africaine à Paris, Londres et New York.`,
    quote: "Le wax est mon langage. Chaque motif est une phrase, chaque coupe une ponctuation.",
    awards: ["Prix Émergence Mode Africaine 2021", "Featured in Vogue Africa 2022"],
    collectionHandle: "designer-adaeze-okafor",
  },
  "kofi-mensah": {
    num: "02", name: "Kofi Mensah", country: "Ghana",
    specialty: "Kente & Streetwear", pieces: 18, since: 2021,
    gradient: "linear-gradient(155deg, #0a2010, #201408, #200a18)",
    tags: ["Kente", "Streetwear", "Homme"],
    bio: "Pionnier du Kente urbain, Kofi redéfinit les codes du tissu royal ghanéen pour la génération Z mondiale.",
    story: `Né à Kumasi, capitale de la culture Ashanti, Kofi Mensah a grandi entouré de tisserands de Kente. Son père était l'un des derniers maîtres tisserands traditionnels de la région.

Plutôt que de perpétuer la tradition à l'identique, Kofi a choisi de la réinventer. Il incorpore des silhouettes streetwear — hoodies, joggers, bombers — dans des pièces entièrement tissées en Kente authentique.

Son compte Instagram a explosé en 2022 avec une veste Kente portée par un artiste Afrobeats nigérian.`,
    quote: "Le Kente a habillé des rois pendant des siècles. Aujourd'hui il habille la rue. C'est la même noblesse.",
    awards: ["Ghana Fashion Week Best Designer 2023"],
    collectionHandle: "designer-kofi-mensah",
  },
  "aminata-diallo": {
    num: "03", name: "Aminata Diallo", country: "Sénégal",
    specialty: "Broderie & Luxe", pieces: 31, since: 2018,
    gradient: "linear-gradient(155deg, #201408, #0a1820, #180a20)",
    tags: ["Broderie", "Femme", "Premium"],
    bio: "Maîtresse de la broderie dakaroise, Aminata crée des pièces d'exception portées par les élites africaines.",
    story: `Aminata Diallo est issue d'une famille de couturières dakaroises depuis trois générations. Sa mère habillait les épouses de diplomates, sa grand-mère les femmes de ministres.

Elle a hissé cet héritage familial au niveau du luxe international en introduisant des techniques de broderie à l'aiguille d'or inspirées des cours royales wolof dans des pièces à la coupe résolument contemporaine.

Ses robes de soirée sont aujourd'hui portées lors des grands événements officiels de la CEDEAO.`,
    quote: "Chaque point de broderie est une prière. Je couds avec l'âme de mes ancêtres.",
    awards: ["Dakar Fashion Week Grand Prix 2020", "African Luxury Awards 2022"],
    collectionHandle: "designer-aminata-diallo",
  },
  "chidi-okeke": {
    num: "04", name: "Chidi Okeke", country: "Nigeria",
    specialty: "Agbada moderne", pieces: 22, since: 2020,
    gradient: "linear-gradient(155deg, #1a2010, #20100a, #0a1020)",
    tags: ["Agbada", "Homme", "Traditionnel"],
    bio: "Chidi réinterprète l'Agbada traditionnel Yoruba avec des matières contemporaines.",
    story: `Lagos, 2020. Chidi Okeke quitte son poste d'ingénieur financier pour suivre sa vraie passion : la mode masculine africaine.

Son obsession : rendre l'Agbada — la grande robe cérémonialle Yoruba — portable au quotidien. Il travaille avec des tailleurs de Lagos pour créer des versions slim-fit, en lin et en soie naturelle, qui se portent aussi bien en réunion d'affaires qu'à une soirée.`,
    quote: "L'homme africain moderne n'a pas à choisir entre son identité et son ambition.",
    awards: ["Lagos Fashion Week Revelation 2021"],
    collectionHandle: "designer-chidi-okeke",
  },
  "fatoumata-coulibaly": {
    num: "05", name: "Fatoumata Coulibaly", country: "Mali",
    specialty: "Bogolan & Art textile", pieces: 15, since: 2022,
    gradient: "linear-gradient(155deg, #201808, #081820, #180820)",
    tags: ["Bogolan", "Unisexe", "Art"],
    bio: "Artiste textile formée à Bamako, Fatoumata transforme le bogolan en pièces portables.",
    story: `Le bogolan — cette étoffe de coton teinte à la boue ferrugineuse du Mali — est l'un des textiles les plus anciens d'Afrique de l'Ouest.

Fatoumata Coulibaly lui offre une seconde vie en collaborant avec des artisans de San pour créer des motifs contemporains qui dialoguent avec l'art abstrait occidental tout en restant profondément enracinés dans la cosmologie bambara.`,
    quote: "La boue du Mali contient des siècles de mémoire. Je la porte sur moi.",
    awards: ["Bamako Textile Arts Prize 2023"],
    collectionHandle: "designer-fatoumata-coulibaly",
  },
  "amara-traore": {
    num: "06", name: "Amara Traoré", country: "Côte d'Ivoire",
    specialty: "Accessoires & Joaillerie", pieces: 40, since: 2017,
    gradient: "linear-gradient(155deg, #201510, #102015, #151020)",
    tags: ["Accessoires", "Or", "Joaillerie"],
    bio: "Joaillier et accessoiriste, Amara crée des pièces en or et en bronze inspirées des cours royales akan.",
    story: `Abidjan, quartier du Plateau. L'atelier d'Amara Traoré est un sanctuaire où l'or coule comme de l'eau.

Formé à la joaillerie traditionnelle akan auprès de maîtres orfèvres d'Abidjan, puis à Paris à l'École de Joaillerie, Amara crée des pièces qui s'inspirent des ornements royaux akan — ces colliers, bracelets et pendentifs qui symbolisaient le pouvoir — pour les adapter aux femmes et hommes contemporains.`,
    quote: "L'or akan n'a jamais quitté l'Afrique dans mon cœur. Je le ramène dans les mains qui méritent de le porter.",
    awards: ["LVMH Prize Longlist 2022", "Abidjan Design Week 2021"],
    collectionHandle: "designer-amara-traore",
  },
};

type DesignerData = typeof DESIGNERS_DATA[keyof typeof DESIGNERS_DATA];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const designer = DESIGNERS_DATA[handle as keyof typeof DESIGNERS_DATA];
  if (!designer) return { title: "Designer introuvable" };
  return {
    title: designer.name,
    description: designer.bio,
  };
}

export async function generateStaticParams() {
  return Object.keys(DESIGNERS_DATA).map((handle) => ({ handle }));
}

export default async function DesignerPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const designer = DESIGNERS_DATA[handle as keyof typeof DESIGNERS_DATA];
  if (!designer) notFound();

  return (
    <div style={{ background: "#0F172A", minHeight: "100vh" }}>

      {/* Back */}
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <Link
          href="/designers"
          className="inline-flex items-center gap-2 text-xs tracking-widest uppercase transition-colors"
          style={{ color: "#D4CCBA" }}
        >
          <ArrowLeft size={14} />
          Tous les designers
        </Link>
      </div>

      {/* Hero designer */}
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-16">

        {/* Photo */}
        <div>
          <div
            className="aspect-[3/4] rounded-sm mb-4"
            style={{ background: designer.gradient }}
          />
          {/* Awards */}
          {designer.awards.length > 0 && (
            <div className="space-y-2">
              {designer.awards.map((award) => (
                <div
                  key={award}
                  className="flex items-center gap-2 text-xs"
                  style={{ color: "#D4CCBA" }}
                >
                  <span style={{ color: "#D4AF37" }}>✦</span>
                  {award}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Infos */}
        <div className="flex flex-col justify-center gap-6">
          <div>
            <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "#D4AF37" }}>
              {designer.num} — {designer.country}
            </p>
            <h1 className="font-serif text-5xl mb-2" style={{ color: "#FDFAF4" }}>
              {designer.name}
            </h1>
            <p className="text-sm tracking-widest uppercase" style={{ color: "#D4AF37" }}>
              {designer.specialty}
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {designer.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-3 py-1"
                style={{
                  border: "0.5px solid rgba(212,175,55,0.3)",
                  color: "#D4CCBA",
                  borderRadius: "2px",
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div
            className="flex gap-8 py-6"
            style={{ borderTop: "0.5px solid rgba(212,175,55,0.15)", borderBottom: "0.5px solid rgba(212,175,55,0.15)" }}
          >
            <div>
              <div className="font-serif text-3xl font-bold" style={{ color: "#D4AF37" }}>
                {designer.pieces}
              </div>
              <div className="text-xs tracking-widest uppercase mt-1" style={{ color: "#D4CCBA" }}>
                Pièces
              </div>
            </div>
            <div>
              <div className="font-serif text-3xl font-bold" style={{ color: "#D4AF37" }}>
                {new Date().getFullYear() - designer.since}
              </div>
              <div className="text-xs tracking-widest uppercase mt-1" style={{ color: "#D4CCBA" }}>
                Ans d'expérience
              </div>
            </div>
            <div>
              <div className="font-serif text-3xl font-bold" style={{ color: "#D4AF37" }}>
                {designer.since}
              </div>
              <div className="text-xs tracking-widest uppercase mt-1" style={{ color: "#D4CCBA" }}>
                Année de début
              </div>
            </div>
          </div>

          {/* Citation */}
          <blockquote
            className="font-serif text-xl italic leading-relaxed"
            style={{ color: "#FDFAF4", borderLeft: "2px solid #D4AF37", paddingLeft: "1.5rem" }}
          >
            "{designer.quote}"
          </blockquote>
        </div>
      </div>

      {/* Histoire */}
      <div
        className="py-16 px-6"
        style={{ background: "#1E293B", borderTop: "0.5px solid rgba(212,175,55,0.1)" }}
      >
        <div className="max-w-3xl mx-auto">
          <p className="text-xs tracking-widest uppercase mb-6" style={{ color: "#D4AF37" }}>
            Son histoire
          </p>
          {designer.story.split("\n\n").map((paragraph, i) => (
            <p
              key={i}
              className="text-base leading-relaxed mb-6"
              style={{ color: "#D4CCBA" }}
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* CTA voir produits */}
      <div className="py-16 px-6 text-center" style={{ background: "#0F172A" }}>
        <p className="text-xs tracking-widest uppercase mb-3" style={{ color: "#D4AF37" }}>
          Découvrir
        </p>
        <h2 className="font-serif text-3xl mb-6" style={{ color: "#FDFAF4" }}>
          La collection de {designer.name.split(" ")[0]}
        </h2>
        <Link href="/collections" className="btn-primary inline-flex">
          Voir les pièces <ArrowRight size={14} />
        </Link>
      </div>

    </div>
  );
}