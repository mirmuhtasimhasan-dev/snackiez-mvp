"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/services/api";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("admin@snackiez.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("snackiez_admin_token", response.data.token);
      localStorage.setItem("snackiez_admin", JSON.stringify(response.data.admin));

      alert("Admin login successful");
      router.push("/dashboard");
    } catch (error) {
      console.log("Admin login error:", error);
      alert(error.response?.data?.message || "Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-6">
      <div className="bg-white p-8 rounded-2xl shadow-md max-w-md w-full">
        <h1 className="text-4xl font-bold text-orange-500 text-center">
          Admin Login
        </h1>

        <p className="text-gray-600 text-center mt-3">
          Login to manage Snackiez
        </p>

        <form onSubmit={handleLogin} className="mt-8">
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-orange-500"
              placeholder="Enter admin email"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-orange-500"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-5 text-center">
          <Link href="/" className="text-orange-500 font-semibold">
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}