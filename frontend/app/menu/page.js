"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const fetchMenuData = async () => {
    try {
      const [itemsResponse, categoriesResponse] = await Promise.all([
        api.get("/menu/items"),
        api.get("/menu/categories"),
      ]);

      setMenuItems(itemsResponse.data.menuItems || []);
      setCategories(categoriesResponse.data.categories || []);
    } catch (error) {
      console.log("Menu fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item) => {
    const existingCart = JSON.parse(localStorage.getItem("snackiez_cart")) || [];

    const alreadyExists = existingCart.find(
      (cartItem) => cartItem.id === item.id
    );

    let updatedCart;

    if (alreadyExists) {
      updatedCart = existingCart.map((cartItem) =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
    } else {
      updatedCart = [...existingCart, { ...item, quantity: 1 }];
    }

    localStorage.setItem("snackiez_cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));

    alert(`${item.name} added to cart`);
  };

  useEffect(() => {
    fetchMenuData();
  }, []);

  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchText.toLowerCase());

    const matchesCategory = selectedCategory
      ? item.categoryId === selectedCategory
      : true;

    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl font-semibold text-gray-700">Loading menu...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-orange-500">
            Snackiez Menu
          </h1>

          <p className="text-gray-600 mt-2">
            Choose your favorite food and add it to your cart
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-md mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-orange-500"
              placeholder="Search food..."
            />

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-orange-500"
            >
              <option value="">All Categories</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {(searchText || selectedCategory) && (
            <button
              onClick={() => {
                setSearchText("");
                setSelectedCategory("");
              }}
              className="mt-4 bg-gray-900 text-white px-5 py-2 rounded-xl font-semibold"
            >
              Clear Filter
            </button>
          )}
        </div>

        {filteredMenuItems.length === 0 ? (
          <p className="text-center text-gray-600">No menu items found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredMenuItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-md overflow-hidden"
              >
                <img
                  src={
                    item.image || "https://placehold.co/400x250?text=Snackiez"
                  }
                  alt={item.name}
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://placehold.co/400x250?text=Snackiez";
                  }}
                  className="w-full h-52 object-cover"
                />

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900">
                        {item.name}
                      </h2>

                      <p className="text-sm text-gray-500 mt-1">
                        {item.category?.name || "No Category"}
                      </p>
                    </div>

                    <span
                      className={`text-sm px-3 py-1 rounded-full ${
                        item.isAvailable
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </div>

                  <p className="text-gray-600 mt-3">
                    {item.description || "No description available"}
                  </p>

                  <p className="text-xl font-bold text-orange-500 mt-5">
                    ৳ {item.price}
                  </p>

                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={!item.isAvailable}
                    className={`w-full mt-5 py-3 rounded-xl font-semibold ${
                      item.isAvailable
                        ? "bg-orange-500 text-white hover:bg-orange-600"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}