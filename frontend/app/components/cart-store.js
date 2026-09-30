"use client";

// Cart persisted in localStorage and shared across tabs.
const STORAGE_KEY = "bitezz_cart";
const EMPTY = [];
const listeners = new Set();

let cachedRaw = null;
let cachedItems = EMPTY;

function read() {
  let raw = null;

  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return cachedItems;
  }

  if (raw !== cachedRaw) {
    cachedRaw = raw;

    try {
      const parsed = raw ? JSON.parse(raw) : EMPTY;
      cachedItems = Array.isArray(parsed) ? parsed : EMPTY;
    } catch {
      cachedItems = EMPTY;
    }
  }

  return cachedItems;
}

function write(items) {
  try {
    if (items.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  } catch {
    // Storage unavailable (private mode): keep the cart in memory only.
    cachedRaw = null;
    cachedItems = items;
  }

  listeners.forEach((listener) => listener());
}

export function subscribe(listener) {
  listeners.add(listener);

  const onStorage = (event) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export const getSnapshot = read;
export const getServerSnapshot = () => EMPTY;

function maxQty(item) {
  return Number.isFinite(item.stockQty) && item.stockQty > 0 ? item.stockQty : 99;
}

export function addItem(menuItem) {
  const items = read();
  const existing = items.find((item) => item.id === menuItem.id);

  if (existing) {
    setQuantity(menuItem.id, existing.quantity + 1);
    return;
  }

  write([
    ...items,
    {
      id: menuItem.id,
      name: menuItem.name,
      price: Number(menuItem.price),
      image: menuItem.image ?? null,
      stockQty: menuItem.stockQty,
      quantity: 1,
    },
  ]);
}

export function setQuantity(id, quantity) {
  const items = read();

  write(
    items
      .map((item) =>
        item.id === id
          ? { ...item, quantity: Math.min(quantity, maxQty(item)) }
          : item
      )
      .filter((item) => item.quantity > 0)
  );
}

export function removeItem(id) {
  write(read().filter((item) => item.id !== id));
}

export function clearCart() {
  write(EMPTY);
}

export function canIncrease(item) {
  return item.quantity < maxQty(item);
}
