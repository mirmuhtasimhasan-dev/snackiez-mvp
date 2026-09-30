"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useCart } from "./CartProvider";
import ItemImage from "./ItemImage";
import { BagIcon, CloseIcon, MinusIcon, PlusIcon, TrashIcon } from "./icons";
import { formatPrice } from "@/lib/site";

export default function CartDrawer() {
  const {
    items,
    subtotal,
    deliveryFee,
    total,
    isOpen,
    closeCart,
    setQuantity,
    removeItem,
    canIncrease,
  } = useCart();
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, closeCart]);

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? "" : "pointer-events-none"}`}>
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={closeCart}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        inert={!isOpen}
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-line bg-surface shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
          <h2 id="cart-title" className="font-display text-3xl tracking-wide">
            Your Cart
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeCart}
            className="flex h-11 w-11 items-center justify-center rounded-full text-cream/80 hover:bg-white/5 hover:text-cream"
            aria-label="Close cart"
          >
            <CloseIcon />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-muted">
              <BagIcon width={28} height={28} />
            </div>
            <p className="text-lg font-semibold">Your cart is empty</p>
            <p className="text-sm text-muted">Hungry? The kitchen is open till 4 AM.</p>
            <Link
              href="/menu"
              onClick={closeCart}
              className="mt-2 rounded-full bg-brand px-6 py-3 font-semibold text-cream hover:bg-brand-hover"
            >
              Browse Menu
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto overscroll-contain px-4">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 py-4">
                  <ItemImage
                    src={item.image}
                    alt={item.name}
                    sizes="64px"
                    className="h-16 w-16 shrink-0 rounded-xl"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold leading-snug">{item.name}</p>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="-mr-2 -mt-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-white/5 hover:text-cream"
                        aria-label={`Remove ${item.name}`}
                      >
                        <TrashIcon width={16} height={16} />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-line">
                        <button
                          type="button"
                          onClick={() => setQuantity(item.id, item.quantity - 1)}
                          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/5"
                          aria-label={`Decrease ${item.name}`}
                        >
                          <MinusIcon width={16} height={16} />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(item.id, item.quantity + 1)}
                          disabled={!canIncrease(item)}
                          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/5 disabled:opacity-30"
                          aria-label={`Increase ${item.name}`}
                        >
                          <PlusIcon width={16} height={16} />
                        </button>
                      </div>

                      <p className="font-semibold tabular-nums">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="shrink-0 border-t border-line px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between text-cream/80">
                  <dt>Subtotal</dt>
                  <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between text-cream/80">
                  <dt>Delivery fee</dt>
                  <dd className="tabular-nums">{formatPrice(deliveryFee)}</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatPrice(total)}</dd>
                </div>
              </dl>

              <Link
                href="/checkout"
                onClick={closeCart}
                className="mt-4 flex h-12 w-full items-center justify-center rounded-full bg-brand font-semibold text-cream hover:bg-brand-hover"
              >
                Checkout
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
