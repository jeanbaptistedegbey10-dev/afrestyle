// src/app/faq/page.tsx
import type { Metadata } from "next";
import InfoPage, { InfoCard, InfoCta } from "@/components/layout/InfoPage";
import { FREE_SHIPPING_THRESHOLD, formatStoreAmount } from "@/constants/store";

export const metadata: Metadata = {
  title: "Foire aux questions",
  description:
    "Réponses aux questions les plus fréquentes sur AfroStyle : commandes, livraison, retours, créateurs.",
};

const FAQ = [
  {
    q: "Qui confectionne les pièces AfroStyle ?",
    a: "Chaque création est réalisée par un designer africain indépendant, sélectionné pour la qualité de son travail et son éthique de production. 70% du prix de vente lui est reversé directement.",
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
    q: "Quels sont les délais de livraison ?",
    a: `3 à 7 jours ouvrés pour l'Afrique de l'Ouest, 7 à 14 jours pour l'Europe et l'Amérique du Nord. Livraison offerte dès ${formatStoreAmount(FREE_SHIPPING_THRESHOLD)} d'achat.`,
  },
  {
    q: "Puis-je retourner un article ?",
    a: "Oui — vous disposez de 30 jours après réception pour retourner ou échanger une pièce, à condition qu'elle soit neuve avec ses étiquettes. Consultez notre page Retours & Échanges.",
  },
  {
    q: "Comment suivre ma commande ?",
    a: "Un e-mail avec un numéro de suivi vous est envoyé dès l'expédition. Vous pouvez aussi retrouver vos commandes dans votre espace client.",
  },
  {
    q: "Les tailles sont-elles fidèles ?",
    a: "Chaque fiche produit indique la coupe et les mesures du vêtement. En cas de doute entre deux tailles, nous recommandons de choisir la plus grande.",
  },
  {
    q: "Comment devenir créateur partenaire ?",
    a: "Écrivez-nous via la page Contact avec votre portfolio : notre équipe examine chaque candidature sous 5 jours ouvrés.",
  },
];

export default function FaqPage() {
  return (
    <InfoPage
      eyebrow="Service Client"
      title={<>Foire aux questions</>}
      intro="Tout ce qu'il faut savoir avant, pendant et après votre commande."
    >
      {FAQ.map((item) => (
        <InfoCard key={item.q} title={item.q}>
          <p>{item.a}</p>
        </InfoCard>
      ))}

      <InfoCta href="/contact" label="Poser une autre question" />
    </InfoPage>
  );
}
