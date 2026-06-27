import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, ArrowRight, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatCOP, formatDate } from "@/lib/utils/format";
import { PaymentPoller } from "@/components/storefront/PaymentPoller";

interface Props {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ id_wompi?: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pendiente de pago",
  paid: "Pagado ✓",
  preparing: "En preparación",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const STATUS_STEPS = ["paid", "preparing", "shipped", "delivered"];

export default async function ConfirmacionPage({ params }: Props) {
  const { orderId } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", orderId)
    .single();

  if (!order) notFound();

  const currentStep = STATUS_STEPS.indexOf(order.status);
  const isContraentrega = order.payment_method === "contraentrega";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
      {/* Icono de estado */}
      {order.status === "paid" || order.status === "preparing" || order.status === "shipped" || order.status === "delivered" ? (
        <CheckCircle className="mx-auto mb-6 text-[#B5888A]" size={56} strokeWidth={1} />
      ) : (
        <Package className="mx-auto mb-6 text-[#CEC3AB]" size={56} strokeWidth={1} />
      )}

      <h1
        className="text-4xl text-[#3D2B1F] mb-2"
        style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
      >
        {order.status === "paid" ? "¡Pedido confirmado!" : "Tu pedido"}
      </h1>
      <p className="text-[#897568] text-sm mb-2">
        Pedido <span className="font-[600] text-[#3D2B1F]">{order.order_number}</span>
      </p>
      <p className="text-xs text-[#897568] mb-10">
        {formatDate(order.created_at)}
      </p>

      {/* Timeline de estado */}
      <div className="flex justify-center gap-0 mb-10">
        {STATUS_STEPS.map((step, i) => {
          const done = currentStep >= i;
          const active = currentStep === i;
          return (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-3 h-3 rounded-full border-2 transition-colors ${
                    done
                      ? "bg-[#3D2B1F] border-[#3D2B1F]"
                      : "bg-transparent border-[#DDD5C4]"
                  }`}
                />
                <span className={`text-[9px] tracking-wide uppercase whitespace-nowrap ${active ? "text-[#3D2B1F] font-[600]" : done ? "text-[#897568]" : "text-[#CEC3AB]"}`}>
                  {STATUS_LABELS[step]}
                </span>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={`w-12 sm:w-20 h-px mb-5 ${done && currentStep > i ? "bg-[#3D2B1F]" : "bg-[#DDD5C4]"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Detalle del pedido */}
      <div className="bg-[#EAC9C9]/15 border border-[#DDD5C4] p-6 text-left mb-8">
        <h2 className="text-[10px] tracking-[0.25em] uppercase text-[#897568] font-[600] mb-4">
          Detalle del pedido
        </h2>

        <div className="space-y-2 mb-4">
          {(order.items ?? []).map((item: any) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-[#3D2B1F]">
                {item.product_name}{" "}
                <span className="text-[#897568] text-xs">× {item.quantity}</span>
              </span>
              <span className="text-[#3D2B1F] font-[500]">{formatCOP(item.total_price)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-[#DDD5C4] pt-4 flex justify-between font-[600] text-[#3D2B1F]">
          <span>{isContraentrega ? "Total a pagar al recibir" : "Total pagado"}</span>
          <span>{formatCOP(order.total)}</span>
        </div>

        <div className="mt-4 pt-4 border-t border-[#DDD5C4]">
          <p className="text-[10px] tracking-[0.2em] uppercase text-[#897568] font-[600] mb-1">
            Envío a
          </p>
          <p className="text-sm text-[#3D2B1F]">
            {order.shipping_name} · {order.shipping_address}, {order.shipping_city}
          </p>
          <p className="text-xs text-[#897568] mt-0.5">{order.shipping_email}</p>
        </div>

        {order.tracking_number && (
          <div className="mt-4 pt-4 border-t border-[#DDD5C4]">
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#897568] font-[600] mb-1">
              Guía de envío
            </p>
            <p className="text-sm text-[#3D2B1F] font-[500]">{order.tracking_number}</p>
            {order.courier && <p className="text-xs text-[#897568]">{order.courier}</p>}
          </div>
        )}
      </div>

      {/* Aviso contraentrega */}
      {isContraentrega && (
        <div className="flex items-start gap-3 bg-[#F3EDE0] border border-[#CEC3AB] px-5 py-4 text-left mb-6">
          <Truck size={18} className="text-[#897568] shrink-0 mt-0.5" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-[600] text-[#3D2B1F]">Pago contraentrega</p>
            <p className="text-xs text-[#897568] mt-1 leading-relaxed">
              Ten el dinero listo cuando llegue tu domiciliario.
              El valor a pagar es <strong>{formatCOP(order.total)}</strong>.
            </p>
          </div>
        </div>
      )}

      <p className="text-xs text-[#897568] mb-6">
        Te enviamos la confirmación a <strong>{order.shipping_email}</strong>
      </p>

      {/* Polling mientras el webhook de Wompi llega */}
      {order.status === "pending_payment" && order.payment_method === "wompi" && (
        <PaymentPoller orderId={order.id} />
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href={`/seguimiento?orden=${order.order_number}&email=${encodeURIComponent(order.shipping_email)}`}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[#3D2B1F] text-[#3D2B1F] text-[11px] tracking-[0.15em] uppercase font-[500] hover:bg-[#3D2B1F] hover:text-[#F3EDE0] transition-colors"
        >
          Seguir pedido
        </Link>
        <Link
          href="/catalogo"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#3D2B1F] text-[#F3EDE0] text-[11px] tracking-[0.15em] uppercase font-[500] hover:bg-[#5A3E2E] transition-colors"
        >
          Seguir comprando <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
