// src/app/returns/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import InfoPage, { InfoCard, InfoCta } from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "Retours & Échanges",
  description:
    "Politique de retours et d'échanges AfroStyle — 30 jours pour changer d'avis.",
};

export default function ReturnsPage() {
  return (
    <InfoPage
      eyebrow="Service Client"
      title={<>Retours &amp; Échanges</>}
      intro="Vous avez 30 jours après réception pour retourner ou échanger une pièce."
    >
      <InfoCard title="Conditions de retour">
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
          <strong className="text-[#1A1A1A]">1.</strong> Écrivez-nous depuis la
          page <Link href="/contact" className="text-[#B8860B] underline underline-offset-2">Contact</Link>{" "}
          en précisant votre numéro de commande.
        </p>
        <p>
          <strong className="text-[#1A1A1A]">2.</strong> Nous vous transmettons
          une étiquette de retour prépayée sous 48h.
        </p>
        <p>
          <strong className="text-[#1A1A1A]">3.</strong> Dès réception et
          contrôle (2 à 3 jours), le remboursement est effectué sur votre moyen
          de paiement d’origine.
        </p>
        <p>
          Les retours sont <strong className="text-[#1A1A1A]">gratuits</strong>{" "}
          en France et en Afrique de l’Ouest.
        </p>
      </InfoCard>

      <InfoCard title="Échanges">
        <p>
          Pour un échange de taille ou de coloris, indiquez-le lors de votre
          demande : la nouvelle pièce est expédiée dès la prise en charge du
          colis retour.
        </p>
      </InfoCard>

      <InfoCta />
    </InfoPage>
  );
}
