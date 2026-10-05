import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// Cached data for the customer pages. The database is a network round trip
// away for every query, so pages read from the Next data cache instead and
// each admin action (and the Telegram webhook) expires the matching tag.
//
// What stays fresh and how:
// - Stock and sold out: part of the "menu" tag, which is expired on every
//   order status change (the only time stock moves) and every menu edit.
// - Store open/closed: comes from site settings (own tag, expired on save)
//   and is computed per request from the current Dhaka time.
// - Placing an order never uses this cache; it reads the database directly.

export const CACHE_TAGS = {
  menu: "menu",
  reviews: "reviews",
  videos: "creator-videos",
} as const;

// Safety net if something changes the database without expiring a tag
// (for example running the seed script).
const REVALIDATE_SECONDS = 300;

// Development only: how long each database query takes.
async function timed<T>(label: string, query: () => Promise<T>): Promise<T> {
  if (process.env.NODE_ENV !== "development") {
    return query();
  }

  const start = performance.now();
  try {
    return await query();
  } finally {
    console.log(`[db] ${label}: ${Math.round(performance.now() - start)}ms`);
  }
}

/**
 * Every category with its items, oldest first. One query feeds the menu page
 * and the home page (best sellers, category shortcuts, new item banner).
 */
export const getMenu = unstable_cache(
  () =>
    timed("menu (categories + items)", () =>
      prisma.category.findMany({
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          shortName: true,
          image: true,
          menuItems: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              image: true,
              isAvailable: true,
              isFeatured: true,
              stockQty: true,
              createdAt: true,
            },
          },
        },
      })
    ),
  ["site-menu"],
  { tags: [CACHE_TAGS.menu], revalidate: REVALIDATE_SECONDS }
);

/** Approved, visible reviews in display order. */
export const getPublicReviews = unstable_cache(
  () =>
    timed("reviews", () =>
      prisma.review.findMany({
        where: { isVisible: true, status: "APPROVED" },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          text: true,
          rating: true,
          image: true,
          source: true,
          isVerified: true,
        },
      })
    ),
  ["site-reviews"],
  { tags: [CACHE_TAGS.reviews], revalidate: REVALIDATE_SECONDS }
);

/** Visible creator videos in display order. */
export const getCreatorVideos = unstable_cache(
  () =>
    timed("creator videos", () =>
      prisma.creatorVideo.findMany({
        where: { isVisible: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true, handle: true, instagramUrl: true, videoUrl: true, posterUrl: true },
      })
    ),
  ["site-creator-videos"],
  { tags: [CACHE_TAGS.videos], revalidate: REVALIDATE_SECONDS }
);
