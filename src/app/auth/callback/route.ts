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
        const meta = user.user_metadata ?? {};
        // Google OAuth puede venir como "name", registro manual como "full_name"
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
    }
  }

  return NextResponse.redirect(new URL(redirect, req.url));
}
