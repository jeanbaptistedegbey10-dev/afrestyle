// src/app/contact/page.tsx
import type { Metadata } from "next";
import InfoPage, { InfoCard, InfoCta } from "@/components/layout/InfoPage";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez l'équipe AfroStyle — questions sur une commande, une pièce ou une candidature créateur.",
};

export default function ContactPage() {
  return (
    <InfoPage
      eyebrow="Nous écrire"
      title={<>Contact</>}
      intro="Notre équipe vous répond sous 24 à 48h ouvrées."
    >
      <InfoCard title="Service client">
        <p>
          <strong className="text-[#1A1A1A]">E-mail :</strong>{" "}
          <a
            href="mailto:contact@afrestyle.com"
            className="text-[#B8860B] underline underline-offset-2"
          >
            contact@afrestyle.com
          </a>
        </p>
        <p>
          <strong className="text-[#1A1A1A]">Horaires :</strong> du lundi au
          vendredi, 9h — 18h (GMT).
        </p>
      </InfoCard>

      <InfoCard title="Suivi de commande">
        <p>
          Pour toute question sur une commande en cours, précisez votre numéro
          de commande (format <em>#AF-XXXX</em>) et l’e-mail utilisé lors de
          l’achat afin d’accélérer le traitement.
        </p>
      </InfoCard>

      <InfoCard title="Créateurs">
        <p>
          Vous êtes designer et souhaitez rejoindre la maison ? Envoyez votre
          portfolio et une présentation de votre univers à{" "}
          <a
            href="mailto:createurs@afrestyle.com"
            className="text-[#B8860B] underline underline-offset-2"
          >
            createurs@afrestyle.com
          </a>
          .
        </p>
      </InfoCard>

      <InfoCta />
    </InfoPage>
  );
}
