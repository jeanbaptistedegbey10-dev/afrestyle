// src/components/designer/ApplicationForm.tsx
"use client";

import { useState, useTransition, useRef } from "react";
import { submitApplication } from "@/lib/actions/designer.actions";
import { Loader2, CheckCircle, Upload, X } from "lucide-react";

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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarUpload(file: File) {
    // Validation côté client
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowedTypes.includes(file.type)) {
      setError("Format non accepté. Utilise JPG, PNG, WebP ou AVIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image trop grande. Maximum 5 MB.");
      return;
    }

    // Preview locale
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setAvatarFile(file);
    setError(null);
  }

  function handleRemoveAvatar() {
    setAvatarPreview(null);
    setAvatarFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(formData: FormData) {
    setError(null);

    // Upload l'avatar d'abord si un fichier est sélectionné
    if (avatarFile) {
      setUploading(true);
      try {
        const uploadFormData = new FormData();
        uploadFormData.append("avatar", avatarFile);

        const res = await fetch("/api/upload/avatar", {
          method: "POST",
          body: uploadFormData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error ?? "Erreur lors de l'upload de la photo");
          setUploading(false);
          return;
        }

        // Ajoute l'URL de l'avatar au formData
        formData.append("avatarUrl", data.avatarUrl);
      } catch {
        setError("Erreur lors de l'upload de la photo");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

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

        {/* Avatar / Photo */}
        <div className="mt-6">
          <label className="block text-xs tracking-widest uppercase mb-2" style={{ color: "#D4AF37" }}>
            Photo de profil
          </label>
          <p className="text-xs mb-3" style={{ color: "#D4CCBA" }}>
            Ajoute une photo professionnelle (JPG, PNG, WebP — max 5 Mo)
          </p>

          {avatarPreview ? (
            <div className="relative inline-block">
              <img
                src={avatarPreview}
                alt="Aperçu"
                className="w-28 h-28 object-cover rounded-full"
                style={{
                  border: "2px solid rgba(212,175,55,0.3)",
                }}
              />
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="absolute -top-2 -right-2 p-1 rounded-full"
                style={{
                  background: "#DC2626",
                  color: "#FFF",
                }}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-3 px-6 py-4 transition-colors"
              style={{
                border: "1px dashed rgba(212,175,55,0.3)",
                borderRadius: "2px",
                color: "#D4CCBA",
                background: "rgba(212,175,55,0.03)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D4AF37"; e.currentTarget.style.background = "rgba(212,175,55,0.06)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(212,175,55,0.3)"; e.currentTarget.style.background = "rgba(212,175,55,0.03)"; }}
            >
              <Upload size={20} style={{ color: "#D4AF37" }} />
              <span className="text-sm">Choisir une photo</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleAvatarUpload(file);
            }}
          />
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

      {/* Mot de passe espace créateur */}
      <fieldset>
        <legend
          className="text-xs tracking-widest uppercase mb-4 block"
          style={{ color: "#D4AF37" }}
        >
          Ton espace créateur
        </legend>
        <div className="space-y-4">
          <p className="text-xs" style={{ color: "#D4CCBA" }}>
            Crée un mot de passe pour accéder à ton tableau de bord une fois ta candidature validée.
          </p>
          <Field name="password" label="Mot de passe (8 caractères min)" type="password" placeholder="••••••••••••" required />
          <Field name="passwordConfirm" label="Confirmer le mot de passe" type="password" placeholder="••••••••••••" required />
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
        disabled={isPending || uploading}
        className="w-full py-4 flex items-center justify-center gap-2 text-sm font-medium tracking-widest uppercase"
        style={{
          background: isPending || uploading ? "#A8871C" : "#D4AF37",
          color: "#0F172A",
          borderRadius: "2px",
        }}
      >
        {uploading ? (
          <><Loader2 size={16} className="animate-spin" /> Upload de la photo...</>
        ) : isPending ? (
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