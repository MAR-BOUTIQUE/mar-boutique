import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col">
      {/* Header minimal */}
      <header className="py-6 px-8 border-b border-[#EDE3E0]">
        <Link href="/" className="inline-block">
          <span
            className="text-2xl text-[#252525]"
            style={{ fontFamily: "var(--font-playfair), 'Playfair Display', serif", fontStyle: "italic" }}
          >
            Mar Boutique
          </span>
        </Link>
      </header>

      {/* Contenido */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      <footer className="py-4 text-center text-[10px] tracking-[0.15em] uppercase text-[#E3CFCA]">
        © {new Date().getFullYear()} Mar Boutique · Cartagena, Colombia
      </footer>
    </div>
  );
}
