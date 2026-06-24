import { createServiceClient } from "@/lib/supabase/server";

export default async function AdminInventarioPage() {
  const supabase = createServiceClient();

  const { data: variants } = await supabase
    .from("product_variants")
    .select(`
      id, sku, stock, reserved, attributes,
      product:products(id, name, status)
    `)
    .order("stock", { ascending: true })
    .limit(500);

  const items = (variants ?? []).map((v: any) => ({
    ...v,
    available: Math.max(0, v.stock - v.reserved),
  }));

  const soldOut = items.filter((v) => v.available === 0);
  const low = items.filter((v) => v.available > 0 && v.available <= 3);
  const ok = items.filter((v) => v.available > 3);

  return (
    <div>
      <h1
        className="text-3xl text-[#3D2B1F] mb-2"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Inventario
      </h1>
      <p className="text-sm text-[#897568] mb-6">
        {soldOut.length} agotados · {low.length} con stock bajo · {ok.length} OK
      </p>

      {/* Tabs visuales por estado */}
      {[
        { label: "Agotados", items: soldOut, color: "text-red-600" },
        { label: "Stock bajo (1-3 uds)", items: low, color: "text-[#B5888A]" },
        { label: "En stock", items: ok, color: "text-green-700" },
      ].map(({ label, items: group, color }) => (
        <div key={label} className="mb-8">
          <h2 className={`text-[10px] tracking-[0.2em] uppercase font-[600] mb-3 ${color}`}>
            {label} ({group.length})
          </h2>
          {group.length > 0 && (
            <div className="bg-white border border-[#DDD5C4] overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#DDD5C4]">
                    {["SKU", "Producto", "Atributos", "Stock", "Reservado", "Disponible"].map((h) => (
                      <th key={h} className="text-left text-[9px] tracking-[0.2em] uppercase text-[#897568] font-[600] px-4 py-2">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.map((v) => (
                    <tr key={v.id} className="border-b border-[#F3EDE0] hover:bg-[#F3EDE0]/50">
                      <td className="px-4 py-2.5 font-mono text-xs text-[#897568]">{v.sku}</td>
                      <td className="px-4 py-2.5">
                        <p className="text-[#3D2B1F]">{v.product?.name}</p>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-[#897568]">
                        {Object.entries(v.attributes ?? {}).map(([k,val]) => `${k}: ${val}`).join(" · ")}
                      </td>
                      <td className="px-4 py-2.5 text-[#3D2B1F]">{v.stock}</td>
                      <td className="px-4 py-2.5 text-[#897568]">{v.reserved}</td>
                      <td className={`px-4 py-2.5 font-[600] ${v.available === 0 ? "text-red-500" : v.available <= 3 ? "text-[#B5888A]" : "text-green-700"}`}>
                        {v.available}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
