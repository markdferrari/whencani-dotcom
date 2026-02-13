import { Skeleton } from '@whencani/ui';

export default function BookDetailLoading() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_40%)]">
      <main className="mx-auto w-full max-w-[min(100vw,360px)] px-4 py-8 sm:px-6 sm:max-w-[min(100vw,640px)] lg:px-8 lg:max-w-7xl">
        {/* Back link skeleton */}
        <Skeleton className="h-4 w-16" />

        {/* Hero card skeleton */}
        <div className="mt-6 overflow-hidden rounded-3xl border border-zinc-200/70 bg-white/90 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70">
          {/* Backdrop skeleton */}
          <Skeleton className="h-56 w-full rounded-none sm:h-72" />

          {/* Grid: poster + details */}
          <div className="grid gap-6 p-6 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-10 sm:p-10">
            <Skeleton className="mx-auto aspect-[2/3] w-full max-w-[220px] rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-8 w-40 rounded-full" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <Skeleton className="h-20 w-full" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
