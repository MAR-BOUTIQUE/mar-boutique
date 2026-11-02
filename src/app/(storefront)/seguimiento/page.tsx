import type { Metadata } from "next";
import Link from "next/link";
import { Search, Package, MapPin, Truck, CheckCircle, XCircle, Clock } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { formatCOP, formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Seguimiento de pedido" };

const STATUS_STEPS = [
  { key: "pending_payment", label: "Pendiente de pago", icon: Clock },
  { key: "paid", label: "Pago confirmado", icon: CheckCircle },
  { key: "preparing", label: "En preparación", icon: Package },
  { key: "shipped", label: "En camino", icon: Truck },
  { key: "delivered", label: "Entregado", icon: CheckCircle },
];

const STATUS_ORDER = ["pending_payment", "paid", "preparing", "shipped", "delivered"];

function getStepIndex(status: string) {
  return STATUS_ORDER.indexOf(status);
}

interface Props {
  searchParams: Promise<{ orden?: string; email?: string }>;
}

export default async function SeguimientoPage({ searchParams }: Props) {
  const { orden, email } = await searchParams;

  let order: any = null;
  let error: string | null = null;

  if (orden && email) {
    // Service client para que guests y clientes registrados puedan consultar
    const db = createServiceClient();
    const { data, error: err } = await db
      .from("orders")
      .select(`*, order_items (id, product_name, variant_attrs, quantity, total_price)`)
      .eq("order_number", orden.toUpperCase())
      .ilike("shipping_email", email.trim())
      .single();

    if (err || !data) {
      error = "No encontramos un pedido con ese número y correo. Verifica los datos.";
    } else {
      order = data;
    }
  }

  const isCancelled = order?.status === "cancelled";
  const currentStep = order ? getStepIndex(order.status) : -1;

  return (
    <div className="min-h-screen bg-[#FFFFFF]">
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-[10px] tracking-[0.28em] uppercase text-[#B5888A] font-[500]">
            Estado de tu compra
          </span>
          <h1
            className="text-4xl text-[#252525] mt-2"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Seguimiento de pedido
          </h1>
        </div>

        {/* Formulario de búsqueda */}
        <form method="GET" className="bg-white border border-[#EDE3E0] p-6 mb-8">
          <p className="text-[11px] uppercase tracking-[0.15em] font-[600] text-[#252525] mb-4">
            Consultar pedido
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.15em] text-[#7B7B7B] font-[600] mb-1.5">
                Número de pedido
              </label>
              <input
                name="orden"
                defaultValue={orden ?? ""}
                placeholder="MB-WEB001"
                className="w-full border border-[#EDE3E0] bg-white px-3 py-2.5 text-sm text-[#252525] focus:outline-none focus:border-[#7B7B7B] transition-colors placeholder:text-[#E3CFCA] uppercase"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.15em] text-[#7B7B7B] font-[600] mb-1.5">
                Correo electrónico
              </label>
              <input
                name="email"
                type="email"
                defaultValue={email ?? ""}
                placeholder="tu@correo.com"
                className="w-full border border-[#EDE3E0] bg-white px-3 py-2.5 text-sm text-[#252525] focus:outline-none focus:border-[#7B7B7B] transition-colors placeholder:text-[#E3CFCA]"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#252525] text-[#FFFFFF] text-[11px] tracking-[0.2em] uppercase font-[500] hover:bg-[#B5888A] transition-colors"
            >
              <Search size={14} /> Buscar pedido
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-white border border-[#ECD6D1] p-4 mb-6 flex items-start gap-3">
            <XCircle size={18} className="text-[#B5888A] shrink-0 mt-0.5" />
            <p className="text-sm text-[#7B7B7B]">{error}</p>
          </div>
        )}

        {/* Resultado */}
        {order && (
          <div className="space-y-5">
            {/* Cabecera del pedido */}
            <div className="bg-white border border-[#EDE3E0] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.15em] text-[#B5888A] font-[500]">
                    Pedido
                  </p>
                  <p
                    className="text-2xl text-[#252525] mt-0.5"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {order.order_number}
                  </p>
                  <p className="text-xs text-[#7B7B7B] mt-1">{formatDate(order.created_at)}</p>
                </div>
                <p className="text-xl font-[600] text-[#252525]">{formatCOP(order.total)}</p>
              </div>
            </div>

            {/* Timeline de estado */}
            <div className="bg-white border border-[#EDE3E0] p-5">
              <p className="text-[11px] uppercase tracking-[0.15em] font-[600] text-[#252525] mb-5">
                Estado del pedido
              </p>

              {isCancelled ? (
                <div className="flex items-center gap-3 py-3 text-[#B5888A]">
                  <XCircle size={20} />
                  <div>
                    <p className="text-sm font-[600]">Pedido cancelado</p>
                    <p className="text-xs text-[#7B7B7B] mt-0.5">
                      Este pedido fue cancelado. Si tienes preguntas escríbenos a hola@mar-boutique.com
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-0">
                  {STATUS_STEPS.map((step, idx) => {
                    const done = currentStep >= idx;
                    const active = currentStep === idx;
                    return (
                      <div key={step.key} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              done
                                ? "bg-[#252525] text-[#FFFFFF]"
                                : "bg-[#FFFFFF] text-[#E3CFCA] border border-[#EDE3E0]"
                            }`}
                          >
                            <step.icon size={14} />
                          </div>
                          {idx < STATUS_STEPS.length - 1 && (
                            <div className={`w-px h-6 ${done ? "bg-[#252525]" : "bg-[#EDE3E0]"}`} />
                          )}
                        </div>
                        <div className="pb-4">
                          <p
                            className={`text-sm ${active ? "font-[600]" : "font-[400]"} ${
                              done ? "text-[#252525]" : "text-[#E3CFCA]"
                            }`}
                          >
                            {step.label}
                          </p>
                          {active && step.key === "shipped" && order.tracking_number && (
                            <p className="text-xs text-[#7B7B7B] mt-0.5">
                              Guía: <span className="font-[600] text-[#252525]">{order.tracking_number}</span>
                              {order.courier && ` · ${order.courier}`}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Prendas */}
            <div className="bg-white border border-[#EDE3E0]">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-[#FFFFFF]">
                <Package size={13} className="text-[#B5888A]" />
                <p className="text-[11px] uppercase tracking-[0.15em] font-[600] text-[#252525]">
                  Prendas
                </p>
              </div>
              {order.order_items?.map((item: any) => {
                const attrs = Object.values(item.variant_attrs ?? {}).filter(Boolean).join(" · ");
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-5 py-3.5 border-b border-[#FFFFFF] last:border-0"
                  >
                    <div>
                      <p className="text-sm text-[#252525] font-[500]">{item.product_name}</p>
                      {attrs && <p className="text-[11px] text-[#7B7B7B]">{attrs}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-[600] text-[#252525]">{formatCOP(item.total_price)}</p>
                      <p className="text-[11px] text-[#7B7B7B]">× {item.quantity}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Envío */}
            <div className="bg-white border border-[#EDE3E0]">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-[#FFFFFF]">
                <MapPin size={13} className="text-[#B5888A]" />
                <p className="text-[11px] uppercase tracking-[0.15em] font-[600] text-[#252525]">
                  Dirección de envío
                </p>
              </div>
              <div className="px-5 py-4 text-sm text-[#7B7B7B] space-y-0.5">
                <p className="text-[#252525] font-[500]">{order.shipping_name}</p>
                <p>{order.shipping_address}</p>
                <p>{order.shipping_city}, {order.shipping_department}</p>
              </div>
            </div>

            <p className="text-center text-xs text-[#7B7B7B]">
              ¿Tienes dudas?{" "}
              <Link href="mailto:hola@mar-boutique.com" className="text-[#252525] underline underline-offset-2">
                hola@mar-boutique.com
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
