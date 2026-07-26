"use client";

import { Accordion } from "@/components/ui/accordion";
import { ALL_FAQ, FAQ_CATEGORIES } from "@/lib/faq-data";

export function FaqContent() {
  return (
    <div className="space-y-10">
      {FAQ_CATEGORIES.map((category) => {
        const items = ALL_FAQ.filter((faq) => faq.category === category);
        if (items.length === 0) return null;
        return (
          <div key={category}>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400 sm:text-sm">
              {category}
            </h2>
            <Accordion items={items} />
          </div>
        );
      })}
    </div>
  );
}
