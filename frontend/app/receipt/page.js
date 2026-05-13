"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/services/api";

export default function ReceiptPage() {
  const [orderCode, setOrderCode] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReceipt = async (code) => {
    try {
      setLoading(true);

      const response = await api.get(`/orders/track/${code}`);

      setOrder(response.data.order);
    } catch (error) {
      console.log("Receipt fetch error:", error);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      setOrderCode(code);
      fetchReceipt(code);
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-xl font-semibold text-gray-600">
          Loading receipt...
        </p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center px-6">
        <div className="bg-white p-8 rounded-2xl shadow-md text-center max-w-md w-full">
          <h1 className="text-3xl font-bold text-red-500">
            Receipt Not Found
          </h1>

          <p className="text-gray-600 mt-3">
            No receipt found for this order code.
          </p>

          <Link
            href="/track"
            className="inline-block mt-6 bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600"
          >
            Track Order
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-8">
        <div className="text-center border-b pb-6">
          <h1 className="text-4xl font-bold text-orange-500">Snackiez</h1>

          <p className="text-gray-600 mt-2">
            Fast, Fresh & Budget-Friendly Bites
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-6">
            Order Receipt
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Customer Details</h3>

            <p className="text-gray-700">
              <span className="font-semibold">Name:</span>{" "}
              {order.customer?.name}
            </p>

            <p className="text-gray-700">
              <span className="font-semibold">Phone:</span>{" "}
              {order.customer?.phone}
            </p>

            <p className="text-gray-700">
              <span className="font-semibold">Address:</span>{" "}
              {order.customer?.address || "No address"}
            </p>
          </div>

          <div>
            <h3 className="font-bold text-gray-900 mb-2">Order Details</h3>

            <p className="text-gray-700">
              <span className="font-semibold">Order Code:</span>{" "}
              {order.orderCode}
            </p>

            <p className="text-gray-700">
              <span className="font-semibold">Status:</span> {order.status}
            </p>

            <p className="text-gray-700">
              <span className="font-semibold">Payment:</span>{" "}
              {order.payment?.method || "CASH"}
            </p>
          </div>
        </div>

        <div className="mt-8 border-t pt-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Ordered Items
          </h3>

          <div className="space-y-3">
            {order.items?.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-gray-50 p-4 rounded-xl"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {item.menuItem?.name}
                  </p>

                  <p className="text-gray-600 text-sm">
                    ৳ {item.price} × {item.quantity}
                  </p>
                </div>

                <p className="font-bold text-orange-500">
                  ৳ {Number(item.price) * Number(item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mt-8 pt-5 border-t">
          <h3 className="text-2xl font-bold text-gray-900">Total Amount</h3>

          <p className="text-3xl font-bold text-orange-500">
            ৳ {order.totalAmount}
          </p>
        </div>

        <div className="mt-8 flex flex-col md:flex-row gap-4">
          <Link
            href={`/track?code=${order.orderCode}`}
            className="w-full text-center bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600"
          >
            Track This Order
          </Link>

          <Link
            href="/menu"
            className="w-full text-center border border-orange-500 text-orange-500 py-3 rounded-xl font-bold hover:bg-orange-50"
          >
            Order More
          </Link>
        </div>

        <p className="text-center text-gray-500 text-sm mt-8">
          Thank you for ordering from Snackiez.
        </p>
      </div>
    </main>
  );
}