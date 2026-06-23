import { Skeleton } from "@/components/ui/skeleton";

export function TaskCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-card transition-shadow duration-200 hover:shadow-lifted active:scale-[0.99] flex flex-col space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      
      <Skeleton className="h-16 w-full" />
      
      <div className="flex justify-between items-center pt-2 border-t border-gray-50">
        <div className="flex space-x-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}
