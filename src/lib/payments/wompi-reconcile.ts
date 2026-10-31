import { createServiceClient } from "@/lib/supabase/server";
import { sendOrderConfirmationEmail, sendNewOrderAdminEmail } from "@/lib/email/templates";
import { sendEmailsSafe } from "@/lib/email/resend";

type Supabase = ReturnType<typeof createServiceClient>;

export const WOMPI_BASE =
  process.env.NEXT_PUBLIC_WOMPI_ENV === "production"
    ? "https://production.wompi.co/v1"
    : "https://sandbox.wompi.co/v1";

export interface WompiTx {
  id: string;
  status: string;
}

export type ReconcileOutcome =
  | "confirmed" // esta llamada marcó el pedido como pagado
  | "already_paid" // otro proceso lo confirmó antes (no se repite stock ni correos)
  | "not_approved" // Wompi no tiene una transacción APPROVED
  | "skipped" // no aplica (no es de Wompi, sin referencia, estado no confirmable)
  | "error"; // no se pudo consultar Wompi

export interface ReconcileResult {
  outcome: ReconcileOutcome;
  transactionId?: string;
  /** Estados de las transacciones que Wompi reporta para la referencia */
  statuses: string[];
}

interface OrderLike {
  id: string;
  order_number: string;
  status: string;
  payment_method: string | null;
  wompi_reference: string | null;
  cart_session_id: string | null;
  items?: { variant_id: string; quantity: number }[] | null;
}

const CONFIRMABLE = ["pending_payment", "cancelled"];

export async function fetchWompiTransactions(reference: string): Promise<WompiTx[] | null> {
  const privateKey = process.env.WOMPI_PRIVATE_KEY;
  if (!privateKey) {
    console.error("[wompi_reconcile] WOMPI_PRIVATE_KEY no configurado");
    return null;
  }
  try {
    const res = await fetch(`${WOMPI_BASE}/transactions?reference=${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${privateKey}` },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("[wompi_reconcile] Wompi API error:", res.status, "ref:", reference);
      return null;
    }
    const { data } = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("[wompi_reconcile] Error consultando Wompi:", reference, err);
    return null;
  }
}

/**
 * Consulta Wompi por la referencia del pedido y, si hay una transacción APPROVED,
 * lo confirma. Es idempotente: el UPDATE atómico condicionado al estado decide quién
 * "gana"; solo el ganador descuenta stock, registra el log y envía los correos.
 * Nunca cancela nada.
 */
export async function reconcileOrderWithWompi(
  supabase: Supabase,
  order: OrderLike,
  source: string
): Promise<ReconcileResult> {
  if (order.payment_method !== "wompi" || !order.wompi_reference) {
    return { outcome: "skipped", statuses: [] };
  }
  if (order.status === "paid") return { outcome: "already_paid", statuses: [] };
  if (!CONFIRMABLE.includes(order.status)) return { outcome: "skipped", statuses: [] };

  const txs = await fetchWompiTransactions(order.wompi_reference);
  if (txs === null) return { outcome: "error", statuses: [] };

  const statuses = txs.map((t) => t.status);
  const approved = txs.find((t) => t.status === "APPROVED");
  if (!approved) return { outcome: "not_approved", statuses };

  // 1. UPDATE atómico: solo una ejecución concurrente obtiene filas de vuelta.
  const { data: updated, error: updateErr } = await supabase
    .from("orders")
    .update({
      status: "paid",
      wompi_transaction_id: approved.id,
      paid_at: new Date().toISOString(),
    })
    .eq("id", order.id)
    .in("status", CONFIRMABLE)
    .select("id");

  if (updateErr) {
    console.error("[wompi_reconcile] Error actualizando pedido:", order.order_number, updateErr);
    return { outcome: "error", statuses };
  }
  if (!updated?.length) return { outcome: "already_paid", transactionId: approved.id, statuses };

  // 2. Stock: solo el ganador del UPDATE descuenta (evita doble descuento).
  let items = order.items;
  if (!items) {
    const { data } = await supabase
      .from("order_items")
      .select("variant_id, quantity")
      .eq("order_id", order.id);
    items = data ?? [];
  }
  for (const item of items) {
    const { error: stockErr } = await supabase.rpc("confirm_stock_sale", {
      p_variant_id: item.variant_id,
      p_session_id: order.cart_session_id ?? order.wompi_reference,
      p_quantity: item.quantity,
      p_order_id: order.id,
    });
    if (stockErr) console.error("[wompi_reconcile] confirm_stock_sale error:", order.order_number, stockErr);
  }

  // 3. Log auditable
  await supabase.from("order_status_log").insert({
    order_id: order.id,
    from_status: order.status,
    to_status: "paid",
    notes: `Pago confirmado por verificación directa Wompi (${source}). Transacción: ${approved.id}`,
  });

  // 4. Correos (best-effort)
  const { data: fullOrder } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", order.id)
    .single();
  if (fullOrder) {
    await sendEmailsSafe(
      `reconcile/${source}/${order.order_number}`,
      sendOrderConfirmationEmail(fullOrder),
      sendNewOrderAdminEmail(fullOrder)
    );
  }

  console.log("[wompi_reconcile] Pedido confirmado:", order.order_number, "fuente:", source, "tx:", approved.id);
  return { outcome: "confirmed", transactionId: approved.id, statuses };
}
