import { WatchlistSection } from '@/components/WatchlistSection';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function WatchlistPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const idsParam = params.ids;
  const overrideIds = idsParam
    ? String(idsParam)
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id))
    : undefined;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_45%)]">
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8">
        <section className="hidden sm:blockrounded-3xl border border-zinc-200/70 bg-white/90 p-8 shadow-xl shadow-slate-900/5 dark:border-zinc-800/80 dark:bg-zinc-950/75">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-500">
            Watchlist
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Favourite movies, ready when you are
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-300">
            Keep tabs on releases you care about without losing track of the rest. Toggle the star on any movie to add or remove it from this list.
          </p>
        </section>

        <WatchlistSection overrideIds={overrideIds} isShared={!!overrideIds} />
      </main>
    </div>
  );
}
