import { Skeleton } from "@/components/ui/skeleton";

export default function PublicLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="container-page flex flex-1 flex-col space-y-8 py-12 sm:py-20"
    >
      <div className="flex flex-col items-center space-y-4 text-center">
        <Skeleton className="h-4 w-32 rounded-full" />
        <Skeleton className="h-10 w-72 rounded-md sm:w-96" />
        <Skeleton className="h-4 w-60 rounded-full" />
      </div>

      <div className="grid grid-cols-1 gap-6 pt-6 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-card" />
        <Skeleton className="hidden h-72 rounded-card sm:block" />
        <Skeleton className="hidden h-72 rounded-card lg:block" />
      </div>

      <span className="sr-only">Loading page content…</span>
    </div>
  );
}
