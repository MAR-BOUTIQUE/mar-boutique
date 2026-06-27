import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Llamado por Vercel Cron cada 5 minutos — RB-CHK-01, RB-PED-02
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // 1. Liberar reservas de stock expiradas (10 min) — RB-CHK-01
  const { error: releaseError } = await supabase.rpc("release_expired_reservations");
  if (releaseError) {
    console.error("release_expired_reservations error:", releaseError);
  }

  // 2. Cancelar pedidos en pending_payment con más de 30 min sin pago — RB-PED-02
  const { data: cancelled, error: cancelError } = await supabase.rpc("cancel_expired_orders");
  if (cancelError) {
    console.error("cancel_expired_orders error:", cancelError);
  }

  return NextResponse.json({
    ok: !releaseError && !cancelError,
    cancelled_orders: cancelled ?? 0,
    timestamp: new Date().toISOString(),
  });
}
