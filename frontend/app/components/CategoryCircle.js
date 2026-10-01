"use client";

import { useState } from "react";
import Image from "next/image";
import { FoodIcon } from "./icons";

// Round category image. Falls back to a warm gradient with a food icon when
// there is no image or it fails to load. Size comes from className.
export default function CategoryCircle({ src, sizes = "96px", className = "", selected = false }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const showImage = src && failedSrc !== src;

  return (
    <span
      className={`relative block shrink-0 overflow-hidden rounded-full ring-2 ring-offset-2 ring-offset-ink transition ${
        selected ? "ring-brand" : "ring-line group-hover:ring-brand/60"
      } ${className}`}
    >
      {showImage ? (
        <Image
          src={src}
          alt=""
          fill
          unoptimized
          sizes={sizes}
          className="object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#7a3b0c] via-[#3a2213] to-[#1c1612] text-highlight">
          <FoodIcon className="h-[42%] w-[42%]" />
        </span>
      )}
    </span>
  );
}
