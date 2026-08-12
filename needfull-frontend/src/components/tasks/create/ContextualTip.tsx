"use client";

// WHAT: Single contextual tip shown in the create-task flow once a category is
//       chosen. Replaces the removed generic Home "Insights" wall with a
//       relevant, in-context nudge.
// WHY:  Insights are more useful where the user is acting, not parked on Home.
// NOTE: Tips key on canonical category KEY (categoryConfig.ts), resolved from
//       the API's DB name — so renamed labels never break the tip lookup.

import { Lightbulb } from "lucide-react";
import { getCategoryConfig } from "@/lib/categoryConfig";

const TIPS: Record<string, string> = {
  printing:
    "Printing tasks posted before 5 PM usually receive faster responses.",
  laundry:
    "Mention pickup and delivery in your description — it gets more applications.",
  delivery:
    "Adding your hostel or hall name helps nearby runners say yes faster.",
  academic:
    "Include your course code and deadline — tutors respond to specifics.",
  techsupport:
    "List the exact device or software — it saves back-and-forth messages.",
  cleaning:
    "Runners prefer tasks with a rough time estimate. Keep it realistic.",
  shopping:
    "Name the item and budget in the description to get accurate offers.",
  food:
    "Runners pick food tasks fastest during lunch and dinner hours.",
};

export function ContextualTip({ categoryName }: { categoryName: string }) {
  const config = categoryName ? getCategoryConfig(categoryName) : null;
  const tip = config ? TIPS[config.key] ?? null : null;
  if (!tip) return null;

  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-gold/30 bg-gold-light/40 px-3.5 py-3 dark:bg-gold-light/10">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
      <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-200">
        <span className="font-bold text-gold-dark">Tip: </span>
        {tip}
      </p>
    </div>
  );
}