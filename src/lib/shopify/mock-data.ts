// src/lib/shopify/mock-data.ts
// ────────────────────────────────────────────────────────────────────────────
//  CATALOGUE DE RÉFÉRENCE AFROSTYLE (données mock + replis visuels locaux).
//
//  Ce fichier joue DEUX rôles, tous deux explicitement documentés :
//
//   1. ENRICHISSEMENT DU CATALOGUE
//      Chaque produit du catalogue reçoit, via `getProductEnrichment()` :
//        • une galerie de 3 a 4 replis locaux (grande image + vignettes de
//          la fiche produit, survol des cartes…) ;
//        • une courte description (matières, coupe, livraison) ;
//        • une longue description structurée — Histoire & Inspiration,
//          Confection & Entretien, Guide des Tailles & Livraisons ;
//        • sa catégorie (Femme, Homme, Accessoires & Bijoux,
//          Cérémonie & Mariage) traduite en tags, ET le tag `lookbook` qui
//          alimente automatiquement la section Lookbook.
//
//   2. REPLI (jamais un écran blanc)
//      Si la Storefront API Shopify est muette — token absent, boutique hors
//      ligne, réseau coupé — les lectures publiques de `products.ts` servent
//      CE catalogue. La vitrine reste consultable au lieu de lever une erreur.
//
//  ⚠️ RÈGLE D'OR — Shopify reste la source de vérité de l'IDENTITÉ COMMERCIALE
//     (handle, prix, variantes, stock, panier) : l'enrichissement se contente
//     d'AJOUTER des visuels et du récit éditorial, il ne réécrit jamais un
//     prix ni un SKU. C'est ce qui garantit qu'un ajout au panier reste
//     factuellement exact.
// ────────────────────────────────────────────────────────────────────────────

import {
  CATALOG_ALL_SIZES,
  CATALOG_CATEGORY_TAGS,
  LOOKBOOK_TAG,
  MOCK_VARIANT_PREFIX,
  resolveCatalogCategory,
  type CatalogAllSize,
  type CatalogCategory,
} from "@/constants/catalog";
import { STORE_CURRENCY } from "@/constants/store";
import { getSvgPlaceholder } from "@/lib/assets/images";
import { formatPrice } from "@/lib/utils";
import type {
  Product,
  ProductDescriptionSections,
  ProductGalleryImage,
  ProductOption,
  SelectedOptions,
  ShopifyVariant,
} from "./types";

/**
 * Construit un placeholder SVG local et deterministe.
 *
 * Le pool Unsplash code en dur a ete retire : ses identifiants repondent 404
 * et provoquaient des visuels casses sur la vitrine de repli. Chaque entree
 * conserve une trame propre (`seed`) afin que les galeries restent variees.
 */
export function catalogImage(seed: number): string {
  return getSvgPlaceholder({
    ratio: "portrait",
    label: "Piece AfroStyle",
    seed,
  });
}

/** Pool de replis locaux — 27 trames distinctes, aucun appel reseau. */
export const CATALOG_IMAGE_POOL: readonly string[] = Array.from(
  { length: 27 },
  (_, index) => catalogImage(index),
);

/**
 * Visuel éditorial de secours par catégorie : utilisé quand une création ne
 * possède aucune image exploitable (ni Shopify, ni pool). Aucun bloc vide.
 */
export const CATALOG_CATEGORY_VISUALS: Record<CatalogCategory, string> = {
  Femme: CATALOG_IMAGE_POOL[6],
  Homme: CATALOG_IMAGE_POOL[13],
  "Accessoires & Bijoux": CATALOG_IMAGE_POOL[4],
  "Cérémonie & Mariage": CATALOG_IMAGE_POOL[5],
};

/** Longue description éditoriale — 4 volets de la fiche produit. */
export type MockLongDescription = {
  /** Origines du motif, symbolique du tissu, intention du créateur. */
  histoire: string;
  /** Geste de confection, atelier, finitions. */
  confection: string;
  /** Lavage, séchage, repassage. */
  entretien: string;
  /** Guide des tailles, délais et expéditions internationales. */
  tailles: string;
};

/**
 * Fiche de catalogue éditoriale.
 *
 * `handle`, `title`, `vendor` et `price` reprennent volontairement les valeurs
 * publiées dans la boutique : l'enrichissement ne peut donc jamais afficher un
 * récit incohérent avec la pièce réellement vendue. Ces valeurs ne servent de
 * source primaire que dans le mode « repli » (Shopify muet).
 */
