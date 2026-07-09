"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { useAuth, type GoogleProfile } from "@/hooks/useAuth";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { getErrorMessage } from "@/lib/errors";

const FEATURES = [
  "Publica anuncios gratis",
  "Conecta con compradores y vendedores",
  "Guarda tus favoritos y recibe avisos",
];

export default function LoginPage() {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogle = async (profile: GoogleProfile) => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle(profile);
      router.push("/");
    } catch (err) {
      setError(getErrorMessage(err, "Error de conexión"));
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-surface">
      <div className="p-4">
        <Link
          href="/"
          className="grid h-10 w-10 place-items-center rounded-full text-on-surface hover:bg-surface-container"
          aria-label="Volver"
        >
          <ArrowLeft size={22} />
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mb-7 grid h-28 w-28 place-items-center rounded-full border border-primary/15 bg-primary/[0.06]">
          <ShoppingBag size={48} className="text-primary" strokeWidth={1.3} />
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Bienvenido a Market EG
        </h1>
        <p className="mt-2 max-w-sm text-[15px] leading-6 text-on-surface-variant">
          Compra y vende anuncios en Guinea Ecuatorial de forma segura y
          sencilla.
        </p>

        <ul className="mt-8 w-full max-w-xs space-y-3.5 text-left">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-3">
              <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
              <span className="text-[15px] text-on-surface">{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-auto w-full max-w-md px-6 pb-12">
        {error && (
          <p className="mb-4 rounded-lg bg-danger-soft px-3 py-2 text-center text-sm text-danger">
            {error}
          </p>
        )}

        <div className={loading ? "pointer-events-none opacity-60" : ""}>
          <GoogleSignInButton onSuccess={handleGoogle} onError={setError} />
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-muted">
          Al continuar, aceptas nuestros Términos de servicio y Política de
          privacidad.
        </p>
        <p className="mt-2 text-center text-xs text-muted">
          ¿Eres administrador?{" "}
          <Link href="/admin/login" className="font-semibold text-primary">
            Acceso admin
          </Link>
        </p>
      </div>
    </div>
  );
}
