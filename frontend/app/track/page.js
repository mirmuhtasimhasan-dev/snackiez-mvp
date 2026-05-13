"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";

export default function TrackOrderPage() {
  const [orderCode, setOrderCode] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const statusSteps = ["PENDING", "CONFIRMED", "PREPARING", "DELIVERED"];

  const trackOrderByCode = async (code) => {
    if (!code.trim()) {
      alert("Please enter your order code");
      return;
    }

    try {
      setLoading(true);
      setSearched(true);
      setOrder(null);

      const response = await api.get(`/orders/track/${code.trim()}`);

      setOrder(response.data.order);
    } catch (error) {
      console.log("Track order error:", error);

      if (error.response?.status === 404) {
        setOrder(null);
      } else {
        alert(error.response?.data?.message || "Failed to track order");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      setOrderCode(code);
      trackOrderByCode(code);
    }
  }, []);

  const handleTrackOrder = async (e) => {
    e.preventDefault();
    trackOrderByCode(orderCode);
  };

  const getStatusStyle = (status) => {
    if (status === "PENDING") {
      return "bg-yellow-100 text-yellow-700";
    }

    if (status === "CONFIRMED") {
      return "bg-blue-100 text-blue-700";
    }

    if (status === "PREPARING") {
      return "bg-purple-100 text-purple-700";
    }

    if (status === "DELIVERED") {
      return "bg-green-100 text-green-700";
    }

    if (status === "CANCELLED") {
      return "bg-red-100 text-red-700";
    }

    return "bg-gray-100 text-gray-700";
  };

  const getCurrentStepIndex = () => {
    return statusSteps.indexOf(order?.status);
  };

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-orange-500">Track Order</h1>
          <p className="text-gray-600 mt-2">
            Enter your order code to check the latest order status
          </p>
        </div>

        <form
          onSubmit={handleTrackOrder}
          className="bg-white p-6 rounded-2xl shadow-md mb-8"
        >
          <label className="block text-gray-700 font-semibold mb-2">
            Enter Order Code
          </label>

          <input
            type="text"
            value={orderCode}
            onChange={(e) => setOrderCode(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-orange-500"
            placeholder="Example: SNK-123456"
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-5 py-3 rounded-xl font-bold ${
              loading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-orange-500 text-white hover:bg-orange-600"
            }`}
          >
            {loading ? "Tracking..." : "Track Order"}
          </button>
        </form>

        {searched && !order && !loading && (
          <div className="bg-white p-8 rounded-2xl shadow-md text-center">
            <p className="text-red-500 font-semibold">
              No order found with this order code.
            </p>
          </div>
        )}

        {order && (
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Order: {order.orderCode}
                </h2>

                <p className="text-gray-600 mt-1">
                  Customer: {order.customer?.name}
                </p>

                <p className="text-gray-600">
                  Phone: {order.customer?.phone}
                </p>

                <p className="text-gray-600">
                  Address: {order.customer?.address || "No address"}
                </p>
              </div>

              <span
                className={`px-4 py-2 rounded-full font-semibold w-fit ${getStatusStyle(
                  order.status
                )}`}
              >
                {order.status}
              </span>
            </div>

            {order.status === "CANCELLED" ? (
              <div className="bg-red-50 border border-red-200 p-5 rounded-2xl mb-8 text-center">
                <h3 className="text-2xl font-bold text-red-600">
                  Order Cancelled
                </h3>
                <p className="text-red-500 mt-2">
                  Sorry, this order has been cancelled.
                </p>
              </div>
            ) : (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-5">
                  Order Progress
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {statusSteps.map((step, index) => {
                    const currentIndex = getCurrentStepIndex();
                    const isCompleted = index <= currentIndex;

                    return (
                      <div
                        key={step}
                        className={`p-5 rounded-2xl text-center border ${
                          isCompleted
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-gray-50 text-gray-500 border-gray-200"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center font-bold ${
                            isCompleted
                              ? "bg-white text-orange-500"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {index + 1}
                        </div>

                        <p className="font-bold mt-3">{step}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Ordered Items
              </h3>

              <div className="space-y-3">
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-xl"
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
                      ৳ {Number(item.price) * item.quantity}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <h3 className="text-2xl font-bold">Total</h3>

              <p className="text-2xl font-bold text-orange-500">
                ৳ {order.totalAmount}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}