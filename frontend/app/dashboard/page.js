"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/services/api";

export default function DashboardPage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);

  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  const [categoryName, setCategoryName] = useState("");
  const [editingItemId, setEditingItemId] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");

  const [orderSearchText, setOrderSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
    categoryId: "",
    isAvailable: true,
  });

  const statusOptions = [
    "PENDING",
    "CONFIRMED",
    "PREPARING",
    "DELIVERED",
    "CANCELLED",
  ];

  const handleAuthError = (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("snackiez_admin_token");
      localStorage.removeItem("snackiez_admin");
      router.push("/admin-login");
      return true;
    }

    return false;
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [ordersResponse, categoriesResponse, menuItemsResponse] =
        await Promise.all([
          api.get("/orders"),
          api.get("/menu/categories"),
          api.get("/menu/items"),
        ]);

      setOrders(ordersResponse.data.orders || []);
      setCategories(categoriesResponse.data.categories || []);
      setMenuItems(menuItemsResponse.data.menuItems || []);
    } catch (error) {
      console.log("Dashboard fetch error:", error);

      if (!handleAuthError(error)) {
        alert(error.response?.data?.message || "Failed to fetch dashboard data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("snackiez_admin_token");

    if (!token) {
      router.push("/admin-login");
      return;
    }

    setCheckingAuth(false);
    fetchDashboardData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("snackiez_admin_token");
    localStorage.removeItem("snackiez_admin");
    router.push("/admin-login");
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();

    if (!categoryName.trim()) {
      alert("Please enter category name");
      return;
    }

    try {
      await api.post("/menu/categories", {
        name: categoryName.trim(),
      });

      setCategoryName("");
      fetchDashboardData();
      alert("Category created successfully");
    } catch (error) {
      console.log("Category create error:", error);

      if (!handleAuthError(error)) {
        alert(error.response?.data?.message || "Category creation failed");
      }
    }
  };

  const handleItemFormChange = (e) => {
    const { name, value, type, checked } = e.target;

    setItemForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetItemForm = () => {
    setEditingItemId("");

    setItemForm({
      name: "",
      description: "",
      price: "",
      image: "",
      categoryId: "",
      isAvailable: true,
    });
  };

  const handleCreateOrUpdateMenuItem = async (e) => {
    e.preventDefault();

    if (!itemForm.name.trim() || !itemForm.price || !itemForm.categoryId) {
      alert("Name, price and category are required");
      return;
    }

    try {
      const payload = {
        name: itemForm.name.trim(),
        description: itemForm.description.trim(),
        price: Number(itemForm.price),
        image: itemForm.image.trim(),
        categoryId: itemForm.categoryId,
        isAvailable: itemForm.isAvailable,
      };

      if (editingItemId) {
        await api.put(`/menu/items/${editingItemId}`, payload);
        alert("Menu item updated successfully");
      } else {
        await api.post("/menu/items", payload);
        alert("Menu item created successfully");
      }

      resetItemForm();
      fetchDashboardData();
    } catch (error) {
      console.log("Menu item save error:", error);

      if (!handleAuthError(error)) {
        alert(error.response?.data?.message || "Menu item save failed");
      }
    }
  };

  const handleEditMenuItem = (item) => {
    setEditingItemId(item.id);

    setItemForm({
      name: item.name || "",
      description: item.description || "",
      price: item.price || "",
      image: item.image || "",
      categoryId: item.categoryId || "",
      isAvailable: item.isAvailable,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleToggleAvailability = async (item) => {
    try {
      await api.patch(`/menu/items/${item.id}/availability`, {
        isAvailable: !item.isAvailable,
      });

      fetchDashboardData();
    } catch (error) {
      console.log("Availability update error:", error);

      if (!handleAuthError(error)) {
        alert(error.response?.data?.message || "Failed to update availability");
      }
    }
  };

  const handleDeleteMenuItem = async (itemId) => {
    const confirmDelete = confirm("Are you sure you want to delete this item?");

    if (!confirmDelete) {
      return;
    }

    try {
      await api.delete(`/menu/items/${itemId}`);

      fetchDashboardData();
      alert("Menu item deleted successfully");
    } catch (error) {
      console.log("Menu item delete error:", error);

      if (!handleAuthError(error)) {
        alert(
          error.response?.data?.message ||
            "Delete failed. If this item has orders, you may not be able to delete it."
        );
      }
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);

      await api.patch(`/orders/${orderId}/status`, {
        status: newStatus,
      });

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      alert("Order status updated");
    } catch (error) {
      console.log("Status update error:", error);

      if (!handleAuthError(error)) {
        alert(error.response?.data?.message || "Failed to update order status");
      }
    } finally {
      setUpdatingOrderId("");
    }
  };

  const filteredOrders = orders.filter((order) => {
    const search = orderSearchText.toLowerCase();

    const matchesSearch =
      order.orderCode?.toLowerCase().includes(search) ||
      order.customer?.name?.toLowerCase().includes(search) ||
      order.customer?.phone?.toLowerCase().includes(search) ||
      order.customer?.address?.toLowerCase().includes(search);

    const matchesStatus = statusFilter ? order.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  const totalOrders = orders.length;

  const pendingOrders = orders.filter(
    (order) => order.status === "PENDING"
  ).length;

  const confirmedOrders = orders.filter(
    (order) => order.status === "CONFIRMED"
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.status === "DELIVERED"
  ).length;

  const totalRevenue = orders
    .filter((order) => order.status !== "CANCELLED")
    .reduce((total, order) => total + Number(order.totalAmount), 0);

  if (checkingAuth || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl font-semibold text-gray-700">
          Loading dashboard...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-orange-500">
              Admin Dashboard
            </h1>

            <p className="text-gray-600 mt-2">
              Manage orders, categories and menu items
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="bg-white border border-orange-500 text-orange-500 px-5 py-3 rounded-xl font-semibold"
            >
              Home
            </Link>

            <Link
              href="/menu"
              className="bg-orange-500 text-white px-5 py-3 rounded-xl font-semibold"
            >
              View Menu
            </Link>

            <button
              onClick={fetchDashboardData}
              className="bg-gray-900 text-white px-5 py-3 rounded-xl font-semibold"
            >
              Refresh
            </button>

            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-5 py-3 rounded-xl font-semibold"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-5 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <p className="text-gray-600 font-semibold">Total Orders</p>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">
              {totalOrders}
            </h2>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md">
            <p className="text-gray-600 font-semibold">Pending</p>
            <h2 className="text-3xl font-bold text-yellow-500 mt-2">
              {pendingOrders}
            </h2>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md">
            <p className="text-gray-600 font-semibold">Confirmed</p>
            <h2 className="text-3xl font-bold text-blue-500 mt-2">
              {confirmedOrders}
            </h2>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md">
            <p className="text-gray-600 font-semibold">Delivered</p>
            <h2 className="text-3xl font-bold text-green-500 mt-2">
              {deliveredOrders}
            </h2>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md">
            <p className="text-gray-600 font-semibold">Revenue</p>
            <h2 className="text-3xl font-bold text-orange-500 mt-2">
              ৳ {totalRevenue}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-5">
              Add Category
            </h2>

            <form onSubmit={handleCreateCategory}>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-orange-500"
                placeholder="Example: Burger"
              />

              <button
                type="submit"
                className="w-full mt-4 bg-orange-500 text-white py-3 rounded-xl font-bold"
              >
                Add Category
              </button>
            </form>

            <div className="mt-6">
              <h3 className="font-bold text-gray-900 mb-3">Categories</h3>

              {categories.length === 0 ? (
                <p className="text-gray-600">No categories found.</p>
              ) : (
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="bg-gray-50 px-4 py-3 rounded-xl flex items-center justify-between"
                    >
                      <span className="font-semibold text-gray-900">
                        {category.name}
                      </span>

                      <span className="text-sm text-gray-500">
                        {category.menuItems?.length || 0} items
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-5">
              {editingItemId ? "Edit Menu Item" : "Add Menu Item"}
            </h2>

            <form
              onSubmit={handleCreateOrUpdateMenuItem}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Item Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={itemForm.name}
                  onChange={handleItemFormChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-orange-500"
                  placeholder="Chicken Burger"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Price
                </label>

                <input
                  type="number"
                  name="price"
                  value={itemForm.price}
                  onChange={handleItemFormChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-orange-500"
                  placeholder="180"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Category
                </label>

                <select
                  name="categoryId"
                  value={itemForm.categoryId}
                  onChange={handleItemFormChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-orange-500 bg-white"
                >
                  <option value="">Select Category</option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Image URL
                </label>

                <input
                  type="text"
                  name="image"
                  value={itemForm.image}
                  onChange={handleItemFormChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-orange-500"
                  placeholder="https://placehold.co/400x250?text=Food"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-700 font-semibold mb-2">
                  Description
                </label>

                <textarea
                  name="description"
                  value={itemForm.description}
                  onChange={handleItemFormChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-orange-500"
                  placeholder="Write item description"
                  rows="3"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-3">
                <input
                  type="checkbox"
                  name="isAvailable"
                  checked={itemForm.isAvailable}
                  onChange={handleItemFormChange}
                  className="w-5 h-5"
                />

                <label className="text-gray-700 font-semibold">Available</label>
              </div>

              <div className="md:col-span-2 flex gap-4">
                <button
                  type="submit"
                  className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold"
                >
                  {editingItemId ? "Update Menu Item" : "Add Menu Item"}
                </button>

                {editingItemId && (
                  <button
                    type="button"
                    onClick={resetItemForm}
                    className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Menu Items
          </h2>

          {menuItems.length === 0 ? (
            <p className="text-center text-gray-600 py-10">
              No menu items found.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {menuItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-2xl overflow-hidden"
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
                    className="w-full h-44 object-cover"
                  />

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {item.name}
                        </h3>

                        <p className="text-gray-600 text-sm mt-1">
                          {item.category?.name}
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

                    <p className="text-2xl font-bold text-orange-500 mt-4">
                      ৳ {item.price}
                    </p>

                    <div className="grid grid-cols-1 gap-3 mt-5">
                      <button
                        onClick={() => handleEditMenuItem(item)}
                        className="bg-blue-500 text-white py-2 rounded-xl font-semibold"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`py-2 rounded-xl font-semibold ${
                          item.isAvailable
                            ? "bg-gray-900 text-white"
                            : "bg-green-500 text-white"
                        }`}
                      >
                        {item.isAvailable
                          ? "Make Unavailable"
                          : "Make Available"}
                      </button>

                      <button
                        onClick={() => handleDeleteMenuItem(item.id)}
                        className="bg-red-500 text-white py-2 rounded-xl font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
              <p className="text-gray-600 mt-1">
                View and update customer orders
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={orderSearchText}
                onChange={(e) => setOrderSearchText(e.target.value)}
                className="border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-orange-500"
                placeholder="Search order"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-orange-500 bg-white"
              >
                <option value="">All Status</option>

                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <p className="text-center text-gray-600 py-10">No orders found.</p>
          ) : (
            <div className="space-y-5">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-2xl p-5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {order.orderCode}
                      </h3>

                      <p className="text-gray-600 mt-1">
                        Customer: {order.customer?.name}
                      </p>

                      <p className="text-gray-600">
                        Phone: {order.customer?.phone}
                      </p>

                      <p className="text-gray-600">
                        Address: {order.customer?.address || "No address"}
                      </p>

                      <p className="text-gray-600">
                        Payment: {order.payment?.method || "CASH"} /{" "}
                        {order.payment?.status || "UNPAID"}
                      </p>
                    </div>

                    <div className="lg:text-right">
                      <p className="text-2xl font-bold text-orange-500">
                        ৳ {order.totalAmount}
                      </p>

                      <select
                        value={order.status}
                        disabled={updatingOrderId === order.id}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value)
                        }
                        className="mt-3 border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-orange-500 bg-white"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-5 border-t pt-4">
                    <h4 className="font-bold text-gray-900 mb-3">
                      Ordered Items
                    </h4>

                    <div className="space-y-2">
                      {order.items?.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl"
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

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href={`/track?code=${order.orderCode}`}
                      className="bg-gray-900 text-white px-4 py-2 rounded-xl font-semibold"
                    >
                      Track Link
                    </Link>

                    <Link
                      href={`/receipt?code=${order.orderCode}`}
                      className="bg-orange-500 text-white px-4 py-2 rounded-xl font-semibold"
                    >
                      Receipt
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}