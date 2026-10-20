// Servidor MCP de inventario (transporte stdio, para uso local).
// Se lanza con mcp/run.sh. Solo lectura.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  getInventorySummary,
  getProductCost,
  getVariantStock,
  listLowStock,
  LOW_STOCK_DEFAULT,
  searchProducts,
} from "../../src/lib/mcp/inventory-tools";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  // stdout es el canal del protocolo: los logs van a stderr.
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY (revisa .env.local).");
  process.exit(1);
}

const db = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Las tools devuelven JSON; estas instrucciones le dicen a Claude cómo presentarlo.
const INSTRUCTIONS = `
Eres el asistente de inventario de una boutique. Responde siempre en español, breve y fácil de escanear.

Formato de las respuestas:
- Stock de un producto: título con el nombre en negrita y una tabla markdown con columnas
  Talla | Color | Disponible | Stock | Reservado | SKU. Termina con una línea de total disponible.
- Marca el estado con emoji en la columna Disponible: 🔴 0 (agotado), 🟡 1-3 (bajo), 🟢 más de 3.
- Si solo preguntan por una talla/color concreta, responde en una frase directa
  ("Quedan **4** disponibles de Vestido Lino, talla M, azul (5 en stock, 1 reservado)") sin tabla.
- Costos y dinero: formatea como $1.234.567 (pesos colombianos, punto de miles). Muestra costo, precio
  y margen en una tabla pequeña. Nunca inventes un costo: si dice "no cargado", dilo tal cual.
- Si value_is_partial es true, aclara que el valor total es parcial y cuántos productos no tienen costo.
- Si varios productos coinciden con la búsqueda, lista los nombres y pregunta cuál quieren en vez de adivinar.
- Si un filtro no encuentra variantes, sugiere las tallas y colores disponibles (available_sizes / available_colors).
- No muestres el JSON crudo ni IDs internos.
`.trim();

const server = new McpServer(
  { name: "mar-boutique-inventory", version: "0.1.0" },
  { instructions: INSTRUCTIONS }
);

/** Envuelve el resultado como texto JSON y convierte excepciones en error legible. */
async function respond(run: () => Promise<unknown>) {
  try {
    return { content: [{ type: "text" as const, text: JSON.stringify(await run(), null, 2) }] };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { isError: true, content: [{ type: "text" as const, text: `Error: ${msg}` }] };
  }
}

const readOnly = { readOnlyHint: true, openWorldHint: false };

server.registerTool(
  "get_variant_stock",
  {
    title: "Stock por producto, talla y color",
    description:
      "Cantidad en inventario de un producto, opcionalmente filtrada por talla y/o color. " +
      "'available' = stock - reservado. Con include_cost=true agrega costo unitario y valor del stock.",
    inputSchema: {
      product: z.string().min(1).describe("Nombre o slug del producto (sin importar tildes ni mayúsculas)"),
      talla: z.string().optional().describe("Talla exacta, ej. 'M' (alias: size)"),
      color: z.string().optional().describe("Color exacto, ej. 'azul'"),
      include_cost: z.boolean().optional().describe("Incluir costo y valor del stock (dato sensible)"),
    },
    annotations: readOnly,
  },
  ({ product, talla, color, include_cost }) =>
    respond(() => getVariantStock(db, { product, talla, color, includeCost: include_cost }))
);

server.registerTool(
  "get_product_cost",
  {
    title: "Costo de un producto",
    description:
      "Costo al por mayor, precio de venta y margen de un producto. " +
      "Si no hay costo cargado lo indica en vez de devolver 0.",
    inputSchema: {
      product: z.string().min(1).describe("Nombre o slug del producto"),
    },
    annotations: readOnly,
  },
  ({ product }) => respond(() => getProductCost(db, { product }))
);

server.registerTool(
  "search_products",
  {
    title: "Buscar productos",
    description: "Lista productos cuyo nombre o slug coincide con la búsqueda. Útil para desambiguar.",
    inputSchema: { query: z.string().min(1).describe("Texto a buscar") },
    annotations: readOnly,
  },
  ({ query }) => respond(() => searchProducts(db, query))
);

server.registerTool(
  "list_low_stock",
  {
    title: "Variantes con poco stock",
    description: `Variantes con disponible <= umbral (por defecto ${LOW_STOCK_DEFAULT}), de menos a más.`,
    inputSchema: {
      threshold: z.number().int().min(0).optional().describe("Umbral de disponible"),
      only_sold_out: z.boolean().optional().describe("Solo agotadas (disponible = 0)"),
    },
    annotations: readOnly,
  },
  ({ threshold, only_sold_out }) =>
    respond(() => listLowStock(db, { threshold, onlySoldOut: only_sold_out }))
);

server.registerTool(
  "get_inventory_summary",
  {
    title: "Resumen del inventario",
    description:
      "Totales: productos, variantes, unidades, agotadas, bajo stock y valor del stock a costo " +
      "(marca si el valor es parcial por productos sin costo).",
    inputSchema: {},
    annotations: readOnly,
  },
  () => respond(() => getInventorySummary(db))
);

await server.connect(new StdioServerTransport());
console.error("mar-boutique-inventory listo (stdio)");
