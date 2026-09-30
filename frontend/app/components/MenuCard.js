"use client";

import { useCart } from "./CartProvider";
import ItemImage from "./ItemImage";
import { PlusIcon } from "./icons";
import { formatPrice } from "@/lib/site";

export default function MenuCard({ item }) {
  const { items, addItem, canIncrease } = useCart();
  const soldOut = !item.isAvailable || item.stockQty <= 0;
  const inCart = items.find((cartItem) => cartItem.id === item.id);
  const atLimit = inCart ? !canIncrease(inCart) : false;

  return (
    <article className="flex h-full overflow-hidden rounded-2xl border border-line bg-surface sm:flex-col">
      <div className="relative w-32 shrink-0 sm:w-full">
        <ItemImage
          src={item.image}
          alt={item.name}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 128px"
          className={`h-full min-h-32 w-full sm:aspect-[4/3] sm:h-auto ${soldOut ? "opacity-40 grayscale" : ""}`}
        />
        {soldOut && (
          <span className="absolute left-2 top-2 rounded-full bg-ink/90 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-cream ring-1 ring-white/15">
            Sold Out
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <h3 className="font-semibold leading-snug text-cream">{item.name}</h3>
        {item.description && (
          <p className="mt-1 line-clamp-3 text-sm text-muted">{item.description}</p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <p className="font-display text-2xl tracking-wide text-brand tabular-nums">
            {formatPrice(item.price)}
          </p>

          <button
            type="button"
            onClick={() => addItem(item)}
            disabled={soldOut || atLimit}
            className="flex h-10 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-semibold text-cream transition hover:bg-brand-hover active:scale-95 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted/70"
            aria-label={
              soldOut
                ? `${item.name} is sold out`
                : `Add ${item.name} to cart${inCart ? `, ${inCart.quantity} in cart` : ""}`
            }
          >
            {soldOut ? (
              "Sold Out"
            ) : (
              <>
                <PlusIcon width={16} height={16} />
                Add to Cart
                {inCart && (
                  <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-cream px-1 text-xs font-bold text-brand tabular-nums">
                    {inCart.quantity}
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
