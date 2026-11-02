"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Check, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Category, Collection, Occasion } from "@/types";

interface Props {
  categories: Category[];
  collections: Collection[];
  occasions: Occasion[];
  current: Record<string, string | undefined>;
  onFilterApplied?: () => void;
  showHeader?: boolean;
}

export function CatalogFilters({ categories, collections, occasions, current, onFilterApplied, showHeader = true }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("pagina");
      router.push(`${pathname}?${params.toString()}`);
      onFilterApplied?.();
    },
    [searchParams, pathname, router, onFilterApplied]
  );

  const clearAll = () => {
    router.push(pathname);
    onFilterApplied?.();
  };

  const FILTER_KEYS = ["categoria", "coleccion", "ocasion", "talla", "precio_min", "precio_max"];
  const hasFilters = Object.values(current).some(Boolean);
  const activeCount = FILTER_KEYS.filter((k) => current[k]).length;

  return (
    <div className="divide-y divide-[#EDE3E0]">
      {showHeader && (
        <div className="flex items-center justify-between pb-4">
          <h3 className="flex items-center gap-2 text-sm tracking-[0.2em] uppercase text-[#252525] font-[600]">
            <SlidersHorizontal size={15} strokeWidth={1.75} />
            Filtros
            {activeCount > 0 && (
              <span className="min-w-5 h-5 px-1 rounded-full bg-[#B5888A] text-white text-[11px] flex items-center justify-center font-[600]">
                {activeCount}
              </span>
            )}
          </h3>
          {hasFilters && (
            <button
              onClick={clearAll}
              className="text-xs text-[#9C6468] hover:text-[#252525] underline underline-offset-4 transition-colors"
            >
              Limpiar todo
            </button>
          )}
        </div>
      )}
      {!showHeader && hasFilters && (
        <div className="pb-4">
          <button
            onClick={clearAll}
            className="text-xs text-[#9C6468] hover:text-[#252525] underline underline-offset-4 transition-colors"
          >
            Limpiar todo
          </button>
        </div>
      )}

      {/* CATEGORÍAS */}
      {categories.length > 0 && (
        <FilterGroup title="Categoría">
          {categories.map((cat) => (
            <FilterOption
              key={cat.id}
              label={cat.name}
              active={current.categoria === cat.slug}
              onClick={() =>
                setFilter(
                  "categoria",
                  current.categoria === cat.slug ? null : cat.slug
                )
              }
            />
          ))}
        </FilterGroup>
      )}

      {/* COLECCIONES */}
      {collections.length > 0 && (
        <FilterGroup title="Colección">
          {collections.map((col) => (
            <FilterOption
              key={col.id}
              label={col.name}
              active={current.coleccion === col.slug}
              onClick={() =>
                setFilter(
                  "coleccion",
                  current.coleccion === col.slug ? null : col.slug
                )
              }
            />
          ))}
        </FilterGroup>
      )}

      {/* OCASIONES */}
      {occasions.length > 0 && (
        <FilterGroup title="Ocasión">
          {occasions.map((occ) => (
            <FilterOption
              key={occ.id}
              label={occ.name}
              active={current.ocasion === occ.slug}
              onClick={() =>
                setFilter(
                  "ocasion",
                  current.ocasion === occ.slug ? null : occ.slug
                )
              }
            />
          ))}
        </FilterGroup>
      )}

      {/* TALLAS */}
      <FilterGroup title="Talla" grid>
        {["XS", "S", "M", "L", "XL", "XXL"].map((t) => (
          <SizeChip
            key={t}
            label={t}
            active={current.talla === t}
            onClick={() =>
              setFilter("talla", current.talla === t ? null : t)
            }
          />
        ))}
      </FilterGroup>

      {/* PRECIO */}
      <FilterGroup title="Precio">
        {[
          { label: "Hasta $100.000", min: undefined, max: "100000" },
          { label: "$100.000 – $200.000", min: "100000", max: "200000" },
          { label: "$200.000 – $400.000", min: "200000", max: "400000" },
          { label: "Más de $400.000", min: "400000", max: undefined },
        ].map((range) => {
          const active =
            current.precio_min === range.min &&
            current.precio_max === range.max;
          return (
            <FilterOption
              key={range.label}
              label={range.label}
              active={active}
              onClick={() => {
                if (active) {
                  setFilter("precio_min", null);
                  setFilter("precio_max", null);
                } else {
                  const params = new URLSearchParams(searchParams.toString());
                  if (range.min) params.set("precio_min", range.min);
                  else params.delete("precio_min");
                  if (range.max) params.set("precio_max", range.max);
                  else params.delete("precio_max");
                  router.push(`${pathname}?${params.toString()}`);
                }
              }}
            />
          );
        })}
      </FilterGroup>
    </div>
  );
}

function FilterGroup({
  title,
  children,
  grid = false,
}: {
  title: string;
  children: React.ReactNode;
  grid?: boolean;
}) {
  return (
    <div className="py-5">
      <h4 className="text-[13px] tracking-[0.18em] uppercase text-[#252525] font-[600] mb-3">
        {title}
      </h4>
      <div className={grid ? "grid grid-cols-3 gap-2" : "space-y-0.5"}>{children}</div>
    </div>
  );
}

function FilterOption({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex w-full items-center gap-3 text-left text-[15px] py-2 px-2 -mx-2 rounded-sm transition-colors",
        active
          ? "bg-[#ECD6D1]/60 text-[#252525] font-[500]"
          : "text-[#252525]/80 hover:bg-[#ECD6D1]/30 hover:text-[#252525]"
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center border transition-colors",
          active ? "border-[#252525] bg-[#252525]" : "border-[#B5888A]"
        )}
      >
        {active && <Check size={11} strokeWidth={3} className="text-white" />}
      </span>
      {label}
    </button>
  );
}

function SizeChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "py-2.5 text-sm border transition-colors",
        active
          ? "bg-[#252525] border-[#252525] text-white font-[500]"
          : "border-[#EDE3E0] text-[#252525] hover:border-[#252525]"
      )}
    >
      {label}
    </button>
  );
}
