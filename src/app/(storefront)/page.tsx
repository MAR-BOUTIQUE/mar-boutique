export const dynamic = "force-dynamic";

import Link from "next/link";
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

const BRAND_VALUES = [
  { num: "01", title: "Intencional", desc: "Con propósito detrás de cada costura. Cada prenda nace desde el amor." },
  { num: "02", title: "Versátil", desc: "De los días simples a los momentos especiales. Prendas que se adaptan a tu día a día." },
  { num: "03", title: "Femenina", desc: "Diseños que resaltan tu esencia. Delicadeza, confianza y estilo en cada detalle." },
  { num: "04", title: "Auténtica", desc: "Cada prenda refleja quién quieres ser." },
];

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
  const [featured, heroSlides] = await Promise.all([
    getFeaturedSection(),
    getHeroSlides(),
  ]);

  const hasSlides = heroSlides.length > 0;

  return (
    <>
      {/* ── HERO ───────────────────────────────────────────────── */}
      <section
        className={`relative min-h-[92vh] flex items-center justify-center overflow-hidden ${
          hasSlides ? "bg-[#3D2B1F]" : "bg-[#F3EDE0]"
        }`}
      >
        {hasSlides ? (
          <HeroSlider slides={heroSlides} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#F3EDE0] via-[#EAC9C9]/20 to-[#CEC3AB]/30" />
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
              fontStyle: "italic",
              color: hasSlides ? "#ffffff" : "#3D2B1F",
              ...(hasSlides && {
                textShadow:
                  "0 1px 3px rgba(0,0,0,0.95), 0 3px 20px rgba(0,0,0,0.75), 0 6px 50px rgba(0,0,0,0.5)",
              }),
            }}
          >
            Mar Boutique
          </h1>

          <p
            className={`text-base mb-10 leading-relaxed font-[300] ${
              hasSlides ? "text-white/90" : "text-[#897568]"
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
                  ? "bg-white text-[#3D2B1F] hover:bg-[#F3EDE0]"
                  : "bg-[#3D2B1F] text-[#F3EDE0] hover:bg-[#5A3E2E]"
              }`}
            >
              Ver catálogo <ArrowRight size={14} />
            </Link>
            <Link
              href="/colecciones"
              className={`inline-flex items-center gap-2 px-8 py-3 text-[11px] tracking-[0.2em] uppercase font-[500] transition-colors rounded-none ${
                hasSlides
                  ? "border border-white text-white hover:bg-white hover:text-[#3D2B1F]"
                  : "border border-[#3D2B1F] text-[#3D2B1F] hover:bg-[#3D2B1F] hover:text-[#F3EDE0]"
              }`}
            >
              Colecciones
            </Link>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ────────────────────────────────────────────── */}
      <MarqueeStrip />

      {/* ── VALORES DE MARCA ───────────────────────────────────── */}
      <section className="bg-[#F3EDE0] border-b border-[#DDD5C4] py-16 overflow-hidden">
        <StaggeredGrid
          className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          itemDelay={120}
        >
          {BRAND_VALUES.map((v) => (
            <div key={v.title}>
              <h3
                className="text-lg text-[#3D2B1F] mb-2"
                style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
              >
                {v.title}
              </h3>
              <p className="text-xs text-[#897568] leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </StaggeredGrid>
      </section>

      {/* ── COLECCIÓN DESTACADA ────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <ScrollReveal variant="fadeUp" className="flex items-end justify-between mb-12">
          <div>
            <span className="text-[10px] tracking-[0.25em] uppercase text-[#B5888A] font-[500]">
              Nueva colección
            </span>
            <h2
              className="text-4xl sm:text-5xl text-[#3D2B1F] mt-1"
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

      {/* ── MARQUEE CLARO ──────────────────────────────────────── */}
      <MarqueeStrip inverted />

      {/* ── BANNER NOSOTRAS ────────────────────────────────────── */}
      <section className="relative bg-[#3D2B1F] py-28 overflow-hidden">
        {/* Texto decorativo de fondo */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-[18vw] font-[700] text-white/[0.03] leading-none select-none"
          style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
        >
          Mar
        </span>

        <ScrollReveal variant="fadeUp" className="relative z-10 max-w-2xl mx-auto text-center px-4">
          <span className="text-[10px] tracking-[0.35em] uppercase text-[#B5888A] font-[500]">
            Nuestra historia
          </span>
          <h2
            className="text-5xl sm:text-6xl mt-3 mb-6 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", color: "#ffffff" }}
          >
            Nosotras
          </h2>
          <p className="text-sm text-[#CEC3AB] font-[300] leading-relaxed mb-8 max-w-sm mx-auto">
            Una marca nacida en Cartagena, con el alma del mar y el propósito de vestir mujeres que brillan.
          </p>
          <Link
            href="/nosotras"
            className="inline-flex items-center gap-2 px-8 py-3 border border-[#EAC9C9]/60 text-[#EAC9C9] text-[11px] tracking-[0.2em] uppercase font-[500] hover:bg-[#EAC9C9] hover:text-[#3D2B1F] transition-colors"
          >
            Conocernos <ArrowRight size={12} />
          </Link>
        </ScrollReveal>
      </section>

      {/* ── CTA WISHLIST ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <ScrollReveal variant="scale" duration={800}>
          <span className="block text-[10px] tracking-[0.3em] uppercase text-[#B5888A] font-[500] mb-4">
            Tu lista de deseos
          </span>
          <h2
            className="text-4xl sm:text-5xl text-[#3D2B1F] mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Guarda tus favoritos
          </h2>
          <p className="text-sm text-[#897568] mb-10 font-[300] max-w-sm mx-auto leading-relaxed">
            Añade prendas a tu wishlist y te avisamos cuando baje el precio.
          </p>
          <Link
            href="/cuenta/wishlist"
            className="inline-flex items-center gap-2 px-10 py-3.5 bg-[#3D2B1F] text-[#F3EDE0] text-[11px] tracking-[0.2em] uppercase font-[500] hover:bg-[#5A3E2E] transition-colors"
          >
            Ver wishlist <ArrowRight size={12} />
          </Link>
        </ScrollReveal>
      </section>
    </>
  );
}
