import { createHash, timingSafeEqual } from "crypto";

// Wompi firma sus eventos así:
//   checksum = SHA-256( valores de signature.properties en orden + timestamp + secreto de eventos )
// Las rutas de signature.properties vienen RELATIVAS a `data` (p. ej. "transaction.id").
// Por tolerancia también se aceptan rutas que empiezan por "data." (relativas a la raíz).

function resolveProperty(event: Record<string, unknown>, path: string): unknown {
  const fromRoot = path.startsWith("data.");
  let value: unknown = fromRoot ? event : event.data;
  for (const part of path.split(".")) {
    if (value === null || typeof value !== "object") return undefined;
    value = (value as Record<string, unknown>)[part];
  }
  return value;
}

export function verifyWompiSignature(event: unknown, secret: string): boolean {
  if (!secret) {
    console.error("[wompi_signature] WOMPI_EVENTS_SECRET no está configurado");
    return false;
  }
  if (event === null || typeof event !== "object") {
    console.error("[wompi_signature] Evento inválido");
    return false;
  }

  const ev = event as Record<string, unknown>;
  const signature = ev.signature as { properties?: unknown; checksum?: unknown } | undefined;
  if (
    !signature ||
    !Array.isArray(signature.properties) ||
    signature.properties.length === 0 ||
    typeof signature.checksum !== "string" ||
    ev.timestamp === undefined ||
    ev.timestamp === null
  ) {
    console.error("[wompi_signature] Evento sin bloque signature o timestamp");
    return false;
  }

  const properties = signature.properties as string[];
  const values = properties.map((prop) => resolveProperty(ev, String(prop)));

  if (values.some((v) => v === undefined || v === null)) {
    console.error("[wompi_signature] Propiedad sin valor en el evento", { properties, values });
    return false;
  }

  const str = [...values.map(String), String(ev.timestamp), secret].join("");
  const expected = Buffer.from(createHash("sha256").update(str).digest("hex"), "utf8");
  const received = Buffer.from(signature.checksum.trim().toLowerCase(), "utf8");

  const valid = expected.length === received.length && timingSafeEqual(expected, received);

  if (!valid) {
    // No se registra el checksum esperado: permitiría falsificar este evento.
    console.error("[wompi_signature] Firma inválida", {
      properties,
      values,
      timestamp: ev.timestamp,
      received: signature.checksum,
    });
  }

  return valid;
}
