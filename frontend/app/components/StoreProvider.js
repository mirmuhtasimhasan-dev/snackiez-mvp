"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { formatTime, getStoreStatus } from "@/lib/store-hours";

const StoreContext = createContext(null);

// Site settings (contact links, fee, hours) plus the live open/closed state.
// The server sends the status it computed; after that the browser re-checks
// every 30 seconds with the same helper, so a page left open still closes
// and opens on schedule.
export function StoreProvider({ settings, initialStatus, children }) {
  const [now, setNow] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const value = useMemo(() => {
    const status = now ? getStoreStatus(settings, now) : initialStatus;

    return {
      settings,
      open: status.open,
      // "schedule" = outside opening hours, "manual" = switched off by admin.
      closedReason: status.open ? null : status.reason,
      opensAt: status.reason === "schedule" ? formatTime(settings.openTime) : null,
    };
  }, [settings, initialStatus, now]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);

  if (!context) {
    throw new Error("useStore must be used inside StoreProvider");
  }

  return context;
}
