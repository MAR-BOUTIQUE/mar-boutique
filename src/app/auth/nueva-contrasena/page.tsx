"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export default function NuevaContrasenaPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.updateUser({ password });

    if (authError) {
      setError("No se pudo actualizar la contraseña. El enlace puede haber expirado.");
      setLoading(false);
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/auth/login"), 3000);
  }

  const inputCls = "w-full border border-[#EDE3E0] bg-white px-4 py-3 text-sm text-[#252525] focus:outline-none focus:border-[#7B7B7B] transition-colors placeholder:text-[#E3CFCA]";

  if (done) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="bg-white border border-[#EDE3E0] p-10 space-y-4">
          <h1
            className="text-2xl text-[#252525]"
            style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif" }}
          >
            ¡Contraseña actualizada!
          </h1>
          <p className="text-sm text-[#7B7B7B]">
            Tu contraseña se actualizó correctamente. Redirigiendo al inicio de sesión…
          </p>
          <Link
            href="/auth/login"
            className="inline-block text-[11px] tracking-[0.18em] uppercase font-[600] text-[#B5888A] hover:text-[#252525] transition-colors"
          >
            Ir al login →
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
          Nueva contraseña
        </h1>
        <p className="text-sm text-[#7B7B7B]">Elige una contraseña segura para tu cuenta.</p>
      </div>

      <div className="bg-white border border-[#EDE3E0] p-8 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] tracking-[0.18em] uppercase text-[#7B7B7B] font-[600] mb-1.5">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                className={cn(inputCls, "pr-11")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#E3CFCA] hover:text-[#7B7B7B]"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] tracking-[0.18em] uppercase text-[#7B7B7B] font-[600] mb-1.5">
              Confirmar contraseña
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repite tu contraseña"
              required
              className={inputCls}
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
            {loading ? "Actualizando…" : "Actualizar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}
