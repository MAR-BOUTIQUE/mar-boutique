import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { reconcileOrderWithWompi } from "@/lib/payments/wompi-reconcile";

const WINDOW_HOURS = 48;
const MAX_ORDERS = 20;
const CONCURRENCY = 5;

// Revisa pedidos de Wompi pendientes o cancelados de las últimas 48 h y confirma los que
// Wompi tenga APROBADOS. No cancela nada. Solo rol admin (no basta con tener sesión).
export async function POST() {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (user.app_metadata?.role !== "admin") {
    return NextResponse.json({ error: "Prohibido" }, { status: 403 });
  }

  const supabase = createServiceClient();
  const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("payment_method", "wompi")
    .in("status", ["pending_payment", "cancelled"])
    .not("wompi_reference", "is", null)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(MAX_ORDERS);

  if (error) {
    console.error("[admin/reconcile] Error consultando pedidos:", error);
    return NextResponse.json({ error: "Error consultando pedidos" }, { status: 500 });
  }

  const list = orders ?? [];
  const confirmed: string[] = [];
  let stillUnpaid = 0;
  let errors = 0;

  for (let i = 0; i < list.length; i += CONCURRENCY) {
    const chunk = list.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      chunk.map((order) => reconcileOrderWithWompi(supabase, order, "admin-bulk"))
    );
    results.forEach((r, idx) => {
      if (r.outcome === "confirmed") confirmed.push(chunk[idx].order_number);
      else if (r.outcome === "error") errors++;
      else if (r.outcome === "not_approved") stillUnpaid++;
    });
  }

  return NextResponse.json({
    ok: true,
    checked: list.length,
    confirmed: confirmed.length,
    confirmed_orders: confirmed,
    still_unpaid: stillUnpaid,
    errors,
  });
}
