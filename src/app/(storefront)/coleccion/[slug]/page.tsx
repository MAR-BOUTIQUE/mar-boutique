import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/storefront/ProductCard";
import type { Product } from "@/types";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("collections")
    .select("name, description")
    .eq("slug", slug)
    .single();
  if (!data) return { title: "Colección no encontrada" };
  return {
    title: data.name,
    description: data.description ?? `Explora la colección ${data.name} de Mar Boutique`,
  };
}

export default async function ColeccionPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: collection } = await supabase
    .from("collections")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!collection) notFound();

  const { data: productLinks } = await supabase
    .from("product_collections")
    .select(`
      sort_order,
      products:product_id (
        *,
        variants:product_variants(*)
      )
    `)
    .eq("collection_id", collection.id)
    .order("sort_order", { ascending: true });

  const products: Product[] = (productLinks ?? [])
    .map((l: any) => l.products)
    .filter((p: any) => p && p.status === "active");

  return (
    <>
      {/* Hero de colección */}
      <section
        className="relative min-h-[40vh] flex items-end justify-start overflow-hidden"
        style={{
          background: collection.hero_url
            ? `linear-gradient(to top, #252525CC, transparent), url(${collection.hero_url}) center/cover`
            : "linear-gradient(135deg, #ECD6D1 0%, #FFFFFF 50%, #E3CFCA 100%)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-10">
          <span
            className={`text-[10px] tracking-[0.28em] uppercase font-[500] ${
              collection.hero_url ? "text-[#ECD6D1]" : "text-[#B5888A]"
            }`}
          >
            Colección
          </span>
          <h1
            className={`text-5xl mt-1 ${
              collection.hero_url ? "text-white" : "text-[#252525]"
            }`}
            style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
          >
            {collection.name}
          </h1>
          {collection.description && (
            <p
              className={`text-sm mt-2 max-w-md font-[300] ${
                collection.hero_url ? "text-[#FFFFFF]/80" : "text-[#7B7B7B]"
              }`}
            >
              {collection.description}
            </p>
          )}
        </div>
      </section>

      {/* Productos */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm text-[#7B7B7B]">
              Esta colección no tiene productos disponibles aún.
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-[#7B7B7B] mb-6">
              {products.length} {products.length === 1 ? "prenda" : "prendas"}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
