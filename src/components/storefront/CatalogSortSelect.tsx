"use client";

export function CatalogSortSelect({ current }: { current?: string }) {
  const options = [
    { value: "novedades", label: "Novedades" },
    { value: "precio_asc", label: "Precio: menor a mayor" },
    { value: "precio_desc", label: "Precio: mayor a menor" },
  ];

  return (
    <form method="GET">
      <select
        name="orden"
        defaultValue={current ?? "novedades"}
        onChange={(e) => (e.currentTarget.form as HTMLFormElement).submit()}
        className="text-xs text-[#252525] border border-[#EDE3E0] bg-[#FFFFFF] px-3 py-2 outline-none cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </form>
  );
}
