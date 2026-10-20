// Bucle del agente de atención: un turno de conversación.
//
// Independiente del canal: recibe el id de la conversación y el texto de la clienta,
// y devuelve el texto de respuesta. La página de pruebas del admin y, más adelante,
// el webhook de WhatsApp llaman a esta misma función.

import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAgentTools } from "./tools";
import { buildSystemPrompt } from "./prompt";

// Haiku 5.5 alcanza para estas consultas y es el más barato. Si en las pruebas falla
// con casos ambiguos, se sube con AGENT_MODEL (p. ej. claude-sonnet-5-5) sin tocar código.
const MODEL = process.env.AGENT_MODEL || "claude-haiku-5-5";

const MAX_USER_CHARS = 1000; // una clienta no necesita más; acota costo y abuso
const MAX_HISTORY = 30; // mensajes previos que se reenvían al modelo
const MAX_TOOL_ROUNDS = 5; // tope de vueltas modelo<->herramientas por turno
const MAX_OUTPUT_TOKENS = 1024; // respuestas de chat cortas

const FALLBACK_TEXT =
  "Uy, tuve un problema para responderte. Ya aviso a una persona del equipo para que te escriba.";
const HANDOFF_TEXT =
  "Ya pasé tu conversación a una persona del equipo. Te escribirá en horario de atención.";

export interface AgentReply {
  text: string;
  /** true si la conversación quedó (o ya estaba) en manos de una persona. */
  handoff: boolean;
  /** URLs públicas de fotos a enviar junto al texto. El canal decide cómo mostrarlas. */
  images: string[];
}

export interface RunAgentOptions {
  siteUrl: string;
  /** Se llama cuando el agente pasa la conversación a una persona (aviso por correo, etc.). */
  onHandoff?: (info: { conversationId: string; reason: string; summary: string | null }) => Promise<void>;
}

let client: Anthropic | null = null;
const anthropic = () => (client ??= new Anthropic()); // toma ANTHROPIC_API_KEY del entorno

