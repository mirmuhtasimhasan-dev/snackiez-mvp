"use client";

import { useState } from "react";
import Image from "next/image";

// Warm placeholder gradients; each item gets the same one every time.
const PLACEHOLDERS = [
  "from-[#ffe3c4] via-[#ffd2a1] to-[#ffb877]",
  "from-[#fff0c7] via-[#ffd98a] to-[#ffbf5c]",
  "from-[#ffe0d0] via-[#ffc4a3] to-[#ff9f6e]",
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
          className="absolute -right-6 -top-6 h-2/3 w-2/3 rounded-full bg-card/50 blur-2xl"
        />
        <span
          aria-hidden="true"
          className="relative font-display text-[clamp(2.25rem,12vw,4rem)] leading-none text-brand-ink/85 drop-shadow-[0_2px_8px_rgba(255,255,255,0.6)]"
        >
          {label.trim().charAt(0).toUpperCase() || "B"}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-alt ${className}`}>
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
