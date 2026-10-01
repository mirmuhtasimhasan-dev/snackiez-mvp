import { readSiteSettings, writeSiteSettings } from "@/lib/settings";
import { formatTime, getStoreStatus } from "@/lib/store-hours";
import { escapeHtml } from "@/lib/telegram";
import type { SiteSettingsData } from "@/types/settings";

// /open, /close and /status from the Telegram group. Returns the reply text
// (HTML) and whether the settings changed; the webhook does the sending.

export type StoreCommand = "open" | "close" | "status";

/** "/open", "/close@BitezzBot now" -> "open" | "close". Null for anything else. */
export function parseStoreCommand(text: string | undefined): StoreCommand | null {
  const match = text?.trim().match(/^\/(open|close|status)(?:@\w+)?(?:\s|$)/i);
  return match ? (match[1].toLowerCase() as StoreCommand) : null;
}

function describe(settings: SiteSettingsData) {
  const status = getStoreStatus(settings);
  const lines = [status.open ? "🟢 <b>Store is OPEN</b>" : "🔴 <b>Store is CLOSED</b>"];

  if (status.reason === "manual") {
    lines.push("Closed with the switch. Send /open to open.");
  }

  const opens = formatTime(settings.openTime);
  const closes = formatTime(settings.closeTime);
  if (settings.autoSchedule && opens && closes) {
    lines.push(`Auto schedule: ${opens} to ${closes} (Dhaka time)`);
    if (status.reason === "schedule") {
      lines.push(
        `The switch is on, but it is outside opening hours. Customers can order from ${opens}. Turn off auto schedule in admin Settings to open now.`
      );
    }
  } else {
    lines.push("Auto schedule: off");
  }

  lines.push(`Hours text: ${escapeHtml(settings.hoursText)}`, `Delivery fee: TK ${settings.deliveryFee}`);
  return lines.join("\n");
}

export async function runStoreCommand(command: StoreCommand) {
  if (command === "status") {
    return { changed: false, reply: describe(await readSiteSettings()) };
  }

  const isOpen = command === "open";
  const before = await readSiteSettings();
  const settings = before.isOpen === isOpen ? before : await writeSiteSettings({ isOpen });

  return { changed: before.isOpen !== isOpen, reply: describe(settings) };
}
