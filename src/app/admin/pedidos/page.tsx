import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { formatCOP, formatDateShort } from "@/lib/utils/format";

const STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "pending_payment", label: "Pendiente de pago" },
  { value: "paid", label: "Pagados" },
  { value: "preparing", label: "En preparación" },
  { value: "shipped", label: "Enviados" },
  { value: "delivered", label: "Entregados" },
  { value: "cancelled", label: "Cancelados" },
];

const STATUS_BADGE: Record<string, string> = {
  pending_payment: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  preparing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-[#EAC9C9] text-[#3D2B1F]",
  cancelled: "bg-red-100 text-red-700",
};
const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Pendiente",
  paid: "Pagado",
  preparing: "Preparando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

interface Props {
  searchParams: Promise<{ status?: string; q?: string }>;
}

export default async function AdminPedidosPage({ searchParams }: Props) {
  const { status, q } = await searchParams;
  const supabase = createServiceClient();

  let query = supabase
    .from("orders")
    .select("id, order_number, shipping_name, shipping_email, shipping_city, total, status, created_at, tracking_number")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) query = query.eq("status", status);
  if (q) query = query.ilike("order_number", `%${q}%`);

  const { data: orders } = await query;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-3xl text-[#3D2B1F]"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Pedidos
        </h1>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {STATUS_OPTIONS.map((opt) => (
          <Link
            key={opt.value}
            href={opt.value ? `/admin/pedidos?status=${opt.value}` : "/admin/pedidos"}
            className={`text-[10px] tracking-[0.15em] uppercase px-4 py-2 border font-[500] transition-colors ${
              (status ?? "") === opt.value
                ? "bg-[#3D2B1F] text-[#F3EDE0] border-[#3D2B1F]"
                : "border-[#DDD5C4] text-[#897568] hover:border-[#897568]"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white border border-[#DDD5C4] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#DDD5C4]">
              {["Pedido", "Clienta", "Ciudad", "Total", "Estado", "Fecha", ""].map((h) => (
                <th key={h} className="text-left text-[9px] tracking-[0.2em] uppercase text-[#897568] font-[600] px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(orders ?? []).map((order) => (
              <tr key={order.id} className="border-b border-[#F3EDE0] hover:bg-[#F3EDE0]/50 transition-colors">
                <td className="px-4 py-3 font-[500] text-[#3D2B1F]">{order.order_number}</td>
                <td className="px-4 py-3">
                  <p className="text-[#3D2B1F]">{order.shipping_name}</p>
                  <p className="text-xs text-[#897568]">{order.shipping_email}</p>
                </td>
                <td className="px-4 py-3 text-[#897568]">{order.shipping_city}</td>
                <td className="px-4 py-3 font-[500] text-[#3D2B1F]">{formatCOP(order.total)}</td>
                <td className="px-4 py-3">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-[600] tracking-wide uppercase ${STATUS_BADGE[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#897568] text-xs whitespace-nowrap">
                  {formatDateShort(order.created_at)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/pedidos/${order.id}`}
                    className="text-xs text-[#B5888A] hover:text-[#3D2B1F] font-[500]"
                  >
                    Ver →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!orders?.length && (
          <div className="py-16 text-center text-[#897568] text-sm">
            No hay pedidos con estos filtros.
          </div>
        )}
      </div>
    </div>
  );
}
