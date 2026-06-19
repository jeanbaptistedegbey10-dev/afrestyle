// src/app/designers/apply/page.tsx
import type { Metadata } from "next";
import ApplicationForm from "@/components/designer/ApplicationForm";

export const metadata: Metadata = {
  title: "Devenir créateur AfroStyle",
  description: "Rejoins la première marketplace de mode africaine contemporaine.",
};

export default function ApplyPage() {
  return (
    <div style={{ background: "#0F172A", minHeight: "100vh" }}>

      {/* Hero */}
      <div
        className="py-20 px-6 text-center"
        style={{ borderBottom: "0.5px solid rgba(212,175,55,0.1)" }}
      >
        <p className="text-xs tracking-widest uppercase mb-4" style={{ color: "#D4AF37" }}>
          Rejoindre AfroStyle
        </p>
        <h1 className="font-serif text-5xl mb-4" style={{ color: "#FDFAF4" }}>
          Deviens créateur <em style={{ color: "#D4AF37" }}>AfroStyle</em>
        </h1>
        <p className="text-sm max-w-lg mx-auto" style={{ color: "#D4CCBA" }}>
          Vends tes créations à une communauté mondiale d'amateurs de mode africaine.
          70% du prix de vente te revient directement.
        </p>

        {/* Avantages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-12">
          {[
            { icon: "💰", title: "70% de chaque vente", desc: "Paiement direct via Stripe Connect" },
            { icon: "🌍", title: "Audience mondiale", desc: "Diaspora africaine + clients internationaux" },
            { icon: "📦", title: "On gère la logistique", desc: "Marketing, support client, paiements" },
          ].map((item) => (
            <div
              key={item.title}
              className="p-6 text-center"
              style={{
                background: "#1E293B",
                border: "0.5px solid rgba(212,175,55,0.1)",
                borderRadius: "2px",
              }}
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <p className="font-serif text-lg mb-2" style={{ color: "#FDFAF4" }}>
                {item.title}
              </p>
              <p className="text-xs" style={{ color: "#D4CCBA" }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Formulaire */}
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h2 className="font-serif text-2xl mb-2" style={{ color: "#FDFAF4" }}>
          Ta candidature
        </h2>
        <p className="text-sm mb-8" style={{ color: "#D4CCBA" }}>
          Nous examinons chaque candidature sous 48h.
        </p>
        <ApplicationForm />
      </div>

    </div>
  );
}