"use server";

import { revalidatePath, updateTag } from "next/cache";
import { after } from "next/server";
import type { Category, MenuItem } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { CACHE_TAGS } from "@/lib/site-data";
import { deleteImageIfUnused } from "@/lib/storage-server";
import { ActionError, toErrorResult } from "@/lib/action-result";
import type { ActionResult } from "@/lib/action-result";
import type {
  CategoryInput,
  CategoryWithItems,
  MenuItemInput,
  MenuItemWithCategory,
} from "@/types/menu";

function revalidateMenu() {
  // Expire the cached menu now, so the edit shows on the next page view.
  updateTag(CACHE_TAGS.menu);
  revalidatePath("/");
  revalidatePath("/menu");
  revalidatePath("/admin");
}

// Empty strings from forms mean "no image".
function normalizeImage(image: string | null | undefined) {
  return image === undefined ? undefined : image?.trim() || null;
}

// Deletes a replaced or removed upload once the response is sent.
function cleanUpImage(previous: string | null | undefined, next: string | null | undefined) {
  if (previous && previous !== next) {
    after(() => deleteImageIfUnused(previous));
  }
}

function parseStockQty(value: number | string | undefined) {
  if (value === undefined || value === "") {
    return undefined;
  }

  const stockQty = Number(value);

  if (!Number.isInteger(stockQty) || stockQty < 0) {
    throw new ActionError("Stock quantity must be a whole number of 0 or more");
  }

  return stockQty;
}

function parsePrice(value: number | string) {
  const price = Number(value);

  if (!Number.isFinite(price) || price <= 0) {
    throw new ActionError("Price must be a positive number");
  }

  return price;
}

// Categories

function parseCategory(input: Partial<CategoryInput>, partial: boolean) {
  const data: { name?: string; shortName?: string | null; image?: string | null } = {};

  if (!partial || input.name !== undefined) {
    if (!input.name?.trim()) throw new ActionError("Category name is required");
    data.name = input.name.trim();
  }

  if (input.shortName !== undefined) {
    const shortName = input.shortName?.trim() || null;
    if (shortName && shortName.length > 16) {
      throw new ActionError("Short name must be 16 characters or fewer");
    }
    data.shortName = shortName;
  }

  if (input.image !== undefined) {
    data.image = input.image?.trim() || null;
  }

  return data;
}

export async function createCategory(
  input: CategoryInput
): Promise<ActionResult<Category>> {
  try {
    await requireAdmin();

    const category = await prisma.category.create({
      data: parseCategory(input ?? {}, false) as { name: string },
    });

    revalidateMenu();
    return { success: true, message: "Category created successfully", data: category };
  } catch (error) {
    return toErrorResult(error, "Category creation failed");
  }
}

export async function getCategories(): Promise<ActionResult<CategoryWithItems[]>> {
  try {
    const categories = await prisma.category.findMany({
      include: { menuItems: true },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: categories };
  } catch (error) {
    return toErrorResult(error, "Failed to fetch categories");
  }
}

export async function updateCategory(
  id: string,
  input: Partial<CategoryInput>
): Promise<ActionResult<Category>> {
  try {
    await requireAdmin();

    const previous = await prisma.category.findUnique({ where: { id }, select: { image: true } });
    const category = await prisma.category.update({
      where: { id },
      data: parseCategory(input ?? {}, true),
    });
    if (input?.image !== undefined) cleanUpImage(previous?.image, category.image);

    revalidateMenu();
    return { success: true, message: "Category updated successfully", data: category };
  } catch (error) {
    return toErrorResult(error, "Category update failed");
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    const deleted = await prisma.category.delete({ where: { id } });
    cleanUpImage(deleted.image, null);

    revalidateMenu();
    return { success: true, message: "Category deleted successfully", data: null };
  } catch (error) {
    return toErrorResult(error, "Category delete failed");
  }
}

// Menu items

export async function createMenuItem(
  input: MenuItemInput
): Promise<ActionResult<MenuItemWithCategory>> {
  try {
    await requireAdmin();

    if (!input?.name?.trim() || !input.price || !input.categoryId) {
      throw new ActionError("Name, price and categoryId are required");
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        name: input.name.trim(),
        description: input.description,
        price: parsePrice(input.price),
        image: normalizeImage(input.image),
        categoryId: input.categoryId,
        isAvailable: input.isAvailable,
        isFeatured: input.isFeatured,
        stockQty: parseStockQty(input.stockQty),
      },
      include: { category: true },
    });

    revalidateMenu();
    return { success: true, message: "Menu item created successfully", data: menuItem };
  } catch (error) {
    return toErrorResult(error, "Menu item creation failed");
  }
}

