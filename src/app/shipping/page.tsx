// src/app/shipping/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import InfoPage, { InfoCard, InfoCta } from "@/components/layout/InfoPage";
import {
  FLAT_SHIPPING_RATE,
  FREE_SHIPPING_THRESHOLD,
  formatStoreAmount,
} from "@/constants/store";

export const metadata: Metadata = {
  title: "Livraison",
  description:
    "Politique de livraison AfroStyle — expédition internationale depuis les ateliers de nos créateurs.",
};

export default function ShippingPage() {
  return (
    <InfoPage
      eyebrow="Service Client"
      title={<>Livraison</>}
      intro="Chaque pièce est expédiée directement depuis l’atelier de son créateur, avec le plus grand soin."
    >
      <InfoCard title="Délais & zones">
        <p>
          <strong className="text-text">Afrique de l’Ouest :</strong> 3 à 7
          jours ouvrés.
        </p>
        <p>
          <strong className="text-text">Europe & Amérique du Nord :</strong>{" "}
          7 à 14 jours ouvrés.
        </p>
        <p>
          <strong className="text-text">Reste du monde :</strong> 10 à 20
          jours ouvrés.
        </p>
        <p>
          Les créations étant confectionnées à la commande par nos créateurs, un
          délai de préparation de 2 à 5 jours ouvrés peut s’ajouter.
        </p>
      </InfoCard>

      <InfoCard title="Frais d'expédition">
        <p>
          <strong className="text-text">Livraison internationale offerte</strong>{" "}
          dès {formatStoreAmount(FREE_SHIPPING_THRESHOLD)} d’achat.
        </p>
        <p>
          En dessous de {formatStoreAmount(FREE_SHIPPING_THRESHOLD)} : forfait de{" "}
          {formatStoreAmount(FLAT_SHIPPING_RATE)} worldwide.
        </p>
        <p>
          Les éventuels droits de douane sont à la charge du destinataire selon
          la réglementation locale.
        </p>
      </InfoCard>

      <InfoCard title="Suivi de commande">
        <p>
          Un numéro de suivi vous est envoyé par e-mail dès l’expédition. Vous
          pouvez également suivre votre commande depuis votre{" "}
          <Link href="/account" className="text-gold-dark dark:text-gold underline underline-offset-2">
            espace client
          </Link>
          .
        </p>
      </InfoCard>

      <InfoCta />
    </InfoPage>
  );
}
