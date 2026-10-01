"use client";

import { useState } from "react";
import Image from "next/image";

// Warm placeholder gradients; each item gets the same one every time.
const PLACEHOLDERS = [
  "from-[#5a2a0c] via-[#2a1a10] to-[#1c1612]",
  "from-[#6b3a08] via-[#2e1f12] to-[#1c1612]",
  "from-[#4a1f14] via-[#2a1712] to-[#1c1612]",
];

function pickPlaceholder(name = "") {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PLACEHOLDERS[hash % PLACEHOLDERS.length];
}

// Menu photos come from any URL the admin pastes, so they skip the
// image optimizer. Items without a photo, or whose photo fails to load,
// get a warm gradient with the item's initial.
export default function ItemImage({ src, alt, name, sizes, className = "" }) {
  const [failedSrc, setFailedSrc] = useState(null);

  if (!src || failedSrc === src) {
    const label = name || alt || "";

    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${pickPlaceholder(label)} ${className}`}
        role="img"
        aria-label={alt}
      >
        <div
          aria-hidden="true"
          className="absolute -right-6 -top-6 h-2/3 w-2/3 rounded-full bg-brand/20 blur-2xl"
        />
        <span
          aria-hidden="true"
          className="relative font-display text-[clamp(2.25rem,12vw,4rem)] leading-none text-highlight/90 drop-shadow-[0_4px_16px_rgba(255,107,0,0.45)]"
        >
          {label.trim().charAt(0).toUpperCase() || "B"}
        </span>
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
