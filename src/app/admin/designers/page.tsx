// src/app/admin/designers/page.tsx
import { db } from "@/lib/db";
import { approveDesigner, rejectDesigner, adminLogoutAction } from "@/lib/actions/admin.actions";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Admin — Candidatures" };

type ApplicationInfo = {
  instagramUrl: string | null;
  portfolioUrl: string | null;
  motivation: string;
};

type DesignerWithApplications = {
  id: string;
  createdAt: Date;
  firstName: string;
  lastName: string;
  email: string;
  brandName: string;
  country: string;
  specialty: string;
  since: number;
  bio: string;
  handle: string;
  rejectionReason?: string | null; // Added this field here if it lives on the designer
  applications: ApplicationInfo[];
};

function DesignerCard({ designer }: { designer: DesignerWithApplications }) {
  const app = designer.applications[0];

  return (
    <div
      className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6"
      style={{
        background: "#1E293B",
        border: "0.5px solid rgba(212,175,55,0.15)",
        borderRadius: "2px",
      }}
    >
      {/* Infos créateur */}
      <div className="md:col-span-2 space-y-3">
        <div>
          <p className="font-serif text-xl mb-1" style={{ color: "#FDFAF4" }}>
            {designer.brandName}
          </p>
          <p className="text-sm" style={{ color: "#D4AF37" }}>
            {designer.firstName} {designer.lastName} — {designer.country}
          </p>
          <p className="text-xs" style={{ color: "#D4CCBA" }}>
            {designer.email} · {designer.specialty} · depuis {designer.since}
          </p>
        </div>

        <p className="text-sm leading-relaxed" style={{ color: "#D4CCBA" }}>
          {designer.bio}
        </p>

        {app && (
          <div className="space-y-2 text-xs" style={{ color: "#D4CCBA" }}>
            {app.instagramUrl && (
              <div>
                <span style={{ color: "#D4AF37" }}>Instagram : </span>
                <a
                  href={app.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#D4AF37", textDecoration: "underline" }}
                >
                  {app.instagramUrl}
                </a>
              </div>
            )}
            {app.portfolioUrl && (
              <div>
                <span style={{ color: "#D4AF37" }}>Portfolio : </span>
                <a
                  href={app.portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#D4AF37", textDecoration: "underline" }}
                >
                  Voir →
                </a>
              </div>
            )}
            {app.motivation && (
              <p
                className="italic mt-2 pt-2"
                style={{ borderTop: "0.5px solid rgba(212,175,55,0.1)" }}
              >
                "{app.motivation}"
              </p>
            )}
          </div>
        )}
      </div>

      {/* Actions admin */}
      <div className="flex flex-col gap-3 justify-center">
        <form action={approveDesigner}>
          <input type="hidden" name="designerId" value={designer.id} />
          <button
            type="submit"
            className="w-full py-3 text-sm font-medium tracking-widest uppercase"
            style={{
              background: "#D4AF37",
              color: "#0F172A",
              borderRadius: "2px",
            }}
          >
            ✓ Valider
          </button>
        </form>

        <form action={rejectDesigner}>
          <input type="hidden" name="designerId" value={designer.id} />
          <button
            type="submit"
            className="w-full py-3 text-sm font-medium tracking-widest uppercase"
            style={{
              background: "transparent",
              border: "0.5px solid rgba(220,38,38,0.4)",
              color: "#fca5a5",
              borderRadius: "2px",
            }}
          >
            ✗ Refuser
          </button>
        </form>

        <p className="text-xs text-center" style={{ color: "#D4CCBA" }}>
          Reçue le {new Date(designer.createdAt).toLocaleDateString("fr-FR")}
        </p>
      </div>
    </div>
  );
}

export default async function AdminDesignersPage() {
  const pending = await db.designer.findMany({
    where: { status: "PENDING" },
    include: {
      applications: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          instagramUrl: true,
          portfolioUrl: true,
          motivation: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const approved = await db.designer.findMany({
    where: { status: "APPROVED" },
    orderBy: { createdAt: "desc" },
  });

  const rejected = await db.designer.findMany({
    where: { status: "REJECTED" },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div style={{ background: "#0F172A", minHeight: "100vh", padding: "2rem" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <p
            className="text-xs tracking-widest uppercase mb-1"
            style={{ color: "#D4AF37" }}
          >
            Tableau de bord
          </p>
          <h1 className="font-serif text-3xl" style={{ color: "#FDFAF4" }}>
            Admin — Créateurs
          </h1>
        </div>
        <form action={adminLogoutAction}>
          <button
            type="submit"
            className="text-xs tracking-widest uppercase px-4 py-2 transition-colors"
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

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { num: pending.length,  label: "En attente", color: "#D4AF37" },
          { num: approved.length, label: "Validés",    color: "#86efac" },
          { num: rejected.length, label: "Refusés",    color: "#fca5a5" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-6 text-center"
            style={{
              background: "#1E293B",
              border: "0.5px solid rgba(212,175,55,0.1)",
              borderRadius: "2px",
            }}
          >
            <div
              className="font-serif text-4xl font-bold mb-1"
              style={{ color: stat.color }}
            >
              {stat.num}
            </div>
            <div
              className="text-xs tracking-widest uppercase"
              style={{ color: "#D4CCBA" }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Candidatures en attente */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <h2
            className="text-xs tracking-widest uppercase"
            style={{ color: "#D4AF37" }}
          >
            En attente de validation
          </h2>
          {pending.length > 0 && (
            <span
              className="px-2 py-0.5 text-xs rounded-full font-medium"
              style={{ background: "#D4AF37", color: "#0F172A" }}
            >
              {pending.length}
            </span>
          )}
        </div>

        {pending.length === 0 ? (
          <div
            className="text-center py-10"
            style={{
              background: "#1E293B",
              border: "0.5px solid rgba(212,175,55,0.1)",
              borderRadius: "2px",
            }}
          >
            <p style={{ color: "#D4CCBA" }}>
              Aucune candidature en attente ✓
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((designer) => (
              <DesignerCard key={designer.id} designer={designer as unknown as DesignerWithApplications} />
            ))}
          </div>
        )}
      </section>

      {/* Créateurs validés */}
      <section className="mb-12">
        <h2
          className="text-xs tracking-widest uppercase mb-4"
          style={{ color: "#86efac" }}
        >
          Créateurs actifs ({approved.length})
        </h2>

        {approved.length === 0 ? (
          <p style={{ color: "#D4CCBA" }}>Aucun créateur validé pour l'instant</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {approved.map((designer) => (
              <div
                key={designer.id}
                className="p-4"
                style={{
                  background: "#1E293B",
                  border: "0.5px solid rgba(134,239,172,0.15)",
                  borderRadius: "2px",
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <p
                    className="font-serif text-base"
                    style={{ color: "#FDFAF4" }}
                  >
                    {designer.brandName}
                  </p>
                  <span
                    className="text-xs px-2 py-0.5"
                    style={{
                      background: "rgba(134,239,172,0.1)",
                      color: "#86efac",
                      borderRadius: "2px",
                    }}
                  >
                    Actif
                  </span>
                </div>
                <p className="text-xs mb-1" style={{ color: "#D4CCBA" }}>
                  {designer.firstName} {designer.lastName} — {designer.country}
                </p>
                <p className="text-xs mb-2" style={{ color: "#D4CCBA" }}>
                  {designer.email}
                </p>
                
                <Link
                  href={`/designers/${designer.handle}`}
                  target="_blank"
                  className="text-xs"
                  style={{ color: "#D4AF37", textDecoration: "underline" }}
                >
                  /designers/{designer.handle} →
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Créateurs refusés */}
      {rejected.length > 0 && (
        <section>
          <h2
            className="text-xs tracking-widest uppercase mb-4"
            style={{ color: "#fca5a5" }}
          >
            Candidatures refusées ({rejected.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rejected.map((designer) => (
              <div
                key={designer.id}
                className="p-4"
                style={{
                  background: "#1E293B",
                  border: "0.5px solid rgba(220,38,38,0.15)",
                  borderRadius: "2px",
                }}
              >
                <p
                  className="font-serif text-base mb-1"
                  style={{ color: "#FDFAF4" }}
                >
                  {designer.brandName}
                </p>
                <p className="text-xs mb-1" style={{ color: "#D4CCBA" }}>
                  {designer.firstName} {designer.lastName} — {designer.country}
                </p>
                {/* Fixed potential compilation issue assuming rejectionReason is a string/null property on the designer */}
                {"rejectionReason" in designer && designer.rejectionReason && (
                  <p
                    className="text-xs italic mt-2"
                    style={{ color: "#fca5a5" }}
                  >
                    {String(designer.rejectionReason)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}