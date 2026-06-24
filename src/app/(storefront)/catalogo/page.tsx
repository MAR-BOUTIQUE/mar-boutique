import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/storefront/ProductCard";
import { CatalogFilters } from "@/components/storefront/CatalogFilters";
import { CatalogSortSelect } from "@/components/storefront/CatalogSortSelect";
import type { Product } from "@/types";

interface SearchParams {
  categoria?: string;
  coleccion?: string;
  ocasion?: string;
  talla?: string;
  color?: string;
  precio_min?: string;
  precio_max?: string;
  orden?: string;
  q?: string;
  pagina?: string;
  [key: string]: string | undefined;
}

interface Props {
  searchParams: Promise<SearchParams>;
}

async function getProducts(filters: SearchParams): Promise<Product[]> {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(`
      *,
      variants:product_variants(*),
      categories:product_categories(category:categories(*)),
      collections:product_collections(collection:collections(*)),
      occasions:product_occasions(occasion:occasions(*))
    `)
    .eq("status", "active");

  if (filters.q) {
    query = query.ilike("name", `%${filters.q}%`);
  }

  if (filters.precio_min) {
    query = query.gte("base_price", Number(filters.precio_min));
  }
  if (filters.precio_max) {
    query = query.lte("base_price", Number(filters.precio_max));
  }

  switch (filters.orden) {
    case "precio_asc":
      query = query.order("base_price", { ascending: true });
      break;
    case "precio_desc":
      query = query.order("base_price", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data } = await query.limit(48);
  if (!data) return [];

  return data.map((p: any) => ({
    ...p,
    categories: p.categories?.map((r: any) => r.category) ?? [],
    collections: p.collections?.map((r: any) => r.collection) ?? [],
    occasions: p.occasions?.map((r: any) => r.occasion) ?? [],
    variants: p.variants ?? [],
    is_sold_out:
      !p.variants?.length ||
      p.variants.every((v: any) => v.stock - v.reserved <= 0),
    is_on_sale: !!p.compare_price && p.compare_price > p.base_price,
    effective_price: p.base_price,
  }));
}

async function getFilterOptions() {
  const supabase = await createClient();
  const [cats, cols, occs] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("collections").select("*").eq("is_active", true).order("sort_order"),
    supabase.from("occasions").select("*").order("sort_order"),
  ]);
  return {
    categories: cats.data ?? [],
    collections: cols.data ?? [],
    occasions: occs.data ?? [],
  };
}

export default async function CatalogoPage({ searchParams }: Props) {
  const filters = await searchParams;
  const [products, filterOptions] = await Promise.all([
    getProducts(filters),
    getFilterOptions(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* ENCABEZADO */}
      <div className="text-center mb-10">
        <span className="text-[10px] tracking-[0.3em] uppercase text-[#B5888A] font-[500]">
          {filters.coleccion ?? "Todas las prendas"}
        </span>
        <h1
          className="text-5xl text-[#3D2B1F] mt-1"
          style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
        >
          Catálogo
        </h1>
      </div>

      <div className="flex gap-8">
        {/* SIDEBAR FILTROS */}
        <aside className="hidden lg:block w-56 shrink-0">
          <Suspense fallback={<div className="space-y-8 animate-pulse"><div className="h-4 bg-[#DDD5C4] rounded w-3/4"/><div className="h-4 bg-[#DDD5C4] rounded w-1/2"/></div>}>
            <CatalogFilters
              categories={filterOptions.categories}
              collections={filterOptions.collections}
              occasions={filterOptions.occasions}
              current={filters}
            />
          </Suspense>
        </aside>

        {/* GRID DE PRODUCTOS */}
        <div className="flex-1">
          {/* Barra superior: resultados + orden */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-[#897568]">
              {products.length} {products.length === 1 ? "prenda" : "prendas"}
            </p>
            <CatalogSortSelect current={filters.orden} />
          </div>

          {products.length === 0 ? (
            <div className="text-center py-24">
              <p
                className="text-2xl text-[#897568]"
                style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
              >
                Sin resultados
              </p>
              <p className="text-sm text-[#897568] mt-2">
                Prueba con otros filtros o busca algo diferente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

