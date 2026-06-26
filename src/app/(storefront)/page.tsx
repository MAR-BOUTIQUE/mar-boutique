import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/storefront/ProductCard";
import type { Product } from "@/types";

type FeaturedSection = {
  collectionName: string;
  collectionSlug: string | null;
  collectionDesc: string | null;
  products: Product[];
};

const BRAND_VALUES = [
  { title: "Intencional", desc: "Con propósito detrás de cada costura. Cada prenda nace desde el amor." },
  { title: "Versátil", desc: "De los días simples a los momentos especiales. Prendas que se adaptan a tu día a día." },
  { title: "Femenina", desc: "Diseños que resaltan tu esencia. Delicadeza, confianza y estilo en cada detalle." },
  { title: "Auténtica", desc: "Cada prenda refleja quién quieres ser." },
];

async function getFeaturedSection(): Promise<FeaturedSection> {
  const db = createServiceClient();

  // Buscar colección marcada como destacada en inicio
  const { data: collection } = await db
    .from("collections")
    .select("id, name, slug, description")
    .eq("featured_on_home", true)
    .eq("is_active", true)
    .single();

  if (collection) {
    // Traer los productos de esa colección
    const { data: rows } = await db
      .from("product_collections")
      .select(`
        products (
          id, name, slug, base_price, compare_price, images,
          is_on_sale, effective_price, is_sold_out, status
        )
      `)
      .eq("collection_id", collection.id)
      .order("sort_order", { ascending: true })
      .limit(4);

    const products = (rows ?? [])
      .map((r: any) => r.products)
      .filter((p: any) => p?.status === "active") as Product[];

    return {
      collectionName: collection.name,
      collectionSlug: collection.slug,
      collectionDesc: collection.description,
      products,
    };
  }

  // Fallback: productos más nuevos
  const { data } = await db
    .from("products")
    .select(`
      id, name, slug, base_price, compare_price, images,
      is_on_sale, effective_price, is_sold_out
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(4);

  return {
    collectionName: "Nueva colección",
    collectionSlug: null,
    collectionDesc: null,
    products: (data ?? []) as Product[],
  };
}

export default async function HomePage() {
  const featured = await getFeaturedSection();

  return (
    <>
      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-[#F3EDE0]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F3EDE0] via-[#EAC9C9]/20 to-[#CEC3AB]/30" />

        <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
          <span className="inline-block text-[10px] tracking-[0.3em] uppercase text-[#B5888A] mb-6 font-[500]">
            Nueva colección
          </span>

          <h1
            className="text-5xl sm:text-6xl md:text-7xl text-[#3D2B1F] mb-4 leading-[1.05]"
            style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
          >
            Mar Boutique
          </h1>

          <p className="text-base text-[#897568] mb-10 leading-relaxed font-[300]">
            Mujeres que visten con intención
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#3D2B1F] text-[#F3EDE0] text-[11px] tracking-[0.2em] uppercase font-[500] hover:bg-[#5A3E2E] transition-colors rounded-none"
            >
              Ver catálogo <ArrowRight size={14} />
            </Link>
            <Link
              href="/colecciones"
              className="inline-flex items-center gap-2 px-8 py-3 border border-[#3D2B1F] text-[#3D2B1F] text-[11px] tracking-[0.2em] uppercase font-[500] hover:bg-[#3D2B1F] hover:text-[#F3EDE0] transition-colors rounded-none"
            >
              Colecciones
            </Link>
          </div>
        </div>

      </section>

      {/* ── VALORES DE MARCA ───────────────────────────────────── */}
      <section className="bg-[#F3EDE0] border-y border-[#DDD5C4] py-12">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {BRAND_VALUES.map((v) => (
            <div key={v.title}>
              <h3
                className="text-lg text-[#3D2B1F] mb-1"
                style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
              >
                {v.title}
              </h3>
              <p className="text-xs text-[#897568] leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── COLECCIÓN DESTACADA ────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="text-[10px] tracking-[0.25em] uppercase text-[#B5888A] font-[500]">
              Nueva colección
            </span>
            <h2
              className="text-4xl text-[#3D2B1F] mt-1"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {featured.collectionName}
            </h2>
            {featured.collectionDesc && (
              <p className="text-sm text-[#897568] leading-relaxed font-[300] mt-2 max-w-md">
                {featured.collectionDesc}
              </p>
            )}
          </div>
          <Link
            href={featured.collectionSlug ? `/coleccion/${featured.collectionSlug}` : "/catalogo"}
            className="hidden sm:inline-flex items-center gap-1.5 text-[11px] tracking-[0.15em] uppercase text-[#897568] hover:text-[#3D2B1F] transition-colors font-[500]"
          >
            Ver todo <ArrowRight size={12} />
          </Link>
        </div>

        {featured.products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featured.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-[#EAC9C9]/30 animate-pulse" />
            ))}
          </div>
        )}

        <div className="text-center mt-10 sm:hidden">
          <Link
            href={featured.collectionSlug ? `/coleccion/${featured.collectionSlug}` : "/catalogo"}
            className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.15em] uppercase text-[#897568] hover:text-[#3D2B1F] transition-colors font-[500]"
          >
            Ver todo <ArrowRight size={12} />
          </Link>
        </div>
      </section>

      {/* ── BANNER NOSOTRAS ────────────────────────────────────── */}
      <section className="bg-[#EAC9C9]/40 py-20">
        <div className="max-w-2xl mx-auto text-center px-4">
          <span className="text-[10px] tracking-[0.3em] uppercase text-[#B5888A] font-[500]">
            Nuestra historia
          </span>
          <h2
            className="text-4xl text-[#3D2B1F] mt-2 mb-5"
            style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
          >
            Nosotras
          </h2>
          <Link
            href="/nosotras"
            className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-[#3D2B1F] border-b border-[#3D2B1F] pb-0.5 hover:border-[#B5888A] hover:text-[#B5888A] transition-colors font-[500]"
          >
            Conocernos <ArrowRight size={12} />
          </Link>
        </div>
      </section>

      {/* ── CTA WISHLIST ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2
          className="text-3xl text-[#3D2B1F] mb-3"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Guarda tus favoritos
        </h2>
        <p className="text-sm text-[#897568] mb-8 font-[300]">
          Añade prendas a tu wishlist y te avisamos cuando baje el precio.
        </p>
        <Link
          href="/cuenta/wishlist"
          className="inline-flex items-center gap-2 px-8 py-3 border border-[#3D2B1F] text-[#3D2B1F] text-[11px] tracking-[0.2em] uppercase font-[500] hover:bg-[#3D2B1F] hover:text-[#F3EDE0] transition-colors"
        >
          Ver wishlist
        </Link>
      </section>
    </>
  );
}
