"use server";

import { revalidatePath } from "next/cache";
import type { Banner } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ActionError, toErrorResult } from "@/lib/action-result";
import type { ActionResult } from "@/lib/action-result";
import type { BannerInput } from "@/types/banner";

function revalidateBanners() {
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function getActiveBanners(): Promise<ActionResult<Banner[]>> {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: banners };
  } catch (error) {
    return toErrorResult(error, "Failed to fetch banners");
  }
}

export async function getBanners(): Promise<ActionResult<Banner[]>> {
  try {
    await requireAdmin();

    const banners = await prisma.banner.findMany({
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: banners };
  } catch (error) {
    return toErrorResult(error, "Failed to fetch banners");
  }
}

export async function createBanner(input: BannerInput): Promise<ActionResult<Banner>> {
  try {
    await requireAdmin();

    if (!input?.title?.trim() || !input.image?.trim()) {
      throw new ActionError("Banner title and image are required");
    }

    const banner = await prisma.banner.create({
      data: {
        title: input.title.trim(),
        image: input.image.trim(),
        isActive: input.isActive,
      },
    });

    revalidateBanners();
    return { success: true, message: "Banner created successfully", data: banner };
  } catch (error) {
    return toErrorResult(error, "Banner creation failed");
  }
}

export async function updateBanner(
  id: string,
  input: Partial<BannerInput>
): Promise<ActionResult<Banner>> {
  try {
    await requireAdmin();

    if (input.title !== undefined && !input.title.trim()) {
      throw new ActionError("Banner title cannot be empty");
    }

    if (input.image !== undefined && !input.image.trim()) {
      throw new ActionError("Banner image cannot be empty");
    }

    const banner = await prisma.banner.update({
      where: { id },
      data: {
        title: input.title?.trim(),
        image: input.image?.trim(),
        isActive: input.isActive,
      },
    });

    revalidateBanners();
    return { success: true, message: "Banner updated successfully", data: banner };
  } catch (error) {
    return toErrorResult(error, "Banner update failed");
  }
}

export async function toggleBanner(
  id: string,
  isActive: boolean
): Promise<ActionResult<Banner>> {
  try {
    await requireAdmin();

    if (typeof isActive !== "boolean") {
      throw new ActionError("isActive must be true or false");
    }

    const banner = await prisma.banner.update({
      where: { id },
      data: { isActive },
    });

    revalidateBanners();
    return { success: true, message: "Banner updated successfully", data: banner };
  } catch (error) {
    return toErrorResult(error, "Banner update failed");
  }
}

export async function deleteBanner(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    await prisma.banner.delete({ where: { id } });

    revalidateBanners();
    return { success: true, message: "Banner deleted successfully", data: null };
  } catch (error) {
    return toErrorResult(error, "Banner delete failed");
  }
}
