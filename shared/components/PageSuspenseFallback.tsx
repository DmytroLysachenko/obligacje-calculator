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
          <Skeleton className="h-[96px] w-full rounded-[1.6rem] md:h-[120px] md:rounded-2xl" />
          <Skeleton className="h-[420px] w-full rounded-[1.6rem] md:h-[640px] md:rounded-2xl" />
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
          <Skeleton className="h-8 w-full max-w-[16rem] rounded-xl md:h-10 md:max-w-[20rem]" />
          <Skeleton className="h-4 w-full max-w-2xl rounded-xl" />
          <Skeleton className="h-4 w-full max-w-xl rounded-xl" />
        </div>
        <Skeleton className="h-[200px] w-full rounded-[1.8rem] md:h-[220px] md:rounded-3xl" />
        <Skeleton className="h-[320px] w-full rounded-[1.8rem] md:h-[420px] md:rounded-3xl" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-[160px] w-full rounded-[1.6rem] md:h-[180px] md:rounded-2xl" />
          <Skeleton className="h-[160px] w-full rounded-[1.6rem] md:h-[180px] md:rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
