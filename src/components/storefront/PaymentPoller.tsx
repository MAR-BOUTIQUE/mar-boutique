"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Props {
  orderId: string;
}

// Cuando el usuario llega a la confirmación justo después de pagar,
// el webhook de Wompi puede tardar unos segundos. Polleamos el estado
// del pedido cada 3 segundos durante máximo 90 segundos; en cuanto
// pase a "paid" refrescamos la página para mostrar el estado correcto.
export function PaymentPoller({ orderId }: Props) {
  const router = useRouter();
  const attempts = useRef(0);
  const MAX_ATTEMPTS = 30; // 30 × 3s = 90 segundos

  useEffect(() => {
    const interval = setInterval(async () => {
      attempts.current += 1;

      try {
        const res = await fetch(`/api/orders/${orderId}/status`);
        if (!res.ok) return;
        const { status } = await res.json();

        if (
          status === "paid" ||
          status === "preparing" ||
          status === "shipped" ||
          status === "delivered" ||
          status === "cancelled" ||
          status === "payment_failed"
        ) {
          clearInterval(interval);
          router.refresh();
        }
      } catch {
        // silencioso — reintentará
      }

      if (attempts.current >= MAX_ATTEMPTS) {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [orderId, router]);

  return (
    <div className="flex items-center justify-center gap-2 text-xs text-[#897568] mt-4 animate-pulse">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#B5888A] animate-bounce" />
      Verificando confirmación de pago…
    </div>
  );
}
