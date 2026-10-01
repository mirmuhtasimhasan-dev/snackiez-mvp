import { createClient } from "@/lib/supabase/client";

// Admin image uploads to the public Supabase Storage bucket. Runs in the
// browser with the signed-in admin's session, so the bucket's policies must
// let authenticated users upload.
export const STORAGE_BUCKET = "menu-images";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Uploads an image to `<folder>/<uuid>.<ext>`. Returns { url } or { error }. */
export async function uploadPublicImage(file, folder) {
  if (!file?.type?.startsWith("image/")) {
    return { error: "Please choose an image file" };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return { error: "Image must be 5 MB or smaller" };
  }

  const supabase = createClient();
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    return { error: `Upload failed: ${error.message}` };
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}
