"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ArchiveProductButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function archive() {
    setLoading(true);
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    router.push("/admin/productos");
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-[#7B7B7B]">¿Archivar este producto?</span>
        <button
          onClick={archive}
          disabled={loading}
          className="text-xs text-[#B5888A] hover:text-[#252525] font-[500]"
        >
          {loading ? "Archivando…" : "Sí, archivar"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-[#E3CFCA] hover:text-[#7B7B7B]"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-[#E3CFCA] hover:text-[#B5888A] transition-colors"
    >
      Archivar producto
    </button>
  );
}
