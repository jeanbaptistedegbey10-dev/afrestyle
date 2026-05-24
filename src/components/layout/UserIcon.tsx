// src/components/layout/UserIcon.tsx
import Link from "next/link";
import { User } from "lucide-react";
import { getCurrentCustomer } from "@/lib/actions/auth.actions";

export default async function UserIcon() {
  const customer = await getCurrentCustomer();

  return (
    <Link
      href={customer ? "/account" : "/account/login"}
      aria-label={customer ? "Mon compte" : "Se connecter"}
      className="hidden md:flex w-9 h-9 items-center justify-center rounded-full border transition-all duration-200 relative"
      style={{ borderColor: "rgba(212,175,55,0.25)", color: "#D4CCBA" }}
    >
      <User size={15} />
      {/* Point vert si connecté */}
      {customer && (
        <span
          className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
          style={{ background: "#22c55e", border: "2px solid #0F172A" }}
        />
      )}
    </Link>
  );
}