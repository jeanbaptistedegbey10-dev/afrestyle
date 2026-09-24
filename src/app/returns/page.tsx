// src/app/returns/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import InfoPage, { InfoCard, InfoCta } from "@/components/layout/InfoPage";
import {
  RETURN_WINDOW_DAYS,
  SHIPPING_AND_RETURNS_RULE,
} from "@/constants/store";

export const metadata: Metadata = {
  title: "Retours & Échanges",
  description:
    "Politique de retours et d'échanges AfroStyle — 30 jours après réception pour changer d'avis.",
};

export default function ReturnsPage() {
  return (
    <InfoPage
      eyebrow="Service Client"
      title={<>Retours &amp; Échanges</>}
      intro={`Vous disposez de ${RETURN_WINDOW_DAYS} jours après réception pour retourner ou échanger une pièce.`}
    >
      {/* Règle commerciale canonique — formulation UNIQUE (src/constants/store.ts) */}
      <InfoCard title="Conditions de retour">
        <p>{SHIPPING_AND_RETURNS_RULE}</p>
        <p>
          Les articles doivent être retournés neufs, non portés, non lavés,
          avec leurs étiquettes d’origine et leur emballage de protection.
        </p>
        <p>
          Les pièces personnalisées ou réalisées sur mesure ne sont ni
          reprises ni échangées, sauf défaut de fabrication.
        </p>
      </InfoCard>

      <InfoCard title="Procédure">
        <p>
          <strong className="text-text">1.</strong> Écrivez-nous depuis la
          page <Link href="/contact" className="text-gold-dark dark:text-gold underline underline-offset-2">Contact</Link>{" "}
          en précisant votre numéro de commande.
        </p>
        <p>
          <strong className="text-text">2.</strong> Nous vous transmettons les
          instructions de retour et, lorsque la destination le permet, une
          étiquette prépayée sous 48 h.
        </p>
        <p>
          <strong className="text-text">3.</strong> Dès réception et
          contrôle (2 à 3 jours), le remboursement est effectué sur votre moyen
          de paiement d’origine.
        </p>
        <p>
          Les retours sont pris en charge avec une{" "}
          <strong className="text-text">étiquette prépayée</strong> en France et
          en Afrique de l’Ouest. Depuis les autres destinations, les frais de
          retour restent à votre charge.
        </p>
      </InfoCard>

      <InfoCard title="Échanges">
        <p>
          Pour un échange de taille ou de coloris, indiquez-le lors de votre
          demande : la nouvelle pièce est expédiée dès la prise en charge du
          colis retour.
        </p>
        <p>
          Une question sur une condition précise ? Retrouvez le détail dans notre{" "}
          <Link href="/faq" className="text-gold-dark dark:text-gold underline underline-offset-2">
            FAQ
          </Link>{" "}
          ou écrivez-nous depuis la page{" "}
          <Link href="/contact" className="text-gold-dark dark:text-gold underline underline-offset-2">
            Contact
          </Link>
          .
        </p>
      </InfoCard>

      <InfoCta />
    </InfoPage>
  );
}
