// Herramientas del agente de atención al cliente.
//
// Solo lectura, salvo handoff_to_human (que solo registra un aviso).
// REGLA: nada de lo que devuelvan puede incluir costos, márgenes, stock total ni
// unidades reservadas. Por eso NO se registran get_product_cost ni
// get_inventory_summary, y getVariantStock se llama sin includeCost y se filtra
// campo por campo aquí.

import type { SupabaseClient } from "@supabase/supabase-js";
import { getVariantStock, norm, searchProducts } from "@/lib/mcp/inventory-tools";

type Db = SupabaseClient;

export interface AgentToolContext {
  db: Db;
  conversationId: string;
  siteUrl: string;
}

/** Definición en el formato de tool use de la API de Anthropic. */
export interface AgentTool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  run: (input: Record<string, unknown>) => Promise<unknown>;
}

// Estado de un producto a la venta (enum product_status: draft | active | archived).
// Borradores y archivados no se ofrecen a clientas.
const SELLABLE_STATUS = "active";

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

const ORDER_STATUS_ES: Record<string, string> = {
  pending_payment: "Pendiente de pago",
  paid: "Pago confirmado",
  preparing: "En preparación",
  shipped: "En camino",
  delivered: "Entregado",
  cancelled: "Cancelado",
  return_requested: "Devolución solicitada",
  return_in_transit: "Devolución en camino",
  return_received: "Devolución recibida",
  refunded: "Reembolsado",
};

