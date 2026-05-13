"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/services/api";

export default function CheckoutPage() {
  const router = useRouter();

  const [cartItems, setCartItems] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem("snackiez_cart")) || [];
    setCartItems(savedCart);
  }, []);

  const totalPrice = cartItems.reduce(
    (total, item) => total + Number(item.price) * Number(item.quantity),
    0
  );

  const handlePhoneChange = (e) => {
    const onlyNumbers = e.target.value.replace(/[^0-9]/g, "");
    setPhone(onlyNumbers);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (!customerName.trim() || !phone.trim() || !address.trim()) {
      alert("Please fill all required fields");
      return;
    }

    if (phone.length < 11) {
      alert("Please enter a valid phone number");
      return;
    }

    if (cartItems.length === 0) {
      alert("Your cart is empty");
      return;
    }

    try {
      setPlacingOrder(true);

      const orderData = {
        customerName: customerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        paymentMethod,
        items: cartItems.map((item) => ({
          menuItemId: item.id,
          quantity: Number(item.quantity),
        })),
      };

      const response = await api.post("/orders", orderData);

      if (response.data.success) {
        const orderCode = response.data.order.orderCode;

        localStorage.removeItem("snackiez_cart");
        window.dispatchEvent(new Event("cartUpdated"));

        router.push(`/order-success?code=${orderCode}`);
      }
    } catch (error) {
      console.log("Order place error:", error);
      alert(error.response?.data?.message || "Order failed. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-orange-500">Checkout</h1>
          <p className="text-gray-600 mt-2">
            Enter your delivery information to place your order
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl shadow-md text-center">
            <p className="text-gray-600 text-lg">Your cart is empty.</p>

            <Link
              href="/menu"
              className="inline-block mt-5 bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600"
            >
              Go to Menu
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <form
              onSubmit={handlePlaceOrder}
              className="bg-white p-6 rounded-2xl shadow-md"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-5">
                Delivery Information
              </h2>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Full Name
                </label>

                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-orange-500"
                  placeholder="Enter your name"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">
                  Phone Number
                </label>

                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-orange-500"
                  placeholder="Example: 01700000000"
                />
              </div>

              <div className="mb-5">
                <label className="block text-gray-700 font-semibold mb-2">
                  Delivery Address
                </label>

                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-orange-500"
                  placeholder="Enter your full delivery address"
                  rows="4"
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  Payment Method
                </label>

                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-orange-500 bg-white"
                >
                  <option value="CASH">Cash on Delivery</option>
                  <option value="BKASH">bKash Manual Payment</option>
                </select>

                {paymentMethod === "BKASH" && (
                  <div className="mt-4 bg-pink-50 border border-pink-200 p-4 rounded-xl">
                    <p className="font-semibold text-gray-800">
                      bKash payment selected.
                    </p>
                    <p className="text-gray-600 text-sm mt-1">
                      For now, admin will manually confirm bKash payment after
                      receiving the order.
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={placingOrder}
                className={`w-full py-4 rounded-xl font-bold text-lg ${
                  placingOrder
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-orange-500 text-white hover:bg-orange-600"
                }`}
              >
                {placingOrder ? "Placing Order..." : "Place Order"}
              </button>
            </form>

            <div className="bg-white p-6 rounded-2xl shadow-md h-fit">
              <h2 className="text-2xl font-bold text-gray-900 mb-5">
                Order Summary
              </h2>

              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b pb-3"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {item.name}
                      </h3>

                      <p className="text-gray-600">
                        ৳ {item.price} × {item.quantity}
                      </p>
                    </div>

                    <p className="font-bold text-orange-500">
                      ৳ {Number(item.price) * Number(item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <h3 className="text-2xl font-bold">Subtotal</h3>

                <p className="text-2xl font-bold text-orange-500">
                  ৳ {totalPrice}
                </p>
              </div>

              <div className="mt-5 bg-orange-50 p-4 rounded-xl">
                <p className="text-gray-700 font-semibold">
                  Payment Method:{" "}
                  {paymentMethod === "CASH"
                    ? "Cash on Delivery"
                    : "bKash Manual Payment"}
                </p>

                <p className="text-gray-500 text-sm mt-1">
                  Final amount will be confirmed from the server price.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}