export type MockCatalogProduct = {
  handle: string;
  title: string;
  vendor: string;
  /** Prix catalogue TTC, au format Shopify ("185.00"). */
  price: string;
  /** Prix barré éventuel (pièce en promotion saisonnière). */
  compareAtPrice?: string;
  category: CatalogCategory;
  /** Tailles standard disponibles (échelle `CATALOG_SIZE_SCALE`). */
  sizes: readonly string[];
  /** La pièce accepte une commande aux mesures du client. */
  madeToMeasure?: boolean;
  /** Déclinaisons de couleur proposées à la commande. */
  colors?: readonly string[];
  /** Pièce mise en avant dans le Lookbook (tag `lookbook`). */
  lookbook: boolean;
  /** Note affichée sous le titre de la fiche (contenu de démonstration). */
  rating: { value: number; count: number };
  /** 1 à 2 phrases : matières, coupe, livraison. */
  shortDescription: string;
  longDescription: MockLongDescription;
  /** Galerie : 3 a 4 replis visuels locaux (grande image puis vignettes). */
  images: readonly string[];
};

/** Tailles standard + « Sur-mesure » : échelle complète de la fiche produit. */
export function sizesWithMadeToMeasure(
  sizes: readonly string[],
  madeToMeasure: boolean | undefined,
): string[] {
  const out = [...sizes];
  if (madeToMeasure && !out.includes("Sur-mesure")) out.push("Sur-mesure");
  return out.filter((size) =>
    (CATALOG_ALL_SIZES as readonly string[]).includes(size),
  );
}

/** Vrai si la chaîne appartient à l'échelle de tailles officielle du site. */
export function isKnownSize(size: string): size is CatalogAllSize {
  return (CATALOG_ALL_SIZES as readonly string[]).includes(size);
}

/** Alias court du pool — les galeries ci-dessous se lisent comme un nuancier. */
const IMG = CATALOG_IMAGE_POOL;

/**
 * LE CATALOGUE ÉDITORIAL — 12 pièces de référence, 3 par univers.
 *
 * Chaque fiche fournit sa galerie (3 à 4 visuels du pool), ses tailles, ses
 * couleurs, sa courte description et ses 4 volets de longue description.
 * Les `handle` correspondent aux créations réellement publiées dans la
 * boutique : l'enrichissement s'applique donc sans jamais contredire le prix
 * ou le créateur affichés au panier.
 *
 * Les pièces non listées ici ne sont pas oubliées : elles reçoivent une
 * galerie déterministe (`rotatedGallery`) et leur catégorie déduite des tags.
 */
