"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?redirect=/auth/nueva-contrasena`,
    });

    if (authError) {
      setError("No pudimos enviar el correo. Verifica la dirección e intenta de nuevo.");
    } else {
      setDone(true);
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="bg-white border border-[#EDE3E0] p-10 space-y-4">
          <h1
            className="text-2xl text-[#252525]"
            style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}
          >
            Revisa tu correo
          </h1>
          <p className="text-sm text-[#7B7B7B]">
            Si <strong className="text-[#252525]">{email}</strong> está registrado, recibirás
            un enlace para restablecer tu contraseña.
          </p>
          <p className="text-xs text-[#E3CFCA]">Revisa también la carpeta de spam.</p>
          <Link
            href="/auth/login"
            className="inline-block mt-4 text-[11px] tracking-[0.18em] uppercase font-[600] text-[#B5888A] hover:text-[#252525] transition-colors"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1
          className="text-3xl text-[#252525] mb-2"
          style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}
        >
          Recuperar contraseña
        </h1>
        <p className="text-sm text-[#7B7B7B]">
          Ingresa tu email y te enviaremos un enlace para crear una nueva contraseña.
        </p>
      </div>

      <div className="bg-white border border-[#EDE3E0] p-8 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] tracking-[0.18em] uppercase text-[#7B7B7B] font-[600] mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              autoComplete="email"
              className="w-full border border-[#EDE3E0] bg-white px-4 py-3 text-sm text-[#252525] focus:outline-none focus:border-[#7B7B7B] transition-colors placeholder:text-[#E3CFCA]"
            />
          </div>

          {error && (
            <p className="text-xs text-[#B5888A] bg-[#ECD6D1]/20 border border-[#ECD6D1] px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#252525] text-[#FFFFFF] py-3 text-[11px] tracking-[0.2em] uppercase font-[600] hover:bg-[#B5888A] transition-colors disabled:opacity-50"
          >
            {loading ? "Enviando…" : "Enviar enlace de recuperación"}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-[#7B7B7B] mt-5">
        <Link href="/auth/login" className="text-[#B5888A] hover:text-[#252525] transition-colors">
          ← Volver al inicio de sesión
        </Link>
      </p>
    </div>
  );
}
