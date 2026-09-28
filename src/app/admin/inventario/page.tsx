import { createServiceClient } from "@/lib/supabase/server";
import { InventoryList, type InventoryRow } from "@/components/admin/InventoryList";

// Tope defensivo: el filtrado y la búsqueda son instantáneos en el cliente, así
// que se carga el catálogo entero de una vez. El orden por menor stock garantiza
// que, si algún día se supera el tope, lo que se recorta es lo que sobra.
const LIMIT = 1000;

interface VariantRow {
  id: string;
  sku: string;
  stock: number;
  reserved: number;
  attributes: Record<string, string> | null;
  product: { id: string; name: string; images: string[] | null } | null;
}

export default async function AdminInventarioPage() {
  const supabase = createServiceClient();

  const { data: variants } = await supabase
    .from("product_variants")
    .select(`
      id, sku, stock, reserved, attributes,
      product:products(id, name, images)
    `)
    .order("stock", { ascending: true })
    .limit(LIMIT);

  const rows: InventoryRow[] = ((variants ?? []) as unknown as VariantRow[]).map((v) => ({
    id: v.id,
    sku: v.sku,
    stock: v.stock,
    reserved: v.reserved,
    attributes: v.attributes,
    productName: v.product?.name ?? "—",
    image: v.product?.images?.[0],
  }));

  return (
    <div>
      <h1
        className="text-2xl md:text-3xl text-[#3D2B1F] mb-2"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Inventario
      </h1>

      <InventoryList rows={rows} truncated={rows.length === LIMIT} />
    </div>
  );
}
