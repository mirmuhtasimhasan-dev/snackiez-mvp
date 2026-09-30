"use client";

import { useState } from "react";
import Image from "next/image";
import logo from "@/public/logo.png";

// Shows a /public image, or the logo if that file is missing.
export default function FallbackImage({ src, alt, sizes, className = "" }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <Image
        src={logo}
        alt={alt}
        sizes={sizes}
        className={`h-auto w-full object-contain p-6 drop-shadow-[0_20px_50px_rgba(255,107,0,0.35)] ${className}`}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={`object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
