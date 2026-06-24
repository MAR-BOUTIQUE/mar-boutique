import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Colecciones — Mar Boutique",
  description: "Explora todas las colecciones de Mar Boutique. Prendas de playa y moda femenina desde Cartagena.",
};

export default async function ColeccionesPage() {
  const supabase = await createClient();

  const { data: collections } = await supabase
    .from("collections")
    .select("id, name, slug, description, hero_url")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const items = collections ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Encabezado */}
      <div className="text-center mb-14">
        <span className="text-[10px] tracking-[0.3em] uppercase text-[#B5888A] font-[500]">
          Mar Boutique
        </span>
        <h1
          className="text-5xl text-[#3D2B1F] mt-1"
          style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
        >
          Colecciones
        </h1>
        <p className="text-sm text-[#897568] mt-4 max-w-md mx-auto">
          Cada colección es un universo de estilo pensado para la mujer que vive el mar con elegancia.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-24">
          <p
            className="text-2xl text-[#897568]"
            style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
          >
            Próximamente
          </p>
          <p className="text-sm text-[#897568] mt-2">
            Estamos preparando nuestras colecciones. Vuelve pronto.
          </p>
          <Link
            href="/catalogo"
            className="inline-block mt-6 text-[11px] tracking-[0.2em] uppercase font-[500] text-[#3D2B1F] border border-[#3D2B1F] px-8 py-3 hover:bg-[#3D2B1F] hover:text-[#F3EDE0] transition-colors"
          >
            Ver catálogo completo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((col) => (
            <Link
              key={col.id}
              href={`/coleccion/${col.slug}`}
              className="group block relative overflow-hidden"
            >
              {/* Imagen / fondo */}
              <div className="aspect-[3/4] relative overflow-hidden bg-[#EAC9C9]/30">
                {col.hero_url ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${col.hero_url})` }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-end justify-start p-0">
                    {/* Gradiente decorativo cuando no hay imagen */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#EAC9C9]/60 via-[#F3EDE0] to-[#DDD5C4]/60" />
                    <span
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl text-[#3D2B1F]/20 select-none"
                      style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
                    >
                      MB
                    </span>
                  </div>
                )}

                {/* Overlay oscuro al hover */}
                <div className="absolute inset-0 bg-[#3D2B1F]/0 group-hover:bg-[#3D2B1F]/25 transition-colors duration-500" />

                {/* Texto sobre imagen */}
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <div className="translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    <h2
                      className="text-2xl text-white drop-shadow-md leading-tight"
                      style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
                    >
                      {col.name}
                    </h2>
                    {col.description && (
                      <p className="text-xs text-white/80 mt-1 line-clamp-2 drop-shadow opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {col.description}
                      </p>
                    )}
                    <span className="inline-block mt-3 text-[10px] tracking-[0.2em] uppercase text-white/90 font-[500] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Ver colección →
                    </span>
                  </div>
                </div>
              </div>

              {/* Texto debajo (cuando no hay imagen de fondo legible) */}
              {!col.hero_url && (
                <div className="pt-4 pb-2">
                  <h2
                    className="text-xl text-[#3D2B1F]"
                    style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
                  >
                    {col.name}
                  </h2>
                  {col.description && (
                    <p className="text-xs text-[#897568] mt-1 line-clamp-2">{col.description}</p>
                  )}
                  <span className="text-[10px] tracking-[0.2em] uppercase text-[#B5888A] font-[500] mt-2 inline-block">
                    Ver colección →
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* CTA catálogo completo */}
      {items.length > 0 && (
        <div className="text-center mt-16">
          <Link
            href="/catalogo"
            className="inline-block text-[11px] tracking-[0.2em] uppercase font-[500] text-[#897568] border border-[#DDD5C4] px-8 py-3 hover:border-[#3D2B1F] hover:text-[#3D2B1F] transition-colors"
          >
            Ver catálogo completo
          </Link>
        </div>
      )}
    </div>
  );
}
