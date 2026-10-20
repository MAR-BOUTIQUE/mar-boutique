import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { runAgent } from "@/lib/agent/run";
import { sendHandoffEmail } from "@/lib/agent/notify";

// Una vuelta con herramientas puede tardar varios segundos.
export const maxDuration = 60;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// En esta fase solo el admin puede conversar con el agente (chat de pruebas).
// Cuando se conecte WhatsApp, el canal real entrará por su propio webhook, con su
// propia verificación, y llamará a runAgent directamente.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { conversationId?: unknown; message?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return NextResponse.json({ error: "Escribe un mensaje" }, { status: 400 });

  const db = createServiceClient();

  let conversationId = typeof body.conversationId === "string" ? body.conversationId : "";
  if (conversationId) {
    if (!UUID_RE.test(conversationId)) {
      return NextResponse.json({ error: "Conversación no válida" }, { status: 400 });
    }
  } else {
    const { data, error } = await db
      .from("agent_conversations")
      .insert({ channel: "admin_test", customer_name: "Prueba (admin)" })
      .select("id")
      .single();
    if (error || !data) {
      return NextResponse.json({ error: "No se pudo crear la conversación" }, { status: 500 });
    }
    conversationId = data.id;
  }

  try {
    const reply = await runAgent(db, conversationId, message, {
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      onHandoff: sendHandoffEmail,
    });
    return NextResponse.json({ conversationId, reply: reply.text, handoff: reply.handoff });
  } catch (e) {
    console.error("[api/agent/chat]", e);
    return NextResponse.json({ error: "El agente no pudo responder" }, { status: 500 });
  }
}
