"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createOrder } from "@/app/actions/orders";
import { useCart } from "@/app/components/CartProvider";
import { CheckIcon, CopyIcon } from "@/app/components/icons";
import {
  BD_PHONE_PATTERN,
  BKASH_TRX_ID_PATTERN,
  normalizeBdPhone,
} from "@/lib/order-config";
import { formatPrice } from "@/lib/site";

const inputClass =
  "mt-1.5 block h-12 w-full rounded-xl border bg-surface-2 px-4 text-base text-cream placeholder:text-muted/60 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30";

function Field({ label, id, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-cream/90">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

function validate(form, paymentMethod) {
  const errors = {};

  if (!form.name.trim()) errors.name = "Please enter your name.";

  if (!BD_PHONE_PATTERN.test(normalizeBdPhone(form.phone))) {
    errors.phone = "Enter a valid Bangladeshi mobile number, e.g. 01712345678.";
  }

  if (!form.block.trim()) errors.block = "Block is required.";
  if (!form.road.trim()) errors.road = "Road is required.";
  if (!form.house.trim()) errors.house = "House is required.";

  if (paymentMethod === "BKASH") {
    if (!BKASH_TRX_ID_PATTERN.test(form.trxId.trim().toUpperCase())) {
      errors.trxId = "Enter the Transaction ID from your bKash confirmation SMS.";
    }

    if (!BD_PHONE_PATTERN.test(normalizeBdPhone(form.senderNumber))) {
      errors.senderNumber = "Enter the bKash number you sent money from.";
    }
  }

  return errors;
}

export default function CheckoutForm({ bkashNumber }) {
  const router = useRouter();
  const { items, subtotal, deliveryFee, total, clearCart } = useCart();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    block: "",
    road: "",
    house: "",
    note: "",
    trxId: "",
    senderNumber: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [copied, setCopied] = useState(false);

  const update = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const inputProps = (field) => ({
    id: field,
    name: field,
    value: form[field],
    onChange: update(field),
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `${field}-error` : undefined,
    className: `${inputClass} ${errors[field] ? "border-red-500/70" : "border-line"}`,
  });

  const copyBkashNumber = async () => {
    try {
      await navigator.clipboard.writeText(bkashNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the number is visible to copy by hand.
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError("");

    const found = validate(form, paymentMethod);
    setErrors(found);

    const firstInvalid = Object.keys(found)[0];
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setSubmitting(true);

    try {
      const result = await createOrder({
        customerName: form.name.trim(),
        phone: normalizeBdPhone(form.phone),
        address: `House ${form.house.trim()}, Road ${form.road.trim()}, Block ${form.block.trim()}, Bashundhara R/A, Dhaka`,
        note: form.note.trim() || undefined,
        paymentMethod,
        trxId: paymentMethod === "BKASH" ? form.trxId.trim().toUpperCase() : undefined,
        senderNumber:
          paymentMethod === "BKASH" ? normalizeBdPhone(form.senderNumber) : undefined,
        items: items.map((item) => ({ menuItemId: item.id, quantity: item.quantity })),
      });

      if (!result.success) {
        setSubmitError(result.message);
        setSubmitting(false);
        return;
      }

      setPlaced(true);
      clearCart();
      router.push(`/order-success?code=${encodeURIComponent(result.data.orderCode)}`);
    } catch {
      setSubmitError("Could not place your order. Please check your connection and try again.");
      setSubmitting(false);
    }
  };

  if (placed) {
    return <p className="mt-12 text-center text-muted">Order placed. Taking you to your order…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-line bg-surface p-8 text-center">
        <p className="text-lg font-semibold">Your cart is empty</p>
        <p className="mt-1 text-sm text-muted">Add something tasty before checking out.</p>
        <Link
          href="/menu"
          className="mt-5 inline-flex h-12 items-center rounded-full bg-brand px-6 font-semibold text-cream hover:bg-brand-hover"
        >
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]"
    >
      <div className="space-y-8">
        <fieldset className="space-y-4">
          <legend className="font-display text-2xl tracking-wide">Your details</legend>

          <Field label="Name" id="name" error={errors.name}>
            <input {...inputProps("name")} autoComplete="name" placeholder="Your name" />
          </Field>

          <Field
            label="Phone"
            id="phone"
            error={errors.phone}
            hint="Our rider will call this number."
          >
            <input
              {...inputProps("phone")}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="01XXXXXXXXX"
            />
          </Field>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-display text-2xl tracking-wide">
            Delivery address
          </legend>
          <p className="-mt-2 text-sm text-muted">
            Bashundhara R/A only, including NSU, IUB and NISS.
          </p>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Block" id="block" error={errors.block}>
              <input {...inputProps("block")} placeholder="C" autoCapitalize="characters" />
            </Field>
            <Field label="Road" id="road" error={errors.road}>
              <input {...inputProps("road")} placeholder="5" inputMode="text" />
            </Field>
            <Field label="House" id="house" error={errors.house}>
              <input {...inputProps("house")} placeholder="12" inputMode="text" />
            </Field>
          </div>

          <Field
            label="Note (optional)"
            id="note"
            hint="Floor, flat, landmark, or anything the kitchen should know."
          >
            <textarea
              {...inputProps("note")}
              rows={3}
              maxLength={300}
              placeholder="e.g. 4th floor, extra spicy"
              className={`${inputClass} h-auto border-line py-3`}
            />
          </Field>
        </fieldset>

        <fieldset>
          <legend className="font-display text-2xl tracking-wide">Payment</legend>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { value: "CASH", title: "Cash on Delivery", detail: "Pay the rider at your door" },
              {
                value: "BKASH",
                title: "bKash",
                detail: bkashNumber ? "Send Money before ordering" : "Unavailable right now",
                disabled: !bkashNumber,
              },
            ].map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand ${
                  paymentMethod === option.value
                    ? "border-brand bg-brand/10"
                    : "border-line bg-surface hover:border-white/20"
                } ${option.disabled ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={option.value}
                  checked={paymentMethod === option.value}
                  disabled={option.disabled}
                  onChange={() => setPaymentMethod(option.value)}
                  className="mt-1 h-4 w-4 accent-brand"
                />
                <span>
                  <span className="block font-semibold">{option.title}</span>
                  <span className="block text-sm text-muted">{option.detail}</span>
                </span>
              </label>
            ))}
          </div>

          {paymentMethod === "BKASH" && bkashNumber && (
            <div className="mt-4 space-y-4 rounded-2xl border border-pink-500/30 bg-pink-500/5 p-4">
              <ol className="list-decimal space-y-2 pl-5 text-sm text-cream/90 marker:font-semibold marker:text-pink-400">
                <li>
                  Open the bKash app and tap <strong>Send Money</strong>.
                </li>
                <li>
                  Enter our number:
                  <span className="ml-2 inline-flex items-center gap-2 rounded-lg bg-black/40 px-2 py-1 font-mono text-base font-semibold text-cream">
                    {bkashNumber}
                    <button
                      type="button"
                      onClick={copyBkashNumber}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-cream/80 hover:bg-white/10 hover:text-cream"
                      aria-label="Copy bKash number"
                    >
                      {copied ? <CheckIcon width={16} height={16} /> : <CopyIcon width={16} height={16} />}
                    </button>
                  </span>
                </li>
                <li>
                  Send exactly <strong className="text-cream">{formatPrice(total)}</strong>.
                </li>
                <li>Confirm with your PIN.</li>
                <li>Enter the Transaction ID from the confirmation SMS below.</li>
              </ol>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Transaction ID" id="trxId" error={errors.trxId}>
                  <input
                    {...inputProps("trxId")}
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="e.g. 9BG7XK2LQP"
                    className={`${inputProps("trxId").className} font-mono uppercase`}
                  />
                </Field>
                <Field label="Sender bKash number" id="senderNumber" error={errors.senderNumber}>
                  <input
                    {...inputProps("senderNumber")}
                    type="tel"
                    inputMode="tel"
                    placeholder="01XXXXXXXXX"
                  />
                </Field>
              </div>
            </div>
          )}
        </fieldset>
      </div>

      <aside className="h-fit rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-24">
        <h2 className="font-display text-2xl tracking-wide">Order summary</h2>

        <ul className="mt-4 divide-y divide-line text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 py-2.5">
              <span className="text-cream/90">
                {item.name} <span className="text-muted">× {item.quantity}</span>
              </span>
              <span className="shrink-0 tabular-nums">
                {formatPrice(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-3 space-y-2 border-t border-line pt-3 text-sm">
          <div className="flex justify-between text-cream/80">
            <dt>Subtotal</dt>
            <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between text-cream/80">
            <dt>Delivery fee</dt>
            <dd className="tabular-nums">{formatPrice(deliveryFee)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-lg font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatPrice(total)}</dd>
          </div>
        </dl>

        {submitError && (
          <p role="alert" className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 flex h-13 w-full items-center justify-center rounded-full bg-brand py-3.5 font-display text-2xl tracking-wider text-cream transition hover:bg-brand-hover active:scale-[0.99] disabled:opacity-60"
        >
          {submitting ? "Placing order…" : `Place Order · ${formatPrice(total)}`}
        </button>

        <p className="mt-3 text-center text-xs text-muted">
          {paymentMethod === "CASH"
            ? "Pay in cash when your food arrives."
            : "We'll verify your bKash payment before cooking."}
        </p>
      </aside>
    </form>
  );
}
