import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { AgentChat } from "@/components/admin/AgentChat";

interface Props {
  searchParams: Promise<{ c?: string }>;
}

const STATUS_LABEL: Record<string, string> = {
  open: "Abierta",
  handoff: "Con una persona",
  closed: "Cerrada",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function AdminAgentePage({ searchParams }: Props) {
  const { c } = await searchParams;
  const db = createServiceClient();

  const [{ data: conversations }, { data: handoffs }] = await Promise.all([
    db
      .from("agent_conversations")
      .select("id, channel, customer_name, status, updated_at")
      .order("updated_at", { ascending: false })
      .limit(20),
    db
      .from("agent_handoffs")
      .select("id, conversation_id, reason, summary, created_at")
      .is("resolved_at", null)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  // Transcripción de la conversación elegida. Las filas "tool" son el rastro de lo que
  // consultó el agente: sirven para entender por qué respondió lo que respondió.
  const selected = c && UUID_RE.test(c) ? c : null;
  const { data: transcript } = selected
    ? await db
        .from("agent_messages")
        .select("id, role, content, tool_name, created_at")
        .eq("conversation_id", selected)
        .order("created_at")
    : { data: null };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-xl font-[500] text-[#252525]">Agente de atención</h1>
        <p className="text-sm text-[#7B7B7B] mt-1">
          Prueba cómo responde el agente y revisa las conversaciones que pasaron a una persona.
        </p>
      </div>

      <AgentChat />

      {handoffs && handoffs.length > 0 && (
        <section>
          <h2 className="text-[11px] uppercase tracking-[0.15em] font-[600] text-[#252525] mb-3">
            Esperando a una persona ({handoffs.length})
          </h2>
          <div className="bg-white border border-[#EDE3E0] divide-y divide-[#EDE3E0]">
            {handoffs.map((h) => (
              <Link
                key={h.id}
                href={`/admin/agente?c=${h.conversation_id}`}
                className="block px-4 py-3 hover:bg-[#FFFFFF]"
              >
                <p className="text-sm text-[#252525]">{h.reason}</p>
                {h.summary && <p className="text-xs text-[#7B7B7B] mt-0.5 line-clamp-2">{h.summary}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-[11px] uppercase tracking-[0.15em] font-[600] text-[#252525] mb-3">
          Conversaciones recientes
        </h2>
        {!conversations?.length ? (
          <p className="text-sm text-[#7B7B7B]">Todavía no hay conversaciones.</p>
        ) : (
          <div className="bg-white border border-[#EDE3E0] divide-y divide-[#EDE3E0]">
            {conversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/admin/agente?c=${conv.id}`}
                className={`flex items-center justify-between px-4 py-3 hover:bg-[#FFFFFF] ${
                  conv.id === selected ? "bg-[#FFFFFF]" : ""
                }`}
              >
                <span className="text-sm text-[#252525]">
                  {conv.customer_name ?? "Sin nombre"}{" "}
                  <span className="text-xs text-[#7B7B7B]">· {conv.channel}</span>
                </span>
                <span className="text-xs text-[#7B7B7B]">
                  {STATUS_LABEL[conv.status] ?? conv.status} ·{" "}
                  {new Date(conv.updated_at).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {transcript && (
        <section>
          <h2 className="text-[11px] uppercase tracking-[0.15em] font-[600] text-[#252525] mb-3">Transcripción</h2>
          <div className="bg-white border border-[#EDE3E0] p-4 space-y-2 text-sm">
            {transcript.map((m) =>
              m.role === "tool" ? (
                <details key={m.id} className="text-xs text-[#7B7B7B]">
                  <summary className="cursor-pointer">Consulta: {m.tool_name}</summary>
                  <pre className="whitespace-pre-wrap break-words mt-1">{m.content}</pre>
                </details>
              ) : (
                <p key={m.id} className="text-[#252525]">
                  <span className="font-[600]">{m.role === "user" ? "Clienta" : "Agente"}:</span> {m.content}
                </p>
              )
            )}
          </div>
        </section>
      )}
    </div>
  );
}
