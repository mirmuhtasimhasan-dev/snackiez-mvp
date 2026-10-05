"use client";

import { useState } from "react";
import Link from "next/link";
import { submitReview, verifyReviewAccess } from "@/app/actions/customer-reviews";
import { CheckIcon } from "@/app/components/icons";
import { prepareImage } from "@/lib/storage";

const inputClass =
  "mt-1.5 block w-full rounded-xl border border-line bg-card px-4 text-base text-fg placeholder:text-muted/60 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30";
const buttonClass =
  "flex h-12 w-full items-center justify-center rounded-full bg-brand font-semibold text-fg transition hover:bg-brand-hover disabled:opacity-60";
const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

export default function ReviewForm({ orderCode, photoEnabled }) {
  const [step, setStep] = useState("phone"); // phone | form | done
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState(null); // { blob, previewUrl }
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleVerify = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      const result = await verifyReviewAccess(orderCode, phone);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setCustomerName(result.data.firstName);
      setStep("form");
    } catch {
      setError("We could not verify your order. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const handlePhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");

    try {
      // Resized in the browser so large phone photos upload quickly.
      const blob = await prepareImage(file);
      if (photo) URL.revokeObjectURL(photo.previewUrl);
      setPhoto({ blob, previewUrl: URL.createObjectURL(blob) });
    } catch (photoError) {
      setError(photoError.message || "The photo could not be read. Please try another image.");
    }
  };

  const removePhoto = () => {
    if (photo) URL.revokeObjectURL(photo.previewUrl);
    setPhoto(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (rating < 1) {
      setError("Please select a rating from 1 to 5 stars.");
      return;
    }
    if (text.trim().length < 10) {
      setError("Please write at least 10 characters about your order.");
      return;
    }

    setBusy(true);
    try {
      const formData = new FormData();
      formData.set("orderCode", orderCode);
      formData.set("phone", phone);
      formData.set("rating", String(rating));
      formData.set("text", text.trim());
      if (photo) {
        const extension = photo.blob.type === "image/webp" ? "webp" : "jpg";
        formData.set("photo", new File([photo.blob], `review.${extension}`, { type: photo.blob.type }));
      }

      const result = await submitReview(formData);
      if (!result.success) {
        setError(result.message);
        return;
      }
      removePhoto();
      setStep("done");
    } catch {
      setError("We could not save your review. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  if (step === "done") {
    return (
      <div className="mt-8 rounded-2xl border border-line bg-card p-6 text-center shadow-soft">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand text-fg">
          <CheckIcon width={28} height={28} strokeWidth={3} />
        </div>
        <h2 className="mt-4 font-display text-3xl tracking-wide">Thank you for your review</h2>
        <p className="mt-2 text-muted">
          We appreciate you taking the time to share your feedback. Your review will be
          published once it has been checked by our team.
        </p>
        <Link href="/menu" className={`${buttonClass} mt-6`}>
          Return to the menu
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-2xl border border-line bg-card p-5 shadow-soft">
      {step === "phone" ? (
        <form onSubmit={handleVerify} noValidate>
          <label htmlFor="phone" className="text-sm font-medium text-fg/90">
            Mobile number used for this order
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="01XXXXXXXXX"
            className={`${inputClass} h-12`}
          />
          <p className="mt-1.5 text-xs text-muted">
            This confirms that the review is from the person who placed the order.
          </p>

          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className={`${buttonClass} mt-5`}>
            {busy ? "Checking…" : "Continue"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <p className="text-sm text-muted">
            Hello {customerName}, please tell us about your order.
          </p>

          <fieldset className="mt-4">
            <legend className="text-sm font-medium text-fg/90">Your rating</legend>
            <div className="mt-1.5 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
                  aria-pressed={rating === value}
                  className={`flex h-11 w-11 items-center justify-center rounded-full text-3xl leading-none transition ${
                    value <= rating ? "text-highlight-ink" : "text-line hover:text-highlight"
                  }`}
                >
                  ★
                </button>
              ))}
              <span className="ml-2 text-sm font-semibold text-fg/80">{RATING_LABELS[rating]}</span>
            </div>
          </fieldset>

          <label htmlFor="text" className="mt-4 block text-sm font-medium text-fg/90">
            Your review
          </label>
          <textarea
            id="text"
            rows={4}
            maxLength={500}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="How was the food and the delivery?"
            className={`${inputClass} py-3`}
          />
          <p className="mt-1 text-right text-xs text-muted">{text.trim().length} / 500 (minimum 10)</p>

          {photoEnabled && (
            <div className="mt-3">
              <p className="text-sm font-medium text-fg/90">Photo (optional)</p>
              {photo ? (
                <div className="mt-1.5 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
                  <img src={photo.previewUrl} alt="" className="h-16 w-16 rounded-xl border border-line object-cover" />
                  <button type="button" onClick={removePhoto} className="text-sm font-semibold text-red-700">
                    Remove photo
                  </button>
                </div>
              ) : (
                <label className="mt-1.5 inline-flex h-11 cursor-pointer items-center rounded-full border border-line bg-alt px-4 text-sm font-semibold text-fg hover:border-fg/20">
                  Add a photo
                  <input type="file" accept="image/*" onChange={handlePhoto} className="sr-only" />
                </label>
              )}
            </div>
          )}

          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className={`${buttonClass} mt-5`}>
            {busy ? "Submitting…" : "Submit review"}
          </button>
        </form>
      )}
    </div>
  );
}
