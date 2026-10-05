"use client";

import Image from "next/image";
import Link from "next/link";
import logo from "@/public/logo.png";
import { useCart } from "./CartProvider";
import { BagIcon } from "./icons";

export default function Navbar() {
  const { count, openCart } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-card/95 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" prefetch className="flex items-center gap-2" aria-label="Bitezz home">
          <Image src={logo} alt="" width={40} height={40} loading="eager" className="h-10 w-10" />
          <span className="font-display text-2xl tracking-wide">Bitezz</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/menu"
            prefetch
            className="rounded-full px-4 py-2.5 text-sm font-semibold text-fg/80 hover:bg-alt hover:text-fg"
          >
            Menu
          </Link>

          <button
            type="button"
            onClick={openCart}
            className="flex items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-fg hover:bg-brand-hover"
            aria-label={`Open cart, ${count} ${count === 1 ? "item" : "items"}`}
          >
            <BagIcon width={18} height={18} />
            <span>Cart</span>
            {count > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-fg px-1.5 text-xs font-bold text-card tabular-nums">
                {count}
              </span>
            )}
          </button>
        </div>
      </nav>
    </header>
  );
}
