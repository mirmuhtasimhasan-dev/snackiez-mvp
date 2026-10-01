"use client";

import { useStore } from "./StoreProvider";
import { ClockIcon } from "./icons";

// Shown at the top of every customer page while the store is closed.
export default function ClosedBanner() {
  const { open, opensAt, settings } = useStore();

  if (open) {
    return null;
  }

  return (
    <div role="status" className="bg-espresso px-4 py-2.5 text-cream">
      <p className="mx-auto flex max-w-6xl items-start justify-center gap-2 text-center text-sm font-medium">
        <ClockIcon width={18} height={18} className="mt-0.5 shrink-0 text-highlight" />
        <span>
          {settings.closedMessage}
          {opensAt && <span className="font-semibold text-highlight"> Opens at {opensAt}.</span>}
        </span>
      </p>
    </div>
  );
}
