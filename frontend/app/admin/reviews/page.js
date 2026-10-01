"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  createReview,
  deleteReview,
  getReviews,
  toggleReviewVisibility,
  updateReview,
} from "@/app/actions/reviews";
import { REVIEW_IMAGE_FOLDER, REVIEW_SOURCES } from "@/lib/reviews";
import { uploadPublicImage } from "@/lib/storage";

const emptyForm = {
  name: "",
  text: "",
  rating: "5",
  source: "",
  image: "",
  sortOrder: "0",
  isVisible: true,
};

const inputClass =
  "w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-orange-500 bg-white";

function Stars({ rating }) {
  return (
    <span className="text-amber-500" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}
      <span className="text-gray-300">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState("");

  const handleFailure = (result, fallbackMessage) => {
    if (result.unauthorized) {
      router.push("/admin/login");
      return;
    }

    alert(result.message || fallbackMessage);
  };

  const fetchReviews = async () => {
    setLoading(true);

    try {
      const result = await getReviews();

      if (!result.success) {
        handleFailure(result, "Failed to fetch reviews");
        return;
      }

      setReviews(result.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (!user) {
          router.push("/admin/login");
          return;
        }

        setCheckingAuth(false);
        fetchReviews();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const resetForm = () => {
    setEditingId("");
    setForm(emptyForm);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEdit = (review) => {
    setEditingId(review.id);
    setForm({
      name: review.name,
      text: review.text,
      rating: String(review.rating),
      source: review.source || "",
      image: review.image || "",
      sortOrder: String(review.sortOrder),
      isVisible: review.isVisible,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const { url, error } = await uploadPublicImage(file, REVIEW_IMAGE_FOLDER);

      if (error) {
        alert(error);
        event.target.value = "";
        return;
      }

      setForm((prev) => ({ ...prev, image: url }));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.text.trim()) {
      alert("Name and review text are required");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name,
        text: form.text,
        rating: Number(form.rating),
        source: form.source || null,
        image: form.image || null,
        sortOrder: form.sortOrder === "" ? 0 : Number(form.sortOrder),
        isVisible: form.isVisible,
      };

      const result = editingId
        ? await updateReview(editingId, payload)
        : await createReview(payload);

      if (!result.success) {
        handleFailure(result, "Saving the review failed");
        return;
      }

      resetForm();
      fetchReviews();
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (review) => {
    setBusyId(review.id);

    try {
      const result = await toggleReviewVisibility(review.id, !review.isVisible);

      if (!result.success) {
        handleFailure(result, "Failed to update review");
        return;
      }

      setReviews((prev) => prev.map((item) => (item.id === review.id ? result.data : item)));
    } finally {
      setBusyId("");
    }
  };

  const handleDelete = async (review) => {
    if (!confirm(`Delete the review from ${review.name}?`)) return;

    setBusyId(review.id);

    try {
      const result = await deleteReview(review.id);

      if (!result.success) {
        handleFailure(result, "Failed to delete review");
        return;
      }

      if (editingId === review.id) resetForm();
      setReviews((prev) => prev.filter((item) => item.id !== review.id));
    } finally {
      setBusyId("");
    }
  };

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-lg font-semibold text-gray-700">Loading…</p>
      </main>
    );
  }

  return (
    <main className="px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-orange-500">Reviews</h1>
        <p className="mt-1 text-gray-600">
          Visible reviews appear on the home page, lowest sort order first. If none are
          visible, the section is hidden.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid grid-cols-1 gap-4 rounded-2xl bg-white p-6 shadow-md md:grid-cols-2"
        >
          <h2 className="text-xl font-bold md:col-span-2">
            {editingId ? "Edit review" : "Add review"}
          </h2>

          <div>
            <label htmlFor="name" className="mb-2 block font-semibold text-gray-700">
              Name
            </label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              className={inputClass}
              placeholder="Tanvir, NSU"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="rating" className="mb-2 block font-semibold text-gray-700">
                Rating
              </label>
              <select id="rating" name="rating" value={form.rating} onChange={handleChange} className={inputClass}>
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value} ★
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="source" className="mb-2 block font-semibold text-gray-700">
                Source
              </label>
              <select id="source" name="source" value={form.source} onChange={handleChange} className={inputClass}>
                <option value="">None</option>
                {REVIEW_SOURCES.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sortOrder" className="mb-2 block font-semibold text-gray-700">
                Sort order
              </label>
              <input
                id="sortOrder"
                name="sortOrder"
                type="number"
                step="1"
                value={form.sortOrder}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="text" className="mb-2 block font-semibold text-gray-700">
              Review
            </label>
            <textarea
              id="text"
              name="text"
              rows={3}
              value={form.text}
              onChange={handleChange}
              className={inputClass}
              placeholder="What the customer said"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="imageFile" className="mb-2 block font-semibold text-gray-700">
              Image (optional screenshot or avatar)
            </label>
            <div className="flex flex-wrap items-center gap-4">
              {form.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image} alt="" className="h-16 w-16 rounded-xl border object-cover" />
              )}
              <input
                ref={fileInputRef}
                id="imageFile"
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                className="text-sm"
              />
              {uploading && <span className="text-sm text-gray-600">Uploading…</span>}
              {form.image && !uploading && (
                <button
                  type="button"
                  onClick={() => {
                    setForm((prev) => ({ ...prev, image: "" }));
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-sm font-semibold text-red-600"
                >
                  Remove image
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 md:col-span-2">
            <input
              id="isVisible"
              name="isVisible"
              type="checkbox"
              checked={form.isVisible}
              onChange={handleChange}
              className="h-5 w-5"
            />
            <label htmlFor="isVisible" className="font-semibold text-gray-700">
              Show on home page
            </label>
          </div>

          <div className="flex gap-4 md:col-span-2">
            <button
              type="submit"
              disabled={saving || uploading}
              className="w-full rounded-xl bg-orange-500 py-3 font-bold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : editingId ? "Update review" : "Add review"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="w-full rounded-xl bg-gray-900 py-3 font-bold text-white"
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-md">
          <h2 className="text-xl font-bold">All reviews</h2>

          {loading ? (
            <p className="py-8 text-center text-gray-600">Loading reviews…</p>
          ) : reviews.length === 0 ? (
            <p className="py-8 text-center text-gray-600">
              No reviews yet. The home page reviews section stays hidden until you add one.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-200">
              {reviews.map((review) => (
                <li key={review.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start">
                  <span className="w-10 shrink-0 text-sm font-semibold text-gray-500">
                    #{review.sortOrder}
                  </span>

                  {review.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={review.image} alt="" className="h-14 w-14 shrink-0 rounded-xl border object-cover" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold">{review.name}</span>
                      <Stars rating={review.rating} />
                      {review.source && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                          {review.source}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          review.isVisible ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {review.isVisible ? "Visible" : "Hidden"}
                      </span>
                    </div>
                    <p className="mt-1 text-gray-700">{review.text}</p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(review)}
                      className="rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold text-white"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggle(review)}
                      disabled={busyId === review.id}
                      className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {review.isVisible ? "Hide" : "Show"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(review)}
                      disabled={busyId === review.id}
                      className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
