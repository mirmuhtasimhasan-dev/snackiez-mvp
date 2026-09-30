import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Item = {
  name: string;
  price: number;
  description: string;
  image?: string;
  stockQty?: number;
};

const menu: Record<string, Item[]> = {
  "Shawarma Specials": [
    { name: "Beef Shawarma Supreme", price: 249, description: "Thin bread, shawarma beef, onion, capsicum, pickles, jalapeno, house special sauce" },
    { name: "Chicken Shawarma Classic", price: 219, description: "Thin bread, shawarma chicken, onion, capsicum, pickles, jalapeno, house special sauce" },
    { name: "Chicken Cheese Shawarma", price: 239, description: "Thin bread, shawarma chicken, slice cheese, onion, capsicum, pickles, jalapeno, house special sauce" },
  ],
  "Burger Specials": [
    { name: "BBQ Chicken Burger", price: 219, description: "Grilled BBQ chicken, cheese, red onion, lettuce, house sauce, soft sesame bun", image: "/menu/bbq-chicken-burger.webp" },
    { name: "BBQ Micro Burger", price: 289, description: "Mini burgers with juicy patty, BBQ sauce, cheese, lettuce, sesame bun. Small size, big flavor", image: "/menu/bbq-micro-burger.webp" },
    { name: "Signature Micro Burger", price: 279, description: "Grilled chicken, slice cheese, lettuce, onion, pickles, house special sauce" },
    { name: "Retro Chicken Burger", price: 199, description: "Grilled chicken, onion, lettuce, pickles, house special sauce" },
  ],
  "Fries Favourites": [
    { name: "Loaded Fries", price: 199, description: "Fries, crispy chicken, house special sauce, spicy sauce, pickles, jalapeno" },
    { name: "Fried Chicken Combo (4 Pcs)", price: 259, description: "1 pc drumstick, 1 pc thigh, 2 pcs wings, crispy coating, dip sauce" },
  ],
  "Wrap Favorites": [
    { name: "Chicken Classic Wrap", price: 219, description: "Thin bread, crispy chicken tender, onion, capsicum, house special sauce, pickles" },
  ],
  "Tender Special": [
    { name: "Honey Chicken Tender (5 Pcs)", price: 249, description: "Crispy chicken tender, honey glazed house special sauce" },
    { name: "Chicken Classic Tender (5 Pcs)", price: 225, description: "Crispy, well marinated fresh chicken strips" },
  ],
};

const reviews = [
  {
    name: "Tanvir, NSU",
    text: "Ordered at 2 AM after a study night. Shawarma came hot and the sauce was on point. Bitezz is my go-to now.",
  },
  {
    name: "Nusrat, IUB",
    text: "The BBQ Micro Burgers are so good. Small but full of flavor. Delivery was fast inside Bashundhara.",
  },
  {
    name: "Rafi, Block D",
    text: "Honey chicken tenders are crispy and not oily. Fair price, friendly rider. Will order again.",
  },
];

// Review.name is not a unique column (two customers can share a name), so
// Prisma's upsert() can't key on it. Find-then-update/create by name gives
// the same result: re-running the seed never duplicates these.
async function seedReviews() {
  for (const [index, review] of reviews.entries()) {
    const data = {
      ...review,
      rating: 5,
      source: "Facebook",
      isVisible: true,
      sortOrder: index + 1,
    };
    const existing = await prisma.review.findFirst({ where: { name: review.name } });

    if (existing) {
      await prisma.review.update({ where: { id: existing.id }, data });
    } else {
      await prisma.review.create({ data });
    }
  }

  console.log(`Seeded ${reviews.length} reviews.`);
}

async function main() {
  for (const [categoryName, items] of Object.entries(menu)) {
    let category = await prisma.category.findFirst({ where: { name: categoryName } });
    if (!category) category = await prisma.category.create({ data: { name: categoryName } });

    for (const item of items) {
      const data = {
        name: item.name,
        price: item.price,
        description: item.description,
        image: item.image ?? null,
        categoryId: category.id,
      };
      const existing = await prisma.menuItem.findFirst({ where: { name: item.name } });
      if (existing) {
        // keep current stock and availability, update the rest
        await prisma.menuItem.update({ where: { id: existing.id }, data });
      } else {
        await prisma.menuItem.create({
          data: { ...data, stockQty: item.stockQty ?? 20, isAvailable: true },
        });
      }
    }
  }
  // remove old categories that are no longer in the menu and have no items
  const keep = Object.keys(menu);
  const removed = await prisma.category.deleteMany({
    where: { name: { notIn: keep }, menuItems: { none: {} } },
  });
  if (removed.count) console.log(`Removed ${removed.count} old empty categories.`);

  await seedReviews();

  const count = await prisma.menuItem.count();
  console.log(`Seed done. ${count} menu items in database.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());