export const MOCK_CATALOG: readonly MockCatalogProduct[] = [
  // ── FEMME ────────────────────────────────────────────────────────────────
  {
    handle: "robe-cotonou-dusk",
    title: "Robe Cotonou Dusk",
    vendor: "Adaeze Okafor",
    price: "185.00",
    category: "Femme",
    sizes: ["XS", "S", "M", "L", "XL"],
    madeToMeasure: true,
    colors: ["Indigo", "Écru"],
    lookbook: true,
    rating: { value: 4.9, count: 124 },
    shortDescription:
      "Wax de coton indigo, coupe architecturale ceinturée et tombé fluide — expédiée depuis l'atelier sous 2 à 5 jours ouvrés.",
    longDescription: {
      histoire:
        "Le motif naît des étals de Dantokpa, à Cotonou : un indigo profond traversé de réserves claires, symbole de protection et de transmission dans les cours royales du Danxomè. Adaeze Okafor en isole les lignes essentielles pour dessiner une robe de soirée qui porte son héritage sans le répéter.",
      confection:
        "Pièce montée à l'atelier de Cotonou : buste doublé, pinces marquées à la craie, fermeture invisible et ourlet roulotté main. Le wax est pré-lavé pour stabiliser la couleur avant montage — d'où une tenue qui ne bouge pas au premier entretien.",
      entretien:
        "Lavage à la main ou en machine à 30 °C sur programme délicat, à l'envers, avec un détergent doux et sans javel. Séchage à plat à l'ombre, repassage à fer tiède sur l'envers. Le coton wax se patine élégamment au fil des lavages.",
      tailles:
        "Tailles XS à XL et confection sur-mesure (mensurations prises à distance, 10 à 15 jours d'atelier). Guide des tailles détaillé en bas de fiche. Expédition internationale suivie depuis Cotonou ; livraison offerte dès 150 €.",
    },
    images: [IMG[1], IMG[3], IMG[6], IMG[16]],
  },
  {
    handle: "robe-broderie-diamant",
    title: "Robe Broderie Diamant",
    vendor: "Aminata Diallo",
    price: "450.00",
    category: "Femme",
    sizes: ["S", "M", "L", "XL", "XXL"],
    madeToMeasure: true,
    lookbook: true,
    rating: { value: 5, count: 58 },
    shortDescription:
      "Bazin riche brodé « diamant » au fil doré, robe longue doublée à la main — création de cérémonie signée Aminata Diallo.",
    longDescription: {
      histoire:
        "Le bazin riche se transmet de mère en fille dans les familles sénégalaises ; sa broderie « diamant », réalisée au fil de coton mercerisé puis lustrée au bâton, capte la lumière comme une pierre taillée. Aminata Diallo en fait une robe longue pensée pour les grands jours, sans jamais tomber dans le costume folklorique.",
      confection:
        "Chaque panneau est brodé avant montage par les brodeurs de l'atelier dakarois, puis lustré à la main. Doublure en coton respirant, baleines discrètes au buste, fermeture invisible au dos. Comptez 3 à 4 semaines pour une pièce sur-mesure.",
      entretien:
        "Nettoyage à sec recommandé pour préserver le lustre de la broderie. Repassage à l'envers, à fer doux, en interposant un linge. Ne jamais repasser directement sur les motifs brodés ni les exposer à un parfum alcoolisé.",
      tailles:
        "Tailles S à XXL, plus sur-mesure sur rendez-vous (visio ou atelier). Les mesures du buste et de la taille sont reprises à la commande pour une tombée parfaite. Expédition internationale suivie, emballage en housse coton.",
    },
    images: [IMG[3], IMG[8], IMG[22], IMG[9]],
  },
  {
    handle: "jupe-fendue-wax",
    title: "Jupe Fendue Wax",
    vendor: "Zara Kone",
    price: "95.00",
    compareAtPrice: "125.00",
    category: "Femme",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Terracotta", "Noir"],
    lookbook: true,
    rating: { value: 4.8, count: 203 },
    shortDescription:
      "Jupe crayon en wax, taille haute et fente latérale maîtrisée — la pièce facile à porter du matin au soir.",
    longDescription: {
      histoire:
        "Zara Kone travaille le wax d'Abidjan comme un tissu de tailleur : elle en retient les aplats graphiques et laisse le motif dialoguer avec la coupe. La fente latérale, héritée des jupes de cérémonie nouchi, libère le mouvement sans jamais forcer le trait.",
      confection:
        "Pantalon de taille haute doublé, ceinture intérieure, fermeture invisible et fente ourlée à la main. Le wax est thermocollé sur les zones de tension (taille, fente) pour éviter tout gondolement après quelques ports.",
      entretien:
        "Machine à 30 °C sur programme délicat, à l'envers, dans un filet de lavage. Étendre à plat, repasser à fer tiède sur l'envers. Éviter le sèche-linge : il fragilise la tenue du coton et fige les plis.",
      tailles:
        "XS à XL. Les hanches déterminent la taille à commander (guide des tailles en bas de fiche). Retours acceptés sous 30 jours, hors pièces sur-mesure. Expédition sous 48 h pour les tailles en stock.",
    },
    images: [IMG[18], IMG[23], IMG[15]],
  },

  // ── HOMME ────────────────────────────────────────────────────────────────
  {
    handle: "agbada-lagos-night",
    title: "Agbada Lagos Night",
    vendor: "Chidi Okeke",
    price: "450.00",
    category: "Homme",
    sizes: ["S", "M", "L", "XL", "XXL"],
    madeToMeasure: true,
    colors: ["Encre", "Ivoire"],
    lookbook: true,
    rating: { value: 4.9, count: 76 },
    shortDescription:
      "Agbada yoruba en soie naturelle, coupe slim-fit trois pièces et broderie au col — l'élégance de Lagos pour les grandes occasions.",
    longDescription: {
      histoire:
        "L'agbada est la tenue des grandes assemblées yoruba : ses amples manches captent le vent, ses broderies annoncent le rang de celui qui la porte. Chidi Okeke en propose une lecture slim-fit, trois pièces (tunique, pantalon, agbada), pour que la pièce reste majestueuse en ville comme en cérémonie.",
      confection:
        "Soie naturelle doublée coton, broderie machine fine au col et aux poignets, agbada volant monté en panneaux pour un tombé régulier. Repassage final vapeur à l'atelier de Lagos, pièce posée à plat avant emballage.",
      entretien:
        "Nettoyage à sec pour l'ensemble. Repassage vapeur à fer doux, sur l'envers, en évitant la broderie. Suspendre sur cintre large (épaules de costume) : la soie garde ainsi la mémoire de sa coupe.",
      tailles:
        "S à XXL et sur-mesure (7 mesures relevées à distance). Pour la hauteur d'épaule, comparez la longueur de manche de la pièce que vous portez habituellement. Expédition internationale suivie, livraison offerte dès 150 €.",
    },
    images: [IMG[12], IMG[10], IMG[11], IMG[21]],
  },
  {
    handle: "veste-accra-royale",
    title: "Veste Accra Royale",
    vendor: "Kofi Mensah",
    price: "320.00",
    category: "Homme",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Or antique", "Vert forêt"],
    lookbook: true,
    rating: { value: 4.7, count: 41 },
    shortDescription:
      "Veste en Kente tissé main, doublure coton et revers structurés — la pièce de soirée qui reprend les codes royaux ashanti.",
    longDescription: {
      histoire:
        "Le Kente est né chez les Ashanti du Ghana : chaque bande tissée porte un nom et un proverbe. Kofi Mensah réserve les motifs royaux — or, vert, indigo — à une veste de soirée, pour que le tissu reste le héros de la silhouette.",
      confection:
        "Bandes de Kente tissées à la main dans la région de Kumasi, assemblées en panneaux symétriques avant montage. Doublure coton, épaules légèrement rembourrées, boutons recouverts du même tissu. Le pattier recoupe chaque bande pour aligner les motifs.",
      entretien:
        "Nettoyage à sec des épaules et du corps de la veste. En cas de petit pli, vapeur à distance, sans contact avec le tissé main. Ranger impérativement sur cintre large, à l'abri de la lumière directe.",
      tailles:
        "S à XXL. La veste se porte ajustée : si vous hésitez entre deux tailles, prenez la plus petite pour les silhouettes fines, la plus grande pour superposer un col roulé. Guide des tailles détaillé et expédition suivie depuis Accra.",
    },
    images: [IMG[13], IMG[11], IMG[24], IMG[14]],
  },
  {
    handle: "chemise-agbada-fusion",
    title: "Chemise Agbada Fusion",
    vendor: "Chidi Okeke",
    price: "135.00",
    category: "Homme",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: ["Blanc cassé", "Bleu nuit"],
    lookbook: true,
    rating: { value: 4.8, count: 96 },
    shortDescription:
      "Chemise en soie légère à plastron brodé, entre héritage agbada et coupe contemporaine — la pièce de journée.",
    longDescription: {
      histoire:
        "Chidi Okeke conserve de l'agbada ce qui fait sa force — le plastron brodé, le col montant, la lumière de la soie — et en retire le volume. Résultat : une chemise qui se porte avec un pantalon de tailleur, un jean brut ou un ensemble assorti.",
      confection:
        "Plastron brodé séparément puis monté à la surjeteuse pour un intérieur net. Boutons en corne teintée, patte de boutonnage droite, pans arrondis pour se porter sorti ou rentré. Aucune doublure : la soie respire.",
      entretien:
        "Lavage à la main à froid ou nettoyage à sec. Essorer sans tordre, sécher à l'ombre sur cintre. Repasser à fer doux sur l'envers, sans jamais poser le fer sur la broderie du plastron.",
      tailles:
        "XS à XXL (col et tour de poitrine indiqués dans le guide). Pour un porté ajusté, prendre la taille indiquée ; pour un porté ample, monter d'une taille. Expédition sous 2 à 5 jours ouvrés, retours acceptés sous 30 jours.",
    },
    images: [IMG[19], IMG[25], IMG[13]],
  },

  // ── ACCESSOIRES & BIJOUX ─────────────────────────────────────────────────
  {
    handle: "parure-abidjan-gold",
    title: "Parure Abidjan Gold",
    vendor: "Amara Traoré",
    price: "890.00",
    category: "Accessoires & Bijoux",
    // Bijoux : aucune taille vêtement — la fiche affiche « Taille unique ».
    sizes: [],
    lookbook: true,
    rating: { value: 5, count: 34 },
    shortDescription:
      "Parure trois pièces en or akan 18 carats — collier, boucles et bracelet — livrée en écrin, 2 à 5 jours ouvrés.",
    longDescription: {
      histoire:
        "Dans la cour ashanti, l'or n'est pas un ornement : il est parole, protection et mémoire. Amara Traoré reprend les motifs géométriques akan — spirale de vie, nœud de sagesse — et les traduit en une parure de trois pièces qui se transmet.",
      confection:
        "Chaque élément est fondu, ciselé puis poli à la main dans l'atelier d'Abidjan. Les attaches sont renforcées pour supporter un usage quotidien ; le fermoir du collier est muni d'une double sécurité. Poinçon de titre apposé sur chaque pièce.",
      entretien:
        "Conserver dans l'écrin, à l'abri de l'humidité. Nettoyer avec un chiffon doux non pelucheux ou un bain d'eau tiède savonneuse, puis sécher immédiatement. Retirer les bijoux avant le sport, la douche et l'application de parfum.",
      tailles:
        "Taille unique : la longueur du collier est réglable de 40 à 45 cm et le bracelet comporte trois œillets. Un ajustement gratuit est possible à l'atelier. Expédition internationale assurée et suivie, livraison offerte dès 150 €.",
    },
    images: [IMG[4], IMG[0], IMG[5]],
  },
  {
    handle: "sac-bamako-heritage",
    title: "Sac Bamako Heritage",
    vendor: "Fatoumata Coulibaly",
    price: "240.00",
    category: "Accessoires & Bijoux",
    sizes: [],
    lookbook: true,
    rating: { value: 4.8, count: 62 },
    shortDescription:
      "Sac en bogolan teint à la boue ferrugineuse, base renforcée et anse cuir — chaque pièce est unique.",
    longDescription: {
      histoire:
        "Le bogolan est un tissu-parole du Mali : le fer de la boue fixe les motifs, chaque signe renvoie à un proverbe bambara. Fatoumata Coulibaly travaille ces signes en aplats graphiques et laisse volontairement la teinture irrégulière, signature d'un geste humain.",
      confection:
        "Toile de coton tissée au village, teinte par bains successifs puis séchée au soleil. Le sac est doublé coton, sa base renforcée par une couche de toile enduite, et son anse taillée dans une chute de cuir végétal. Fermeture aimantée en laiton.",
      entretien:
        "Brosser à sec pour retirer la poussière ; en cas de tache, tamponner avec un chiffon humide sans frotter, la couleur est naturelle et peut migrer. Ne pas immerger. Éviter l'exposition prolongée au soleil direct pour préserver les nuances.",
      tailles:
        "Taille unique : 32 × 26 × 12 cm, anse ajustable de 60 à 80 cm. Compartiment intérieur pour ordinateur 13 pouces. Expédition sous 2 à 5 jours ouvrés depuis Bamako, retours acceptés sous 30 jours.",
    },
    images: [IMG[0], IMG[5], IMG[4]],
  },
  {
    handle: "echarpe-bogolan",
    title: "Écharpe Bogolan",
    vendor: "Fatoumata Coulibaly",
    price: "55.00",
    category: "Accessoires & Bijoux",
    sizes: [],
    lookbook: true,
    rating: { value: 4.6, count: 148 },
    shortDescription:
      "Écharpe en bogolan artisanal, teinture naturelle à la boue et finitions franges nouées main — unisexe.",
    longDescription: {
      histoire:
        "Écharpe de saison sèche : le bogolan se porte à Bamako autour du cou ou en turban, et son motif annonce la région d'origine du tisserand. Fatoumata Coulibaly conserve la largeur traditionnelle pour que la pièce puisse se nouer de plusieurs manières.",
      confection:
        "Coton tissé sur métier traditionnel, teint à la boue ferrugineuse puis rincé jusqu'à stabilisation complète de la nuance. Les franges sont nouées à la main, une par une, pour éviter l'effilochage au premier lavage.",
      entretien:
        "Premier lavage à froid, seul, sans détergent agressif : la teinture naturelle peut libérer un léger excédent. Ensuite, machine à 30 °C en filet. Séchage à l'ombre à plat, repassage à fer tiède sur l'envers.",
      tailles:
        "Taille unique : 180 × 45 cm, franges comprises. Se porte en écharpe, en châle ou en turban. Expédition sous 2 à 5 jours ouvrés, livraison offerte dès 150 € d'achat.",
    },
    images: [IMG[5], IMG[2], IMG[4]],
  },

  // ── CÉRÉMONIE & MARIAGE ──────────────────────────────────────────────────
  {
    handle: "costume-sur-mesure",
    title: "Costume Sur-Mesure",
    vendor: "Moussa Sow",
    price: "650.00",
    category: "Cérémonie & Mariage",
    sizes: ["S", "M", "L", "XL", "XXL"],
    madeToMeasure: true,
    colors: ["Encre", "Anthracite", "Blanc ivoire"],
    lookbook: true,
    rating: { value: 5, count: 27 },
    shortDescription:
      "Costume trois pièces taillé aux mesures du client, laine froide et doublure soie — 3 semaines d'atelier, Conakry.",
    longDescription: {
      histoire:
        "Le vestiaire de cérémonie guinéen emprunte au tailleur européen sa rigueur et aux tisserands leur chaleur : un costume qui se porte à un mariage comme à une cérémonie officielle. Moussa Sow le coupe en trois pièces pour multiplier les portés — veste seule, gilet sur chemise, ou ensemble complet.",
      confection:
        "Dix-huit mesures relevées (ou transmises à distance selon notre protocole illustré), patron individuel conservé à l'atelier pour toute commande future. Laine froide, doublure soie, boutonnières milanaises travaillées main et ourlet de pantalon monté sans revers pour s'ajuster à la hauteur définitive.",
      entretien:
        "Brosser la veste après chaque port et la laisser respirer 24 h sur cintre large avant de la ranger en housse. Nettoyage à sec uniquement, deux fois par saison. Repassage vapeur confié à un pressing familier des tissus de costume.",
      tailles:
        "Confection aux mesures, ou tailles S à XXL pour un ajustement plus rapide. Comptez 3 semaines d'atelier plus expédition suivie. Un rendez-vous visio de validation du patron est proposé avant montage — aucune surprise à la réception.",
    },
    images: [IMG[20], IMG[13], IMG[21], IMG[24]],
  },
  {
    handle: "etole-kente-ceremonie",
    title: "Étole Kente Cérémonie",
    vendor: "Kwame Asante",
    price: "200.00",
    category: "Cérémonie & Mariage",
    sizes: [],
    lookbook: true,
    rating: { value: 4.9, count: 51 },
    shortDescription:
      "Étole en Kente tissé main aux motifs royaux ashantis, bords frangés — la pièce qui signe une tenue de cérémonie.",
    longDescription: {
      histoire:
        "L'étole de Kente se pose sur l'épaule comme un titre : chez les Ashanti, le motif choisi dit la circonstance et le lien familial. Kwame Asante en tisse une version d'apparat, assez longue pour retomber jusqu'à la taille, portée seule sur un costume sombre.",
      confection:
        "Bandes tissées à la main sur métier traditionnel dans la région de Kumasi, puis cousues bord à bord par un pattier qui aligne les motifs bande par bande. Les franges sont torsadées et nouées main à chaque extrémité.",
      entretien:
        "Nettoyage à sec uniquement. Repasser à l'envers, à fer doux et sans vapeur directe, pour ne pas aplatir le relief du tissage. Conserver roulée dans un tissu de coton plutôt que pliée, afin d'éviter les marques sur les fils d'or.",
      tailles:
        "Taille unique : 300 × 60 cm, franges incluses. Se porte sur l'épaule droite ou en châle pour les cérémonies. Expédition internationale suivie depuis Accra, emballage en poche coton réutilisable.",
    },
    images: [IMG[5], IMG[4], IMG[0]],
  },
  {
    handle: "pagne-kente-royal",
    title: "Pagne Kente Royal",
    vendor: "Kwame Asante",
    price: "320.00",
    category: "Cérémonie & Mariage",
    sizes: [],
    lookbook: true,
    rating: { value: 4.9, count: 44 },
    shortDescription:
      "Pagne Kente royal de 12 motifs traditionnels, tissé main à Kumasi — pièce d'héritage, unisexe.",
    longDescription: {
      histoire:
        "Le pagne royal réunit les motifs que les tisserands ashanti réservaient aux chefs : nœuds de sagesse, écheveaux de vie, lumière dorée du matin. Sa lecture se fait à deux voix — les hommes le portent drapé sur une épaule, les femmes en haut et bas assortis.",
      confection:
        "Douze motifs tissés bande par bande, soit environ trois semaines de métier à tisser. Le pagne est livré non monté : vous choisissez l'atelier de coupe, ou nos créateurs le montent en ensemble sur demande. Bords finis à la main pour éviter tout effilochage.",
      entretien:
        "Nettoyage à sec et rangement à plat dans une housse coton. En cas de contact avec l'eau, sécher immédiatement à l'ombre : les fils d'or supportent mal l'humidité prolongée. Repassage à l'envers, à fer doux.",
      tailles:
        "Taille unique : 2 × 1,20 m, non monté (pagne drapé) ou monté sur commande aux mesures du client en 10 à 15 jours. Expédition internationale suivie depuis Kumasi, livraison offerte dès 150 €.",
    },
    images: [IMG[2], IMG[1], IMG[3]],
  },
];

