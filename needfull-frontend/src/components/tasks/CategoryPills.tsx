"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface CategoryPillsProps {
  categories: { id: string; name: string }[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function CategoryPills({ categories, selectedId, onSelect }: CategoryPillsProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap pb-2">
      <div className="flex w-max space-x-2 p-1">
        <button
          onClick={() => onSelect(null)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedId === null
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelect(category.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedId === category.id
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" className="invisible" />
    </ScrollArea>
  );
}
