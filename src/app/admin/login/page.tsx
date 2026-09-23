// src/app/admin/login/page.tsx
// PHASE 2 — fallback anti-boucle : si le proxy redirige ici avec
// ?error=config-missing (ADMIN_SECRET_TOKEN absent), on l'affiche
// explicitement au lieu de boucler silencieusement.
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Connexion" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const params = await searchParams;
  const configMissing = params.error === "config-missing";

  return (
    <div
      style={{ background: "#0F172A", minHeight: "100vh" }}
      className="flex items-center justify-center px-6"
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p
            className="font-serif text-3xl mb-2"
            style={{ color: "#D4AF37" }}
          >
            AfroStyle
          </p>
          <p
            className="text-xs tracking-widest uppercase"
            style={{ color: "#D4CCBA" }}
          >
            Accès administrateur
          </p>
        </div>
        {configMissing && (
          <div
            className="px-4 py-3 text-sm mb-4"
            role="alert"
            style={{
              background: "rgba(220,38,38,0.1)",
              border: "0.5px solid rgba(220,38,38,0.3)",
              color: "#fca5a5",
              borderRadius: "2px",
            }}
          >
            Configuration admin incomplète : <code>ADMIN_SECRET_TOKEN</code>{" "}
            n&apos;est pas défini. Ajoutez-le dans <code>.env.local</code> (voir{" "}
            <code>.env.example</code>), redémarrez le serveur, puis reconnectez-vous.
          </div>
        )}
        <AdminLoginForm />
      </div>
    </div>
  );
}