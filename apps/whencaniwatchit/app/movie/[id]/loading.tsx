export default function LoadingMoviePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_40%)]">
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-4 w-24 animate-pulse rounded bg-zinc-200/70 dark:bg-zinc-800/70" />
        <div className="overflow-hidden rounded-3xl border border-zinc-200/70 bg-white/90 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70">
          <div className="h-56 animate-pulse bg-zinc-200/50 dark:bg-zinc-900/60 sm:h-72" />
          <div className="grid gap-6 p-6 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-10 sm:p-10">
            <div className="mx-auto w-full max-w-[220px]">
              <div className="aspect-[2/3] animate-pulse rounded-2xl bg-zinc-200/50 dark:bg-zinc-900/60" />
            </div>
            <div className="space-y-4">
              <div className="h-8 w-2/3 animate-pulse rounded bg-zinc-200/70 dark:bg-zinc-800/70" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-200/60 dark:bg-zinc-800/60" />
              <div className="h-20 w-full animate-pulse rounded-2xl bg-zinc-200/50 dark:bg-zinc-900/60" />
              <div className="h-20 w-full animate-pulse rounded-2xl bg-zinc-200/50 dark:bg-zinc-900/60" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
