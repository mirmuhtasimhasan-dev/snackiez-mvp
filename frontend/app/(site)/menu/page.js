import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { categoryImage, categoryShortName } from "@/lib/categories";
import { getSiteSettings } from "@/lib/settings";
import MenuBrowser from "./MenuBrowser";

export const metadata = {
  title: "Menu",
};

export default async function MenuPage({ searchParams }) {
  // Stock changes with every order, so always render with fresh data.
  await connection();
  const { category: requestedCategory } = await searchParams;
  const settings = await getSiteSettings();

  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      menuItems: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          image: true,
          isAvailable: true,
          stockQty: true,
        },
      },
    },
  });

  const withItems = categories
    .filter((category) => category.menuItems.length > 0)
    .map((category) => ({
      id: category.id,
      name: category.name,
      shortName: categoryShortName(category),
      image: categoryImage(category),
      items: category.menuItems,
    }));

  // /menu?category=Burger%20Specials opens that tab (matched by name).
  const initialCategory =
    typeof requestedCategory === "string"
      ? withItems.find(
          (category) => category.name.toLowerCase() === requestedCategory.trim().toLowerCase()
        )
      : undefined;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8">
      <h1 className="font-display text-5xl tracking-wide sm:text-6xl">Menu</h1>
      <p className="mt-1 text-muted">Made fresh, delivered hot. {settings.hoursText}.</p>

      {withItems.length === 0 ? (
        <p className="mt-12 rounded-2xl border border-line bg-card p-8 text-center text-muted">
          The menu is being updated. Please check back soon.
        </p>
      ) : (
        <MenuBrowser
          key={initialCategory?.id ?? "all"}
          categories={withItems}
          initialCategoryId={initialCategory?.id}
        />
      )}
    </main>
  );
}
