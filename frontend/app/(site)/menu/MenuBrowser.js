"use client";

import { useState } from "react";
import MenuCard from "@/app/components/MenuCard";

const ALL = "all";

export default function MenuBrowser({ categories, initialCategoryId = ALL }) {
  const [activeId, setActiveId] = useState(initialCategoryId);

  const visible =
    activeId === ALL ? categories : categories.filter((category) => category.id === activeId);

  const tabs = [{ id: ALL, name: "All" }, ...categories];

  return (
    <>
      <div className="sticky top-16 z-30 -mx-4 mt-6 border-b border-line bg-ink/90 px-4 backdrop-blur-md">
        <div
          role="tablist"
          aria-label="Menu categories"
          className="-mb-px flex gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {tabs.map((tab) => {
            const selected = tab.id === activeId;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveId(tab.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  selected
                    ? "bg-brand text-cream"
                    : "bg-surface-2 text-cream/80 hover:bg-white/10 hover:text-cream"
                }`}
              >
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 space-y-12">
        {visible.map((category) => (
          <section key={category.id} aria-labelledby={`cat-${category.id}`}>
            <h2
              id={`cat-${category.id}`}
              className="font-display text-3xl tracking-wide text-brand"
            >
              {category.name}
            </h2>

            <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {category.items.map((item) => (
                <li key={item.id}>
                  <MenuCard item={item} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
