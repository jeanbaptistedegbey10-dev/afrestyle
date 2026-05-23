// src/components/home/NewsletterSection.tsx
"use client";

import { useState } from "react";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    // TODO: connecter à Klaviyo
    await new Promise((r) => setTimeout(r, 1000));
    setStatus("success");
    setEmail("");
  }

  return (
    <section
      className="py-16 px-6 text-center"
      style={{ background: "#D4AF37" }}
    >
      <h2
        className="font-serif text-3xl font-bold mb-2"
        style={{ color: "#0F172A" }}
      >
        Rejoignez la communauté
      </h2>
      <p className="text-sm mb-8 opacity-75" style={{ color: "#0F172A" }}>
        Nouveautés, histoires de créateurs et offres exclusives — directement
        dans votre boîte mail.
      </p>

      {status === "success" ? (
        <p className="font-serif text-xl" style={{ color: "#0F172A" }}>
          ✓ Bienvenue dans la communauté AfroStyle !
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex max-w-md mx-auto"
          style={{ border: "1.5px solid #0F172A" }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
            required
            className="flex-1 bg-transparent px-5 py-3 text-sm outline-none"
            style={{ color: "#0F172A" }}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="px-6 py-3 text-xs font-medium tracking-widest uppercase transition-colors"
            style={{ background: "#0F172A", color: "#D4AF37" }}
          >
            {status === "loading" ? "..." : "S'inscrire"}
          </button>
        </form>
      )}
    </section>
  );
}
