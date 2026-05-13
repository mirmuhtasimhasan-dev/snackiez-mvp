"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem("snackiez_cart")) || [];
    setCartItems(savedCart);
  }, []);

  const updateQuantity = (id, type) => {
    const updatedCart = cartItems
      .map((item) => {
        if (item.id === id) {
          return {
            ...item,
            quantity:
              type === "increase" ? item.quantity + 1 : item.quantity - 1,
          };
        }

        return item;
      })
      .filter((item) => item.quantity > 0);

    setCartItems(updatedCart);
    localStorage.setItem("snackiez_cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const removeItem = (id) => {
    const updatedCart = cartItems.filter((item) => item.id !== id);

    setCartItems(updatedCart);
    localStorage.setItem("snackiez_cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem("snackiez_cart");
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const totalPrice = cartItems.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0
  );

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-orange-500">Your Cart</h1>
          <p className="text-gray-600 mt-2">
            Review your selected food items before checkout
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl shadow-md text-center">
            <p className="text-gray-600 text-lg">Your cart is empty.</p>

            <Link
              href="/menu"
              className="inline-block mt-5 bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600"
            >
              Add Food
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-white p-5 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-5"
              >
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {item.name}
                  </h2>

                  <p className="text-gray-600 mt-1">
                    ৳ {item.price} each
                  </p>

                  <p className="text-orange-500 font-bold mt-1">
                    Subtotal: ৳ {Number(item.price) * item.quantity}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(item.id, "decrease")}
                    className="bg-gray-200 px-3 py-1 rounded-lg font-bold hover:bg-gray-300"
                  >
                    -
                  </button>

                  <span className="font-semibold">{item.quantity}</span>

                  <button
                    onClick={() => updateQuantity(item.id, "increase")}
                    className="bg-gray-200 px-3 py-1 rounded-lg font-bold hover:bg-gray-300"
                  >
                    +
                  </button>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <div className="bg-white p-6 rounded-2xl shadow-md flex items-center justify-between">
              <h2 className="text-2xl font-bold">Total</h2>

              <p className="text-2xl font-bold text-orange-500">
                ৳ {totalPrice}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={clearCart}
                className="w-full sm:w-1/2 bg-red-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-red-600"
              >
                Clear Cart
              </button>

              <Link
                href="/checkout"
                className="w-full sm:w-1/2 bg-orange-500 text-white py-4 rounded-xl font-bold text-lg text-center hover:bg-orange-600"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}