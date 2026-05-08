import { Skeleton } from '@/components/ui/skeleton';

export function PageSuspenseFallback({
  showSidebar = true,
}: {
  showSidebar?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
      {showSidebar ? (
        <div className="space-y-4 xl:col-span-4">
          <Skeleton className="h-[120px] w-full rounded-2xl" />
          <Skeleton className="h-[640px] w-full rounded-2xl" />
        </div>
      ) : null}

      <div
        className={
          showSidebar
            ? 'space-y-6 xl:col-span-8'
            : 'space-y-6 xl:col-span-12'
        }
      >
        <div className="space-y-3 rounded-2xl border bg-card p-6">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-10 w-80 rounded-xl" />
          <Skeleton className="h-4 w-full max-w-2xl rounded-xl" />
          <Skeleton className="h-4 w-full max-w-xl rounded-xl" />
        </div>
        <Skeleton className="h-[220px] w-full rounded-3xl" />
        <Skeleton className="h-[420px] w-full rounded-3xl" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-[180px] w-full rounded-2xl" />
          <Skeleton className="h-[180px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
