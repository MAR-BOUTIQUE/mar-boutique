import { createServiceClient } from "@/lib/supabase/server";
import { formatDateShort } from "@/lib/utils/format";

export default async function AdminClientesPage() {
  const supabase = createServiceClient();

  const { data: customers } = await supabase
    .from("customers")
    .select("id, full_name, email, phone, is_guest, marketing_email, created_at")
    .order("created_at", { ascending: false })
    .limit(300);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-3xl text-[#3D2B1F]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Clientes
          </h1>
          <p className="text-sm text-[#897568] mt-1">
            {customers?.length ?? 0} registradas (incluyendo invitadas)
          </p>
        </div>
        <a
          href="/api/admin/customers/export"
          className="text-[11px] tracking-[0.15em] uppercase border border-[#DDD5C4] text-[#897568] px-4 py-2 hover:border-[#897568] hover:text-[#3D2B1F] transition-colors font-[500]"
        >
          Exportar CSV
        </a>
      </div>

      <div className="bg-white border border-[#DDD5C4] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#DDD5C4]">
              {["Nombre", "Email", "Teléfono", "Tipo", "Marketing", "Fecha"].map((h) => (
                <th key={h} className="text-left text-[9px] tracking-[0.2em] uppercase text-[#897568] font-[600] px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(customers ?? []).map((c) => (
              <tr key={c.id} className="border-b border-[#F3EDE0] hover:bg-[#F3EDE0]/50 transition-colors">
                <td className="px-4 py-3 font-[400] text-[#3D2B1F]">{c.full_name}</td>
                <td className="px-4 py-3 text-[#897568]">{c.email}</td>
                <td className="px-4 py-3 text-[#897568]">{c.phone ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-[600] tracking-wide uppercase ${c.is_guest ? "bg-[#F3EDE0] text-[#897568]" : "bg-[#EAC9C9] text-[#3D2B1F]"}`}>
                    {c.is_guest ? "Invitada" : "Registrada"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {c.marketing_email ? "✓" : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-[#897568] whitespace-nowrap">
                  {formatDateShort(c.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
