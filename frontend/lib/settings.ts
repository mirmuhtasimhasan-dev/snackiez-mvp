import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { SiteSettingsData } from "@/types/settings";

export const SETTINGS_TAG = "site-settings";
const SETTINGS_ID = 1;

// Used to create the row the first time, and as a fallback if the database
// cannot be reached, so the site still renders.
export const DEFAULT_SETTINGS: SiteSettingsData = {
  whatsappNumber: "01816453795",
  phoneNumber: null,
  facebookUrl: "https://facebook.com/bitezzbd",
  instagramUrl: null,
  tiktokUrl: null,
  deliveryFee: 60,
  hoursText: "Open till 4 AM",
  openTime: null,
  closeTime: null,
  autoSchedule: false,
  isOpen: true,
  closedMessage: "We are closed right now. Please order again later.",
};

function toData(row: SiteSettingsData & { id?: number; updatedAt?: Date }): SiteSettingsData {
  return {
    whatsappNumber: row.whatsappNumber,
    phoneNumber: row.phoneNumber,
    facebookUrl: row.facebookUrl,
    instagramUrl: row.instagramUrl,
    tiktokUrl: row.tiktokUrl,
    deliveryFee: row.deliveryFee,
    hoursText: row.hoursText,
    openTime: row.openTime,
    closeTime: row.closeTime,
    autoSchedule: row.autoSchedule,
    isOpen: row.isOpen,
    closedMessage: row.closedMessage,
  };
}

/**
 * Straight from the database, creating the single row if it does not exist.
 * Use where staleness is not acceptable: placing orders, admin, Telegram.
 */
export async function readSiteSettings(): Promise<SiteSettingsData> {
  const row = await prisma.siteSettings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: { id: SETTINGS_ID, ...DEFAULT_SETTINGS },
  });

  return toData(row);
}

export async function writeSiteSettings(data: Partial<SiteSettingsData>): Promise<SiteSettingsData> {
  const row = await prisma.siteSettings.upsert({
    where: { id: SETTINGS_ID },
    update: data,
    create: { id: SETTINGS_ID, ...DEFAULT_SETTINGS, ...data },
  });

  return toData(row);
}

const cachedSettings = unstable_cache(readSiteSettings, [SETTINGS_TAG], {
  tags: [SETTINGS_TAG],
  // Safety net; saves from admin and Telegram expire the tag immediately.
  revalidate: 60,
});

/** Cached settings for rendering pages. Falls back to defaults on a database error. */
export async function getSiteSettings(): Promise<SiteSettingsData> {
  try {
    return await cachedSettings();
  } catch (error) {
    console.error("[settings] could not load site settings, using defaults:", error);
    return DEFAULT_SETTINGS;
  }
}
