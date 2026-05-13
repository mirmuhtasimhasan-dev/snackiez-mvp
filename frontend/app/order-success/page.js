"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function OrderSuccessPage() {
  const [orderCode, setOrderCode] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      setOrderCode(code);
    }
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-6">
      <div className="bg-white p-10 rounded-2xl shadow-md max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-4xl font-bold">
          ✓
        </div>

        <h1 className="text-4xl font-bold text-orange-500 mt-6">
          Order Placed!
        </h1>

        <p className="text-gray-600 mt-3">
          Your order has been placed successfully.
        </p>

        {orderCode && (
          <div className="mt-6 bg-orange-50 p-4 rounded-xl">
            <p className="text-gray-700 font-semibold">Your Order Code</p>

            <p className="text-2xl font-bold text-orange-500 mt-2">
              {orderCode}
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-4">
          <Link
            href={orderCode ? `/track?code=${orderCode}` : "/track"}
            className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold"
          >
            Track Order
          </Link>

          <Link
            href={orderCode ? `/receipt?code=${orderCode}` : "/receipt"}
            className="bg-white border border-orange-500 text-orange-500 px-6 py-3 rounded-xl font-semibold"
          >
            View Receipt
          </Link>

          <Link
            href="/menu"
            className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold"
          >
            Back to Menu
          </Link>
        </div>
      </div>
    </main>
  );
}