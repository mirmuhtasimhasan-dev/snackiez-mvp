// How a category appears as a round icon on the home page and menu tabs.

// Words dropped when a category has no shortName ("Fries Favourites" -> "Fries").
const FILLER_WORDS = /\b(specials?|favou?rites?|corner|items?)\b/gi;

export function categoryShortName(category: { name: string; shortName?: string | null }) {
  if (category.shortName?.trim()) {
    return category.shortName.trim();
  }

  const stripped = category.name.replace(FILLER_WORDS, "").replace(/\s+/g, " ").trim();
  return stripped || category.name;
}

/**
 * The category's own image, else the first of its items that has one,
 * else null (the UI then shows a gradient circle with a food icon).
 */
export function categoryImage(category: {
  image?: string | null;
  menuItems?: { image: string | null }[];
}) {
  return category.image || category.menuItems?.find((item) => item.image)?.image || null;
}
