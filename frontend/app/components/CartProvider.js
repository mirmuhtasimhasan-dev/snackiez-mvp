"use client";

import { createContext, useContext, useMemo, useState, useSyncExternalStore } from "react";
import * as store from "./cart-store";
import { DELIVERY_FEE } from "@/lib/order-config";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const items = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo(() => {
    const count = items.reduce((total, item) => total + item.quantity, 0);
    const subtotal = items.reduce(
      (total, item) => total + Number(item.price) * item.quantity,
      0
    );
    const deliveryFee = items.length > 0 ? DELIVERY_FEE : 0;

    return {
      items,
      count,
      subtotal,
      deliveryFee,
      total: subtotal + deliveryFee,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem: store.addItem,
      setQuantity: store.setQuantity,
      removeItem: store.removeItem,
      clearCart: store.clearCart,
      canIncrease: store.canIncrease,
    };
  }, [items, isOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
