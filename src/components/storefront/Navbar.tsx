"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
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
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const itemCount = useCartStore((s) =>
    s.items.reduce((sum, i) => sum + i.quantity, 0)
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
    }
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchOpen(false);
    router.push(`/catalogo?q=${encodeURIComponent(q)}`);
  }

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[#F3EDE0]/95 backdrop-blur-md shadow-[0_1px_12px_rgba(61,43,31,0.08)]"
          : "bg-[#F3EDE0]"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 xl:px-8">
        {/* Grid 3 columnas: [nav] [logo] [iconos] */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center h-16">

          {/* COLUMNA IZQUIERDA */}
          <div className="flex items-center min-w-0">
            {/* Móvil y tablet (< 1280px): hamburger */}
            <button
              className="xl:hidden text-[#3D2B1F] shrink-0"
              aria-label="Menú"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Desktop (≥ 1280px): links de navegación */}
            <nav className="hidden xl:flex items-center gap-7 2xl:gap-9 min-w-0">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-[10px] 2xl:text-[11px] tracking-[0.15em] 2xl:tracking-[0.2em] uppercase font-[500] transition-colors duration-200 whitespace-nowrap",
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
          </div>

          {/* COLUMNA CENTRAL: Logo — siempre centrado */}
          <Link href="/" className="flex items-center justify-center px-3">
            <span
              className="text-[19px] sm:text-[21px] text-[#3D2B1F] tracking-tight leading-none select-none whitespace-nowrap"
              style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
            >
              Mar Boutique
            </span>
          </Link>

          {/* COLUMNA DERECHA */}
          <div className="flex items-center justify-end gap-3 sm:gap-4">
            {/* Móvil y tablet (< 1280px): búsqueda + carrito */}
            <div className="xl:hidden flex items-center gap-3">
              <button
                aria-label="Buscar"
                onClick={() => setSearchOpen(true)}
                className="text-[#897568] hover:text-[#3D2B1F] transition-colors"
              >
                <Search size={18} strokeWidth={1.5} />
              </button>
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

            {/* Desktop (≥ 1280px): todos los iconos */}
            <div className="hidden xl:flex items-center gap-4 2xl:gap-5">
              <button
                aria-label="Buscar"
                onClick={() => setSearchOpen(true)}
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
          </div>
        </div>
      </div>

      {/* OVERLAY DE BÚSQUEDA */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div
            className="absolute inset-0 bg-[#3D2B1F]/40 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          />
          <div className="relative bg-[#F3EDE0] border-b border-[#DDD5C4] px-4 sm:px-8 py-5">
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex items-center gap-4">
              <Search size={18} className="text-[#897568] shrink-0" strokeWidth={1.5} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar prendas..."
                className="flex-1 bg-transparent text-lg text-[#3D2B1F] placeholder:text-[#CEC3AB] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-[#897568] hover:text-[#3D2B1F] transition-colors"
                aria-label="Cerrar búsqueda"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MENÚ MÓVIL/TABLET — drawer (< 1280px) */}
      {menuOpen && (
        <div className="xl:hidden bg-[#F3EDE0] border-t border-[#DDD5C4] px-6 py-6 flex flex-col gap-5">
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
          </div>
        </div>
      )}
    </header>
  );
}
