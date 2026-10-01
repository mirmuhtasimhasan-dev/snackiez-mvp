"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";
import { BagIcon, WhatsAppIcon } from "./icons";
import { formatPrice, whatsappLink } from "@/lib/site";

// Pages with their own primary action at the bottom of the screen.
const HIDDEN_ON = ["/checkout", "/order-success"];

const whatsappProps = {
  href: whatsappLink(),
  target: "_blank",
  rel: "noopener noreferrer",
  "aria-label": "Chat with Bitezz on WhatsApp",
};

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
      {/* Floating WhatsApp: always on desktop; on phones only when there is
          no bottom bar (the bar carries its own WhatsApp button). */}
      <a
        {...whatsappProps}
        className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-black shadow-lg shadow-black/40 transition hover:scale-105 md:bottom-6 md:right-6 md:flex md:h-12 md:w-12 ${
          showBar ? "hidden" : "flex"
        }`}
      >
        <WhatsAppIcon width={22} height={22} />
      </a>

      {/* Bottom padding so the fixed bar or button never hides the last
          cards, buttons or footer links on phones. */}
      <div
        aria-hidden="true"
        className={`md:hidden ${
          showBar ? "h-[calc(4.5rem+env(safe-area-inset-bottom))]" : "h-16"
        }`}
      />

      {showBar && (
        <div
          data-mobile-bar
          className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-line bg-ink/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md md:hidden"
        >
          {count > 0 ? (
            <button
              type="button"
              onClick={openCart}
              className="flex h-12 min-w-0 flex-1 items-center justify-between gap-2 whitespace-nowrap rounded-full bg-brand px-5 font-semibold text-cream active:scale-[0.99]"
            >
              <span className="flex items-center gap-2">
                <BagIcon width={18} height={18} className="shrink-0" /> View Cart ({count})
              </span>
              <span className="tabular-nums">{formatPrice(total)}</span>
            </button>
          ) : (
            <Link
              href="/menu"
              className="flex h-12 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-full bg-brand font-display text-2xl tracking-wider text-cream active:scale-[0.99]"
            >
              Order Now
            </Link>
          )}

          <a
            {...whatsappProps}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#25D366]/40 bg-[#25D366]/15 text-[#25D366] active:scale-95"
          >
            <WhatsAppIcon width={22} height={22} />
          </a>
        </div>
      )}
    </>
  );
}
