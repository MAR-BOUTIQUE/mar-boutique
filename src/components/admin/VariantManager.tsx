"use client";

import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { buildSku } from "@/lib/utils/sku";

export interface VariantRow {
  sku: string;
  attributes: { talla: string; color: string };
  stock: number;
  price: number | null;
}

interface Props {
  variants: VariantRow[];
  onChange: (variants: VariantRow[]) => void;
  basePrice: number;
  /** Nombre del producto: prefijo del SKU autogenerado. */
  productName: string;
}

const TALLAS_DEFAULT = ["XS", "S", "M", "L", "XL", "XXL"];

export function VariantManager({ variants, onChange, basePrice, productName }: Props) {
  const [tallas, setTallas] = useState<string[]>([]);
  const [colores, setColores] = useState<string[]>([]);
  const [newTalla, setNewTalla] = useState("");
  const [newColor, setNewColor] = useState("");

  // Sync tallas/colores from incoming variants (for edit mode)
  useEffect(() => {
    if (variants.length === 0) return;
    const t = [...new Set(variants.map((v) => v.attributes.talla))];
    const c = [...new Set(variants.map((v) => v.attributes.color))];
    setTallas(t);
    setColores(c);
  }, []); // only on mount

  function rebuildMatrix(nextTallas: string[], nextColores: string[]) {
    const next: VariantRow[] = [];
    for (const t of nextTallas) {
      for (const c of nextColores) {
        const existing = variants.find(
          (v) => v.attributes.talla === t && v.attributes.color === c
        );
        next.push(
          existing ?? {
            sku: buildSku(productName, t, c),
            attributes: { talla: t, color: c },
            stock: 0,
            price: null,
          }
        );
      }
    }
    onChange(next);
  }

  function addTalla(value: string) {
    const v = value.trim().toUpperCase();
    if (!v || tallas.includes(v)) return;
    const next = [...tallas, v];
    setTallas(next);
    rebuildMatrix(next, colores);
  }

  function removeTalla(t: string) {
    const next = tallas.filter((x) => x !== t);
    setTallas(next);
    rebuildMatrix(next, colores);
  }

  function addColor(value: string) {
    const v = value.trim();
    if (!v || colores.includes(v)) return;
    const next = [...colores, v];
    setColores(next);
    rebuildMatrix(tallas, next);
  }

  function removeColor(c: string) {
    const next = colores.filter((x) => x !== c);
    setColores(next);
    rebuildMatrix(tallas, next);
  }

  function updateVariant(
    talla: string,
    color: string,
    field: "sku" | "stock" | "price",
    value: string
  ) {
    const next = variants.map((v) => {
      if (v.attributes.talla !== talla || v.attributes.color !== color) return v;
      if (field === "sku") return { ...v, sku: value };
      if (field === "stock") return { ...v, stock: Math.max(0, parseInt(value) || 0) };
      if (field === "price")
        return { ...v, price: value === "" ? null : Math.max(0, parseFloat(value) || 0) };
      return v;
    });
    onChange(next);
  }

  function getVariant(talla: string, color: string): VariantRow | undefined {
    return variants.find(
      (v) => v.attributes.talla === talla && v.attributes.color === color
    );
  }

  const inputCls =
    "w-full border border-[#DDD5C4] bg-white px-2 py-1 text-xs text-[#3D2B1F] focus:outline-none focus:border-[#897568]";

  return (
    <div className="space-y-5">
      {/* Tallas */}
      <div>
        <p className="text-[10px] tracking-[0.18em] uppercase text-[#897568] font-[600] mb-2">
          Tallas disponibles
        </p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {TALLAS_DEFAULT.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => (tallas.includes(t) ? removeTalla(t) : addTalla(t))}
              className={cn(
                "px-3 py-1 text-xs border transition-colors",
                tallas.includes(t)
                  ? "bg-[#3D2B1F] text-[#F3EDE0] border-[#3D2B1F]"
                  : "bg-white text-[#897568] border-[#DDD5C4] hover:border-[#897568]"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newTalla}
            onChange={(e) => setNewTalla(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addTalla(newTalla); setNewTalla(""); }
            }}
            placeholder="Otra talla…"
            className="border border-[#DDD5C4] px-2 py-1 text-xs text-[#3D2B1F] focus:outline-none focus:border-[#897568] w-32"
          />
          <button
            type="button"
            onClick={() => { addTalla(newTalla); setNewTalla(""); }}
            className="text-xs text-[#897568] hover:text-[#3D2B1F] flex items-center gap-1"
          >
            <Plus size={12} /> Agregar
          </button>
        </div>
      </div>

      {/* Colores */}
      <div>
        <p className="text-[10px] tracking-[0.18em] uppercase text-[#897568] font-[600] mb-2">
          Colores disponibles
        </p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {colores.map((c) => (
            <span
              key={c}
              className="flex items-center gap-1 px-2 py-0.5 text-xs bg-[#F3EDE0] text-[#3D2B1F] border border-[#DDD5C4]"
            >
              {c}
              <button type="button" onClick={() => removeColor(c)}>
                <X size={10} className="text-[#897568] hover:text-[#B5888A]" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addColor(newColor); setNewColor(""); }
            }}
            placeholder="Ej: Negro, Blanco, Rojo…"
            className="border border-[#DDD5C4] px-2 py-1 text-xs text-[#3D2B1F] focus:outline-none focus:border-[#897568] w-48"
          />
          <button
            type="button"
            onClick={() => { addColor(newColor); setNewColor(""); }}
            className="text-xs text-[#897568] hover:text-[#3D2B1F] flex items-center gap-1"
          >
            <Plus size={12} /> Agregar
          </button>
        </div>
      </div>

      {/* Matriz talla × color */}
      {tallas.length > 0 && colores.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left text-[9px] tracking-[0.15em] uppercase text-[#897568] font-[600] pb-2 pr-4 whitespace-nowrap">
                  Talla / Color
                </th>
                {colores.map((c) => (
                  <th
                    key={c}
                    className="text-center text-[9px] tracking-[0.15em] uppercase text-[#897568] font-[600] pb-2 px-2 whitespace-nowrap"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tallas.map((t) => (
                <tr key={t} className="border-t border-[#F3EDE0]">
                  <td className="py-2 pr-4 font-[500] text-[#3D2B1F] whitespace-nowrap">{t}</td>
                  {colores.map((c) => {
                    const variant = getVariant(t, c);
                    if (!variant) return <td key={c} />;
                    return (
                      <td key={c} className="py-2 px-2 align-top">
                        <div className="space-y-1 min-w-[120px]">
                          {/* SKU */}
                          <input
                            value={variant.sku}
                            onChange={(e) => updateVariant(t, c, "sku", e.target.value)}
                            placeholder="SKU"
                            className={inputCls}
                            title="SKU"
                          />
                          {/* Stock */}
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-[#897568] w-10 shrink-0">Stock</span>
                            <input
                              type="number"
                              min={0}
                              value={variant.stock}
                              onChange={(e) => updateVariant(t, c, "stock", e.target.value)}
                              className={inputCls}
                            />
                          </div>
                          {/* Precio override */}
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-[#897568] w-10 shrink-0">Precio</span>
                            <input
                              type="number"
                              min={0}
                              step={100}
                              value={variant.price ?? ""}
                              onChange={(e) => updateVariant(t, c, "price", e.target.value)}
                              placeholder={String(basePrice)}
                              className={cn(inputCls, "placeholder:text-[#CEC3AB]")}
                              title="Dejar vacío para usar el precio base"
                            />
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-[#897568] mt-2">
            Precio vacío = usa el precio base del producto. SKU se genera automáticamente, puedes editarlo.
          </p>
        </div>
      )}

      {tallas.length === 0 && colores.length === 0 && (
        <p className="text-xs text-[#CEC3AB] italic">
          Agrega al menos una talla y un color para generar la matriz de variantes.
        </p>
      )}
    </div>
  );
}
