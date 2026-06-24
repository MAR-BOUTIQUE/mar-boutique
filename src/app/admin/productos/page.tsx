import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/utils/format";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-[#F3EDE0] text-[#3D2B1F]",
  draft: "bg-[#EAC9C9]/40 text-[#897568]",
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
          className="text-3xl text-[#3D2B1F]"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Productos
        </h1>
        <div className="flex gap-3">
          <Link
            href="/admin/productos/importar"
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#DDD5C4] text-[#897568] text-[11px] tracking-[0.2em] uppercase font-[500] hover:border-[#897568] hover:text-[#3D2B1F] transition-colors"
          >
            Carga masiva
          </Link>
          <Link
            href="/admin/productos/nuevo"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3D2B1F] text-[#F3EDE0] text-[11px] tracking-[0.2em] uppercase font-[500] hover:bg-[#5A3E2E] transition-colors"
          >
            <Plus size={14} /> Nuevo producto
          </Link>
        </div>
      </div>

      <div className="bg-white border border-[#DDD5C4] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#DDD5C4]">
              {["", "Nombre", "Precio", "Stock total", "Estado", ""].map((h) => (
                <th key={h} className="text-left text-[9px] tracking-[0.2em] uppercase text-[#897568] font-[600] px-4 py-3">
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
                <tr key={product.id} className="border-b border-[#F3EDE0] hover:bg-[#F3EDE0]/50 transition-colors">
                  <td className="px-4 py-3 w-14">
                    {product.images?.[0] ? (
                      <div className="relative w-10 h-12 overflow-hidden bg-[#EAC9C9]/20">
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-12 bg-[#EAC9C9]/20 flex items-center justify-center">
                        <span className="text-[10px] text-[#897568]"
                          style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
                          MB
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-[500] text-[#3D2B1F]">{product.name}</p>
                    <p className="text-xs text-[#897568]">{product.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-[#3D2B1F]">{formatCOP(product.base_price)}</td>
                  <td className="px-4 py-3">
                    <span className={totalStock === 0 ? "text-[#B5888A] font-[500]" : "text-[#3D2B1F]"}>
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
                      className="text-xs text-[#B5888A] hover:text-[#3D2B1F] font-[500]"
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
          <div className="py-16 text-center text-[#897568] text-sm">
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