export function createAgentTools({ db, conversationId, siteUrl }: AgentToolContext): AgentTool[] {
  const productUrl = (slug: string) => `${siteUrl.replace(/\/$/, "")}/producto/${slug}`;

  return [
    {
      name: "check_availability",
      description:
        "Consulta si hay una prenda disponible y su precio. Puede filtrar por talla y color. " +
        "Devuelve cuántas unidades se pueden comprar ahora por variante.",
      input_schema: {
        type: "object",
        properties: {
          product: { type: "string", description: "Nombre del producto" },
          talla: { type: "string", description: "Talla, ej. 'M'" },
          color: { type: "string", description: "Color, ej. 'azul'" },
        },
        required: ["product"],
      },
      run: async (input) => {
        const product = str(input.product);
        if (!product) return { error: "Falta el nombre del producto." };

        const res = await getVariantStock(db, {
          product,
          talla: str(input.talla) || undefined,
          color: str(input.color) || undefined,
          includeCost: false,
        });
        if (!res.found) return { found: false, message: res.message };

        // Lista blanca de campos: solo lo que una clienta puede ver.
        return {
          found: true,
          message: res.message,
          products: res.products
            // Solo productos a la venta.
            .filter((p) => p.status === SELLABLE_STATUS)
            .map((p) => ({
              name: p.name,
              url: productUrl(p.slug),
              available_sizes: p.available_sizes,
              available_colors: p.available_colors,
              variants: p.variants.map((v) => ({
                talla: v.attributes.talla ?? v.attributes.size ?? null,
                color: v.attributes.color ?? null,
                available: v.available,
                price: v.price,
              })),
            })),
        };
      },
    },

    {
      name: "search_products",
      description: "Busca productos por nombre cuando no se sabe cuál es el exacto o hay varios parecidos.",
      input_schema: {
        type: "object",
        properties: { query: { type: "string", description: "Texto a buscar" } },
        required: ["query"],
      },
      run: async (input) => {
        const query = str(input.query);
        if (!query) return { error: "Falta el texto a buscar." };
        const res = await searchProducts(db, query);
        return {
          products: res.products
            .filter((p) => p.status === SELLABLE_STATUS)
            .map((p) => ({ name: p.name, url: productUrl(p.slug), price: p.base_price })),
        };
      },
    },

    {
      name: "track_order",
      description:
        "Estado de un pedido. Exige el número de pedido Y el correo con el que se compró; " +
        "sin ambos no se puede consultar.",
      input_schema: {
        type: "object",
        properties: {
          order_number: { type: "string", description: "Número de pedido, ej. ORD-1A2B3C4D" },
          email: { type: "string", description: "Correo usado en la compra" },
        },
        required: ["order_number", "email"],
      },
      run: async (input) => {
        const orderNumber = str(input.order_number).toUpperCase();
        const email = str(input.email).toLowerCase();
        if (!orderNumber || !email) return { error: "Se necesitan el número de pedido y el correo." };

        const { data, error } = await db
          .from("orders")
          .select(
            "order_number, status, shipping_email, shipping_city, tracking_number, courier, " +
              "shipped_at, delivered_at, total, created_at, order_items (product_name, quantity)"
          )
          .eq("order_number", orderNumber)
          .maybeSingle();

        // Mismo mensaje si el pedido no existe o el correo no coincide: así no se
        // confirma a un tercero que un número de pedido existe.
        // Comparación exacta en código (ilike trataría "_" y "%" como comodines).
        const row = data as unknown as {
          order_number: string; status: string; shipping_email: string; shipping_city: string;
          tracking_number: string | null; courier: string | null; shipped_at: string | null;
          delivered_at: string | null; total: number; created_at: string;
          order_items: { product_name: string; quantity: number }[];
        } | null;
        if (error || !row || row.shipping_email.trim().toLowerCase() !== email) {
          return { found: false, message: "No encontré un pedido con ese número y correo." };
        }

        return {
          found: true,
          order_number: row.order_number,
          status: ORDER_STATUS_ES[row.status] ?? row.status,
          city: row.shipping_city,
          items: row.order_items.map((i) => `${i.quantity} x ${i.product_name}`),
          total: row.total,
          courier: row.courier,
          tracking_number: row.tracking_number,
          shipped_at: row.shipped_at,
          delivered_at: row.delivered_at,
        };
      },
    },

    {
      name: "shipping_info",
      description: "Costo y zona de envío para una ciudad o municipio de Colombia.",
      input_schema: {
        type: "object",
        properties: { city: { type: "string", description: "Ciudad o municipio de destino" } },
        required: ["city"],
      },
      run: async (input) => {
        const city = norm(str(input.city));
        if (!city) return { error: "Falta la ciudad." };

        const [{ data: zones, error: e1 }, { data: cities, error: e2 }] = await Promise.all([
          db.from("shipping_zones").select("id, code, name, description, price").order("sort_order"),
          db.from("shipping_zone_cities").select("zone_id, city_name"),
        ]);
        if (e1 || e2 || !zones?.length) return { error: "No pude consultar las tarifas de envío." };

        // Coincidencia exacta normalizada; el resto cae en la zona "municipios",
        // igual que hace el checkout (zona 3 = fallback).
        const hit = (cities ?? []).find((c) => norm(c.city_name) === city);
        const zone =
          zones.find((z) => z.id === hit?.zone_id) ??
          zones.find((z) => z.code === "municipalities") ??
          zones[zones.length - 1];

        return {
          zone: zone.name,
          description: zone.description,
          price: zone.price,
          exact_city_match: Boolean(hit),
        };
      },
    },

    {
      name: "handoff_to_human",
      description:
        "Pasa la conversación a una persona del equipo. Úsala cuando la clienta lo pida, haya un reclamo o " +
        "molestia, sea un tema de pago o devolución, o no puedas resolverlo con las herramientas.",
      input_schema: {
        type: "object",
        properties: {
          reason: { type: "string", description: "Motivo breve del traspaso" },
          summary: { type: "string", description: "Resumen de lo que necesita la clienta, para que la persona no tenga que preguntar de nuevo" },
        },
        required: ["reason"],
      },
      run: async (input) => {
        const reason = str(input.reason);
        if (!reason) return { error: "Falta el motivo." };

        const [h, c] = await Promise.all([
          db.from("agent_handoffs").insert({
            conversation_id: conversationId,
            reason,
            summary: str(input.summary) || null,
          }),
          db
            .from("agent_conversations")
            .update({ status: "handoff", updated_at: new Date().toISOString() })
            .eq("id", conversationId),
        ]);
        if (h.error || c.error) return { error: "No pude registrar el traspaso." };

        // El aviso por correo a las dueñas se agrega en run.ts (paso 4).
        return { ok: true, message: "Traspaso registrado. Una persona del equipo continuará la conversación." };
      },
    },
  ];
}