// ────────────────────────────────────────────────────────────────────────────
//  API PUBLIQUE DU CATALOGUE DE RÉFÉRENCE
// ────────────────────────────────────────────────────────────────────────────

/** Fiche éditoriale correspondant à un handle (ou `null`). */
export function getMockCatalogEntry(handle: string): MockCatalogProduct | null {
  return MOCK_CATALOG.find((product) => product.handle === handle) ?? null;
}

/** Empreinte déterministe d'un handle — même produit, même galerie, partout. */
function hashKey(key: string): number {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

/**
 * Galerie déterministe pour une création sans fiche éditoriale dédiée.
 * Le pool est parcouru par pas de trois : les visuels d'une même galerie ne se
 * répètent jamais, et deux produits voisins ne partagent pas la même image
 * d'ouverture.
 */
export function rotatedGallery(handle: string, count: number = 3): string[] {
  const start = hashKey(handle) % CATALOG_IMAGE_POOL.length;
  const gallery: string[] = [];
  for (let index = 0; index < count; index += 1) {
    gallery.push(
      CATALOG_IMAGE_POOL[(start + index * 3) % CATALOG_IMAGE_POOL.length],
    );
  }
  return [...new Set(gallery)];
}

/** Enrichissement éditorial complet appliqué à un produit du catalogue. */
export type CatalogEnrichment = {
  /** Fiche éditoriale dédiée (si le handle est décrit dans `MOCK_CATALOG`). */
  entry: MockCatalogProduct | null;
  /** Catégorie résolue (fiche dédiée, sinon déduite des tags). */
  category: CatalogCategory | null;
/** Replis visuels locaux à ajouter à la galerie (3 à 4). */
  gallery: string[];
  /** Tags à poser : catégorie + `lookbook`. */
  tags: string[];
  /** Échelle de tailles à afficher (fiche dédiée uniquement). */
  sizes: string[] | null;
  /** Déclinaisons de couleur proposées. */
  colors: string[] | null;
  /** Courte description (matières, coupe, livraison). */
  shortDescription: string | null;
  /** Longue description structurée en 4 volets. */
  descriptionSections: ProductDescriptionSections | null;
  /** Note affichée sous le titre (contenu de démonstration). */
  rating: { value: number; count: number } | null;
  /** La pièce accepte une confection aux mesures du client. */
  madeToMeasure: boolean;
  /** Pièce prioritaire du Lookbook (ordre d'affichage). */
  featuredInLookbook: boolean;
};

/**
 * Calcule l'enrichissement d'un produit.
 *
 * Toujours non-null : une création absente de `MOCK_CATALOG` reçoit une
 * galerie déterministe, sa catégorie déduite des tags et le tag `lookbook` —
 * la section Lookbook reste donc pilotée par les données, jamais par une liste
 * écrite en dur dans un composant.
 */
export function getProductEnrichment({
  handle,
  tags = [],
}: {
  handle: string;
  tags?: readonly string[];
}): CatalogEnrichment {
  const entry = getMockCatalogEntry(handle);
  const category = entry?.category ?? resolveCatalogCategory(tags);

  return {
    entry,
    category,
    gallery: entry ? [...entry.images] : rotatedGallery(handle, 3),
    tags: [...(category ? CATALOG_CATEGORY_TAGS[category] : []), LOOKBOOK_TAG],
    sizes: entry
      ? sizesWithMadeToMeasure(entry.sizes, entry.madeToMeasure)
      : null,
    colors: entry?.colors ? [...entry.colors] : null,
    shortDescription: entry?.shortDescription ?? null,
    descriptionSections: entry
      ? {
          materialOrigin: entry.longDescription.histoire,
          cutAndMaking: entry.longDescription.confection,
          care: entry.longDescription.entretien,
          sizeAndDelivery: entry.longDescription.tailles,
        }
      : null,
    rating: entry?.rating ?? null,
    madeToMeasure: entry?.madeToMeasure ?? false,
    featuredInLookbook: entry?.lookbook ?? false,
  };
}

// ────────────────────────────────────────────────────────────────────────────
//  CATALOGUE DE REPLI — mode « boutique injoignable »
// ────────────────────────────────────────────────────────────────────────────

/** Visuel de galerie dérivé d'une fiche de catalogue. */
function galleryImage(
  entry: MockCatalogProduct,
  url: string,
  index: number,
): ProductGalleryImage {
  return {
    url,
    altText: `${entry.title} — ${entry.vendor}, vue ${index + 1} du catalogue AfroStyle.`,
    // Replis locaux servies au ratio 3/4.
    width: 1000,
    height: 1500,
    role: index === 0 ? "overview" : index === 1 ? "detail" : "lifestyle",
  };
}

/**
 * Convertit une fiche de catalogue en `Product` normalisé.
 *
 * Utilisé UNIQUEMENT en mode repli (Storefront API muette) : la vitrine reste
 * alors entièrement consultable — galeries, tailles, couleurs, descriptions —
 * au lieu de renvoyer une erreur. Les variantes portent le préfixe
 * `mock-variant-` : l'interface propose donc une commande par contact au lieu
 * d'un ajout au panier impossible.
 */
export function buildMockCatalogProduct(entry: MockCatalogProduct): Product {
  const sizes = sizesWithMadeToMeasure(entry.sizes, entry.madeToMeasure);
  const colors = entry.colors ? [...entry.colors] : [];
  const enrichment = getProductEnrichment({ handle: entry.handle });

  const options: ProductOption[] = [];
  if (sizes.length > 0) options.push({ name: "Taille", values: sizes });
  if (colors.length > 0) options.push({ name: "Couleur", values: colors });

  const combinations: SelectedOptions[] =
    sizes.length > 0
      ? colors.length > 0
        ? sizes.flatMap((size) =>
            colors.map((color) => ({ Taille: size, Couleur: color })),
          )
        : sizes.map((size) => ({ Taille: size }))
      : [{}];

  const variants: ShopifyVariant[] = combinations.map(
    (selectedOptions, index) => ({
      id: `${MOCK_VARIANT_PREFIX}${entry.handle}-${index}`,
      title: Object.values(selectedOptions).join(" / ") || "Taille unique",
      availableForSale: true,
      quantityAvailable: null,
      sku: `AFS-${entry.handle.toUpperCase().slice(0, 12)}-${index + 1}`,
      price: { amount: entry.price, currencyCode: STORE_CURRENCY },
      compareAtPrice: entry.compareAtPrice
        ? { amount: entry.compareAtPrice, currencyCode: STORE_CURRENCY }
        : null,
      selectedOptions: Object.entries(selectedOptions).map(([name, value]) => ({
        name,
        value,
      })),
      image: null,
    }),
  );

  return {
    id: `mock-product-${entry.handle}`,
    handle: entry.handle,
    title: entry.title,
    description: entry.longDescription.histoire,
    price: entry.price,
    priceFormatted: formatPrice(entry.price),
    currencyCode: STORE_CURRENCY,
    compareAtPrice: entry.compareAtPrice ?? null,
    images: entry.images.map((url, index) => galleryImage(entry, url, index)),
    shortDescription: entry.shortDescription,
    descriptionSections: {
      materialOrigin: entry.longDescription.histoire,
      cutAndMaking: entry.longDescription.confection,
      care: entry.longDescription.entretien,
      sizeAndDelivery: entry.longDescription.tailles,
    },
    variants,
    options,
    vendor: entry.vendor,
    tags: enrichment.tags,
    country: null,
    fabric: null,
    style: null,
    availableForSale: true,
    rating: entry.rating,
    madeToMeasure: entry.madeToMeasure,
  };
}

/** Catalogue de repli (ordre éditorial de `MOCK_CATALOG`). */
const FALLBACK_CATALOG: Product[] = MOCK_CATALOG.map(buildMockCatalogProduct);

/** Toutes les pièces du catalogue de référence. */
export function getMockCatalogProducts(): Product[] {
  return FALLBACK_CATALOG;
}

/** Une pièce du catalogue de référence par son handle. */
export function getMockCatalogProductByHandle(handle: string): Product | null {
  return FALLBACK_CATALOG.find((product) => product.handle === handle) ?? null;
}

/**
 * Applique une requête Storefront simplifiée au catalogue de repli.
 *
 * Seuls les filtres réellement produits par l'application sont interprétés
 * (`tag:<tag>`, `vendor:<nom>`) ainsi que les mots libres — mieux vaut une
 * sélection large qu'un catalogue vide présenté comme une absence de stock.
 */
export function filterMockCatalog({
  query,
  first,
}: {
  query?: string;
  first?: number;
} = {}): Product[] {
  const terms = (query ?? "").trim().split(/\s+/).filter(Boolean);
  const tagFilters = terms
    .filter((term) => term.startsWith("tag:"))
    .map((term) => term.slice(4).replace(/^"|"$/g, "").toLowerCase());
  const vendorFilters = terms
    .filter((term) => term.startsWith("vendor:"))
    .map((term) => term.slice(7).replace(/^"|"$/g, "").toLowerCase());
  const freeText = terms
    .filter((term) => !term.includes(":"))
    .map((term) => term.toLowerCase());

  const matched = FALLBACK_CATALOG.filter((product) => {
    const productTags = product.tags.map((tag) => tag.toLowerCase());
    if (!tagFilters.every((tag) => productTags.includes(tag))) return false;
    if (
      vendorFilters.length > 0 &&
      !vendorFilters.some((vendor) =>
        product.vendor.toLowerCase().includes(vendor),
      )
    ) {
      return false;
    }
    if (freeText.length > 0) {
      const haystack =
        `${product.title} ${product.vendor} ${product.tags.join(" ")}`.toLowerCase();
      if (!freeText.every((word) => haystack.includes(word))) return false;
    }
    return true;
  });

  return typeof first === "number" && first > 0
    ? matched.slice(0, first)
    : matched;
}

/**
 * Pièces mises en avant dans le Lookbook (fiches éditoriales d'abord, puis
 * galerie déterministe) — alimente /lookbook et l'aperçu de l'accueil quand la
 * collection Shopify « lookbook » est absente ou vide.
 */
export function getMockLookbookProducts(first: number = 12): Product[] {
  const featured = MOCK_CATALOG.filter((entry) => entry.lookbook)
    .map((entry) =>
      FALLBACK_CATALOG.find((product) => product.handle === entry.handle),
    )
    .filter((product): product is Product => Boolean(product));

  const rest = FALLBACK_CATALOG.filter(
    (product) => !featured.some((item) => item.id === product.id),
  );

  return [...featured, ...rest].slice(0, first);
}

