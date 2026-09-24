// src/app/faq/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import InfoPage, { InfoCard, InfoCta } from "@/components/layout/InfoPage";
import {
  FLAT_SHIPPING_RATE,
  FREE_SHIPPING_THRESHOLD,
  RETURN_WINDOW_DAYS,
  SHIPPING_AND_RETURNS_RULE,
  formatStoreAmount,
} from "@/constants/store";

export const metadata: Metadata = {
  title: "Foire aux questions",
  description:
    "Réponses aux questions les plus fréquentes sur AfroStyle : commandes, livraison internationale, retours sous 30 jours et créateurs partenaires.",
};

const FAQ = [
  {
    q: "Qui confectionne les pièces AfroStyle ?",
    a: "Chaque création est réalisée par un designer africain indépendant, sélectionné pour la qualité de son travail et son éthique de production. 70 % du prix de vente lui est reversé directement.",
  },
  {
    q: "Comment passer commande ?",
    a: "Ajoutez vos pièces au panier puis cliquez sur « Procéder au paiement ». Le paiement est traité de façon sécurisée par Shopify. Vous recevez une confirmation par e-mail immédiatement.",
  },
  {
    q: "Quels moyens de paiement sont acceptés ?",
    a: "Visa, Mastercard, American Express, PayPal, Shop Pay, Apple Pay et Google Pay.",
  },
  {
    q: "Livrez-vous à l'international ?",
    a: `Oui — la livraison internationale est disponible. Expédition depuis l'atelier de votre créateur : 3 à 7 jours ouvrés pour l'Afrique de l'Ouest, 7 à 14 jours ouvrés pour l'Europe et l'Amérique du Nord, 10 à 20 jours ouvrés pour le reste du monde. Un délai de préparation de 2 à 5 jours ouvrés peut s'ajouter, chaque pièce étant confectionnée à la commande. Livraison offerte dès ${formatStoreAmount(FREE_SHIPPING_THRESHOLD)} d'achat, forfait de ${formatStoreAmount(FLAT_SHIPPING_RATE)} en dessous.`,
  },
  {
    q: "Puis-je retourner un article ?",
    a: `Oui — vous disposez de ${RETURN_WINDOW_DAYS} jours après réception pour retourner ou échanger une pièce, à condition qu'elle soit neuve, non portée, avec ses étiquettes d'origine et son emballage de protection. Les conditions détaillées figurent dans notre page Retours & Échanges.`,
  },
  {
    q: "Les retours sont-ils payants ?",
    a: "Les retours sont pris en charge avec une étiquette prépayée en France et en Afrique de l'Ouest. Depuis les autres destinations, les frais de retour restent à votre charge. Les pièces personnalisées ou réalisées sur mesure ne sont ni reprises ni échangées, sauf défaut de fabrication.",
  },
  {
    q: "Comment suivre ma commande ?",
    a: "Un e-mail avec un numéro de suivi vous est envoyé dès l'expédition. Vous pouvez aussi retrouver vos commandes dans votre espace client.",
  },
  {
    q: "Les tailles sont-elles fidèles ?",
    a: "Chaque fiche produit indique la coupe et les mesures du vêtement. En cas de doute entre deux tailles, nous vous recommandons de choisir la plus grande.",
  },
  {
    q: "Comment devenir créateur partenaire ?",
    a: "Écrivez-nous depuis la page Contact avec votre portfolio : notre équipe examine chaque candidature sous 5 jours ouvrés.",
  },
];

export default function FaqPage() {
  return (
    <InfoPage
      eyebrow="Service Client"
      title={<>Foire aux questions</>}
      intro="Tout ce qu'il faut savoir avant, pendant et après votre commande."
    >
      {/* Règle commerciale canonique — formulation UNIQUE (src/constants/store.ts),
          affichée à l'identique sur l'accueil, les fiches produit et le footer. */}
      <InfoCard title="Livraison & retours en un coup d'œil">
        <p>{SHIPPING_AND_RETURNS_RULE}</p>
        <p>
          Livraison offerte dès {formatStoreAmount(FREE_SHIPPING_THRESHOLD)}{" "}
          d&apos;achat · forfait de {formatStoreAmount(FLAT_SHIPPING_RATE)} en
          dessous. Détail des zones et des délais sur la page{" "}
          <Link
            href="/shipping"
            className="text-gold-dark dark:text-gold underline underline-offset-2"
          >
            Livraison
          </Link>{" "}
          et des conditions sur la page{" "}
          <Link
            href="/returns"
            className="text-gold-dark dark:text-gold underline underline-offset-2"
          >
            Retours &amp; Échanges
          </Link>
          .
        </p>
      </InfoCard>

      {FAQ.map((item) => (
        <InfoCard key={item.q} title={item.q}>
          <p>{item.a}</p>
        </InfoCard>
      ))}

      <InfoCta href="/contact" label="Poser une autre question" />
    </InfoPage>
  );
}
