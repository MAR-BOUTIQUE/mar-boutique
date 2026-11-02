const WORDS = [
  "◈ Nueva Colección",
  "◈ Mar Boutique",
  "◈ Cartagena",
  "◈ Mujeres que visten con intención",
  "◈ Hecho con amor",
  "◈ Diseño exclusivo",
];

const TEXT = WORDS.join("   ") + "   ";

export function MarqueeStrip() {
  return (
    <div className="bg-[#ECD6D1] overflow-hidden py-3 select-none">
      <div className="flex whitespace-nowrap">
        {/* Duplicamos el texto para que el loop sea seamless */}
        <span className="animate-marquee inline-block text-[#252525] text-[11px] tracking-[0.18em] uppercase font-[500]">
          {TEXT.repeat(6)}
        </span>
      </div>
    </div>
  );
}
