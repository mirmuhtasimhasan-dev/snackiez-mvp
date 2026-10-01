"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { ActionError, toErrorResult } from "@/lib/action-result";
import type { ActionResult } from "@/lib/action-result";
import { BD_PHONE_PATTERN, normalizeBdPhone } from "@/lib/order-config";
import { SETTINGS_TAG, readSiteSettings, writeSiteSettings } from "@/lib/settings";
import { TIME_PATTERN } from "@/lib/store-hours";
import type { SiteSettingsData, SiteSettingsInput } from "@/types/settings";

// Settings appear on every customer page (banner, footer, prices), so a save
// expires the cached settings and every rendered page right away.
function refreshSite() {
  updateTag(SETTINGS_TAG);
  revalidatePath("/", "layout");
}

function parsePhone(value: string | null | undefined, label: string) {
  const digits = normalizeBdPhone(value ?? "");
  if (!digits) return null;

  if (!BD_PHONE_PATTERN.test(digits)) {
    throw new ActionError(`${label} must be a valid Bangladeshi mobile number, e.g. 01712345678`);
  }

  return digits;
}

function parseUrl(value: string | null | undefined, label: string) {
  const text = value?.trim();
  if (!text) return null;

  let url: URL;
  try {
    url = new URL(text);
  } catch {
    throw new ActionError(`${label} must be a full link starting with https://`);
  }

  if (url.protocol !== "https:") {
    throw new ActionError(`${label} must start with https://`);
  }

  return url.toString().replace(/\/$/, "");
}

function parseTime(value: string | null | undefined, label: string) {
  const text = value?.trim();
  if (!text) return null;

  if (!TIME_PATTERN.test(text)) {
    throw new ActionError(`${label} must be a time like 18:00`);
  }

  return text;
}

function parseSettings(input: SiteSettingsInput, current: SiteSettingsData) {
  const data: Partial<SiteSettingsData> = {};

  if (input.whatsappNumber !== undefined) data.whatsappNumber = parsePhone(input.whatsappNumber, "WhatsApp number");
  if (input.phoneNumber !== undefined) data.phoneNumber = parsePhone(input.phoneNumber, "Phone number");
  if (input.facebookUrl !== undefined) data.facebookUrl = parseUrl(input.facebookUrl, "Facebook link");
  if (input.instagramUrl !== undefined) data.instagramUrl = parseUrl(input.instagramUrl, "Instagram link");
  if (input.tiktokUrl !== undefined) data.tiktokUrl = parseUrl(input.tiktokUrl, "TikTok link");

  if (input.deliveryFee !== undefined) {
    const fee = Number(input.deliveryFee);
    if (input.deliveryFee === "" || !Number.isInteger(fee) || fee < 0 || fee > 1000) {
      throw new ActionError("Delivery fee must be a whole number from 0 to 1000");
    }
    data.deliveryFee = fee;
  }

  if (input.hoursText !== undefined) {
    const hoursText = input.hoursText.trim();
    if (!hoursText || hoursText.length > 40) {
      throw new ActionError("Hours text is required and must be 40 characters or fewer");
    }
    data.hoursText = hoursText;
  }

  if (input.closedMessage !== undefined) {
    const closedMessage = input.closedMessage.trim();
    if (!closedMessage || closedMessage.length > 200) {
      throw new ActionError("Closed message is required and must be 200 characters or fewer");
    }
    data.closedMessage = closedMessage;
  }

  if (input.openTime !== undefined) data.openTime = parseTime(input.openTime, "Opening time");
  if (input.closeTime !== undefined) data.closeTime = parseTime(input.closeTime, "Closing time");

  if (input.autoSchedule !== undefined) {
    if (typeof input.autoSchedule !== "boolean") throw new ActionError("Auto schedule must be on or off");
    data.autoSchedule = input.autoSchedule;
  }

  if (input.isOpen !== undefined) {
    if (typeof input.isOpen !== "boolean") throw new ActionError("Store open must be on or off");
    data.isOpen = input.isOpen;
  }

  const next = { ...current, ...data };
  if (next.autoSchedule && (!next.openTime || !next.closeTime)) {
    throw new ActionError("Set both opening and closing times to use the auto schedule");
  }

  return data;
}

export async function getAdminSettings(): Promise<ActionResult<SiteSettingsData>> {
  try {
    await requireAdmin();
    return { success: true, data: await readSiteSettings() };
  } catch (error) {
    return toErrorResult(error, "Failed to load settings");
  }
}

export async function updateSiteSettings(
  input: SiteSettingsInput
): Promise<ActionResult<SiteSettingsData>> {
  try {
    await requireAdmin();

    const current = await readSiteSettings();
    const settings = await writeSiteSettings(parseSettings(input ?? {}, current));

    refreshSite();
    return { success: true, message: "Settings saved", data: settings };
  } catch (error) {
    return toErrorResult(error, "Saving settings failed");
  }
}

// The big Open / Closed switch on the dashboard.
export async function setStoreOpen(isOpen: boolean): Promise<ActionResult<SiteSettingsData>> {
  try {
    await requireAdmin();

    if (typeof isOpen !== "boolean") {
      throw new ActionError("Store open must be on or off");
    }

    const settings = await writeSiteSettings({ isOpen });

    refreshSite();
    return { success: true, message: isOpen ? "Store is open" : "Store is closed", data: settings };
  } catch (error) {
    return toErrorResult(error, "Could not change the store status");
  }
}
