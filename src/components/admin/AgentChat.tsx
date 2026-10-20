"use client";

import { useRef, useState } from "react";
import { Send, RotateCcw } from "lucide-react";

interface Msg {
  role: "user" | "assistant";
  text: string;
  images?: string[];
}

export function AgentChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [handoff, setHandoff] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  function reset() {
    setMessages([]);
    setConversationId(null);
    setHandoff(false);
    setError(null);
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError(null);
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");

      setConversationId(data.conversationId);
      setHandoff(Boolean(data.handoff));
      setMessages((m) => [...m, { role: "assistant", text: data.reply, images: data.images ?? [] }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  return (
    <div className="bg-white border border-[#DDD5C4] flex flex-col h-[28rem]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#DDD5C4]">
        <p className="text-[11px] uppercase tracking-[0.15em] font-[600] text-[#3D2B1F]">Chat de prueba</p>
        <button
          onClick={reset}
          className="flex items-center gap-1.5 text-[11px] text-[#897568] hover:text-[#3D2B1F]"
        >
          <RotateCcw size={12} /> Nueva conversación
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-[#897568]">
            Escribe como si fueras una clienta. Prueba: &ldquo;¿Qué precio tiene?&rdquo;, &ldquo;¿Cuánto demora el
            envío a Bogotá?&rdquo; o &ldquo;¿Tienen contraentrega?&rdquo;
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={`max-w-[85%] px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === "user" ? "bg-[#3D2B1F] text-[#F3EDE0]" : "bg-[#F3EDE0] text-[#3D2B1F]"
              }`}
            >
              {m.images && m.images.length > 0 && (
                <div className="flex gap-1.5 mb-2">
                  {m.images.map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={src} src={src} alt="" className="h-28 w-auto object-cover" />
                  ))}
                </div>
              )}
              {m.text}
            </div>
          </div>
        ))}
        {loading && <p className="text-xs text-[#897568]">Escribiendo…</p>}
        {handoff && (
          <p className="text-xs text-[#B5888A]">
            Conversación pasada a una persona: el agente ya no responde en este chat.
          </p>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 p-3 border-t border-[#DDD5C4]">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          maxLength={1000}
          placeholder="Escribe un mensaje"
          className="flex-1 border border-[#DDD5C4] px-3 py-2 text-sm text-[#3D2B1F] outline-none focus:border-[#3D2B1F]"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          aria-label="Enviar"
          className="px-4 bg-[#3D2B1F] text-[#F3EDE0] disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
