"use client";

import Image from "next/image";
import Link from "next/link";
import logo from "@/public/logo.png";
import { useCart } from "./CartProvider";
import { BagIcon } from "./icons";

export default function Navbar() {
  const { count, openCart } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2" aria-label="Bitezz home">
          <Image src={logo} alt="" width={40} height={40} loading="eager" className="h-10 w-10" />
          <span className="font-display text-2xl tracking-wide">Bitezz</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/menu"
            className="rounded-full px-4 py-2.5 text-sm font-semibold text-cream/90 hover:bg-white/5 hover:text-cream"
          >
            Menu
          </Link>

          <button
            type="button"
            onClick={openCart}
            className="flex items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-cream hover:bg-brand-hover"
            aria-label={`Open cart, ${count} ${count === 1 ? "item" : "items"}`}
          >
            <BagIcon width={18} height={18} />
            <span>Cart</span>
            {count > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-cream px-1.5 text-xs font-bold text-brand tabular-nums">
                {count}
              </span>
            )}
          </button>
        </div>
      </nav>
    </header>
  );
}
