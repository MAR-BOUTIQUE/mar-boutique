import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createServiceClient } from "@/lib/supabase/server";
import { sendOrderConfirmationEmail, sendNewOrderAdminEmail, sendPaymentFailedEmail } from "@/lib/email/templates";
import type { WompiWebhookEvent } from "@/types";

// Verificar firma del webhook — seguridad
function verifySignature(event: WompiWebhookEvent, secret: string): boolean {
  const { properties, checksum } = event.signature;

  const values = properties.map((prop) => {
    const parts = prop.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = event.data;
    for (const part of parts) {
      value = value?.[part];
    }
    return value ?? "";
  });

  const str = [...values, event.timestamp, secret].join("");
  const expected = createHash("sha256").update(str).digest("hex");
  return expected === checksum;
}

export async function POST(req: NextRequest) {
  try {
    const body: WompiWebhookEvent = await req.json();
    const secret = process.env.WOMPI_EVENTS_SECRET!;

    // Validar firma — RB-CHK-04
    if (!verifySignature(body, secret)) {
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }

    const { event, data } = body;
    if (event !== "transaction.updated") {
      return NextResponse.json({ ok: true });
    }

    const tx = data.transaction;
    const supabase = createServiceClient();

    // Buscar pedido por referencia
    const { data: order } = await supabase
      .from("orders")
      .select(`*, cart_session_id, items:order_items(*)`)
      .eq("wompi_reference", tx.reference)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    // Idempotencia: si ya está pagado, no hacer nada
    if (order.status === "paid" && tx.status === "APPROVED") {
      return NextResponse.json({ ok: true });
    }

    if (tx.status === "APPROVED") {
      // ── PAGO APROBADO ──────────────────────────────────────

      // 1. Confirmar stock de cada variante — RB-CHK-04 (idempotente)
      for (const item of order.items) {
        await supabase.rpc("confirm_stock_sale", {
          p_variant_id: item.variant_id,
          p_session_id: order.cart_session_id ?? order.wompi_reference,
          p_quantity: item.quantity,
          p_order_id: order.id,
        });
      }

      // 2. Actualizar estado del pedido
      await supabase
        .from("orders")
        .update({
          status: "paid",
          wompi_transaction_id: tx.id,
          paid_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      // 3. Log de estado — RB-PED-04
      await supabase.from("order_status_log").insert({
        order_id: order.id,
        from_status: "pending_payment",
        to_status: "paid",
        notes: `Pago confirmado por Wompi. Transacción: ${tx.id}`,
      });

      // 4. Emails — RB-PED-03, RB-PED-05
      await Promise.allSettled([
        sendOrderConfirmationEmail(order),
        sendNewOrderAdminEmail(order),
      ]);

    } else if (tx.status === "DECLINED" || tx.status === "VOIDED" || tx.status === "ERROR") {
      // ── PAGO RECHAZADO — RB-CHK-05 ───────────────────────

      // Liberar reservas de este pedido
      await supabase.rpc("release_expired_reservations");

      await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", order.id);

      await supabase.from("order_status_log").insert({
        order_id: order.id,
        from_status: "pending_payment",
        to_status: "cancelled",
        notes: `Pago rechazado por Wompi. Estado: ${tx.status}`,
      });

      await sendPaymentFailedEmail(order);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[wompi_webhook]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
