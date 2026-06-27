import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return null;
  return user;
}

// GET — todas las zonas con sus ciudades
export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const db = createServiceClient();
  const { data: zones } = await db
    .from("shipping_zones")
    .select("*, cities:shipping_zone_cities(id, city_name)")
    .order("sort_order");

  return NextResponse.json(zones ?? []);
}

// PUT — actualizar precio de una zona
export async function PUT(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id, price } = await req.json();
  if (!id || price == null) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

  const db = createServiceClient();
  const { error } = await db
    .from("shipping_zones")
    .update({ price: Number(price), updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// POST — agregar ciudad a una zona
export async function POST(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { zone_id, city_name } = await req.json();
  if (!zone_id || !city_name?.trim()) return NextResponse.json({ error: "Faltan datos" }, { status: 400 });

  const db = createServiceClient();
  const { error } = await db
    .from("shipping_zone_cities")
    .insert({ zone_id, city_name: city_name.trim() });

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Esa ciudad ya está asignada" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE — quitar ciudad de una zona
export async function DELETE(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Falta el ID" }, { status: 400 });

  const db = createServiceClient();
  const { error } = await db.from("shipping_zone_cities").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
