"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingBag, Users,
  Tag, BarChart2, Settings, Archive, LogOut, Layers, FolderOpen, Menu, X, MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/inventario", label: "Inventario", icon: Archive },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/agente", label: "Agente", icon: MessageCircle },
  { href: "/admin/colecciones", label: "Colecciones", icon: Layers },
  { href: "/admin/categorias", label: "Categorías", icon: FolderOpen },
  { href: "/admin/descuentos", label: "Descuentos", icon: Tag },
  { href: "/admin/reportes", label: "Reportes", icon: BarChart2 },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <>
      {/* Barra superior solo en celular */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#252525] flex items-center px-3 z-50">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          className="h-11 w-11 flex items-center justify-center text-[#FFFFFF]"
        >
          {open ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
        </button>
        <span
          className="text-lg text-[#FFFFFF] ml-1"
          style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
        >
          Mar Boutique
        </span>
      </div>

      {open && (
        <button
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
          className="md:hidden fixed inset-0 bg-black/40 z-40"
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-60 bg-[#252525] flex flex-col z-50 transition-transform md:z-40 md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
      {/* Logo */}
      <div className="px-6 py-6 border-b border-[#444444]">
        <Link href="/" target="_blank">
          <span
            className="text-xl text-[#FFFFFF]"
            style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
          >
            Mar Boutique
          </span>
        </Link>
        <p className="text-[9px] tracking-[0.2em] uppercase text-[#7B7B7B] mt-0.5">
          Panel admin
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors",
                active
                  ? "bg-[#ECD6D1]/15 text-[#ECD6D1] font-[500]"
                  : "text-[#7B7B7B] hover:text-[#E3CFCA] hover:bg-white/5"
              )}
            >
              <Icon size={16} strokeWidth={1.5} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-[#444444]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full text-sm text-[#7B7B7B] hover:text-[#E3CFCA] transition-colors"
        >
          <LogOut size={16} strokeWidth={1.5} />
          Cerrar sesión
        </button>
      </div>
      </aside>
    </>
  );
}
