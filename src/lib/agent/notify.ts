// Aviso por correo cuando el agente pasa una conversación a una persona.
//
// Destinatarios: AGENT_HANDOFF_EMAIL (separados por coma) o, si no está, ADMIN_EMAILS.

import { getResend, FROM, ADMIN_EMAILS, sendEmailsSafe } from "@/lib/email/resend";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");

// El motivo y el resumen salen del texto de la clienta: se escapan antes de ir al HTML.
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function recipients(): string[] {
  const own = (process.env.AGENT_HANDOFF_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  return own.length ? own : ADMIN_EMAILS;
}

export async function sendHandoffEmail(info: {
  conversationId: string;
  reason: string;
  summary: string | null;
}) {
  const to = recipients();
  if (to.length === 0) {
    console.error("[agent] sin destinatarios: define AGENT_HANDOFF_EMAIL o ADMIN_EMAILS");
    return;
  }

  const link = SITE_URL ? `${SITE_URL}/admin/agente?c=${info.conversationId}` : null;
  const html = `
    <div style="font-family:Arial,sans-serif;color:#3D2B1F;max-width:520px">
      <h2 style="font-weight:600">Una clienta necesita atención</h2>
      <p><strong>Motivo:</strong> ${esc(info.reason)}</p>
      ${info.summary ? `<p><strong>Resumen:</strong> ${esc(info.summary)}</p>` : ""}
      ${link ? `<p><a href="${link}">Ver la conversación en el admin</a></p>` : ""}
    </div>`;

  await sendEmailsSafe(
    "agent-handoff",
    getResend().emails.send({ from: FROM, to, subject: "Mar Boutique · Una clienta necesita atención", html })
  );
}