export async function getMenuItems(): Promise<ActionResult<MenuItemWithCategory[]>> {
  try {
    const menuItems = await prisma.menuItem.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: menuItems };
  } catch (error) {
    return toErrorResult(error, "Failed to fetch menu items");
  }
}

export async function getSingleMenuItem(
  id: string
): Promise<ActionResult<MenuItemWithCategory>> {
  try {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!menuItem) {
      throw new ActionError("Menu item not found");
    }

    return { success: true, data: menuItem };
  } catch (error) {
    return toErrorResult(error, "Failed to fetch menu item");
  }
}

export async function updateMenuItem(
  id: string,
  input: Partial<MenuItemInput>
): Promise<ActionResult<MenuItemWithCategory>> {
  try {
    await requireAdmin();

    const previous = await prisma.menuItem.findUnique({ where: { id }, select: { image: true } });
    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: {
        name: input.name?.trim(),
        description: input.description,
        price: input.price !== undefined ? parsePrice(input.price) : undefined,
        image: normalizeImage(input.image),
        categoryId: input.categoryId,
        isAvailable: input.isAvailable,
        isFeatured: input.isFeatured,
        stockQty: parseStockQty(input.stockQty),
      },
      include: { category: true },
    });
    if (input.image !== undefined) cleanUpImage(previous?.image, menuItem.image);

    revalidateMenu();
    return { success: true, message: "Menu item updated successfully", data: menuItem };
  } catch (error) {
    return toErrorResult(error, "Menu item update failed");
  }
}

export async function toggleMenuItemAvailability(
  id: string,
  isAvailable: boolean
): Promise<ActionResult<MenuItem>> {
  try {
    await requireAdmin();

    if (typeof isAvailable !== "boolean") {
      throw new ActionError("isAvailable must be true or false");
    }

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: { isAvailable },
    });

    revalidateMenu();
    return {
      success: true,
      message: "Menu item availability updated successfully",
      data: menuItem,
    };
  } catch (error) {
    return toErrorResult(error, "Availability update failed");
  }
}

export async function toggleMenuItemFeatured(
  id: string,
  isFeatured: boolean
): Promise<ActionResult<MenuItem>> {
  try {
    await requireAdmin();

    if (typeof isFeatured !== "boolean") {
      throw new ActionError("isFeatured must be true or false");
    }

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: { isFeatured },
    });

    revalidateMenu();
    return {
      success: true,
      message: isFeatured ? "Added to Best Sellers" : "Removed from Best Sellers",
      data: menuItem,
    };
  } catch (error) {
    return toErrorResult(error, "Best Seller update failed");
  }
}

export async function updateMenuItemStock(
  id: string,
  stockQty: number
): Promise<ActionResult<MenuItem>> {
  try {
    await requireAdmin();

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: { stockQty: parseStockQty(stockQty) ?? 0 },
    });

    revalidateMenu();
    return { success: true, message: "Stock updated successfully", data: menuItem };
  } catch (error) {
    return toErrorResult(error, "Stock update failed");
  }
}

export async function deleteMenuItem(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    const deleted = await prisma.menuItem.delete({ where: { id } });
    cleanUpImage(deleted.image, null);

    revalidateMenu();
    return { success: true, message: "Menu item deleted successfully", data: null };
  } catch (error) {
    return toErrorResult(error, "Menu item delete failed");
  }
}
