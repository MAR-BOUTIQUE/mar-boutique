"use client";

import Image from "next/image";
import { useState } from "react";

interface Props {
  src: string;
  alt: string;
}

export function ProductThumb({ src, alt }: Props) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="w-10 h-12 bg-[#EAC9C9]/20 flex items-center justify-center">
        <span
          className="text-[10px] text-[#897568]"
          style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
        >
          MB
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-10 h-12 overflow-hidden bg-[#EAC9C9]/20">
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        className="object-cover"
        sizes="40px"
        onError={() => setError(true)}
      />
    </div>
  );
}
