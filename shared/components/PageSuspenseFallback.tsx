import { Skeleton } from '@/components/ui/skeleton';

export function PageSuspenseFallback({
  showSidebar = true,
}: {
  showSidebar?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
      {showSidebar ? (
        <div className="xl:col-span-4">
          <Skeleton className="h-[720px] w-full rounded-2xl" />
        </div>
      ) : null}
      <div className={showSidebar ? 'space-y-8 xl:col-span-8' : 'space-y-8 xl:col-span-12'}>
        <Skeleton className="h-[120px] w-full rounded-2xl" />
        <Skeleton className="h-[420px] w-full rounded-3xl" />
        <Skeleton className="h-[220px] w-full rounded-2xl" />
      </div>
    </div>
  );
}
