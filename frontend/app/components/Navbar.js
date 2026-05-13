"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);

  const updateCartCount = () => {
    const savedCart = JSON.parse(localStorage.getItem("snackiez_cart")) || [];

    const totalItems = savedCart.reduce(
      (total, item) => total + item.quantity,
      0
    );

    setCartCount(totalItems);
  };

  useEffect(() => {
    updateCartCount();

    window.addEventListener("cartUpdated", updateCartCount);
    window.addEventListener("storage", updateCartCount);

    return () => {
      window.removeEventListener("cartUpdated", updateCartCount);
      window.removeEventListener("storage", updateCartCount);
    };
  }, [pathname]);

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Link href="/" className="text-3xl font-bold text-orange-500">
          Snackiez
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 rounded-xl font-semibold text-gray-700 hover:bg-orange-100 hover:text-orange-500"
          >
            Home
          </Link>

          <Link
            href="/menu"
            className="px-4 py-2 rounded-xl font-semibold text-gray-700 hover:bg-orange-100 hover:text-orange-500"
          >
            Menu
          </Link>

          <Link
            href="/cart"
            className="px-4 py-2 rounded-xl font-semibold text-gray-700 hover:bg-orange-100 hover:text-orange-500"
          >
            Cart ({cartCount})
          </Link>

          <Link
            href="/track"
            className="px-4 py-2 rounded-xl font-semibold text-gray-700 hover:bg-orange-100 hover:text-orange-500"
          >
            Track Order
          </Link>

          <Link
            href="/admin-login"
            className="bg-orange-500 text-white px-5 py-2 rounded-xl font-semibold hover:bg-orange-600"
          >
            Admin
          </Link>
        </div>
      </div>
    </nav>
  );
}