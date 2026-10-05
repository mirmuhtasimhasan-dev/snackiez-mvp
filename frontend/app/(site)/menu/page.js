import { connection } from "next/server";
import { getMenu } from "@/lib/site-data";
import { categoryImage, categoryShortName } from "@/lib/categories";
import { getSiteSettings } from "@/lib/settings";
import MenuBrowser from "./MenuBrowser";

export const metadata = {
  title: "Menu",
};

export default async function MenuPage({ searchParams }) {
  // The menu comes from the data cache, which is expired whenever stock or
  // the menu changes (order status changes and admin edits).
  await connection();
  const { category: requestedCategory } = await searchParams;
  const [settings, categories] = await Promise.all([getSiteSettings(), getMenu()]);

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
