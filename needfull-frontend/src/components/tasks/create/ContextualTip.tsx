"use client";

// WHAT: Single contextual tip shown in the create-task flow once a category is
//       chosen. Replaces the removed generic Home "Insights" wall with a
//       relevant, in-context nudge.
// WHY:  Insights are more useful where the user is acting, not parked on Home.

import { Lightbulb } from "lucide-react";

const TIPS: Record<string, string> = {
  Printing:
    "Printing tasks posted before 5 PM usually receive faster responses.",
  Laundry:
    "Mention pickup and delivery in your description — it gets more applications.",
  Delivery:
    "Adding your hostel or hall name helps nearby runners say yes faster.",
  Academics:
    "Include your course code and deadline — tutors respond to specifics.",
  Tech:
    "List the exact device or software — it saves back-and-forth messages.",
  Cleaning:
    "Runners prefer tasks with a rough time estimate. Keep it realistic.",
  Shopping:
    "Name the item and budget in the description to get accurate offers.",
  "Food Runs":
    "Runners pick food tasks fastest during lunch and dinner hours.",
};

export function ContextualTip({ categoryName }: { categoryName: string }) {
  const tip = categoryName ? TIPS[categoryName] ?? null : null;
  if (!tip) return null;

  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-gold/30 bg-gold-light/40 px-3.5 py-3">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
      <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-200">
        <span className="font-bold text-gold-dark">Tip: </span>
        {tip}
      </p>
    </div>
  );
}