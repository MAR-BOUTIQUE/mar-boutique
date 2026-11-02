"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2 } from "lucide-react";

const AUTO_INTERVAL_MS = 5 * 60 * 1000;
const STORAGE_KEY = "mar:last-payment-reconcile";

interface ReconcileResponse {
  ok?: boolean;
  checked?: number;
  confirmed?: number;
  confirmed_orders?: string[];
  still_unpaid?: number;
  errors?: number;
  error?: string;
}

function readLastRun(): number {
  try {
    return Number(localStorage.getItem(STORAGE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeLastRun() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // sin almacenamiento: el manual sigue funcionando
  }
}

// Botón "Verificar pagos" + revisión automática en segundo plano (máx. 1 vez cada 5 min)
// al entrar a la lista de pedidos. Solo confirma pagos que Wompi tiene aprobados.
export function ReconcilePaymentsButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const running = useRef(false);

  const run = useCallback(
    async (manual: boolean) => {
      if (running.current) return;
      running.current = true;
      setLoading(manual);
      if (manual) setMessage(null);

      try {
        const res = await fetch("/api/admin/orders/reconcile", { method: "POST" });
        const data: ReconcileResponse = await res.json().catch(() => ({}));
        writeLastRun();

        if (!res.ok) {
          if (manual) setMessage(data.error ?? "Error al verificar pagos");
          return;
        }

        const confirmed = data.confirmed ?? 0;
        if (confirmed > 0) {
          setMessage(`✓ ${confirmed} pago${confirmed !== 1 ? "s" : ""} confirmado${confirmed !== 1 ? "s" : ""}: ${(data.confirmed_orders ?? []).join(", ")}`);
          router.refresh();
        } else if (manual) {
          setMessage(
            `Revisados ${data.checked ?? 0} pedidos de las últimas 48 h: ningún pago aprobado pendiente.` +
              (data.errors ? ` (${data.errors} no se pudieron consultar)` : "")
          );
        }
      } catch {
        if (manual) setMessage("Error de conexión");
      } finally {
        running.current = false;
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (Date.now() - readLastRun() < AUTO_INTERVAL_MS) return;
    const timer = setTimeout(() => void run(false), 0);
    return () => clearTimeout(timer);
  }, [run]);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {message && <span className="text-xs text-[#7B7B7B]">{message}</span>}
      <button
        onClick={() => run(true)}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 border border-[#252525] text-[#252525] text-[11px] tracking-[0.15em] uppercase font-[500] hover:bg-[#252525] hover:text-[#FFFFFF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} strokeWidth={1.5} />}
        {loading ? "Consultando Wompi…" : "Verificar pagos"}
      </button>
    </div>
  );
}
