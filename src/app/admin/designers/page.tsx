// src/app/admin/designers/page.tsx
// Page protégée par middleware admin

import { db } from "@/lib/db";
import { approveDesigner, rejectDesigner } from "@/lib/actions/admin.actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Candidatures" };

export default async function AdminDesignersPage() {
  const pending = await db.designer.findMany({
    where: { status: "PENDING" },
    include: { applications: { orderBy: { createdAt: "desc" }, take: 1 } },
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

      {/* En attente */}
      <section className="mb-12">
        <h2
          className="text-xs tracking-widest uppercase mb-4 flex items-center gap-2"
          style={{ color: "#D4AF37" }}
        >
          En attente de validation
          <span
            className="px-2 py-0.5 text-xs rounded-full"
            style={{ background: "#D4AF37", color: "#0F172A" }}
          >
            {pending.length}
          </span>
        </h2>

        {pending.length === 0 ? (
          <p style={{ color: "#D4CCBA" }}>Aucune candidature en attente</p>
        ) : (
          <div className="space-y-4">
            {pending.map((designer) => (
              <div
                key={designer.id}
                className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6"
                style={{
                  background: "#1E293B",
                  border: "0.5px solid rgba(212,175,55,0.15)",
                  borderRadius: "2px",
                }}
              >
                {/* Infos */}
                <div className="md:col-span-2">
                  <p className="font-serif text-xl mb-1" style={{ color: "#FDFAF4" }}>
                    {designer.brandName}
                  </p>
                  <p className="text-sm mb-1" style={{ color: "#D4AF37" }}>
                    {designer.firstName} {designer.lastName} — {designer.country}
                  </p>
                  <p className="text-xs mb-2" style={{ color: "#D4CCBA" }}>
                    {designer.email} · {designer.specialty}
                  </p>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: "#D4CCBA" }}>
                    {designer.bio}
                  </p>
                  {designer.applications[0] && (
                    <div className="space-y-1 text-xs" style={{ color: "#D4CCBA" }}>
                      {designer.applications[0].instagramUrl && (
                        <p>
                          Instagram:{" "}
                          
                            href={designer.applications[0].instagramUrl}
                            target="_blank"
                            style={{ color: "#D4AF37" }}
                          >
                            {designer.applications[0].instagramUrl}
                          </a>
                        </p>
                      )}
                      {designer.applications[0].portfolioUrl && (
                        <p>
                          Portfolio:{" "}
                          
                            href={designer.applications[0].portfolioUrl}
                            target="_blank"
                            style={{ color: "#D4AF37" }}
                          >
                            Voir →
                          </a>
                        </p>
                      )}
                      <p className="mt-2 italic">
                        "{designer.applications[0].motivation}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
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
                        border: "0.5px solid rgba(220,38,38,0.4)",
                        color: "#fca5a5",
                        borderRadius: "2px",
                      }}
                    >
                      ✗ Refuser
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Créateurs validés */}
      <section>
        <h2 className="text-xs tracking-widest uppercase mb-4" style={{ color: "#D4AF37" }}>
          Créateurs actifs ({approved.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {approved.map((designer) => (
            <div
              key={designer.id}
              className="p-4 flex items-center gap-4"
              style={{
                background: "#1E293B",
                border: "0.5px solid rgba(212,175,55,0.1)",
                borderRadius: "2px",
              }}
            >
              <div>
                <p className="font-serif" style={{ color: "#FDFAF4" }}>
                  {designer.brandName}
                </p>
                <p className="text-xs" style={{ color: "#D4CCBA" }}>
                  {designer.country} · {designer.specialty}
                </p>
                <p className="text-xs mt-1" style={{ color: "#D4AF37" }}>
                  /designers/{designer.handle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}