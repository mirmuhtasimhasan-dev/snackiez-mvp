"use client";

import { useCart } from "./CartProvider";
import ItemImage from "./ItemImage";
import { PlusIcon } from "./icons";
import { formatPriceShort } from "@/lib/site";

// Vertical card: square photo on phones (two per row), 4:3 from sm up.
export default function MenuCard({ item }) {
  const { items, addItem, canIncrease } = useCart();
  const soldOut = !item.isAvailable || item.stockQty <= 0;
  const inCart = items.find((cartItem) => cartItem.id === item.id);
  const atLimit = inCart ? !canIncrease(inCart) : false;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="relative">
        <ItemImage
          src={item.image}
          name={item.name}
          alt={item.name}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className={`aspect-square w-full sm:aspect-[4/3] ${soldOut ? "opacity-40 grayscale" : ""}`}
        />
        {soldOut && (
          <span className="absolute left-2 top-2 whitespace-nowrap rounded-full bg-ink/90 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-cream ring-1 ring-white/15">
            Sold Out
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-cream sm:text-base">
          {item.name}
        </h3>
        {item.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted sm:text-sm">{item.description}</p>
        )}

        <div className="mt-auto pt-3">
          <p
            data-nowrap
            className="whitespace-nowrap text-lg font-bold leading-none text-brand tabular-nums sm:text-xl"
          >
            {formatPriceShort(item.price)}
          </p>

          <button
            type="button"
            onClick={() => addItem(item)}
            disabled={soldOut || atLimit}
            className="mt-2.5 flex h-10 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-brand px-3 text-sm font-semibold text-cream transition hover:bg-brand-hover active:scale-95 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted/70"
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
                <PlusIcon width={16} height={16} className="shrink-0" />
                Add
                {inCart && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-cream px-1 text-xs font-bold text-brand tabular-nums">
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
