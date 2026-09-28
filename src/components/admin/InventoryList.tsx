"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ProductThumb } from "@/components/admin/ProductThumb";
import { StockAdjuster } from "@/components/admin/StockAdjuster";

export interface InventoryRow {
  id: string;
  sku: string;
  stock: number;
  reserved: number;
  attributes: Record<string, string> | null;
  productName: string;
  image?: string;
}

const ESTADOS = [
  { value: "todos", label: "Todos" },
  { value: "agotados", label: "Agotados" },
  { value: "bajo", label: "Stock bajo" },
  { value: "ok", label: "En stock" },
] as const;

type Estado = (typeof ESTADOS)[number]["value"];

/** Minúsculas y sin tildes: buscar "vestido rojo" debe encontrar "Vestido Rojó". */
function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function attrsText(attributes: Record<string, string> | null) {
  return Object.entries(attributes ?? {})
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
}

export function InventoryList({ rows, truncated }: { rows: InventoryRow[]; truncated: boolean }) {
  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState<Estado>("todos");

  // El índice de búsqueda se calcula una vez por lista, no en cada tecla.
  const indexed = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        available: Math.max(0, r.stock - r.reserved),
        haystack: norm(`${r.productName} ${r.sku} ${attrsText(r.attributes)}`),
      })),
    [rows]
  );

  const counts = useMemo(
    () => ({
      todos: indexed.length,
      agotados: indexed.filter((v) => v.available === 0).length,
      bajo: indexed.filter((v) => v.available > 0 && v.available <= 3).length,
      ok: indexed.filter((v) => v.available > 3).length,
    }),
    [indexed]
  );

  const visible = useMemo(() => {
    // Cada palabra debe aparecer en algún campo: "vestido m" filtra por ambas.
    const terms = norm(query).split(/\s+/).filter(Boolean);

    return indexed.filter((v) => {
      if (estado === "agotados" && v.available !== 0) return false;
      if (estado === "bajo" && !(v.available > 0 && v.available <= 3)) return false;
      if (estado === "ok" && v.available <= 3) return false;
      return terms.every((t) => v.haystack.includes(t));
    });
  }, [indexed, query, estado]);

  const tone = (available: number) =>
    available === 0 ? "text-red-500" : available <= 3 ? "text-[#B5888A]" : "text-green-700";

  return (
    <div>
      <p className="text-sm text-[#897568] mb-5">
        {counts.agotados} agotados · {counts.bajo} con stock bajo · {counts.ok} OK
      </p>

      {/* Búsqueda instantánea: filtra mientras se escribe, sin recargar */}
      <div className="relative mb-4">
        <Search
          size={16}
          strokeWidth={1.5}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#897568] pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por producto, SKU, talla o color"
          autoComplete="off"
          aria-label="Buscar en el inventario"
          className="h-11 w-full border border-[#DDD5C4] bg-white pl-9 pr-11 text-sm text-[#3D2B1F] placeholder:text-[#897568]"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Limpiar búsqueda"
            className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-[#897568]"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {ESTADOS.map((e) => (
          <button
            key={e.value}
            type="button"
            onClick={() => setEstado(e.value)}
            className={cn(
              "shrink-0 h-9 px-3 flex items-center border text-[10px] tracking-[0.15em] uppercase",
              estado === e.value
                ? "bg-[#3D2B1F] border-[#3D2B1F] text-[#F3EDE0]"
                : "bg-white border-[#DDD5C4] text-[#897568]"
            )}
          >
            {e.label} ({counts[e.value]})
          </button>
        ))}
      </div>

      {truncated && (
        <p className="mb-4 text-xs text-[#897568] border border-[#DDD5C4] bg-white px-3 py-2">
          Mostrando las primeras {rows.length} variantes ordenadas por menor stock. Si no
          encuentras una, refina la búsqueda desde Productos.
        </p>
      )}

      {visible.length === 0 ? (
        <p className="text-sm text-[#897568] py-8 text-center border border-[#DDD5C4] bg-white">
          {query ? `Sin resultados para "${query}".` : "No hay variantes en este estado."}
        </p>
      ) : (
        <>
          {/* Celular: una tarjeta por variante, sin scroll horizontal */}
          <div className="md:hidden space-y-3">
            {visible.map((v) => (
              <div key={v.id} className="bg-white border border-[#DDD5C4] p-3">
                <div className="flex gap-3">
                  <ProductThumb src={v.image} alt={v.productName} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[#3D2B1F] leading-tight">{v.productName}</p>
                    <p className="text-xs text-[#897568] mt-0.5">{attrsText(v.attributes)}</p>
                    <p className="font-mono text-[10px] text-[#897568] mt-0.5 truncate">{v.sku}</p>
                    <p className="mt-1.5">
                      <span className="text-[9px] tracking-[0.2em] uppercase text-[#897568] mr-2">
                        Disponible
                      </span>
                      <span className={cn("text-lg font-[600]", tone(v.available))}>
                        {v.available}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <StockAdjuster variantId={v.id} stock={v.stock} reserved={v.reserved} />
                </div>
              </div>
            ))}
          </div>

          {/* Escritorio: tabla */}
          <div className="hidden md:block bg-white border border-[#DDD5C4] overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#DDD5C4]">
                  {["", "Producto", "Atributos", "SKU", "Disponible", "Ajustar stock"].map((h, i) => (
                    <th
                      key={i}
                      className="text-left text-[9px] tracking-[0.2em] uppercase text-[#897568] font-[600] px-4 py-2"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((v) => (
                  <tr key={v.id} className="border-b border-[#F3EDE0] align-top">
                    <td className="pl-4 py-3">
                      <ProductThumb src={v.image} alt={v.productName} />
                    </td>
                    <td className="px-4 py-3 text-[#3D2B1F]">{v.productName}</td>
                    <td className="px-4 py-3 text-xs text-[#897568]">{attrsText(v.attributes)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#897568]">{v.sku}</td>
                    <td className={cn("px-4 py-3 font-[600]", tone(v.available))}>{v.available}</td>
                    <td className="px-4 py-3">
                      <StockAdjuster variantId={v.id} stock={v.stock} reserved={v.reserved} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
