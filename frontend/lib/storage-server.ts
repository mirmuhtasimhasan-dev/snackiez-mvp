import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { STORAGE_BUCKET, storagePathFromUrl } from "@/lib/storage-paths";

/**
 * Deletes a replaced or removed image from Supabase Storage, but only if it
 * is one of our uploads and no menu item, category or review still points at
 * it. Runs with the admin's session. Never throws: a leftover file is better
 * than a failed save.
 */
export async function deleteImageIfUnused(url: string | null | undefined) {
  const path = storagePathFromUrl(url);
  if (!path || !url) return;

  try {
    const [items, categories, reviews] = await Promise.all([
      prisma.menuItem.count({ where: { image: url } }),
      prisma.category.count({ where: { image: url } }),
      prisma.review.count({ where: { image: url } }),
    ]);

    if (items + categories + reviews > 0) return;

    const supabase = await createClient();
    const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);

    if (error) {
      console.error(`[storage] could not delete ${path}:`, error.message);
    }
  } catch (error) {
    console.error(`[storage] could not delete ${path}:`, error);
  }
}
