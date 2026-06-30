const WORDS = [
  "◈ Nueva Colección",
  "◈ Mar Boutique",
  "◈ Cartagena",
  "◈ Mujeres que visten con intención",
  "◈ Estilo costero",
  "◈ Hecho con amor",
  "◈ Diseño exclusivo",
];

const TEXT = WORDS.join("   ") + "   ";

export function MarqueeStrip({ inverted = false }: { inverted?: boolean }) {
  const bg = inverted ? "bg-[#F3EDE0]" : "bg-[#3D2B1F]";
  const color = inverted ? "text-[#897568]" : "text-[#F3EDE0]";
  const border = inverted ? "border-[#DDD5C4]" : "";

  return (
    <div className={`${bg} ${border} border-y overflow-hidden py-3 select-none`}>
      <div className="flex whitespace-nowrap">
        {/* Duplicamos el texto para que el loop sea seamless */}
        <span className={`animate-marquee inline-block ${color} text-[11px] tracking-[0.18em] uppercase font-[500]`}>
          {TEXT.repeat(6)}
        </span>
      </div>
    </div>
  );
}
