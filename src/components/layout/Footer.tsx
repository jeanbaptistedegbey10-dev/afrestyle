// src/components/layout/Footer.tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{ background: "#1E293B", borderTop: "0.5px solid rgba(212,175,55,0.1)", padding: "3.5rem 1.5rem 1.5rem" }}>
      <div style={{ maxWidth: "80rem", margin: "0 auto" }}>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "2.5rem", paddingBottom: "2.5rem", borderBottom: "0.5px solid rgba(212,175,55,0.1)" }}>

          {/* Brand */}
          <div>
            <p style={{ fontFamily: "var(--font-playfair), serif", fontSize: "1.5rem", color: "#D4AF37", marginBottom: "0.75rem" }}>AfroStyle</p>
            <p style={{ fontSize: "0.85rem", lineHeight: 1.7, color: "#D4CCBA", marginBottom: "1.5rem", maxWidth: "240px" }}>
              La première destination premium pour la mode africaine contemporaine.
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <SocialLink label="Instagram" />
              <SocialLink label="TikTok" />
              <SocialLink label="Pinterest" />
            </div>
          </div>

          {/* Boutique */}
          <FooterCol title="Boutique" links={["Femme", "Homme", "Accessoires", "Nouveautés", "Ventes privées"]} />

          {/* Créateurs */}
          <FooterCol title="Créateurs" links={["Tous les designers", "Bénin", "Nigeria", "Sénégal", "Ghana"]} />

          {/* Aide */}
          <FooterCol title="Aide" links={["Livraison", "Retours", "Guide des tailles", "Contact", "FAQ"]} />

        </div>

        {/* Bottom */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", paddingTop: "1.5rem" }}>
          <p style={{ fontSize: "0.72rem", color: "#D4CCBA" }}>© 2024 AfroStyle. Tous droits réservés.</p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <PayBadge label="Visa" />
            <PayBadge label="Mastercard" />
            <PayBadge label="PayPal" />
            <PayBadge label="Stripe" />
          </div>
        </div>

      </div>
    </footer>
  );
}

function SocialLink({ label }: { label: string }) {
  return (
    <a
      href="#"
      aria-label={label}
      style={{ width: "36px", height: "36px", borderRadius: "50%", border: "0.5px solid rgba(212,175,55,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", color: "#D4CCBA", textDecoration: "none" }}
    >
      {label[0]}
    </a>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <p style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase" as const, color: "#D4AF37", marginBottom: "1.25rem" }}>
        {title}
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {links.map((item) => (
          <li key={item} style={{ marginBottom: "0.6rem" }}>
            <Link href="#" style={{ fontSize: "0.85rem", color: "#D4CCBA", textDecoration: "none" }}>
              {item}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PayBadge({ label }: { label: string }) {
  return (
    <span style={{ fontSize: "0.65rem", padding: "0.25rem 0.6rem", border: "0.5px solid rgba(212,175,55,0.2)", borderRadius: "3px", color: "#D4CCBA" }}>
      {label}
    </span>
  );
}