export async function runAgent(
  db: SupabaseClient,
  conversationId: string,
  userText: string,
  { siteUrl, onHandoff }: RunAgentOptions
): Promise<AgentReply> {
  const text = userText.trim().slice(0, MAX_USER_CHARS);
  if (!text) return { text: "Hola linda 🌸 ¿En qué te puedo ayudar?", handoff: false, images: [] };

  const { data: conv, error: convErr } = await db
    .from("agent_conversations")
    .select("id, status")
    .eq("id", conversationId)
    .maybeSingle();
  if (convErr || !conv) throw new Error("Conversación no encontrada");

  await saveMessage(db, conversationId, { role: "user", content: text });

  // Una vez en manos de una persona, el agente no vuelve a contestar: evita pisarla.
  if (conv.status === "handoff") {
    await saveMessage(db, conversationId, { role: "assistant", content: HANDOFF_TEXT });
    return { text: HANDOFF_TEXT, handoff: true, images: [] };
  }

  // Historial de la conversación: solo texto de clienta y asistente. Los resultados de
  // herramientas se guardan para auditoría pero no se reenvían (lo relevante ya quedó
  // dicho en la respuesta del asistente).
  const { data: rows, error: histErr } = await db
    .from("agent_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .in("role", ["user", "assistant"])
    .order("created_at", { ascending: false })
    .limit(MAX_HISTORY);
  if (histErr) throw new Error(histErr.message);

  const messages: Anthropic.MessageParam[] = (rows ?? [])
    .reverse()
    .map((r) => ({ role: r.role as "user" | "assistant", content: r.content }));
  // La API exige que el primer mensaje sea de la clienta; el recorte por límite podría dejar uno del asistente.
  while (messages.length && messages[0].role !== "user") messages.shift();

  const images: string[] = [];
  const tools = createAgentTools({
    db,
    conversationId,
    siteUrl,
    onImages: (urls) => {
      for (const u of urls) if (!images.includes(u)) images.push(u);
    },
  });
  const toolDefs: Anthropic.Tool[] = tools.map(({ name, description, input_schema }) => ({
    name,
    description,
    input_schema,
  }));
  const system = buildSystemPrompt({ siteUrl });

  let tokensIn = 0;
  let tokensOut = 0;
  let handoff = false;
  let finalText = "";

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await anthropic().messages.create({
        model: MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        system,
        tools: toolDefs,
        // Chat corto: poco razonamiento basta y baja latencia y costo.
        output_config: { effort: "low" },
        messages,
      });
      tokensIn += response.usage.input_tokens;
      tokensOut += response.usage.output_tokens;

      if (response.stop_reason === "refusal") throw new Error("refusal");

      const textOf = () =>
        response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n")
          .trim();

      if (response.stop_reason !== "tool_use") {
        finalText = textOf();
        break;
      }

      // Se devuelve el contenido completo del asistente y TODOS los resultados en un solo mensaje.
      messages.push({ role: "assistant", content: response.content });
      const results: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type !== "tool_use") continue;
        const tool = tools.find((t) => t.name === block.name);
        let output: unknown;
        let isError = false;
        try {
          if (!tool) throw new Error(`Herramienta desconocida: ${block.name}`);
          output = await tool.run((block.input ?? {}) as Record<string, unknown>);
        } catch (e) {
          isError = true;
          output = { error: e instanceof Error ? e.message : String(e) };
          console.error(`[agent] herramienta ${block.name} falló:`, e);
        }

        if (block.name === "handoff_to_human" && !isError && (output as { ok?: boolean })?.ok) {
          handoff = true;
          const input = (block.input ?? {}) as { reason?: string; summary?: string };
          await onHandoff?.({
            conversationId,
            reason: String(input.reason ?? ""),
            summary: input.summary ? String(input.summary) : null,
          }).catch((e) => console.error("[agent] aviso de traspaso falló:", e));
        }

        const serialized = JSON.stringify(output);
        await saveMessage(db, conversationId, { role: "tool", content: serialized, tool_name: block.name });
        results.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: serialized,
          ...(isError ? { is_error: true } : {}),
        });
      }
      messages.push({ role: "user", content: results });
    }
  } catch (e) {
    console.error("[agent] error en el turno:", e);
    // Si el modelo falló, la clienta no se queda sin respuesta: se pasa a una persona.
    await escalate(db, conversationId, "Error técnico del agente", text, onHandoff);
    await saveMessage(db, conversationId, { role: "assistant", content: FALLBACK_TEXT });
    return { text: FALLBACK_TEXT, handoff: true, images: [] };
  }

  if (!finalText) {
    // Se agotaron las vueltas sin respuesta de texto: mejor una persona que un silencio.
    await escalate(db, conversationId, "El agente no logró responder", text, onHandoff);
    await saveMessage(db, conversationId, { role: "assistant", content: FALLBACK_TEXT });
    return { text: FALLBACK_TEXT, handoff: true, images: [] };
  }

  await saveMessage(db, conversationId, {
    role: "assistant",
    content: finalText,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
  });
  await db
    .from("agent_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return { text: finalText, handoff, images };
}

async function saveMessage(
  db: SupabaseClient,
  conversationId: string,
  m: { role: "user" | "assistant" | "tool"; content: string; tool_name?: string; tokens_in?: number; tokens_out?: number }
) {
  const { error } = await db.from("agent_messages").insert({ conversation_id: conversationId, ...m });
  if (error) console.error("[agent] no se pudo guardar el mensaje:", error.message);
}

async function escalate(
  db: SupabaseClient,
  conversationId: string,
  reason: string,
  lastUserText: string,
  onHandoff: RunAgentOptions["onHandoff"]
) {
  await Promise.all([
    db.from("agent_handoffs").insert({ conversation_id: conversationId, reason, summary: `Último mensaje: ${lastUserText}` }),
    db
      .from("agent_conversations")
      .update({ status: "handoff", updated_at: new Date().toISOString() })
      .eq("id", conversationId),
  ]);
  await onHandoff?.({ conversationId, reason, summary: `Último mensaje: ${lastUserText}` }).catch(() => {});
}
