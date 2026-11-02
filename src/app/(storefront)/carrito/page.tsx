"use client";

import Link from "next/link";
import Image from "next/image";
import { Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { formatCOP } from "@/lib/utils/format";
import { CountdownTimer } from "@/components/storefront/CountdownTimer";

export default function CarritoPage() {
  const { items, subtotal, discountAmount, shippingCost, total, removeItem, updateQuantity } =
    useCartStore();

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5 text-center px-4">
        <ShoppingBag size={48} strokeWidth={1} className="text-[#E3CFCA]" />
        <h1
          className="text-3xl text-[#252525]"
          style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
        >
          Tu carrito está vacío
        </h1>
        <p className="text-sm text-[#7B7B7B] max-w-xs">
          Explora nuestro catálogo y encuentra tu próxima prenda favorita.
        </p>
        <Link
          href="/catalogo"
          className="inline-flex items-center gap-2 px-8 py-3 bg-[#252525] text-[#FFFFFF] text-[11px] tracking-[0.2em] uppercase font-[500] hover:bg-[#444444] transition-colors"
        >
          Ver catálogo <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-12">
      <h1
        className="text-5xl text-[#252525] mb-10"
        style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
      >
        Tu carrito
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_28rem] xl:grid-cols-[1fr_32rem] gap-12 lg:gap-16">
        {/* ── ITEMS ── */}
        <div className="space-y-0">
          {items.map((item, idx) => (
            <div
              key={item.variantId}
              className={`flex gap-5 sm:gap-8 py-8 ${idx !== 0 ? "border-t border-[#EDE3E0]" : ""}`}
            >
              {/* Imagen */}
              <div className="relative w-28 h-40 sm:w-40 sm:h-56 shrink-0 bg-[#ECD6D1]/20 overflow-hidden">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.productName}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="(min-width: 640px) 160px, 112px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="text-lg text-[#7B7B7B]"
                      style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
                    >
                      MB
                    </span>
                  </div>
                )}
              </div>

              {/* Detalle */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2">
                  <div>
                    <Link
                      href={`/producto/${item.productSlug}`}
                      className="text-lg sm:text-xl text-[#252525] font-[400] hover:text-[#B5888A] transition-colors"
                    >
                      {item.productName}
                    </Link>
                    <p className="text-sm sm:text-base text-[#7B7B7B] mt-1">
                      {Object.entries(item.attributes)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" · ")}
                    </p>
                    {item.reservedUntil && (
                      <CountdownTimer expiresAt={item.reservedUntil} />
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.variantId)}
                    aria-label="Eliminar"
                    className="text-[#E3CFCA] hover:text-[#B5888A] transition-colors shrink-0"
                  >
                    <Trash2 size={20} strokeWidth={1.5} />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-6">
                  {/* Cantidad */}
                  <div className="flex items-center border border-[#EDE3E0]">
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="w-11 h-11 flex items-center justify-center text-lg text-[#7B7B7B] hover:text-[#252525]"
                    >
                      −
                    </button>
                    <span className="w-11 text-center text-base text-[#252525] font-[500]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      className="w-11 h-11 flex items-center justify-center text-lg text-[#7B7B7B] hover:text-[#252525]"
                    >
                      +
                    </button>
                  </div>

                  {/* Precio */}
                  <span className="text-lg sm:text-xl text-[#252525] font-[500]">
                    {formatCOP(item.unitPrice * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── RESUMEN ── */}
        <div className="bg-[#ECD6D1]/15 border border-[#EDE3E0] p-8 h-fit lg:sticky lg:top-28">
          <h2 className="text-sm tracking-[0.25em] uppercase text-[#252525] font-[600] mb-6">
            Resumen del pedido
          </h2>

          <div className="space-y-4 text-base">
            <div className="flex justify-between text-[#252525]">
              <span>Subtotal</span>
              <span>{formatCOP(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-[#B5888A]">
                <span>Descuento</span>
                <span>-{formatCOP(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[#7B7B7B]">
              <span>Envío</span>
              <span>
                {shippingCost > 0 ? formatCOP(shippingCost) : "Se calcula en checkout"}
              </span>
            </div>
            <div className="border-t border-[#EDE3E0] pt-3 flex justify-between font-[500] text-[#252525]">
              <span>Total</span>
              <span>{formatCOP(total)}</span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="mt-6 w-full flex items-center justify-center gap-2 py-4 bg-[#252525] text-[#FFFFFF] text-[11px] tracking-[0.2em] uppercase font-[500] hover:bg-[#444444] transition-colors"
          >
            Proceder al pago <ArrowRight size={14} />
          </Link>

          <Link
            href="/catalogo"
            className="mt-3 w-full flex items-center justify-center text-[10px] tracking-[0.15em] uppercase text-[#7B7B7B] hover:text-[#252525] transition-colors py-2"
          >
            Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  );
}
