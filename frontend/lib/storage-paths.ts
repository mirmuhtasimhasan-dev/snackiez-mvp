// Shared by browser and server code: where admin images live in Supabase
// Storage, and how to tell our uploads apart from pasted URLs or /public files.

export const STORAGE_BUCKET = "menu-images";

export const IMAGE_FOLDERS = {
  items: "items",
  categories: "categories",
  reviews: "reviews",
} as const;

export type ImageFolder = (typeof IMAGE_FOLDERS)[keyof typeof IMAGE_FOLDERS];

function publicPrefix() {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  return base ? `${base}/storage/v1/object/public/${STORAGE_BUCKET}/` : null;
}

/**
 * The object path ("items/123-abc.webp") for a public URL in our bucket, or
 * null for anything else (pasted links, /public files), which must never be
 * deleted from storage.
 */
export function storagePathFromUrl(url: string | null | undefined) {
  const prefix = publicPrefix();
  if (!url || !prefix || !url.startsWith(prefix)) return null;

  const path = decodeURIComponent(url.slice(prefix.length).split("?")[0]);
  const folders = Object.values(IMAGE_FOLDERS) as string[];
  return folders.includes(path.split("/")[0]) && !path.includes("..") ? path : null;
}
