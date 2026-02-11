import type { Metadata } from 'next';
import { getGameGenres, getDeveloperStudios } from '@/lib/igdb';
import { LatestReviewsSection } from '@/components/LatestReviewsSection';
import { PlatformFilter } from '@/components/PlatformFilter';
import { TrendingSection } from '@/components/TrendingSection';
import { GamesSection } from '@/components/GamesSection';
import { Suspense } from 'react';

const SITE_URL = 'https://whencaniplayit.com';
const SITE_NAME = 'WhenCanIPlayIt.com';
const PLATFORM_LABELS: Record<string, string> = {
  '1': 'PlayStation',
  '2': 'Xbox',
  '5': 'Nintendo',
  '6': 'PC',
};

interface PageProps {
  searchParams: Promise<{ platform?: string; view?: string; genre?: string; studio?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const platformParam = params.platform || 'all';
  const viewParam = params.view || 'upcoming';
  const genreParam = params.genre;
  const studioParam = params.studio;

  const genres = await getGameGenres().catch(() => []);
  const genreName = genreParam ? genres.find((g) => g.id === parseInt(genreParam, 10))?.name : null;

  let studioName: string | null = null;
  if (studioParam) {
    const studios = await getDeveloperStudios().catch(() => []);
    studioName = studios.find((s) => s.id === parseInt(studioParam, 10))?.name || null;
  }

  const platformLabel = platformParam !== 'all' ? PLATFORM_LABELS[platformParam] || 'Multi-platform' : null;
  const filterParts = [platformLabel, genreName, studioName].filter(Boolean);
  const filterSuffix = filterParts.length ? ` - ${filterParts.join(', ')}` : '';
  const viewText = viewParam === 'recent' ? 'Recently Released' : 'Upcoming';
  const metaTitle = `${viewText} Video Game Releases${filterSuffix} | ${SITE_NAME}`;
  const metaDescription = `Discover ${viewText.toLowerCase()} video game releases${filterParts.length ? ` for ${filterParts.join(', ')}` : ''} with verified release windows and trending review scores.`;

  const queryParams = new URLSearchParams();
  if (viewParam !== 'upcoming') queryParams.set('view', viewParam);
  if (platformParam !== 'all') queryParams.set('platform', platformParam);
  if (genreParam) queryParams.set('genre', genreParam);
  if (studioParam) queryParams.set('studio', studioParam);
  const canonicalUrl = queryParams.toString() ? `${SITE_URL}/?${queryParams.toString()}` : SITE_URL;

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: canonicalUrl,
      type: 'website',
    },
  };
}

function buildStructuredData(viewParam: string, genres: any[]) {
  const siteUrl = SITE_URL;
  const now = new Date();
  const startDate = viewParam === 'recent' 
    ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    : now.toISOString();

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Video Game Release Tracker',
    description: 'Browse verified video game release windows and trending reviews',
    url: siteUrl,
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: siteUrl,
    },
    mainEntity: {
      '@type': 'ItemList',
      name: viewParam === 'recent' ? 'Recently Released Games' : 'Upcoming Game Releases',
      description: `${viewParam === 'recent' ? 'Recently released' : 'Upcoming'} video game titles across all major platforms`,
      itemListElement: genres.slice(0, 8).map((genre, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: `${genre.name} Games`,
        url: `${siteUrl}/?genre=${genre.id}`,
      })),
    },
  };
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const genresPromise = getGameGenres();
  const genres = await genresPromise.catch(() => []);
  const viewParam = params.view || 'upcoming';

  const structuredData = buildStructuredData(viewParam, genres);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_45%)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="mx-auto w-full max-w-[min(100vw,360px)] px-4 py-10 sm:px-6 sm:max-w-[min(100vw,640px)] lg:px-8 lg:max-w-7xl flex flex-col gap-10">
        <section className="rounded-3xl border border-zinc-200/70 bg-white/90 p-8 shadow-xl shadow-slate-900/5 dark:border-zinc-800/80 dark:bg-zinc-950/75">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-500">
            Tracking all the upcoming releases so you don&apos;t have to
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Stay ahead of every big game drop and score update.
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-300">
            We surface verified release windows, recent review momentum, and trending scores so you can queue your next session with confidence.
          </p>

          {/* Hero Stats Cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-zinc-200 bg-gradient-to-br from-sky-50 to-blue-50 p-4 dark:border-zinc-800 dark:from-sky-950/30 dark:to-blue-950/30">
              <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">100%</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Verified Release Windows</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 dark:border-zinc-800 dark:from-amber-950/30 dark:to-orange-950/30">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">Live</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Review Momentum Tracking</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 dark:border-zinc-800 dark:from-emerald-950/30 dark:to-teal-950/30">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">4</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Major Platforms</p>
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)_260px]">
          <aside className="space-y-6 min-w-0">
            <Suspense fallback={
              <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-2 h-4 rounded bg-zinc-200 dark:bg-zinc-700" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="mb-2 h-20 rounded bg-zinc-100 dark:bg-zinc-800" />
                ))}
              </div>
            }>
              <div className="rounded-2xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70">
                <LatestReviewsSection />
              </div>
            </Suspense>

            <div className="rounded-2xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70">
              <TrendingSection />
            </div>
          </aside>

          <section className="space-y-6 min-w-0">
            {/* Mobile filters — visible above gamecard component on small screens */}
            <div className="rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70 lg:hidden max-w-full overflow-hidden min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">
                Filters
              </p>
              <div className="mt-4">
                <Suspense fallback={<div>Loading filters...</div>}>
                  <PlatformFilter genres={genres} />
                </Suspense>
              </div>
            </div>

            <Suspense fallback={
              <div className="rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70 space-y-4">
                <div className="h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 w-48" />
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
                ))}
              </div>
            }>
              <GamesSection searchParams={params} />
            </Suspense>
          </section>

          <aside className="space-y-6 hidden lg:block min-w-0">
            <div className="rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">
                Filters
              </p>
              <div className="mt-4">
                <Suspense fallback={<div>Loading filters...</div>}>
                  <PlatformFilter genres={genres} />
                </Suspense>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
