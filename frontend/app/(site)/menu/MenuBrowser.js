"use client";

import { useState } from "react";
import CategoryCircle from "@/app/components/CategoryCircle";
import MenuCard from "@/app/components/MenuCard";
import { GridIcon } from "@/app/components/icons";

const ALL = "all";

export default function MenuBrowser({ categories, initialCategoryId = ALL }) {
  const [activeId, setActiveId] = useState(initialCategoryId);

  const visible =
    activeId === ALL ? categories : categories.filter((category) => category.id === activeId);

  const tabs = [{ id: ALL, name: "All", shortName: "All" }, ...categories];

  return (
    <>
      <div className="sticky top-16 z-30 -mx-4 mt-5 border-b border-line bg-card/90 px-4 backdrop-blur-md">
        <div
          role="tablist"
          aria-label="Menu categories"
          className="-mb-px flex gap-3 overflow-x-auto pb-2.5 pt-3 [scrollbar-width:none] sm:gap-5 [&::-webkit-scrollbar]:hidden"
        >
          {tabs.map((tab) => {
            const selected = tab.id === activeId;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={tab.name}
                onClick={() => setActiveId(tab.id)}
                className="group flex w-16 shrink-0 flex-col items-center gap-1.5 sm:w-[72px]"
              >
                {tab.id === ALL ? (
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-full bg-alt text-highlight-ink ring-2 ring-offset-2 ring-offset-page transition sm:h-14 sm:w-14 ${
                      selected ? "ring-brand" : "ring-line group-hover:ring-brand/60"
                    }`}
                  >
                    <GridIcon width={22} height={22} />
                  </span>
                ) : (
                  <CategoryCircle
                    src={tab.image}
                    sizes="56px"
                    selected={selected}
                    className="h-12 w-12 sm:h-14 sm:w-14"
                  />
                )}
                <span
                  className={`w-full truncate text-center text-[11px] font-semibold sm:text-xs ${
                    selected ? "text-brand-ink" : "text-fg/80 group-hover:text-fg"
                  }`}
                >
                  {tab.shortName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 space-y-8 sm:mt-8 sm:space-y-12">
        {visible.map((category) => (
          <section key={category.id} aria-labelledby={`cat-${category.id}`}>
            <h2
              id={`cat-${category.id}`}
              className="font-display text-3xl tracking-wide text-brand-ink"
            >
              {category.name}
            </h2>

            <ul className="mt-3 grid grid-cols-2 gap-3 sm:mt-4 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
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
