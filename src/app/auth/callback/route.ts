import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createServiceClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email/templates";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("redirect") ?? "/";

  const redirectTo = new URL(next.startsWith("/") ? next : "/", origin);

  if (!code) {
    return NextResponse.redirect(redirectTo);
  }

  // Capturamos las cookies que Supabase quiere escribir para aplicarlas
  // explícitamente sobre la respuesta redirect — es el único patrón confiable
  // en un Route Handler que retorna NextResponse.redirect()
  const sessionCookies: Array<{ name: string; value: string; options: any }> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Leemos del request original — incluye el code_verifier PKCE del browser
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          sessionCookies.push(...cookiesToSet);
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !user) {
    console.error("[auth/callback] exchangeCodeForSession error:", error?.message);
    const errorUrl = new URL("/auth/login", origin);
    errorUrl.searchParams.set("error", "auth_callback_failed");
    return NextResponse.redirect(errorUrl);
  }

  // Aplicar las cookies de sesión directamente sobre el redirect
  const response = NextResponse.redirect(redirectTo);
  sessionCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  // Crear registro de cliente y enviar bienvenida si es la primera vez
  try {
    const db = createServiceClient();
    const { data: existing } = await db
      .from("customers")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!existing) {
      const meta = user.user_metadata ?? {};
      const fullName = meta.full_name || meta.name || user.email?.split("@")[0] || "";

      await db.from("customers").insert({
        auth_user_id: user.id,
        email: user.email?.toLowerCase() ?? "",
        full_name: fullName,
        phone: meta.phone ?? null,
        marketing_email: meta.marketing_email ?? false,
        marketing_whatsapp: meta.marketing_whatsapp ?? false,
        is_guest: false,
      });

      sendWelcomeEmail(user.email ?? "", fullName).catch(() => {});
    }
  } catch {
    // No bloquear el login si falla la creación del customer
  }

  return response;
}
