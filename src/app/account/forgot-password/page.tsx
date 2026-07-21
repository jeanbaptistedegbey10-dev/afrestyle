// src/app/account/forgot-password/page.tsx
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#0F172A" }}>
      <div className="w-full max-w-md">
        <h1 className="font-serif text-3xl mb-8 text-center" style={{ color: "#FDFAF4" }}>
          Mot de passe oublié
        </h1>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}