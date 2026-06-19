// src/components/designer/ApplicationForm.tsx
"use client";

import { useState, useTransition } from "react";
import { submitApplication } from "@/lib/actions/designer.actions";
import { Loader2, CheckCircle } from "lucide-react";

const COUNTRIES = [
  "Bénin", "Nigeria", "Sénégal", "Ghana", "Mali",
  "Côte d'Ivoire", "Cameroun", "Togo", "Burkina Faso",
  "Guinée", "RDC", "Kenya", "Éthiopie", "Afrique du Sud",
  "Autre",
];

const inputStyle = {
  background: "#1E293B",
  border: "0.5px solid rgba(212,175,55,0.2)",
  color: "#F5F0E8",
  borderRadius: "2px",
  width: "100%",
  padding: "0.75rem 1rem",
  fontSize: "0.875rem",
  outline: "none",
};

export default function ApplicationForm() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await submitApplication(formData);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error ?? "Erreur lors de l'envoi");
      }
    });
  }

  if (success) {
    return (
      <div
        className="text-center py-16 px-6"
        style={{
          background: "#1E293B",
          border: "0.5px solid rgba(212,175,55,0.15)",
          borderRadius: "2px",
        }}
      >
        <CheckCircle size={48} className="mx-auto mb-4" style={{ color: "#D4AF37" }} />
        <h3 className="font-serif text-2xl mb-3" style={{ color: "#FDFAF4" }}>
          Candidature envoyée !
        </h3>
        <p className="text-sm" style={{ color: "#D4CCBA" }}>
          Nous examinons ta candidature et te répondons sous 48h à l'adresse email fournie.
        </p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-6">

      {/* Infos personnelles */}
      <fieldset>
        <legend
          className="text-xs tracking-widest uppercase mb-4 block"
          style={{ color: "#D4AF37" }}
        >
          Informations personnelles
        </legend>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field name="firstName" label="Prénom" placeholder="Adaeze" required />
          <Field name="lastName" label="Nom" placeholder="Okafor" required />
        </div>
        <div className="space-y-4">
          <Field name="email" label="Email professionnel" type="email" placeholder="adaeze@example.com" required />
          <Field name="phone" label="Téléphone (WhatsApp)" placeholder="+229 XX XX XX XX" />
        </div>
      </fieldset>

      {/* Identité créateur */}
      <fieldset>
        <legend
          className="text-xs tracking-widest uppercase mb-4 block"
          style={{ color: "#D4AF37" }}
        >
          Ton identité créateur
        </legend>
        <div className="space-y-4">
          <Field name="brandName" label="Nom de ta marque" placeholder="Okafor Studio" required />
          <div>
            <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "#D4AF37" }}>
              Pays d'origine *
            </label>
            <select name="country" required style={inputStyle}>
              <option value="">Sélectionne ton pays</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <Field name="specialty" label="Ta spécialité" placeholder="Couture contemporaine, Wax, Kente..." required />
          <Field name="since" label="Depuis quelle année crées-tu ?" type="number" placeholder="2018" required />
        </div>
      </fieldset>

      {/* Histoire */}
      <fieldset>
        <legend
          className="text-xs tracking-widest uppercase mb-4 block"
          style={{ color: "#D4AF37" }}
        >
          Raconte ton histoire
        </legend>
        <div className="space-y-4">
          <TextArea
            name="bio"
            label="Biographie courte (200 mots max)"
            placeholder="Qui es-tu ? D'où viens-tu ? Quelle est ta philosophie créative ?"
            rows={4}
            required
          />
          <TextArea
            name="motivation"
            label="Pourquoi rejoindre AfroStyle ?"
            placeholder="Ce que tu attends de cette collaboration..."
            rows={3}
            required
          />
        </div>
      </fieldset>

      {/* Portfolio */}
      <fieldset>
        <legend
          className="text-xs tracking-widest uppercase mb-4 block"
          style={{ color: "#D4AF37" }}
        >
          Ton portfolio
        </legend>
        <div className="space-y-4">
          <Field name="instagramUrl" label="Instagram" placeholder="https://instagram.com/toncompte" />
          <Field name="websiteUrl" label="Site web / Portfolio" placeholder="https://tonstudio.com" />
          <Field name="portfolioUrl" label="Lien portfolio (Google Drive, Behance...)" placeholder="https://..." />
        </div>
      </fieldset>

      {/* CGU */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" name="terms" required className="mt-1" />
        <span className="text-xs leading-relaxed" style={{ color: "#D4CCBA" }}>
          J'accepte les{" "}
          <a href="/terms-creator" style={{ color: "#D4AF37" }}>conditions créateur AfroStyle</a>
          {" "}(commission 30%, exclusivité non requise, paiements via Stripe Connect)
        </span>
      </label>

      {error && (
        <div
          className="px-4 py-3 text-sm"
          style={{
            background: "rgba(220,38,38,0.1)",
            border: "0.5px solid rgba(220,38,38,0.3)",
            color: "#fca5a5",
            borderRadius: "2px",
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-4 flex items-center justify-center gap-2 text-sm font-medium tracking-widest uppercase"
        style={{
          background: isPending ? "#A8871C" : "#D4AF37",
          color: "#0F172A",
          borderRadius: "2px",
        }}
      >
        {isPending ? (
          <><Loader2 size={16} className="animate-spin" /> Envoi en cours...</>
        ) : (
          "Envoyer ma candidature →"
        )}
      </button>
    </form>
  );
}

function Field({
  name, label, type = "text", placeholder, required,
}: {
  name: string; label: string; type?: string;
  placeholder: string; required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-xs tracking-widest uppercase mb-2"
        style={{ color: "#D4AF37" }}
      >
        {label} {required && "*"}
      </label>
      <input
        id={name} name={name} type={type}
        placeholder={placeholder}
        required={required}
        style={inputStyle}
        onFocus={(e) => { e.target.style.borderColor = "#D4AF37"; }}
        onBlur={(e) => { e.target.style.borderColor = "rgba(212,175,55,0.2)"; }}
      />
    </div>
  );
}

function TextArea({
  name, label, placeholder, rows, required,
}: {
  name: string; label: string; placeholder: string;
  rows: number; required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-xs tracking-widest uppercase mb-2"
        style={{ color: "#D4AF37" }}
      >
        {label} {required && "*"}
      </label>
      <textarea
        id={name} name={name}
        placeholder={placeholder}
        rows={rows}
        required={required}
        style={{ ...inputStyle, resize: "vertical" }}
        onFocus={(e) => { e.target.style.borderColor = "#D4AF37"; }}
        onBlur={(e) => { e.target.style.borderColor = "rgba(212,175,55,0.2)"; }}
      />
    </div>
  );
}