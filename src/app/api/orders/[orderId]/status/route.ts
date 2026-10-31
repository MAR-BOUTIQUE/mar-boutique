import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { reconcileOrderWithWompi } from "@/lib/payments/wompi-reconcile";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  const supabase = createServiceClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, items:order_items(*), wompi_reference, cart_session_id")
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  // Solo se verifica contra Wompi lo que aún puede confirmarse: pendiente o cancelado
  // por timeout (la clienta pudo pagar después de la cancelación automática).
  const verifiable = order.status === "pending_payment" || order.status === "cancelled";
  if (!verifiable || order.payment_method !== "wompi" || !order.wompi_reference) {
    return NextResponse.json({ status: order.status, paid_at: order.paid_at });
  }

  const result = await reconcileOrderWithWompi(supabase, order, "status");

  if (result.outcome === "confirmed" || result.outcome === "already_paid") {
    const { data: fresh } = await supabase
      .from("orders")
      .select("status, paid_at")
      .eq("id", orderId)
      .single();
    return NextResponse.json({
      status: fresh?.status ?? "paid",
      paid_at: fresh?.paid_at ?? new Date().toISOString(),
    });
  }

  // Transacción rechazada: avisar solo si el pedido sigue pendiente (el poller muestra el reintento)
  if (
    order.status === "pending_payment" &&
    result.statuses.some((s) => s === "DECLINED" || s === "VOIDED" || s === "ERROR")
  ) {
    return NextResponse.json({ status: "payment_failed" });
  }

  return NextResponse.json({ status: order.status });
}
