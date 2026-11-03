export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/storefront/ProductCard";
import { HeroSlider } from "@/components/storefront/HeroSlider";
import { ScrollReveal } from "@/components/storefront/ScrollReveal";
import { StaggeredGrid } from "@/components/storefront/StaggeredGrid";
import { MarqueeStrip } from "@/components/storefront/MarqueeStrip";
import type { Product } from "@/types";

type HeroSlide = { id: string; image_url: string; alt_text: string | null };

type FeaturedSection = {
  collectionName: string;
  collectionSlug: string | null;
  collectionDesc: string | null;
  products: Product[];
};

const WHATSAPP_ADVISORY_URL = `https://wa.me/573042346723?text=${encodeURIComponent(
  "Hola 🌸 Quisiera una asesoría para elegir mi outfit"
)}`;

type CategoryTile = { id: string; name: string; slug: string; image: string | null };

const PRODUCT_FIELDS = `
  id, name, slug, base_price, compare_price, images,
  is_on_sale, effective_price, is_sold_out, is_best_seller, is_pre_sale
`;

async function getCategoryTiles(): Promise<CategoryTile[]> {
  const db = createServiceClient();
  const { data } = await db
    .from("categories")
    .select("id, name, slug, image_url, sort_order")
    .order("sort_order")
    .order("name");

  // Primero las categorías con imagen asignada (en su orden); si faltan para
  // completar las 4, se rellenan con las demás.
  const all = (data ?? []) as any[];
  const picked = [
    ...all.filter((c) => c.image_url),
    ...all.filter((c) => !c.image_url),
  ].slice(0, 4);

  // Una sola consulta para las que no tienen imagen propia (evita N+1)
  const missing = picked.filter((c) => !c.image_url).map((c) => c.id);
  const fallback = new Map<string, string>();
  if (missing.length > 0) {
    const { data: rows } = await db
      .from("product_categories")
      .select("category_id, products!inner(images, status)")
      .in("category_id", missing)
      .eq("products.status", "active")
      .limit(200);
    for (const r of (rows ?? []) as any[]) {
      const img = r.products?.images?.[0];
      if (img && !fallback.has(r.category_id)) fallback.set(r.category_id, img);
    }
  }

  return picked.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    image: c.image_url ?? fallback.get(c.id) ?? null,
  }));
}

async function getRecommended(): Promise<Product[]> {
  const db = createServiceClient();
  const { data } = await db
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("status", "active")
    .eq("is_best_seller", true)
    .order("created_at", { ascending: false })
    .limit(4);
  if (data && data.length > 0) return data as Product[];

  const { data: latest } = await db
    .from("products")
    .select(PRODUCT_FIELDS)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(4);
  return (latest ?? []) as Product[];
}

async function getHeroSlides(): Promise<HeroSlide[]> {
  const db = createServiceClient();
  const { data } = await db
    .from("hero_slides")
    .select("id, image_url, alt_text")
    .eq("is_active", true)
    .order("sort_order");
  return (data ?? []) as HeroSlide[];
}

