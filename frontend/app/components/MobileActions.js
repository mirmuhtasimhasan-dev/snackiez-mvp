"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";
import { BagIcon, WhatsAppIcon } from "./icons";
import { formatPrice, whatsappLink } from "@/lib/site";

// Pages with their own primary action at the bottom of the screen.
const HIDDEN_ON = ["/checkout", "/order-success"];

export default function MobileActions() {
  const pathname = usePathname().replace(/\/$/, "") || "/";
  const { count, total, openCart } = useCart();

  if (HIDDEN_ON.includes(pathname)) {
    return null;
  }

  // On the menu an empty-cart "Order Now" bar would link to itself.
  const showBar = count > 0 || pathname !== "/menu";

  return (
    <>
      <a
        href={whatsappLink()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Bitezz on WhatsApp"
        className={`fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-black shadow-lg shadow-black/40 transition hover:scale-105 md:bottom-6 md:right-6 ${
          showBar ? "bottom-24" : "bottom-6"
        }`}
      >
        <WhatsAppIcon width={28} height={28} />
      </a>

      {showBar && (
        <>
          {/* Keeps the footer clear of the fixed bar on phones. */}
          <div aria-hidden="true" className="h-20 md:hidden" />

          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md md:hidden">
            {count > 0 ? (
              <button
                type="button"
                onClick={openCart}
                className="flex h-12 w-full items-center justify-between rounded-full bg-brand px-5 font-semibold text-cream active:scale-[0.99]"
              >
                <span className="flex items-center gap-2">
                  <BagIcon width={18} height={18} /> View Cart ({count})
                </span>
                <span className="tabular-nums">{formatPrice(total)}</span>
              </button>
            ) : (
              <Link
                href="/menu"
                className="flex h-12 w-full items-center justify-center rounded-full bg-brand font-display text-2xl tracking-wider text-cream active:scale-[0.99]"
              >
                Order Now
              </Link>
            )}
          </div>
        </>
      )}
    </>
  );
}
