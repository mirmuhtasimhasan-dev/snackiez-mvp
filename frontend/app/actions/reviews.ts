"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { ReviewStatus } from "@prisma/client";
import type { Review } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { deleteImageIfUnused } from "@/lib/storage-server";
import { ActionError, toErrorResult } from "@/lib/action-result";
import type { ActionResult } from "@/lib/action-result";
import type { ReviewInput } from "@/types/review";
import { REVIEW_SOURCES } from "@/lib/reviews";

function revalidateReviews() {
  revalidatePath("/");
  revalidatePath("/admin/reviews");
  // The sidebar badge with the pending count sits in the admin layout.
  revalidatePath("/admin", "layout");
}

function parseReview(input: Partial<ReviewInput>, partial: boolean) {
  const data: Partial<Omit<Review, "id" | "createdAt">> = {};

  if (!partial || input.name !== undefined) {
    if (!input.name?.trim()) throw new ActionError("Reviewer name is required");
    data.name = input.name.trim();
  }

  if (!partial || input.text !== undefined) {
    if (!input.text?.trim()) throw new ActionError("Review text is required");
    data.text = input.text.trim();
  }

  if (!partial || input.rating !== undefined) {
    const rating = Number(input.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new ActionError("Rating must be a whole number from 1 to 5");
    }
    data.rating = rating;
  }

  if (input.image !== undefined) {
    data.image = input.image?.trim() || null;
  }

  if (input.source !== undefined) {
    const source = input.source?.trim() || null;
    if (source && !(REVIEW_SOURCES as readonly string[]).includes(source)) {
      throw new ActionError(`Source must be one of ${REVIEW_SOURCES.join(", ")}`);
    }
    data.source = source;
  }

  if (input.isVisible !== undefined) {
    if (typeof input.isVisible !== "boolean") throw new ActionError("isVisible must be true or false");
    data.isVisible = input.isVisible;
  }

  if (input.sortOrder !== undefined && input.sortOrder !== "") {
    const sortOrder = Number(input.sortOrder);
    if (!Number.isInteger(sortOrder)) throw new ActionError("Sort order must be a whole number");
    data.sortOrder = sortOrder;
  }

  return data;
}

export async function getVisibleReviews(): Promise<ActionResult<Review[]>> {
  try {
    const reviews = await prisma.review.findMany({
      where: { isVisible: true, status: ReviewStatus.APPROVED },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return { success: true, data: reviews };
  } catch (error) {
    return toErrorResult(error, "Failed to fetch reviews");
  }
}

export async function getReviews(): Promise<ActionResult<Review[]>> {
  try {
    await requireAdmin();

    const reviews = await prisma.review.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return { success: true, data: reviews };
  } catch (error) {
    return toErrorResult(error, "Failed to fetch reviews");
  }
}

export async function createReview(input: ReviewInput): Promise<ActionResult<Review>> {
  try {
    await requireAdmin();

    const data = parseReview(input ?? {}, false) as Omit<Review, "id" | "createdAt">;
    const review = await prisma.review.create({ data });

    revalidateReviews();
    return { success: true, message: "Review added", data: review };
  } catch (error) {
    return toErrorResult(error, "Review creation failed");
  }
}

export async function updateReview(
  id: string,
  input: Partial<ReviewInput>
): Promise<ActionResult<Review>> {
  try {
    await requireAdmin();

    const previous = await prisma.review.findUnique({ where: { id }, select: { image: true } });
    const review = await prisma.review.update({
      where: { id },
      data: parseReview(input ?? {}, true),
    });

    // Delete a replaced or removed upload once the response is sent.
    const oldImage = previous?.image;
    if (input?.image !== undefined && oldImage && oldImage !== review.image) {
      after(() => deleteImageIfUnused(oldImage));
    }

    revalidateReviews();
    return { success: true, message: "Review updated", data: review };
  } catch (error) {
    return toErrorResult(error, "Review update failed");
  }
}

export async function toggleReviewVisibility(
  id: string,
  isVisible: boolean
): Promise<ActionResult<Review>> {
  try {
    await requireAdmin();

    if (typeof isVisible !== "boolean") {
      throw new ActionError("isVisible must be true or false");
    }

    const review = await prisma.review.update({ where: { id }, data: { isVisible } });

    revalidateReviews();
    return {
      success: true,
      message: isVisible ? "Review is now visible" : "Review hidden",
      data: review,
    };
  } catch (error) {
    return toErrorResult(error, "Review update failed");
  }
}

export async function deleteReview(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    const deleted = await prisma.review.delete({ where: { id } });
    if (deleted.image) after(() => deleteImageIfUnused(deleted.image));

    revalidateReviews();
    return { success: true, message: "Review deleted", data: null };
  } catch (error) {
    return toErrorResult(error, "Review delete failed");
  }
}

// Customer reviews arrive as PENDING; only APPROVED ones show on the site.
export async function setReviewStatus(
  id: string,
  status: ReviewStatus
): Promise<ActionResult<Review>> {
  try {
    await requireAdmin();

    if (status !== ReviewStatus.APPROVED && status !== ReviewStatus.REJECTED) {
      throw new ActionError("A review can only be approved or rejected");
    }

    const review = await prisma.review.update({ where: { id }, data: { status } });

    revalidateReviews();
    return {
      success: true,
      message: status === ReviewStatus.APPROVED ? "Review approved" : "Review rejected",
      data: review,
    };
  } catch (error) {
    return toErrorResult(error, "Review update failed");
  }
}

export async function getPendingReviewCount(): Promise<ActionResult<number>> {
  try {
    await requireAdmin();

    const count = await prisma.review.count({ where: { status: ReviewStatus.PENDING } });
    return { success: true, data: count };
  } catch (error) {
    return toErrorResult(error, "Failed to count pending reviews");
  }
}
