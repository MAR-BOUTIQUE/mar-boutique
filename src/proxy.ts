import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = req.nextUrl;

  // Rutas protegidas del admin — requiere rol 'admin' en app_metadata
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/auth/login";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (user.app_metadata?.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
  }

  // Rutas protegidas de la cuenta de clienta
  if (pathname.startsWith("/cuenta")) {
    if (!user) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/auth/login";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Si ya está autenticada y va a login/registro → redirigir
  if (user && (pathname === "/auth/login" || pathname === "/auth/registro")) {
    const home = req.nextUrl.clone();
    home.pathname = "/";
    return NextResponse.redirect(home);
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/cuenta/:path*", "/auth/login", "/auth/registro"],
};
