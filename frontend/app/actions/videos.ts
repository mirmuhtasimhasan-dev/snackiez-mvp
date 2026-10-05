"use server";

import { revalidatePath, updateTag } from "next/cache";
import type { CreatorVideo } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { CACHE_TAGS } from "@/lib/site-data";
import { ActionError, toErrorResult } from "@/lib/action-result";
import type { ActionResult } from "@/lib/action-result";
import type { CreatorVideoInput } from "@/types/video";

function revalidateVideos() {
  updateTag(CACHE_TAGS.videos);
  revalidatePath("/");
  revalidatePath("/admin/videos");
}

function parseHttpsUrl(value: string | null | undefined, label: string, required: boolean) {
  const text = value?.trim();
  if (!text) {
    if (required) throw new ActionError(`${label} is required`);
    return null;
  }

  try {
    if (new URL(text).protocol !== "https:") throw new Error("not https");
  } catch {
    throw new ActionError(`${label} must be a full link starting with https://`);
  }

  return text;
}

// Video and poster files live in public/videos and are stored as paths.
function parseVideoPath(value: string | null | undefined, label: string, required: boolean) {
  const text = value?.trim();
  if (!text) {
    if (required) throw new ActionError(`${label} is required`);
    return null;
  }

  if (!/^\/videos\/[^\s?#]+$/.test(text) || text.includes("..")) {
    throw new ActionError(`${label} must start with /videos/, e.g. /videos/clip.mp4`);
  }

  return text;
}

function parseVideo(input: Partial<CreatorVideoInput>, partial: boolean) {
  const data: Partial<Omit<CreatorVideo, "id" | "createdAt">> = {};

  if (!partial || input.creatorName !== undefined) {
    // Optional internal note for admin. Never shown on the site.
    data.creatorName = input.creatorName?.trim() ?? "";
  }

  if (input.handle !== undefined) {
    // Stored without the leading @.
    data.handle = input.handle?.trim().replace(/^@+/, "") || null;
  }

  if (input.instagramUrl !== undefined) {
    const url = parseHttpsUrl(input.instagramUrl, "Instagram link", false);
    // Drop tracking parameters such as ?igsh=... and any #fragment.
    data.instagramUrl = url ? url.split(/[?#]/)[0] : null;
  }

  if (!partial || input.videoUrl !== undefined) {
    data.videoUrl = parseVideoPath(input.videoUrl, "Video path", true) as string;
  }

  if (input.posterUrl !== undefined) {
    data.posterUrl = parseVideoPath(input.posterUrl, "Poster path", false);
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

export async function getCreatorVideos(): Promise<ActionResult<CreatorVideo[]>> {
  try {
    await requireAdmin();

    const videos = await prisma.creatorVideo.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return { success: true, data: videos };
  } catch (error) {
    return toErrorResult(error, "Failed to fetch creator videos");
  }
}

export async function createCreatorVideo(
  input: CreatorVideoInput
): Promise<ActionResult<CreatorVideo>> {
  try {
    await requireAdmin();

    const data = parseVideo(input ?? {}, false) as Omit<CreatorVideo, "id" | "createdAt">;
    const video = await prisma.creatorVideo.create({ data });

    revalidateVideos();
    return { success: true, message: "Video added", data: video };
  } catch (error) {
    return toErrorResult(error, "Adding the video failed");
  }
}

export async function updateCreatorVideo(
  id: string,
  input: Partial<CreatorVideoInput>
): Promise<ActionResult<CreatorVideo>> {
  try {
    await requireAdmin();

    const video = await prisma.creatorVideo.update({
      where: { id },
      data: parseVideo(input ?? {}, true),
    });

    revalidateVideos();
    return { success: true, message: "Video updated", data: video };
  } catch (error) {
    return toErrorResult(error, "Updating the video failed");
  }
}

export async function deleteCreatorVideo(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    await prisma.creatorVideo.delete({ where: { id } });

    revalidateVideos();
    return { success: true, message: "Video deleted", data: null };
  } catch (error) {
    return toErrorResult(error, "Deleting the video failed");
  }
}
