"use client";

import { useCart } from "./CartProvider";
import { useStore } from "./StoreProvider";
import { PlusIcon } from "./icons";

export default function AddToCartButton({ item, className = "" }) {
  const { items, addItem, openCart, canIncrease } = useCart();
  const { open } = useStore();
  const soldOut = !item.isAvailable || item.stockQty <= 0;
  const inCart = items.find((cartItem) => cartItem.id === item.id);
  const atLimit = inCart ? !canIncrease(inCart) : false;

  return (
    <button
      type="button"
      disabled={soldOut || atLimit || !open}
      onClick={() => {
        addItem(item);
        openCart();
      }}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand px-6 font-semibold text-fg transition hover:bg-brand-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-alt disabled:text-muted ${className}`}
    >
      {soldOut ? (
        "Sold Out"
      ) : !open ? (
        "Closed right now"
      ) : (
        <>
          <PlusIcon width={18} height={18} /> Add to Cart
        </>
      )}
    </button>
  );
}
