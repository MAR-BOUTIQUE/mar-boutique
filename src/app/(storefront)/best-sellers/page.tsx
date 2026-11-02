export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/storefront/ProductCard";
import type { Product } from "@/types";

export const metadata: Metadata = {
  title: "Best Sellers — Mar Boutique",
  description: "Las prendas más amadas por nuestra comunidad. Selección curada por el equipo Mar Boutique.",
};

async function getBestSellers(): Promise<Product[]> {
  const db = createServiceClient();
  const { data } = await db
    .from("products")
    .select(`
      id, name, slug, base_price, compare_price, images,
      is_on_sale, effective_price, is_sold_out, is_best_seller, is_pre_sale
    `)
    .eq("status", "active")
    .eq("is_best_seller", true)
    .order("created_at", { ascending: false });

  return (data ?? []) as Product[];
}

export default async function BestSellersPage() {
  const products = await getBestSellers();

  return (
    <div className="min-h-screen bg-[#FFFFFF]">

      {/* ── HERO ── */}
      <section className="relative py-20 border-b border-[#EDE3E0] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ECD6D1]/20 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={14} className="text-[#B5888A]" strokeWidth={1.5} />
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#B5888A] font-[500]">
                Lo más amado
              </span>
            </div>
            <h1
              className="text-5xl sm:text-6xl text-[#252525] mb-4 leading-[1.08]"
              style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
            >
              Best Sellers
            </h1>
            <p className="text-base text-[#7B7B7B] leading-relaxed font-[300]">
              Las prendas que más eligen nuestras clientas. Una selección curada por el
              equipo Mar Boutique — piezas que hablan por sí solas.
            </p>
          </div>
        </div>
      </section>

      {/* ── GRID ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {products.length > 0 ? (
          <>
            <p className="text-xs text-[#7B7B7B] mb-8 tracking-wide">
              {products.length} {products.length === 1 ? "prenda seleccionada" : "prendas seleccionadas"}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-24">
            <p
              className="text-3xl text-[#E3CFCA] mb-4"
              style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
            >
              Próximamente
            </p>
            <p className="text-sm text-[#7B7B7B] mb-8 font-[300]">
              Estamos preparando nuestra selección de favoritas. Mientras tanto, explora el catálogo completo.
            </p>
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-[#252525] border-b border-[#252525] pb-0.5 hover:border-[#B5888A] hover:text-[#B5888A] transition-colors font-[500]"
            >
              Ver catálogo completo <ArrowRight size={12} />
            </Link>
          </div>
        )}
      </section>

      {/* ── CTA ── */}
      {products.length > 0 && (
        <section className="bg-[#ECD6D1]/25 border-t border-[#EDE3E0] py-16 text-center">
          <span className="text-[10px] tracking-[0.3em] uppercase text-[#B5888A] font-[500]">
            Hay más donde elegir
          </span>
          <p
            className="text-2xl text-[#252525] mt-2 mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Explora todo el catálogo
          </p>
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 px-8 py-3 border border-[#252525] text-[#252525] text-[11px] tracking-[0.2em] uppercase font-[500] hover:bg-[#252525] hover:text-[#FFFFFF] transition-colors"
          >
            Ver todo <ArrowRight size={13} />
          </Link>
        </section>
      )}
    </div>
  );
}
