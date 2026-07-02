"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface Props {
  images: string[];
  name: string;
}

export function ProductGallery({ images, name }: Props) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-[3/4] bg-[#EAC9C9]/20 flex items-center justify-center">
        <span
          className="text-4xl text-[#897568]"
          style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
        >
          MB
        </span>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex flex-col gap-2 w-16 shrink-0">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "relative aspect-square w-full overflow-hidden border transition-colors",
                active === i
                  ? "border-[#3D2B1F]"
                  : "border-[#DDD5C4] hover:border-[#897568]"
              )}
            >
              <Image
                src={src}
                alt={`${name} imagen ${i + 1}`}
                fill
                unoptimized
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main image */}
      <div className="relative flex-1 aspect-[3/4] overflow-hidden bg-[#EAC9C9]/10">
        <Image
          src={images[active]}
          alt={name}
          fill
          unoptimized
          className="object-cover"
          sizes="(max-width:1024px) 100vw, 50vw"
          priority
        />
      </div>
    </div>
  );
}
