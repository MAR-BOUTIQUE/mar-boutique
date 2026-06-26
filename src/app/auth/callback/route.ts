import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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

  // Usar cookies() de next/headers para que las cookies de sesión
  // se incluyan automáticamente en cualquier respuesta del Route Handler
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !user) {
    const errorUrl = new URL("/auth/login", origin);
    errorUrl.searchParams.set("error", "auth_callback_failed");
    return NextResponse.redirect(errorUrl);
  }

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
      const fullName =
        meta.full_name ||
        meta.name ||
        user.email?.split("@")[0] ||
        "";
      const phone = meta.phone ?? null;
      const marketingEmail = meta.marketing_email ?? false;
      const marketingWhatsapp = meta.marketing_whatsapp ?? false;

      await db.from("customers").insert({
        auth_user_id: user.id,
        email: user.email?.toLowerCase() ?? "",
        full_name: fullName,
        phone,
        marketing_email: marketingEmail,
        marketing_whatsapp: marketingWhatsapp,
        is_guest: false,
      });

      sendWelcomeEmail(user.email ?? "", fullName).catch(() => {});
    }
  } catch {
    // No bloquear el login si falla la creación del customer
  }

  return NextResponse.redirect(redirectTo);
}
