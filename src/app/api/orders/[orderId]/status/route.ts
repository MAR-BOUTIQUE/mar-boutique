import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  const supabase = createServiceClient();
  const { data: order } = await supabase
    .from("orders")
    .select("status, wompi_transaction_id, paid_at")
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    status: order.status,
    wompi_transaction_id: order.wompi_transaction_id,
    paid_at: order.paid_at,
  });
}
