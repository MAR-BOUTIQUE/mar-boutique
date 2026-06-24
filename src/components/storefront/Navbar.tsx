"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ShoppingBag, Heart, User, Menu, X, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useCartStore } from "@/lib/store/cart";

const NAV_LINKS = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/colecciones", label: "Colecciones" },
  { href: "/best-sellers", label: "Best Sellers", hot: true },
  { href: "/nosotras", label: "Nosotras" },
];

export function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const itemCount = useCartStore((s) =>
    s.items.reduce((sum, i) => sum + i.quantity, 0)
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[#F3EDE0]/95 backdrop-blur-md shadow-[0_1px_12px_rgba(61,43,31,0.08)]"
          : "bg-[#F3EDE0]"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* NAV LINKS — izquierda */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-[11px] tracking-[0.2em] uppercase font-[500] transition-colors duration-200",
                  pathname === link.href
                    ? "text-[#3D2B1F]"
                    : link.hot
                    ? "text-[#B5888A] hover:text-[#3D2B1F]"
                    : "text-[#897568] hover:text-[#3D2B1F]"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* LOGO — centro */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 flex items-center"
          >
            <span
              className="font-display-italic text-[22px] text-[#3D2B1F] tracking-tight leading-none select-none"
              style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
            >
              Mar Boutique
            </span>
          </Link>

          {/* ICONOS — derecha */}
          <div className="hidden md:flex items-center gap-5">
            <button
              aria-label="Buscar"
              className="text-[#897568] hover:text-[#3D2B1F] transition-colors"
            >
              <Search size={18} strokeWidth={1.5} />
            </button>

            <Link
              href="/cuenta/wishlist"
              aria-label="Wishlist"
              className="text-[#897568] hover:text-[#3D2B1F] transition-colors"
            >
              <Heart size={18} strokeWidth={1.5} />
            </Link>

            <Link
              href="/cuenta"
              aria-label="Mi cuenta"
              className="text-[#897568] hover:text-[#3D2B1F] transition-colors"
            >
              <User size={18} strokeWidth={1.5} />
            </Link>

            <Link
              href="/carrito"
              aria-label={`Carrito (${itemCount} productos)`}
              className="relative text-[#897568] hover:text-[#3D2B1F] transition-colors"
            >
              <ShoppingBag size={18} strokeWidth={1.5} />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#B5888A] text-white text-[9px] font-[600] flex items-center justify-center">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>
          </div>

          {/* HAMBURGER — móvil */}
          <button
            className="md:hidden ml-auto text-[#3D2B1F]"
            aria-label="Menú"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* MENÚ MÓVIL */}
      {menuOpen && (
        <div className="md:hidden bg-[#F3EDE0] border-t border-[#DDD5C4] px-6 py-6 flex flex-col gap-5">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={cn(
                "text-[13px] tracking-[0.18em] uppercase font-[500]",
                pathname === link.href
                  ? "text-[#3D2B1F]"
                  : link.hot
                  ? "text-[#B5888A]"
                  : "text-[#897568]"
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-[#DDD5C4] pt-5 flex gap-6">
            <Link href="/cuenta/wishlist" onClick={() => setMenuOpen(false)} className="text-[#897568]">
              <Heart size={20} strokeWidth={1.5} />
            </Link>
            <Link href="/cuenta" onClick={() => setMenuOpen(false)} className="text-[#897568]">
              <User size={20} strokeWidth={1.5} />
            </Link>
            <Link href="/carrito" onClick={() => setMenuOpen(false)} className="relative text-[#897568]">
              <ShoppingBag size={20} strokeWidth={1.5} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#B5888A] text-white text-[9px] font-[600] flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