async function getFeaturedSection(): Promise<FeaturedSection> {
  const db = createServiceClient();

  const { data: collection } = await db
    .from("collections")
    .select("id, name, slug, description")
    .eq("featured_on_home", true)
    .eq("is_active", true)
    .single();

  if (collection) {
    const { data: rows } = await db
      .from("product_collections")
      .select(`
        products (
          id, name, slug, base_price, compare_price, images,
          is_on_sale, effective_price, is_sold_out, is_pre_sale, status
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

  const { data } = await db
    .from("products")
    .select(`
      id, name, slug, base_price, compare_price, images,
      is_on_sale, effective_price, is_sold_out, is_pre_sale
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
  const [featured, heroSlides, categories, recommended] = await Promise.all([
    getFeaturedSection(),
    getHeroSlides(),
    getCategoryTiles(),
    getRecommended(),
  ]);

  const hasSlides = heroSlides.length > 0;

  return (
    <>
      {/* ── HERO ───────────────────────────────────────────────── */}
      <section
        className={`relative -mt-20 min-h-[92vh] flex items-center justify-center overflow-hidden ${
          hasSlides ? "bg-[#252525]" : "bg-[#FFFFFF]"
        }`}
      >
        {hasSlides ? (
          <HeroSlider slides={heroSlides} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#FFFFFF] via-[#ECD6D1]/20 to-[#E3CFCA]/30" />
        )}

        <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
          <span
            className={`inline-block text-[10px] tracking-[0.3em] uppercase mb-6 font-[500] ${
              hasSlides ? "text-white/90" : "text-[#B5888A]"
            }`}
            style={hasSlides ? { textShadow: "0 1px 8px rgba(0,0,0,0.9), 0 2px 20px rgba(0,0,0,0.6)" } : undefined}
          >
            Nueva colección
          </span>

          <h1
            className="text-5xl sm:text-6xl md:text-7xl mb-4 leading-[1.05]"
            style={{
              fontFamily: "'Playfair Display', serif",
              color: hasSlides ? "#ffffff" : "#252525",
            }}
          >
            Mar Boutique
          </h1>

          <p
            className={`text-base mb-10 leading-relaxed font-[300] ${
              hasSlides ? "text-white/90" : "text-[#7B7B7B]"
            }`}
            style={hasSlides ? { textShadow: "0 1px 6px rgba(0,0,0,0.9), 0 2px 20px rgba(0,0,0,0.6)" } : undefined}
          >
            Mujeres que visten con intención
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/catalogo"
              className={`inline-flex items-center gap-2 px-8 py-3 text-[11px] tracking-[0.2em] uppercase font-[500] transition-colors rounded-none ${
                hasSlides
                  ? "bg-white text-[#252525] hover:bg-[#FFFFFF]"
                  : "bg-[#252525] text-[#FFFFFF] hover:bg-[#444444]"
              }`}
            >
              Ver catálogo <ArrowRight size={14} />
            </Link>
            <Link
              href="/colecciones"
              className={`inline-flex items-center gap-2 px-8 py-3 text-[11px] tracking-[0.2em] uppercase font-[500] transition-colors rounded-none ${
                hasSlides
                  ? "border border-white text-white hover:bg-white hover:text-[#252525]"
                  : "border border-[#252525] text-[#252525] hover:bg-[#252525] hover:text-[#FFFFFF]"
              }`}
            >
              Colecciones
            </Link>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ────────────────────────────────────────────── */}
      <MarqueeStrip />

      {/* ── CATEGORÍAS ─────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="w-full px-4 sm:px-6 lg:px-8 py-24 bg-white">
          <ScrollReveal variant="fadeUp" className="mb-12 text-center">
            <span className="text-[10px] tracking-[0.25em] uppercase text-[#B5888A] font-[500]">
              Explora
            </span>
            <h2
              className="text-4xl sm:text-5xl text-[#252525] mt-1"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Categorías
            </h2>
          </ScrollReveal>

          <StaggeredGrid className="grid grid-cols-2 md:grid-cols-4 gap-1" itemDelay={100}>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/catalogo?categoria=${c.slug}`}
                className="group relative block aspect-[3/4] overflow-hidden bg-[#ECD6D1]/30"
              >
                {c.image && (
                  <Image
                    src={c.image}
                    alt={c.name}
                    fill
                    sizes="(min-width: 768px) 25vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors" />
                <span
                  className="absolute inset-0 flex items-center justify-center px-3 text-center text-xl sm:text-2xl tracking-[0.12em] uppercase text-white"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {c.name}
                </span>
              </Link>
            ))}
          </StaggeredGrid>
        </section>
      )}

      {/* ── CATÁLOGO + ASESORÍA ────────────────────────────────── */}
      <section className="w-full px-6 sm:px-10 lg:px-16 py-20 bg-[#ECD6D1]">
        <ScrollReveal variant="fadeUp" className="max-w-5xl mx-auto grid gap-px md:grid-cols-2 bg-[#252525]/10">
          <div className="bg-[#ECD6D1] text-center px-6 py-10 md:py-14 md:pr-12">
            <span className="text-[10px] tracking-[0.25em] uppercase text-[#252525]/70 font-[500]">
              Explora
            </span>
            <h3
              className="text-3xl sm:text-4xl text-[#252525] mt-2 mb-3"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Visita nuestro catálogo
            </h3>
            <p className="text-sm text-[#252525]/75 leading-relaxed font-[300] max-w-sm mx-auto mb-7">
              Todas nuestras prendas en un solo lugar: filtra por talla, color y categoría.
            </p>
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-2 px-8 py-3 bg-[#252525] text-white text-[11px] tracking-[0.2em] uppercase font-[500] hover:bg-[#444444] transition-colors"
            >
              Ver catálogo <ArrowRight size={14} />
            </Link>
          </div>

          <div className="bg-[#ECD6D1] text-center px-6 py-10 md:py-14 md:pl-12">
            <span className="text-[10px] tracking-[0.25em] uppercase text-[#252525]/70 font-[500]">
              Asesoría personalizada
            </span>
            <h3
              className="text-3xl sm:text-4xl text-[#252525] mt-2 mb-3"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              ¿No sabes qué elegir?
            </h3>
            <p className="text-sm text-[#252525]/75 leading-relaxed font-[300] max-w-sm mx-auto mb-7">
              Escríbenos por WhatsApp y te ayudamos a encontrar la prenda y la talla ideal para ti.
            </p>
            <a
              href={WHATSAPP_ADVISORY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 border border-[#252525] text-[#252525] text-[11px] tracking-[0.2em] uppercase font-[500] hover:bg-[#252525] hover:text-white transition-colors"
            >
              Hablar por WhatsApp <ArrowRight size={14} />
            </a>
          </div>
        </ScrollReveal>
      </section>

      {/* ── COLECCIÓN DESTACADA ────────────────────────────────── */}
      <section className="w-full px-8 sm:px-16 lg:px-28 py-24 bg-white">
        <div className="w-full">
        <ScrollReveal variant="fadeUp" className="mb-12 text-center">
          <div>
            <span className="text-[10px] tracking-[0.25em] uppercase text-[#B5888A] font-[500]">
              Nueva colección
            </span>
            <h2
              className="text-4xl sm:text-5xl text-[#252525] mt-1"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {featured.collectionName}
            </h2>
            {featured.collectionDesc && (
              <p className="text-sm text-[#7B7B7B] leading-relaxed font-[300] mt-2 max-w-md mx-auto">
                {featured.collectionDesc}
              </p>
            )}
          </div>
        </ScrollReveal>

        {featured.products.length > 0 ? (
          <StaggeredGrid
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            itemDelay={100}
          >
            {featured.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </StaggeredGrid>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-[#ECD6D1]/30 animate-pulse" />
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Link
            href={featured.collectionSlug ? `/coleccion/${featured.collectionSlug}` : "/catalogo"}
            className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.15em] uppercase text-[#7B7B7B] hover:text-[#252525] transition-colors font-[500]"
          >
            Ver todo <ArrowRight size={12} />
          </Link>
        </div>
        </div>
      </section>

      {/* ── RECOMENDADOS ───────────────────────────────────────── */}
      {recommended.length > 0 && (
        <section className="w-full px-4 sm:px-6 lg:px-8 py-24 bg-white">
          <ScrollReveal variant="fadeUp" className="mb-12 text-center">
            <span className="text-[10px] tracking-[0.25em] uppercase text-[#B5888A] font-[500]">
              Lo más amado
            </span>
            <h2
              className="text-4xl sm:text-5xl text-[#252525] mt-1"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Recomendados
            </h2>
          </ScrollReveal>

          <StaggeredGrid className="grid grid-cols-2 md:grid-cols-4 gap-4" itemDelay={100}>
            {recommended.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </StaggeredGrid>

          <div className="text-center mt-10">
            <Link
              href="/best-sellers"
              className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.15em] uppercase text-[#7B7B7B] hover:text-[#252525] transition-colors font-[500]"
            >
              Ver todo <ArrowRight size={12} />
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
