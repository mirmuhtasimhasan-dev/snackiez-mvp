import { createClient } from "@/lib/supabase/client";
import { STORAGE_BUCKET, storagePathFromUrl } from "@/lib/storage-paths";

// Browser-side admin image uploads to the public Supabase Storage bucket.
// Uses the signed-in admin's session, so the bucket's policies must let
// authenticated users upload and delete.

const MAX_SOURCE_BYTES = 25 * 1024 * 1024; // before resizing
const MAX_DIMENSION = 1200;
const TARGET_BYTES = 200 * 1024;
const QUALITY_STEPS = [0.8, 0.72, 0.64, 0.56];

async function decode(file) {
  if ("createImageBitmap" in window) {
    try {
      // Applies the photo's EXIF rotation, so phone shots stay upright.
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Fall through to <img>, which some browsers decode more formats with.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Resizes to at most 1200px on the long side and re-encodes as WebP (JPEG
 * where the browser cannot encode WebP, e.g. older Safari), lowering quality
 * until it is about 200 KB or less.
 */
export async function prepareImage(file) {
  if (!file?.type?.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("That image is over 25 MB. Please pick a smaller one.");
  }

  let source;
  try {
    source = await decode(file);
  } catch {
    throw new Error("This image format can't be read here. Try a JPG or PNG.");
  }

  const width = source.width;
  const height = source.height;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));

  const context = canvas.getContext("2d");
  context.imageSmoothingQuality = "high";
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  source.close?.();

  let blob = null;
  for (const quality of QUALITY_STEPS) {
    blob = await toBlob(canvas, "image/webp", quality);
    if (blob && blob.type !== "image/webp") {
      // No WebP encoder: use JPEG with the same quality ladder.
      blob = await toBlob(canvas, "image/jpeg", quality);
    }
    if (blob && blob.size <= TARGET_BYTES) break;
  }

  if (!blob) {
    throw new Error("Could not process this image.");
  }

  return blob;
}

/**
 * Uploads a prepared image to `<folder>/<timestamp>-<uuid>.<ext>` and reports
 * progress (0 to 1). Uses the Storage REST API directly because supabase-js
 * does not expose upload progress. Resolves to the public URL.
 */
export async function uploadImage(blob, folder, onProgress = () => {}) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Your admin session has expired. Please log in again.");
  }

  const extension = blob.type === "image/webp" ? "webp" : "jpg";
  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "");

  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${baseUrl}/storage/v1/object/${STORAGE_BUCKET}/${path}`);
    xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
    xhr.setRequestHeader("apikey", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    xhr.setRequestHeader("Content-Type", blob.type);
    xhr.setRequestHeader("Cache-Control", "max-age=31536000");
    xhr.setRequestHeader("x-upsert", "false");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(1);
        resolve();
        return;
      }
      let message = `Upload failed (${xhr.status})`;
      try {
        message = JSON.parse(xhr.responseText).message || message;
      } catch {
        // Keep the status-based message.
      }
      reject(new Error(message));
    };
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
    xhr.send(blob);
  });

  return supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Deletes an image this browser uploaded but that was never saved to a
 * record. Saved images are cleaned up by the server after a successful save.
 */
export async function discardUnsavedImage(url) {
  const path = storagePathFromUrl(url);
  if (!path) return;

  const { error } = await createClient().storage.from(STORAGE_BUCKET).remove([path]);
  if (error) console.warn("Could not delete unsaved upload:", error.message);
}
