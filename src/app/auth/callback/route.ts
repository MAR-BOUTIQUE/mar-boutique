import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { sendWelcomeEmail } from "@/lib/email/templates";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") ?? "/";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code);

    // Crear customer y enviar bienvenida si es la primera vez
    if (user) {
      const db = createServiceClient();
      const { data: existing } = await db
        .from("customers")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (!existing) {
        const fullName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? "";
        const marketing = user.user_metadata?.marketing_email ?? false;

        await db.from("customers").insert({
          auth_user_id: user.id,
          email: user.email?.toLowerCase() ?? "",
          full_name: fullName,
          marketing_email: marketing,
          is_guest: false,
        });

        // Enviar bienvenida (no bloquear el redirect si falla)
        sendWelcomeEmail(user.email ?? "", fullName).catch(() => {});
      }
    }
  }

  return NextResponse.redirect(new URL(redirect, req.url));
}
