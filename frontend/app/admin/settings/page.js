"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getAdminSettings, updateSiteSettings } from "@/app/actions/settings";
import { formatTime, getStoreStatus } from "@/lib/store-hours";

const inputClass =
  "w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-orange-500 bg-white";

function toForm(settings) {
  return {
    whatsappNumber: settings.whatsappNumber ?? "",
    phoneNumber: settings.phoneNumber ?? "",
    facebookUrl: settings.facebookUrl ?? "",
    instagramUrl: settings.instagramUrl ?? "",
    tiktokUrl: settings.tiktokUrl ?? "",
    deliveryFee: String(settings.deliveryFee),
    hoursText: settings.hoursText,
    openTime: settings.openTime ?? "",
    closeTime: settings.closeTime ?? "",
    autoSchedule: settings.autoSchedule,
    isOpen: settings.isOpen,
    closedMessage: settings.closedMessage,
  };
}

function Field({ label, hint, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block font-semibold text-gray-700">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: "ok" | "error", text }

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(async ({ data: { user } }) => {
        if (!user) {
          router.push("/admin/login");
          return;
        }

        const result = await getAdminSettings();
        if (result.unauthorized) {
          router.push("/admin/login");
        } else if (result.success) {
          setForm(toForm(result.data));
        } else {
          setMessage({ type: "error", text: result.message });
        }
      });
  }, [router]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setMessage(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const result = await updateSiteSettings(form);

      if (result.unauthorized) {
        router.push("/admin/login");
      } else if (result.success) {
        setForm(toForm(result.data));
        setMessage({ type: "ok", text: "Settings saved. The site is updated." });
      } else {
        setMessage({ type: "error", text: result.message });
      }
    } finally {
      setSaving(false);
    }
  };

  if (!form) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className={`text-lg font-semibold ${message ? "text-red-600" : "text-gray-700"}`}>
          {message?.text ?? "Loading…"}
        </p>
      </main>
    );
  }

  // Preview with the same rule the site and server use.
  const status = getStoreStatus({
    isOpen: form.isOpen,
    autoSchedule: form.autoSchedule,
    openTime: form.openTime || null,
    closeTime: form.closeTime || null,
  });

  return (
    <main className="px-4 py-8 md:px-8">
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-orange-500">Settings</h1>
          <p className="mt-1 text-gray-600">Contact links and store controls for the customer site.</p>
        </div>

        <section className="rounded-2xl bg-white p-6 shadow-md">
          <h2 className="text-xl font-bold">Store status</h2>
          <p
            className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-semibold ${
              status.open ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {status.open
              ? "With these settings the store is OPEN now"
              : status.reason === "manual"
                ? "With these settings the store is CLOSED (switched off)"
                : "With these settings the store is CLOSED (outside opening hours)"}
          </p>

          <div className="mt-4 space-y-4">
            <label className="flex items-center gap-3 font-semibold text-gray-700">
              <input type="checkbox" name="isOpen" checked={form.isOpen} onChange={handleChange} className="h-5 w-5" />
              Store is open (master switch)
            </label>

            <label className="flex items-center gap-3 font-semibold text-gray-700">
              <input type="checkbox" name="autoSchedule" checked={form.autoSchedule} onChange={handleChange} className="h-5 w-5" />
              Auto schedule: only open between the times below
            </label>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Opening time" htmlFor="openTime" hint={formatTime(form.openTime) ?? "Dhaka time"}>
                <input id="openTime" name="openTime" type="time" value={form.openTime} onChange={handleChange} className={inputClass} />
              </Field>
              <Field
                label="Closing time"
                htmlFor="closeTime"
                hint={formatTime(form.closeTime) ? `${formatTime(form.closeTime)} (can be after midnight)` : "Can be after midnight, e.g. 04:00"}
              >
                <input id="closeTime" name="closeTime" type="time" value={form.closeTime} onChange={handleChange} className={inputClass} />
              </Field>
            </div>

            <Field label="Closed message" htmlFor="closedMessage" hint="Shown in the banner and at checkout while closed.">
              <textarea id="closedMessage" name="closedMessage" rows={2} maxLength={200} value={form.closedMessage} onChange={handleChange} className={inputClass} />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-md">
          <h2 className="text-xl font-bold">Delivery and hours</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Delivery fee (TK)" htmlFor="deliveryFee" hint="Added to every new order. Old orders keep their fee.">
              <input id="deliveryFee" name="deliveryFee" type="number" min="0" max="1000" step="1" value={form.deliveryFee} onChange={handleChange} className={inputClass} />
            </Field>
            <Field label="Hours text" htmlFor="hoursText" hint="Shown across the site, e.g. Open till 4 AM.">
              <input id="hoursText" name="hoursText" maxLength={40} value={form.hoursText} onChange={handleChange} className={inputClass} />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-md">
          <h2 className="text-xl font-bold">Contact and social links</h2>
          <p className="mt-1 text-sm text-gray-500">Leave a field empty to hide its button on the site.</p>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="WhatsApp number" htmlFor="whatsappNumber" hint="BD mobile, e.g. 01816453795">
              <input id="whatsappNumber" name="whatsappNumber" type="tel" inputMode="tel" value={form.whatsappNumber} onChange={handleChange} className={inputClass} placeholder="01XXXXXXXXX" />
            </Field>
            <Field label="Phone number" htmlFor="phoneNumber" hint="For the call button">
              <input id="phoneNumber" name="phoneNumber" type="tel" inputMode="tel" value={form.phoneNumber} onChange={handleChange} className={inputClass} placeholder="01XXXXXXXXX" />
            </Field>
            <Field label="Facebook link" htmlFor="facebookUrl">
              <input id="facebookUrl" name="facebookUrl" type="url" value={form.facebookUrl} onChange={handleChange} className={inputClass} placeholder="https://facebook.com/…" />
            </Field>
            <Field label="Instagram link" htmlFor="instagramUrl">
              <input id="instagramUrl" name="instagramUrl" type="url" value={form.instagramUrl} onChange={handleChange} className={inputClass} placeholder="https://instagram.com/…" />
            </Field>
            <Field label="TikTok link" htmlFor="tiktokUrl">
              <input id="tiktokUrl" name="tiktokUrl" type="url" value={form.tiktokUrl} onChange={handleChange} className={inputClass} placeholder="https://tiktok.com/@…" />
            </Field>
          </div>
        </section>

        {message && (
          <p
            role={message.type === "error" ? "alert" : "status"}
            className={`rounded-xl p-3 text-sm font-semibold ${
              message.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
            }`}
          >
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-orange-500 py-3 font-bold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
      </form>
    </main>
  );
}
