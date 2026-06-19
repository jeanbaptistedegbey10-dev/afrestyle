// src/app/dashboard/pending/page.tsx
import type { Metadata } from "next";
import { getCurrentDesigner } from "@/lib/actions/designer.actions";
import { logoutDesigner } from "@/lib/actions/designer.actions";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Candidature en cours — AfroStyle",
};

export default async function DashboardPendingPage() {
  const designer = await getCurrentDesigner();

  // Non connecté → login
  if (!designer) redirect("/dashboard/login");

  // Déjà approuvé → dashboard
  if (designer.status === "APPROVED") redirect("/dashboard");

  const isRejected = designer.status === "REJECTED";

  return (
    <div
      style={{ background: "#0F172A", minHeight: "100vh" }}
      className="flex items-center justify-center px-6 py-12"
    >
      <div className="w-full max-w-lg text-center">

        {/* Icône */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"
          style={{
            background: isRejected
              ? "rgba(220,38,38,0.1)"
              : "rgba(212,175,55,0.1)",
            border: isRejected
              ? "0.5px solid rgba(220,38,38,0.3)"
              : "0.5px solid rgba(212,175,55,0.3)",
          }}
        >
          <span style={{ fontSize: "2rem" }}>
            {isRejected ? "✗" : "⧗"}
          </span>
        </div>

        {isRejected ? (
          <>
            <p
              className="text-xs tracking-widest uppercase mb-3"
              style={{ color: "#fca5a5" }}
            >
              Candidature refusée
            </p>
            <h1
              className="font-serif text-4xl mb-4"
              style={{ color: "#FDFAF4" }}
            >
              Candidature non retenue
            </h1>
            <p className="text-sm mb-4 leading-relaxed" style={{ color: "#D4CCBA" }}>
              Votre candidature pour <strong style={{ color: "#FDFAF4" }}>{designer.brandName}</strong> n'a
              pas été retenue pour le moment.
            </p>
            {designer.rejectionReason && (
              <div
                className="p-4 mb-6 text-left"
                style={{
                  background: "rgba(220,38,38,0.05)",
                  border: "0.5px solid rgba(220,38,38,0.2)",
                  borderRadius: "4px",
                }}
              >
                <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "#fca5a5" }}>
                  Motif
                </p>
                <p className="text-sm italic" style={{ color: "#D4CCBA" }}>
                  {designer.rejectionReason}
                </p>
              </div>
            )}
            <p className="text-sm mb-8" style={{ color: "#D4CCBA" }}>
              Vous pouvez nous contacter pour plus d'informations ou resoumettre
              votre candidature avec de nouveaux éléments.
            </p>
          </>
        ) : (
          <>
            <p
              className="text-xs tracking-widest uppercase mb-3"
              style={{ color: "#D4AF37" }}
            >
              Candidature en cours d'examen
            </p>
            <h1
              className="font-serif text-4xl mb-4"
              style={{ color: "#FDFAF4" }}
            >
              Candidature reçue ✦
            </h1>
            <p className="text-sm mb-8 leading-relaxed" style={{ color: "#D4CCBA" }}>
              Merci <strong style={{ color: "#FDFAF4" }}>{designer.firstName}</strong> !
              Votre candidature pour{" "}
              <strong style={{ color: "#D4AF37" }}>{designer.brandName}</strong> est
              actuellement en cours d'examen par notre équipe.
              <br /><br />
              Nous vous contacterons à l'adresse{" "}
              <span style={{ color: "#FDFAF4" }}>{designer.email}</span>{" "}
              dans les <strong style={{ color: "#FDFAF4" }}>5 à 7 jours ouvrés</strong>.
            </p>

            {/* Indicateur de statut */}
            <div
              className="flex items-center justify-center gap-3 mb-8 p-4"
              style={{
                background: "rgba(212,175,55,0.05)",
                border: "0.5px solid rgba(212,175,55,0.2)",
                borderRadius: "4px",
              }}
            >
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: "#D4AF37" }}
              />
              <span className="text-xs tracking-widest uppercase" style={{ color: "#D4AF37" }}>
                En attente de validation
              </span>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/" className="btn-outline text-xs">
            Retour à l'accueil
          </Link>
          <form action={logoutDesigner}>
            <button
              type="submit"
              className="text-xs tracking-widest uppercase px-6 py-3 transition-colors"
              style={{
                border: "0.5px solid rgba(212,175,55,0.2)",
                color: "#D4CCBA",
                borderRadius: "2px",
              }}
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
