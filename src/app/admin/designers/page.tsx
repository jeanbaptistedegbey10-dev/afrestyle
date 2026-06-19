// src/app/admin/designers/page.tsx
import { db } from "@/lib/db";
import { approveDesigner, rejectDesigner } from "@/lib/actions/admin.actions";
import type { Metadata } from "next";

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

      <div className="flex flex-col gap-3 justify-center">
        <form action={approveDesigner}>
          <input type="hidden" name="designerId" value={designer.id} />
          <button
            type="submit"
            className="w-full py-3 text-sm font-medium tracking-widest uppercase"
            style={{ background: "#D4AF37", color: "#0F172A", borderRadius: "2px" }}
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

  return (
    <div style={{ background: "#0F172A", minHeight: "100vh", padding: "2rem" }}>
      <h1 className="font-serif text-3xl mb-8" style={{ color: "#FDFAF4" }}>
        Admin — Créateurs
      </h1>

      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xs tracking-widest uppercase" style={{ color: "#D4AF37" }}>
            En attente de validation
          </h2>
          <span
            className="px-2 py-0.5 text-xs rounded-full font-medium"
            style={{ background: "#D4AF37", color: "#0F172A" }}
          >
            {pending.length}
          </span>
        </div>

        {pending.length === 0 ? (
          <p style={{ color: "#D4CCBA" }}>Aucune candidature en attente</p>
        ) : (
          <div className="space-y-4">
            {pending.map((designer) => (
              <DesignerCard key={designer.id} designer={designer} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xs tracking-widest uppercase mb-4" style={{ color: "#D4AF37" }}>
          Créateurs actifs ({approved.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {approved.map((designer) => (
            <div
              key={designer.id}
              className="p-4"
              style={{
                background: "#1E293B",
                border: "0.5px solid rgba(212,175,55,0.1)",
                borderRadius: "2px",
              }}
            >
              <p className="font-serif text-base mb-1" style={{ color: "#FDFAF4" }}>
                {designer.brandName}
              </p>
              <p className="text-xs mb-1" style={{ color: "#D4CCBA" }}>
                {designer.firstName} {designer.lastName} — {designer.country}
              </p>
              <p className="text-xs" style={{ color: "#D4AF37" }}>
                /designers/{designer.handle}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}