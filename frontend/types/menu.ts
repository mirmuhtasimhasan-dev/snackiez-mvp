import type { Category, MenuItem } from "@prisma/client";

export type MenuItemWithCategory = MenuItem & { category: Category };
export type CategoryWithItems = Category & { menuItems: MenuItem[] };

export type MenuItemInput = {
  name: string;
  description?: string | null;
  price: number | string;
  image?: string | null;
  categoryId: string;
  isAvailable?: boolean;
  isFeatured?: boolean;
  stockQty?: number | string;
};

export type CategoryInput = {
  name: string;
  shortName?: string | null;
  image?: string | null;
};
