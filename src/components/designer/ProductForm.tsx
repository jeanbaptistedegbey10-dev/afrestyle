// src/components/designer/ProductForm.tsx
"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { createProductAction } from "@/lib/actions/designer.actions";

export default function ProductForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await createProductAction(formData);
      if (result.success) {
        setSuccess("Produit créé avec succès !");
        // Reset form
        const form = document.getElementById("product-form") as HTMLFormElement;
        form?.reset();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form id="product-form" action={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-xs tracking-widest uppercase mb-2"
          style={{ color: "#D4AF37" }}
        >
          Titre du produit
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="Ex: Robe wax imprimée"
          className="w-full px-4 py-3 text-sm outline-none transition-all"
          style={{
            background: "#1E293B",
            border: "0.5px solid rgba(212,175,55,0.2)",
            color: "#F5F0E8",
            borderRadius: "2px",
          }}
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-xs tracking-widest uppercase mb-2"
          style={{ color: "#D4AF37" }}
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          placeholder="Décris ta création..."
          className="w-full px-4 py-3 text-sm outline-none transition-all resize-none"
          style={{
            background: "#1E293B",
            border: "0.5px solid rgba(212,175,55,0.2)",
            color: "#F5F0E8",
            borderRadius: "2px",
          }}
        />
      </div>

      {/* Price */}
      <div>
        <label
          htmlFor="price"
          className="block text-xs tracking-widest uppercase mb-2"
          style={{ color: "#D4AF37" }}
        >
          Prix (XOF)
        </label>
        <input
          id="price"
          name="price"
          type="number"
          required
          min="0"
          placeholder="15000"
          className="w-full px-4 py-3 text-sm outline-none transition-all"
          style={{
            background: "#1E293B",
            border: "0.5px solid rgba(212,175,55,0.2)",
            color: "#F5F0E8",
            borderRadius: "2px",
          }}
        />
      </div>

      {/* Images */}
      <div>
        <label
          htmlFor="images"
          className="block text-xs tracking-widest uppercase mb-2"
          style={{ color: "#D4AF37" }}
        >
          Images (URLs séparées par des virgules)
        </label>
        <input
          id="images"
          name="images"
          type="text"
          placeholder="https://image1.jpg, https://image2.jpg"
          className="w-full px-4 py-3 text-sm outline-none transition-all"
          style={{
            background: "#1E293B",
            border: "0.5px solid rgba(212,175,55,0.2)",
            color: "#F5F0E8",
            borderRadius: "2px",
          }}
        />
      </div>

      {/* Tags */}
      <div>
        <label
          htmlFor="tags"
          className="block text-xs tracking-widest uppercase mb-2"
          style={{ color: "#D4AF37" }}
        >
          Tags (séparés par des virgules)
        </label>
        <input
          id="tags"
          name="tags"
          type="text"
          placeholder="pays-ghana, tissu-wax, style-moderne, femme"
          className="w-full px-4 py-3 text-sm outline-none transition-all"
          style={{
            background: "#1E293B",
            border: "0.5px solid rgba(212,175,55,0.2)",
            color: "#F5F0E8",
            borderRadius: "2px",
          }}
        />
      </div>

      {/* Error */}
      {error && (
        <div
          className="px-4 py-3 text-sm rounded-sm"
          style={{
            background: "rgba(220,38,38,0.1)",
            border: "0.5px solid rgba(220,38,38,0.3)",
            color: "#fca5a5",
          }}
        >
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div
          className="px-4 py-3 text-sm rounded-sm"
          style={{
            background: "rgba(34,197,94,0.1)",
            border: "0.5px solid rgba(34,197,94,0.3)",
            color: "#86efac",
          }}
        >
          {success}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-4 flex items-center justify-center gap-2 text-sm font-medium tracking-widest uppercase transition-all"
        style={{
          background: isPending ? "#A8871C" : "#D4AF37",
          color: "#0F172A",
          borderRadius: "2px",
          cursor: isPending ? "not-allowed" : "pointer",
        }}
      >
        {isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Création...
          </>
        ) : (
          "Créer le produit"
        )}
      </button>
    </form>
  );
}