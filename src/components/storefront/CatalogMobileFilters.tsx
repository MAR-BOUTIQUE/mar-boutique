"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { CatalogFilters } from "./CatalogFilters";
import type { Category, Collection, Occasion } from "@/types";

interface Props {
  categories: Category[];
  collections: Collection[];
  occasions: Occasion[];
  current: Record<string, string | undefined>;
  totalProducts: number;
}

export function CatalogMobileFilters({ categories, collections, occasions, current, totalProducts }: Props) {
  const [open, setOpen] = useState(false);
  const activeCount = ["categoria", "coleccion", "ocasion", "talla", "precio_min", "precio_max"]
    .filter((k) => current[k]).length;

  return (
    <>
      {/* Botón disparador */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 border border-[#EDE3E0] text-xs text-[#252525] font-[500] tracking-[0.1em] uppercase hover:border-[#7B7B7B] transition-colors relative"
      >
        <SlidersHorizontal size={13} strokeWidth={1.5} />
        Filtros
        {activeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#B5888A] text-white text-[9px] flex items-center justify-center font-[600]">
            {activeCount}
          </span>
        )}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer desde abajo */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight: "85vh" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#EDE3E0]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#F6EFED]">
          <span className="text-sm font-[600] text-[#252525] tracking-[0.05em]">
            Filtros {activeCount > 0 && <span className="text-[#B5888A]">({activeCount})</span>}
          </span>
          <button
            onClick={() => setOpen(false)}
            className="text-[#7B7B7B] hover:text-[#252525] transition-colors"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Contenido filtros con scroll */}
        <div className="overflow-y-auto px-5 py-5" style={{ maxHeight: "calc(85vh - 120px)" }}>
          <CatalogFilters
            categories={categories}
            collections={collections}
            occasions={occasions}
            current={current}
            onFilterApplied={() => setOpen(false)}
            showHeader={false}
          />
        </div>

        {/* Footer con botón Ver resultados */}
        <div className="px-5 py-4 border-t border-[#F6EFED]">
          <button
            onClick={() => setOpen(false)}
            className="w-full py-3 bg-[#252525] text-[#FFFFFF] text-[11px] tracking-[0.2em] uppercase font-[500] hover:bg-[#444444] transition-colors"
          >
            Ver {totalProducts} {totalProducts === 1 ? "prenda" : "prendas"}
          </button>
        </div>
      </div>
    </>
  );
}
