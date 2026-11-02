import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, ArrowRight, Truck } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { formatCOP, formatDate } from "@/lib/utils/format";
import { PaymentPoller } from "@/components/storefront/PaymentPoller";
import { sendOrderConfirmationEmail, sendNewOrderAdminEmail } from "@/lib/email/templates";
import { sendEmailsSafe } from "@/lib/email/resend";
import { reconcileOrderWithWompi } from "@/lib/payments/wompi-reconcile";

interface Props {
  params: Promise<{ orderId: string }>;
  // Wompi envía ?id=TRANSACTION_ID al redirigir después del pago
  searchParams: Promise<{ id?: string }>;
}

const WOMPI_BASE =
  process.env.NEXT_PUBLIC_WOMPI_ENV === "production"
    ? "https://production.wompi.co/v1"
    : "https://sandbox.wompi.co/v1";

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pendiente de pago",
  paid: "Pagado ✓",
  preparing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const STATUS_STEPS = ["paid", "preparing", "shipped", "delivered"];

/**
 * Procesa el pago directamente usando el ID de transacción que Wompi envía
 * en el redirect (?id=...). Es la confirmación primaria — el webhook es el respaldo.
 * Retorna true si el pago fue confirmado en esta llamada.
 */
async function processWompiRedirect(
  supabase: ReturnType<typeof createServiceClient>,
  order: any,
  transactionId: string
): Promise<boolean> {
  // Solo actuar si el pedido todavía no está confirmado
  if (order.status !== "pending_payment" && order.status !== "cancelled") return false;

  const privateKey = process.env.WOMPI_PRIVATE_KEY;
  if (!privateKey) {
    console.error("[confirmacion] WOMPI_PRIVATE_KEY no configurado — no se puede verificar transacción desde redirect");
    return false;
  }

  try {
    const res = await fetch(`${WOMPI_BASE}/transactions/${encodeURIComponent(transactionId)}`, {
      headers: { Authorization: `Bearer ${privateKey}` },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("[confirmacion] Wompi API error:", res.status, "tx:", transactionId);
      return false;
    }

    const { data: tx } = await res.json();

    if (!tx || tx.status !== "APPROVED") return false;

    // Verificación de seguridad: la referencia debe coincidir con el pedido
    if (tx.reference !== order.wompi_reference) {
      console.error("[confirmacion] Referencia de transacción no coincide:", tx.reference, "vs", order.wompi_reference);
      return false;
    }

    // Update atómico — solo actualiza si el estado sigue siendo confirmable.
    // Si el webhook llegó primero y ya lo marcó "paid", el update devuelve 0 filas:
    // no se descuenta stock ni se envían emails por segunda vez.
    const { data: updateResult, error: updateErr } = await supabase
      .from("orders")
      .update({
        status: "paid",
        wompi_transaction_id: tx.id,
        paid_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .in("status", ["pending_payment", "cancelled"])
      .select("id");

    if (updateErr) {
      console.error("[confirmacion] Error actualizando pedido:", updateErr);
      return false;
    }

    if (!updateResult?.length) {
      console.log("[confirmacion] Pedido ya confirmado por otro proceso:", order.order_number);
      return true;
    }

    // Confirmar stock (solo el ganador del UPDATE)
    for (const item of order.items ?? []) {
      const { error: stockErr } = await supabase.rpc("confirm_stock_sale", {
        p_variant_id: item.variant_id,
        p_session_id: order.cart_session_id ?? order.wompi_reference,
        p_quantity: item.quantity,
        p_order_id: order.id,
      });
      if (stockErr) console.error("[confirmacion] confirm_stock_sale error:", stockErr);
    }

    await supabase.from("order_status_log").insert({
      order_id: order.id,
      from_status: order.status,
      to_status: "paid",
      notes: `Pago confirmado desde página de confirmación (redirect Wompi). Transacción: ${tx.id}`,
    });

    const { data: fullOrder } = await supabase
      .from("orders")
      .select("*, items:order_items(*)")
      .eq("id", order.id)
      .single();

    if (fullOrder) {
      await sendEmailsSafe(
        `confirmacion/${order.order_number}`,
        sendOrderConfirmationEmail(fullOrder),
        sendNewOrderAdminEmail(fullOrder),
      );
    }

    console.log("[confirmacion] Pago confirmado desde redirect para pedido:", order.order_number);
    return true;
  } catch (err) {
    console.error("[confirmacion] Error procesando redirect Wompi:", err);
    return false;
  }
}

export default async function ConfirmacionPage({ params, searchParams }: Props) {
  const { orderId } = await params;
  const { id: wompiTransactionId } = await searchParams;

  const supabase = createServiceClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", orderId)
    .single();

  if (!order) notFound();

  // Si Wompi redirigió con ?id=TRANSACTION_ID, procesar el pago directamente
  // sin esperar el webhook. Esto soluciona los casos donde el webhook llega tarde o falla.
  if (wompiTransactionId && order.payment_method === "wompi") {
    const confirmed = await processWompiRedirect(supabase, order, wompiTransactionId);
    if (confirmed) {
      // Refetch para mostrar el estado actualizado
      const { data: updated } = await supabase
        .from("orders")
        .select("*, items:order_items(*)")
        .eq("id", orderId)
        .single();
      if (updated) Object.assign(order, updated);
    }
  }

  // Respaldo sin ?id= (la clienta volvió por otro camino, o el pedido ya fue cancelado por
  // timeout): consultar Wompi por la referencia del pedido. No cancela nada.
  if (
    order.payment_method === "wompi" &&
    (order.status === "pending_payment" || order.status === "cancelled")
  ) {
    const result = await reconcileOrderWithWompi(supabase, order, "confirmacion");
    if (result.outcome === "confirmed" || result.outcome === "already_paid") {
      const { data: updated } = await supabase
        .from("orders")
        .select("*, items:order_items(*)")
        .eq("id", orderId)
        .single();
      if (updated) Object.assign(order, updated);
    }
  }

  const currentStep = STATUS_STEPS.indexOf(order.status);
  const isContraentrega = order.payment_method === "contraentrega";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
      {/* Icono de estado */}
      {order.status === "paid" || order.status === "preparing" || order.status === "shipped" || order.status === "delivered" ? (
        <CheckCircle className="mx-auto mb-6 text-[#B5888A]" size={56} strokeWidth={1} />
      ) : (
        <Package className="mx-auto mb-6 text-[#E3CFCA]" size={56} strokeWidth={1} />
      )}

      <h1
        className="text-4xl text-[#252525] mb-2"
        style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
      >
        {order.status === "paid" ? "¡Pedido confirmado!" : "Tu pedido"}
      </h1>
      <p className="text-[#7B7B7B] text-sm mb-2">
        Pedido <span className="font-[600] text-[#252525]">{order.order_number}</span>
      </p>
      <p className="text-xs text-[#7B7B7B] mb-10">
        {formatDate(order.created_at)}
      </p>

      {/* Timeline de estado */}
      <div className="flex justify-center gap-0 mb-10">
        {STATUS_STEPS.map((step, i) => {
          const done = currentStep >= i;
          const active = currentStep === i;
          return (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-3 h-3 rounded-full border-2 transition-colors ${
                    done
                      ? "bg-[#252525] border-[#252525]"
                      : "bg-transparent border-[#EDE3E0]"
                  }`}
                />
                <span className={`text-[9px] tracking-wide uppercase whitespace-nowrap ${active ? "text-[#252525] font-[600]" : done ? "text-[#7B7B7B]" : "text-[#E3CFCA]"}`}>
                  {STATUS_LABELS[step]}
                </span>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={`w-12 sm:w-20 h-px mb-5 ${done && currentStep > i ? "bg-[#252525]" : "bg-[#EDE3E0]"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Detalle del pedido */}
      <div className="bg-[#ECD6D1]/15 border border-[#EDE3E0] p-6 text-left mb-8">
        <h2 className="text-[10px] tracking-[0.25em] uppercase text-[#7B7B7B] font-[600] mb-4">
          Detalle del pedido
        </h2>

        <div className="space-y-2 mb-4">
          {(order.items ?? []).map((item: any) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-[#252525]">
                {item.product_name}{" "}
                <span className="text-[#7B7B7B] text-xs">× {item.quantity}</span>
              </span>
              <span className="text-[#252525] font-[500]">{formatCOP(item.total_price)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-[#EDE3E0] pt-4 flex justify-between font-[600] text-[#252525]">
          <span>{isContraentrega ? "Total a pagar al recibir" : "Total pagado"}</span>
          <span>{formatCOP(order.total)}</span>
        </div>

        <div className="mt-4 pt-4 border-t border-[#EDE3E0]">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#7B7B7B] font-[600] mb-1">
            Envío a
          </p>
          <p className="text-sm text-[#252525]">
            {order.shipping_name} · {order.shipping_address}, {order.shipping_city}
          </p>
          <p className="text-xs text-[#7B7B7B] mt-0.5">{order.shipping_email}</p>
        </div>

        {order.tracking_number && (
          <div className="mt-4 pt-4 border-t border-[#EDE3E0]">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#7B7B7B] font-[600] mb-1">
              Guía de envío
            </p>
            <p className="text-sm text-[#252525] font-[500]">{order.tracking_number}</p>
            {order.courier && <p className="text-xs text-[#7B7B7B]">{order.courier}</p>}
          </div>
        )}
      </div>

      {/* Aviso contraentrega */}
      {isContraentrega && (
        <div className="flex items-start gap-3 bg-[#FFFFFF] border border-[#E3CFCA] px-5 py-4 text-left mb-6">
          <Truck size={18} className="text-[#7B7B7B] shrink-0 mt-0.5" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-[600] text-[#252525]">Pago contraentrega</p>
            <p className="text-xs text-[#7B7B7B] mt-1 leading-relaxed">
              Ten el dinero listo cuando llegue tu domiciliario.
              El valor a pagar es <strong>{formatCOP(order.total)}</strong>.
            </p>
          </div>
        </div>
      )}

      <p className="text-xs text-[#7B7B7B] mb-6">
        Te enviamos la confirmación a <strong>{order.shipping_email}</strong>
      </p>

      {/* Polling como respaldo: solo si el pago todavía no fue confirmado desde el redirect */}
      {order.status === "pending_payment" && order.payment_method === "wompi" && (
        <PaymentPoller orderId={order.id} createdAt={order.created_at} />
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href={`/seguimiento?orden=${order.order_number}&email=${encodeURIComponent(order.shipping_email)}`}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[#252525] text-[#252525] text-[11px] tracking-[0.15em] uppercase font-[500] hover:bg-[#252525] hover:text-[#FFFFFF] transition-colors"
        >
          Seguir pedido
        </Link>
        <Link
          href="/catalogo"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#252525] text-[#FFFFFF] text-[11px] tracking-[0.15em] uppercase font-[500] hover:bg-[#444444] transition-colors"
        >
          Seguir comprando <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
