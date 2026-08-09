// WHAT: /categories — dedicated category browsing experience
// WHY:  Home shows a horizontal rail as a preview; this page holds the
//       complete category directory with search.
// NOTE: Category cards deep-link into the post flow with the category
//       pre-selected, matching the "post task" marketplace action.

"use client";

import { CategorySearch } from "@/components/dashboard/post/CategorySearch";

export default function CategoriesPage() {
  return (
    <div className="page-column">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <div>
          <h1 className="text-scale-section text-gray-900 dark:text-white">
            Browse Categories
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Find the right kind of help for your task.
          </p>
        </div>
        <CategorySearch />
      </div>
    </div>
  );
}