"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/services/api";

const slides = [
  {
    title: "Fresh Burgers Delivered Fast",
    subtitle: "Order your favorite meals from Snackiez in just a few clicks.",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1600&auto=format&fit=crop",
  },
  {
    title: "Hot, Crispy & Delicious",
    subtitle: "Enjoy fresh snacks, burgers and fast food at your doorstep.",
    image:
      "https://images.unsplash.com/photo-1562967916-eb82221dfb92?q=80&w=1600&auto=format&fit=crop",
  },
  {
    title: "Easy Order, Fast Delivery",
    subtitle: "Add to cart, checkout and track your order easily.",
    image:
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?q=80&w=1600&auto=format&fit=crop",
  },
];

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredItems, setFeaturedItems] = useState([]);

  const fetchFeaturedItems = async () => {
    try {
      const response = await api.get("/menu/items");

      const availableItems = (response.data.menuItems || []).filter(
        (item) => item.isAvailable
      );

      setFeaturedItems(availableItems.slice(0, 3));
    } catch (error) {
      console.log("Featured items fetch error:", error);
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
    fetchFeaturedItems();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) =>
        prevSlide === slides.length - 1 ? 0 : prevSlide + 1
      );
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const goToPreviousSlide = () => {
    setCurrentSlide((prevSlide) =>
      prevSlide === 0 ? slides.length - 1 : prevSlide - 1
    );
  };

  const goToNextSlide = () => {
    setCurrentSlide((prevSlide) =>
      prevSlide === slides.length - 1 ? 0 : prevSlide + 1
    );
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <section
        className="relative min-h-[650px] flex items-center justify-center bg-cover bg-center transition-all duration-700"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${slides[currentSlide].image})`,
        }}
      >
        <div className="max-w-5xl mx-auto px-6 text-center text-white">
          <h1 className="text-5xl md:text-7xl font-bold">
            {slides[currentSlide].title}
          </h1>

          <p className="mt-5 text-lg md:text-2xl text-gray-200">
            {slides[currentSlide].subtitle}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/menu"
              className="bg-orange-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-orange-600"
            >
              Order Now
            </Link>

            <Link
              href="/track"
              className="bg-white text-gray-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100"
            >
              Track Order
            </Link>
          </div>
        </div>

        <button
          onClick={goToPreviousSlide}
          className="absolute left-5 top-1/2 -translate-y-1/2 bg-white/80 text-gray-900 w-12 h-12 rounded-full text-2xl font-bold hover:bg-white"
        >
          ‹
        </button>

        <button
          onClick={goToNextSlide}
          className="absolute right-5 top-1/2 -translate-y-1/2 bg-white/80 text-gray-900 w-12 h-12 rounded-full text-2xl font-bold hover:bg-white"
        >
          ›
        </button>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
          {slides.map((slide, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-4 h-4 rounded-full ${
                currentSlide === index ? "bg-orange-500" : "bg-white/70"
              }`}
            ></button>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-orange-500">
            Featured Food
          </h2>

          <p className="text-gray-600 mt-2">
            Popular items from our menu
          </p>
        </div>

        {featuredItems.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl shadow-md text-center">
            <p className="text-gray-600">No featured food available.</p>

            <Link
              href="/menu"
              className="inline-block mt-5 bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600"
            >
              View Menu
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredItems.map((item) => (
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
                  <h3 className="text-2xl font-bold text-gray-900">
                    {item.name}
                  </h3>

                  <p className="text-gray-600 mt-2">
                    {item.description || "No description available"}
                  </p>

                  <div className="flex items-center justify-between mt-5">
                    <p className="text-2xl font-bold text-orange-500">
                      ৳ {item.price}
                    </p>

                    <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
                      Available
                    </span>
                  </div>

                  <button
                    onClick={() => handleAddToCart(item)}
                    className="w-full mt-5 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Link
            href="/menu"
            className="inline-block bg-gray-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800"
          >
            View Full Menu
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-2xl shadow-md text-center">
            <h3 className="text-2xl font-bold text-orange-500">
              Fast Delivery
            </h3>
            <p className="text-gray-600 mt-3">
              Get your favorite food delivered quickly.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-md text-center">
            <h3 className="text-2xl font-bold text-orange-500">Fresh Food</h3>
            <p className="text-gray-600 mt-3">
              Fresh and tasty meals prepared with care.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-md text-center">
            <h3 className="text-2xl font-bold text-orange-500">Easy Order</h3>
            <p className="text-gray-600 mt-3">
              Add to cart, checkout and track easily.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}