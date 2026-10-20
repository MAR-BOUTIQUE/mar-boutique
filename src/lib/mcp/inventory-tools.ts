// Lógica de las herramientas MCP de inventario.
//
// Sin dependencias de Next ni del SDK de MCP: recibe un cliente de Supabase ya
// creado. Así la usan igual el servidor stdio local (mcp/inventory/stdio.mts) y,
// más adelante, la ruta HTTP para el celular.
//
// Solo lectura. Para ajustar stock se sigue usando el panel admin
// (RPC adjust_variant_stock, que valida motivo y deja auditoría).

import type { SupabaseClient } from "@supabase/supabase-js";

export const LOW_STOCK_DEFAULT = 3; // mismo umbral que InventoryList.tsx

type Db = SupabaseClient;

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  status: string;
}

interface VariantRow {
  id: string;
  product_id: string;
  sku: string;
  price: number | null;
  stock: number;
  reserved: number;
  attributes: Record<string, unknown> | null;
}

interface CostRow {
  product_id: string;
  cost: number;
  updated_at: string;
}

// ── Utilidades ───────────────────────────────────────────────

/** Minúsculas y sin tildes: "Camisón" y "camison" son lo mismo. */
export function norm(s: unknown): string {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const available = (v: Pick<VariantRow, "stock" | "reserved">) =>
  Math.max(0, v.stock - v.reserved);

/** Lee todas las filas paginando (PostgREST corta en 1000 por consulta). */
async function fetchAll<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const PAGE = 1000;
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

async function allProducts(db: Db): Promise<ProductRow[]> {
  return fetchAll<ProductRow>((from, to) =>
    db.from("products").select("id, name, slug, base_price, status").order("name").range(from, to)
  );
}

/** Distancia de edición entre dos palabras (inserciones, borrados y sustituciones). */
function editDistance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/**
 * Todos los términos de la búsqueda deben aparecer en nombre o slug.
 * Si así no sale nada, se reintenta tolerando errores de escritura ("Thalia" -> "Thalita"):
 * un término vale si se parece a alguna palabra del producto (1 letra de diferencia, 2 si es largo).
 */
function matchProducts(products: ProductRow[], query: string): ProductRow[] {
  const terms = norm(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const exact = products.filter((p) => {
    const hay = `${norm(p.name)} ${norm(p.slug)}`;
    return terms.every((t) => hay.includes(t));
  });
  if (exact.length > 0) return exact;

  return products.filter((p) => {
    const words = `${norm(p.name)} ${norm(p.slug)}`.split(/[^a-z0-9]+/).filter(Boolean);
    return terms.every((t) => {
      // Con términos muy cortos la tolerancia daría coincidencias absurdas.
      if (t.length < 4) return words.some((w) => w.includes(t));
      const max = t.length >= 7 ? 2 : 1;
      return words.some((w) => w.includes(t) || editDistance(t, w) <= max);
    });
  });
}

async function variantsOf(db: Db, productIds: string[]): Promise<VariantRow[]> {
  if (productIds.length === 0) return [];
  return fetchAll<VariantRow>((from, to) =>
    db
      .from("product_variants")
      .select("id, product_id, sku, price, stock, reserved, attributes")
      .in("product_id", productIds)
      .order("sku")
      .range(from, to)
  );
}

async function costsOf(db: Db, productIds?: string[]): Promise<Map<string, CostRow>> {
  const rows = await fetchAll<CostRow>((from, to) => {
    let q = db.from("product_costs").select("product_id, cost, updated_at");
    if (productIds) q = q.in("product_id", productIds);
    return q.range(from, to);
  });
  return new Map(rows.map((r) => [r.product_id, r]));
}

/** Los atributos se guardan en español ({"talla","color"}); se aceptan alias en inglés. */
function attr(v: VariantRow, ...keys: string[]): string {
  const a = v.attributes ?? {};
  for (const k of keys) {
    if (a[k] != null) return String(a[k]);
  }
  return "";
}
const sizeOf = (v: VariantRow) => attr(v, "talla", "size");
const colorOf = (v: VariantRow) => attr(v, "color", "colour");

function variantView(v: VariantRow) {
  return {
    sku: v.sku,
    attributes: v.attributes ?? {},
    stock: v.stock,
    reserved: v.reserved,
    available: available(v),
  };
}

const money = (n: number) => Math.round(n * 100) / 100;

// ── Herramientas ─────────────────────────────────────────────

export async function searchProducts(db: Db, query: string) {
  const matches = matchProducts(await allProducts(db), query);
  return {
    count: matches.length,
    products: matches.slice(0, 25).map((p) => ({
      name: p.name,
      slug: p.slug,
      status: p.status,
      base_price: p.base_price,
    })),
  };
}

export async function getVariantStock(
  db: Db,
  input: { product: string; talla?: string; color?: string; includeCost?: boolean }
) {
  const matches = matchProducts(await allProducts(db), input.product);
  if (matches.length === 0) {
    return { found: false as const, message: `No encontré productos que coincidan con "${input.product}".` };
  }

  const ids = matches.map((p) => p.id);
  const [variants, costs] = await Promise.all([
    variantsOf(db, ids),
    input.includeCost ? costsOf(db, ids) : Promise.resolve(new Map<string, CostRow>()),
  ]);

  const wantSize = input.talla ? norm(input.talla) : null;
  const wantColor = input.color ? norm(input.color) : null;

  const products = matches.map((p) => {
    const all = variants.filter((v) => v.product_id === p.id);
    const filtered = all.filter(
      (v) =>
        (wantSize === null || norm(sizeOf(v)) === wantSize) &&
        (wantColor === null || norm(colorOf(v)) === wantColor)
    );
    const cost = costs.get(p.id)?.cost;

    return {
      name: p.name,
      slug: p.slug,
      status: p.status,
      // Para ayudar a corregir un filtro que no encontró nada.
      available_sizes: [...new Set(all.map(sizeOf).filter(Boolean))],
      available_colors: [...new Set(all.map(colorOf).filter(Boolean))],
      total_available: filtered.reduce((s, v) => s + available(v), 0),
      variants: filtered.map((v) => ({
        ...variantView(v),
        price: v.price ?? p.base_price,
        ...(input.includeCost
          ? {
              unit_cost: cost ?? null,
              stock_value: cost != null ? money(cost * v.stock) : null,
              ...(cost == null ? { cost_note: "Costo no cargado" } : {}),
            }
          : {}),
      })),
    };
  });

  // Si hubo filtros y ningún producto tuvo coincidencias, se avisa explícitamente.
  const anyVariant = products.some((p) => p.variants.length > 0);
  return {
    found: true as const,
    filters: { talla: input.talla ?? null, color: input.color ?? null },
    ...(anyVariant ? {} : { message: "El producto existe pero ninguna variante coincide con ese filtro." }),
    products,
  };
}

export async function getProductCost(db: Db, input: { product: string }) {
  const matches = matchProducts(await allProducts(db), input.product);
  if (matches.length === 0) {
    return { found: false as const, message: `No encontré productos que coincidan con "${input.product}".` };
  }

  const ids = matches.map((p) => p.id);
  const [variants, costs] = await Promise.all([variantsOf(db, ids), costsOf(db, ids)]);

  return {
    found: true as const,
    products: matches.map((p) => {
      const c = costs.get(p.id);
      const prices = [
        ...new Set(variants.filter((v) => v.product_id === p.id).map((v) => v.price ?? p.base_price)),
      ];
      const base = {
        name: p.name,
        slug: p.slug,
        base_price: p.base_price,
        sale_prices: prices,
      };
      if (!c) return { ...base, cost: null, message: "Costo no cargado para este producto." };

      // El margen se calcula sobre el precio base; si las variantes tienen otros
      // precios, van en sale_prices.
      const margin = p.base_price - c.cost;
      return {
        ...base,
        cost: c.cost,
        margin: money(margin),
        margin_percent: p.base_price > 0 ? money((margin / p.base_price) * 100) : null,
        cost_updated_at: c.updated_at,
      };
    }),
  };
}

export async function listLowStock(
  db: Db,
  input: { threshold?: number; onlySoldOut?: boolean } = {}
) {
  const threshold = input.threshold ?? LOW_STOCK_DEFAULT;
  const [products, variants] = await Promise.all([
    allProducts(db),
    fetchAll<VariantRow>((from, to) =>
      db
        .from("product_variants")
        .select("id, product_id, sku, price, stock, reserved, attributes")
        .order("sku")
        .range(from, to)
    ),
  ]);
  const byId = new Map(products.map((p) => [p.id, p]));

  const rows = variants
    .filter((v) => (input.onlySoldOut ? available(v) === 0 : available(v) <= threshold))
    .map((v) => ({ product: byId.get(v.product_id)?.name ?? "?", ...variantView(v) }))
    .sort((a, b) => a.available - b.available || a.product.localeCompare(b.product));

  return { threshold, count: rows.length, variants: rows.slice(0, 100), truncated: rows.length > 100 };
}

export async function getInventorySummary(db: Db) {
  const [products, costs, variants] = await Promise.all([
    allProducts(db),
    costsOf(db),
    fetchAll<VariantRow>((from, to) =>
      db
        .from("product_variants")
        .select("id, product_id, sku, price, stock, reserved, attributes")
        .range(from, to)
    ),
  ]);

  let units = 0;
  let valueAtCost = 0;
  const productsWithStockNoCost = new Set<string>();
  for (const v of variants) {
    units += v.stock;
    const c = costs.get(v.product_id);
    if (c) valueAtCost += c.cost * v.stock;
    else if (v.stock > 0) productsWithStockNoCost.add(v.product_id);
  }

  const avail = variants.map(available);
  return {
    products: products.length,
    variants: variants.length,
    units_in_stock: units,
    sold_out_variants: avail.filter((a) => a === 0).length,
    low_stock_variants: avail.filter((a) => a > 0 && a <= LOW_STOCK_DEFAULT).length,
    ok_variants: avail.filter((a) => a > LOW_STOCK_DEFAULT).length,
    stock_value_at_cost: money(valueAtCost),
    // Mientras haya productos sin costo, el valor es parcial.
    value_is_partial: productsWithStockNoCost.size > 0,
    products_with_stock_but_no_cost: productsWithStockNoCost.size,
  };
}
