"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminSettings, setStoreOpen } from "@/app/actions/settings";
import { formatTime, getStoreStatus } from "@/lib/store-hours";

// The big Open / Closed switch at the top of the dashboard.
export default function StoreToggle({ onFailure }) {
  const [settings, setSettings] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getAdminSettings().then((result) => {
      if (result.success) setSettings(result.data);
      else onFailure(result, "Could not load the store status");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!settings) {
    return <div className="mb-8 h-28 animate-pulse rounded-2xl bg-white shadow-md" />;
  }

  const status = getStoreStatus(settings);
  const hours =
    settings.autoSchedule && settings.openTime && settings.closeTime
      ? `${formatTime(settings.openTime)} to ${formatTime(settings.closeTime)}`
      : null;

  const toggle = async () => {
    setBusy(true);
    try {
      const result = await setStoreOpen(!settings.isOpen);
      if (result.success) setSettings(result.data);
      else onFailure(result, "Could not change the store status");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      className={`mb-8 flex flex-col gap-4 rounded-2xl border-2 p-5 shadow-md sm:flex-row sm:items-center sm:justify-between ${
        status.open ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"
      }`}
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-600">Store status</p>
        <p className={`text-4xl font-extrabold ${status.open ? "text-green-700" : "text-red-700"}`}>
          {status.open ? "OPEN" : "CLOSED"}
        </p>
        <p className="mt-1 text-sm text-gray-700">
          {status.open
            ? "Customers can order now."
            : status.reason === "manual"
              ? "Switched off. Customers see the closed banner and cannot order."
              : `Switch is on, but it is outside the auto schedule (${hours}).`}
          {status.open && hours && ` Auto schedule: ${hours}.`}{" "}
          <Link href="/admin/settings" className="font-semibold text-blue-700 underline">
            Settings
          </Link>
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={settings.isOpen}
        aria-label="Store open"
        onClick={toggle}
        disabled={busy}
        className={`relative h-14 w-28 shrink-0 rounded-full transition disabled:opacity-60 ${
          settings.isOpen ? "bg-green-600" : "bg-gray-400"
        }`}
      >
        <span
          className={`absolute top-1 flex h-12 w-12 items-center justify-center rounded-full bg-white text-xs font-bold shadow transition-all ${
            settings.isOpen ? "left-[3.75rem] text-green-700" : "left-1 text-gray-600"
          }`}
        >
          {settings.isOpen ? "ON" : "OFF"}
        </span>
      </button>
    </section>
  );
}
