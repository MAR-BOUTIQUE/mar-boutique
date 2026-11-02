import Link from "next/link";
import { Plus } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/utils/format";
import { ProductThumb } from "@/components/admin/ProductThumb";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-[#FFFFFF] text-[#252525]",
  draft: "bg-[#ECD6D1]/40 text-[#7B7B7B]",
  archived: "bg-gray-100 text-gray-400",
};
const STATUS_LABEL: Record<string, string> = {
  active: "Activo",
  draft: "Borrador",
  archived: "Archivado",
};

export default async function AdminProductosPage() {
  const supabase = createServiceClient();
  const { data: products } = await supabase
    .from("products")
    .select(`*, variants:product_variants(id, stock, reserved)`)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-3xl text-[#252525]"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Productos
        </h1>
        <div className="flex gap-3">
          <Link
            href="/admin/productos/importar"
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#EDE3E0] text-[#7B7B7B] text-[11px] tracking-[0.2em] uppercase font-[500] hover:border-[#7B7B7B] hover:text-[#252525] transition-colors"
          >
            Carga masiva
          </Link>
          <Link
            href="/admin/productos/nuevo"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#252525] text-[#FFFFFF] text-[11px] tracking-[0.2em] uppercase font-[500] hover:bg-[#444444] transition-colors"
          >
            <Plus size={14} /> Nuevo producto
          </Link>
        </div>
      </div>

      <div className="bg-white border border-[#EDE3E0] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#EDE3E0]">
              {["", "Nombre", "Precio", "Stock total", "Estado", ""].map((h) => (
                <th key={h} className="text-left text-[9px] tracking-[0.2em] uppercase text-[#7B7B7B] font-[600] px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(products ?? []).map((product) => {
              const totalStock = (product.variants ?? []).reduce(
                (s: number, v: any) => s + Math.max(0, v.stock - v.reserved),
                0
              );
              return (
                <tr key={product.id} className="border-b border-[#FFFFFF] hover:bg-[#FFFFFF]/50 transition-colors">
                  <td className="px-4 py-3 w-14">
                    {product.images?.[0] ? (
                      <ProductThumb src={product.images[0]} alt={product.name} />
                    ) : (
                      <div className="w-10 h-12 bg-[#ECD6D1]/20 flex items-center justify-center">
                        <span className="text-[10px] text-[#7B7B7B]"
                          style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
                          MB
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-[500] text-[#252525]">{product.name}</p>
                    <p className="text-xs text-[#7B7B7B]">{product.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-[#252525]">{formatCOP(product.base_price)}</td>
                  <td className="px-4 py-3">
                    <span className={totalStock === 0 ? "text-[#B5888A] font-[500]" : "text-[#252525]"}>
                      {totalStock === 0 ? "Agotado" : `${totalStock} uds`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-[600] tracking-wide uppercase ${STATUS_BADGE[product.status] ?? "bg-gray-100"}`}>
                      {STATUS_LABEL[product.status] ?? product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/productos/${product.id}`}
                      className="text-xs text-[#B5888A] hover:text-[#252525] font-[500]"
                    >
                      Editar →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!products?.length && (
          <div className="py-16 text-center text-[#7B7B7B] text-sm">
            Aún no hay productos.{" "}
            <Link href="/admin/productos/nuevo" className="text-[#B5888A] underline">
              Crea el primero
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
