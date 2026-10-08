"use client";

import React from "react";
import { Category } from "../types/restaurant";

interface CategoryNavProps {
  categories: Category[];
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
}

export function CategoryNav({
  categories,
  activeCategoryId,
  onSelectCategory,
}: CategoryNavProps) {
  return (
    <nav className="sticky top-[102px] sm:top-[109px] z-20 bg-stone-50/95 backdrop-blur-md border-b border-stone-200 py-2.5 px-4 overflow-x-auto no-scrollbar shadow-xs">
      <div className="max-w-5xl mx-auto flex items-center gap-2">
        {categories.map((cat) => {
          const isActive = cat.id === activeCategoryId;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                isActive
                  ? "bg-stone-900 text-white shadow-sm"
                  : "bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200"
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
