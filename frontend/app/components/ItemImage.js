"use client";

import { useState } from "react";
import Image from "next/image";
import logo from "@/public/logo.png";

// Menu photos come from any URL the admin pastes, so they skip the
// image optimizer. Items without a photo, or whose photo fails to load,
// get a branded placeholder.
export default function ItemImage({ src, alt, sizes, className = "" }) {
  const [failedSrc, setFailedSrc] = useState(null);

  if (!src || failedSrc === src) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-surface-2 to-ink ${className}`}
        role="img"
        aria-label={alt}
      >
        <Image
          src={logo}
          alt=""
          sizes="96px"
          className="h-auto w-1/3 max-w-24 opacity-20 grayscale"
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-surface-2 ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        sizes={sizes}
        className="object-cover"
        onError={() => setFailedSrc(src)}
      />
    </div>
  );
}
