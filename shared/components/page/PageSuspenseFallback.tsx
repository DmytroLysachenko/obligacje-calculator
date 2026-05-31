import { Skeleton } from '@/components/ui/skeleton';

export function PageSuspenseFallback({
  showSidebar = true,
}: {
  showSidebar?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      {showSidebar ? (
        <div className="space-y-4 xl:col-span-4">
          <Skeleton className="h-[96px] w-full rounded-lg md:h-[120px]" />
          <Skeleton className="h-[420px] w-full rounded-lg md:h-[640px]" />
        </div>
      ) : null}

      <div
        className={
          showSidebar
            ? 'space-y-6 xl:col-span-8'
            : 'space-y-6 xl:col-span-12'
        }
      >
        <div className="space-y-3 rounded-lg border border-border bg-card p-6">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-8 w-full max-w-[16rem] rounded-md md:h-10 md:max-w-[20rem]" />
          <Skeleton className="h-4 w-full max-w-2xl rounded-md" />
          <Skeleton className="h-4 w-full max-w-xl rounded-md" />
        </div>
        <Skeleton className="surface-panel h-[200px] w-full rounded-lg md:h-[220px]" />
        <Skeleton className="surface-panel h-[320px] w-full rounded-lg md:h-[420px]" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="surface-soft h-[160px] w-full rounded-lg md:h-[180px]" />
          <Skeleton className="surface-soft h-[160px] w-full rounded-lg md:h-[180px]" />
        </div>
      </div>
    </div>
  );
}
