"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { OrderStatus, Prisma, ReviewStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ActionError, toErrorResult } from "@/lib/action-result";
import type { ActionResult } from "@/lib/action-result";
import { BD_PHONE_PATTERN, normalizeBdPhone } from "@/lib/order-config";
import { isRateLimited } from "@/lib/rate-limit";
import { firstName, reviewerName } from "@/lib/review-link";
import { createAdminClient } from "@/lib/supabase/admin";
import { IMAGE_FOLDERS, STORAGE_BUCKET } from "@/lib/storage-paths";

// Public actions for /review/[orderCode]. A customer may review only their
// own delivered order: the phone number must match the one on the order.

const MAX_PHOTO_BYTES = 900 * 1024;
const PHOTO_TYPES: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };

// One message for "no such order" and "wrong phone", so the page cannot be
// used to find out which order codes exist.
const NO_MATCH =
  "We could not match that phone number with this order. Please check the number and try again.";

async function enforceRateLimit(orderCode: string) {
  const forwarded = (await headers()).get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";

  const limited = await isRateLimited([
    { key: `review:ip:${ip}`, max: 20 },
    { key: `review:code:${orderCode}`, max: 8 },
  ]);

  if (limited) {
    throw new ActionError("Too many attempts. Please wait a few minutes and try again.");
  }
}

async function findReviewableOrder(orderCodeInput: string, phoneInput: string) {
  const orderCode = String(orderCodeInput ?? "").trim().toUpperCase();
  const phone = normalizeBdPhone(String(phoneInput ?? ""));

  if (!orderCode || !BD_PHONE_PATTERN.test(phone)) {
    throw new ActionError("Please enter the mobile number used for the order, e.g. 01712345678.");
  }

  await enforceRateLimit(orderCode);

  const order = await prisma.order.findUnique({
    where: { orderCode },
    include: { customer: true, review: { select: { id: true } } },
  });

  if (!order || normalizeBdPhone(order.customer.phone) !== phone) {
    throw new ActionError(NO_MATCH);
  }

  if (order.status !== OrderStatus.DELIVERED) {
    throw new ActionError(
      "This order has not been delivered yet. You will be able to leave a review once it has been delivered."
    );
  }

  if (order.review) {
    throw new ActionError("A review has already been submitted for this order. Thank you.");
  }

  return order;
}

/** Step 1: confirm the phone number before showing the review form. */
export async function verifyReviewAccess(
  orderCode: string,
  phone: string
): Promise<ActionResult<{ firstName: string }>> {
  try {
    const order = await findReviewableOrder(orderCode, phone);
    return { success: true, data: { firstName: firstName(order.customer.name) } };
  } catch (error) {
    return toErrorResult(error, "We could not verify your order. Please try again.");
  }
}

/** Step 2: save the review as PENDING for admin approval. */
export async function submitReview(formData: FormData): Promise<ActionResult> {
  let uploadedPath: string | null = null;

  try {
    const order = await findReviewableOrder(
      String(formData.get("orderCode") ?? ""),
      String(formData.get("phone") ?? "")
    );

    const rating = Number(formData.get("rating"));
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new ActionError("Please select a rating from 1 to 5 stars.");
    }

    const text = String(formData.get("text") ?? "").trim();
    if (text.length < 10 || text.length > 500) {
      throw new ActionError("Please write between 10 and 500 characters.");
    }

    let image: string | null = null;
    const photo = formData.get("photo");

    if (photo instanceof File && photo.size > 0) {
      const extension = PHOTO_TYPES[photo.type];
      if (!extension || photo.size > MAX_PHOTO_BYTES) {
        throw new ActionError("The photo could not be accepted. Please use a JPG, PNG or WebP image.");
      }

      const storage = createAdminClient();
      if (!storage) {
        throw new ActionError("Photo upload is not available at the moment. Please submit your review without a photo.");
      }

      uploadedPath = `${IMAGE_FOLDERS.reviews}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
      const { error } = await storage.storage
        .from(STORAGE_BUCKET)
        .upload(uploadedPath, photo, { contentType: photo.type, upsert: false });

      if (error) {
        console.error("[reviews] photo upload failed:", error.message);
        uploadedPath = null;
        throw new ActionError("The photo could not be uploaded. Please try again or submit without a photo.");
      }

      image = storage.storage.from(STORAGE_BUCKET).getPublicUrl(uploadedPath).data.publicUrl;
    }

    await prisma.review.create({
      data: {
        orderId: order.id,
        status: ReviewStatus.PENDING,
        isVerified: true,
        name: reviewerName(order.customer),
        text,
        rating,
        image,
      },
    });

    revalidatePath("/admin/reviews");
    return { success: true, message: "Thank you. Your review has been submitted.", data: null };
  } catch (error) {
    // Do not leave an orphaned photo behind if saving the review failed.
    if (uploadedPath) {
      await createAdminClient()?.storage.from(STORAGE_BUCKET).remove([uploadedPath]);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, message: "A review has already been submitted for this order. Thank you." };
    }

    return toErrorResult(error, "We could not save your review. Please try again.");
  }
}
