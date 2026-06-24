import { createServiceClient } from "@/lib/supabase/server";
import { formatCOP } from "@/lib/utils/format";
import { TrendingUp, ShoppingBag, Users, Package } from "lucide-react";

async function getReportData() {
  const supabase = createServiceClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

  const [
    allOrders,
    thisMonthOrders,
    lastMonthOrders,
    totalCustomers,
    topProducts,
    recentOrders,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("total, status")
      .in("status", ["paid", "preparing", "shipped", "delivered"]),
    supabase
      .from("orders")
      .select("total")
      .gte("created_at", startOfMonth)
      .in("status", ["paid", "preparing", "shipped", "delivered"]),
    supabase
      .from("orders")
      .select("total")
      .gte("created_at", lastMonthStart)
      .lte("created_at", lastMonthEnd)
      .in("status", ["paid", "preparing", "shipped", "delivered"]),
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase
      .from("order_items")
      .select("product_name, quantity, total_price")
      .order("total_price", { ascending: false })
      .limit(10),
    supabase
      .from("orders")
      .select("id, order_number, shipping_name, total, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const totalRevenue = (allOrders.data ?? []).reduce((s, o) => s + Number(o.total), 0);
  const thisMonthRevenue = (thisMonthOrders.data ?? []).reduce((s, o) => s + Number(o.total), 0);
  const lastMonthRevenue = (lastMonthOrders.data ?? []).reduce((s, o) => s + Number(o.total), 0);
  const growth = lastMonthRevenue > 0
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : null;

  // Aggregate top products by name
  const productMap: Record<string, { qty: number; revenue: number }> = {};
  for (const item of topProducts.data ?? []) {
    if (!productMap[item.product_name]) productMap[item.product_name] = { qty: 0, revenue: 0 };
    productMap[item.product_name].qty += item.quantity;
    productMap[item.product_name].revenue += Number(item.total_price);
  }
  const topProductsList = Object.entries(productMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5);

  return {
    totalRevenue,
    thisMonthRevenue,
    lastMonthRevenue,
    growth,
    totalOrders: allOrders.data?.length ?? 0,
    totalCustomers: totalCustomers.count ?? 0,
    topProductsList,
    recentOrders: recentOrders.data ?? [],
  };
}

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

export default async function AdminReportesPage() {
  const data = await getReportData();

  return (
    <div className="p-6 max-w-5xl space-y-8">
      <h1 className="text-xl font-semibold text-gray-800">Reportes</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: TrendingUp,
            label: "Ingresos totales",
            value: formatCOP(data.totalRevenue),
            sub: null,
            color: "text-green-600",
          },
          {
            icon: TrendingUp,
            label: "Este mes",
            value: formatCOP(data.thisMonthRevenue),
            sub:
              data.growth !== null
                ? `${data.growth >= 0 ? "+" : ""}${data.growth.toFixed(1)}% vs mes anterior`
                : null,
            color: data.growth !== null && data.growth >= 0 ? "text-green-600" : "text-red-500",
          },
          {
            icon: ShoppingBag,
            label: "Pedidos completados",
            value: data.totalOrders.toLocaleString("es-CO"),
            sub: null,
            color: "text-blue-600",
          },
          {
            icon: Users,
            label: "Clientes registrados",
            value: data.totalCustomers.toLocaleString("es-CO"),
            sub: null,
            color: "text-purple-600",
          },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500">{label}</p>
              <Icon size={16} className={color} />
            </div>
            <p className="text-2xl font-semibold text-gray-800">{value}</p>
            {sub && <p className={`text-xs mt-1 ${color}`}>{sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top productos */}
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
            <Package size={15} className="text-gray-400" />
            <p className="text-sm font-[600] text-gray-800">Productos más vendidos</p>
          </div>
          {data.topProductsList.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">Sin datos.</p>
          ) : (
            <div>
              {data.topProductsList.map(([name, stats], i) => (
                <div
                  key={name}
                  className="flex items-center justify-between px-5 py-3 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-[600] text-gray-300 w-5 shrink-0">{i + 1}</span>
                    <p className="text-sm text-gray-700 truncate">{name}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-[600] text-gray-800">{formatCOP(stats.revenue)}</p>
                    <p className="text-xs text-gray-400">{stats.qty} uds</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pedidos recientes */}
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
            <ShoppingBag size={15} className="text-gray-400" />
            <p className="text-sm font-[600] text-gray-800">Pedidos recientes</p>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">Sin pedidos.</p>
          ) : (
            <div>
              {data.recentOrders.map((o: any) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between px-5 py-3 border-b border-gray-50 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-[500] text-gray-800">{o.order_number}</p>
                    <p className="text-xs text-gray-400 truncate">{o.shipping_name}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-[600] text-gray-800">{formatCOP(o.total)}</p>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-[500] ${
                        STATUS_BADGE[o.status] ?? "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
