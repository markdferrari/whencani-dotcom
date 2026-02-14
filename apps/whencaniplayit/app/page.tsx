import type { Metadata } from 'next';
import { getGameGenres, getDeveloperStudios } from '@/lib/igdb';
import { LatestReviewsSection } from '@/components/LatestReviewsSection';
import { PlatformFilter } from '@/components/PlatformFilter';
import { TrendingSection } from '@/components/TrendingSection';
import { TrendingBoardGamesSection } from '@/components/TrendingBoardGamesSection';
import { GamesSection } from '@/components/GamesSection';
import { RecentlyViewedSection } from '@/components/RecentlyViewedSection';
import { Suspense } from 'react';
import { config } from '@/lib/config';

const SITE_URL = 'https://whencaniplayit.com';
const SITE_NAME = 'WhenCanIPlayIt.com';
const PLATFORM_LABELS: Record<string, string> = {
  '1': 'PlayStation',
  '2': 'Xbox',
  '5': 'Nintendo',
  '6': 'PC',
};

interface PageProps {
  searchParams: Promise<{ platform?: string; view?: string; genre?: string; studio?: string; type?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const platformParam = params.platform || 'all';
  const viewParam = params.view || 'upcoming';
  const genreParam = params.genre;
  const studioParam = params.studio;
  const typeParam = params.type || 'video';

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

  if (typeParam === 'board') {
    const viewText = viewParam === 'recent' ? 'New' : 'Popular';
    const metaTitle = `${viewText} Board Games${filterSuffix} | ${SITE_NAME}`;
    const metaDescription = `Discover ${viewText.toLowerCase()} board games${filterParts.length ? ` for ${filterParts.join(', ')}` : ''} from BoardGameGeek.`;

    const queryParams = new URLSearchParams();
    if (viewParam !== 'upcoming') queryParams.set('view', viewParam);
    if (platformParam !== 'all') queryParams.set('platform', platformParam);
    if (genreParam) queryParams.set('genre', genreParam);
    if (studioParam) queryParams.set('studio', studioParam);
    queryParams.set('type', typeParam);
    const canonicalUrl = queryParams.toString() ? `${SITE_URL}/?${queryParams.toString()}` : SITE_URL;

    return {
      title: metaTitle,
      description: metaDescription,
      alternates: { canonical: canonicalUrl },
      openGraph: { title: metaTitle, description: metaDescription, url: canonicalUrl, type: 'website' },
    };
  }

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
      <main className="mx-auto w-full px-4 py-10 sm:px-6 lg:px-8 max-w-7xl flex flex-col gap-10">
        <section className="hidden sm:block rounded-3xl border border-zinc-200/70 bg-white/90 p-8 shadow-xl shadow-slate-900/5 dark:border-zinc-800/80 dark:bg-zinc-950/75">
          <h1 className="text-4xl font-bold leading-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Track every game release that matters to you.
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-300">
            Upcoming launches, review momentum, and multi-platform tracking—all in one place.
          </p>
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

            <TrendingSection />
            {config.features.boardGames && <TrendingBoardGamesSection />}
          </aside>

          <section className="space-y-6 min-w-0">
            {/* Mobile filters — visible above gamecard component on small screens */}
            <div className="rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70 lg:hidden max-w-full overflow-hidden min-w-0">
              <div className="mt-4">
                <Suspense fallback={<div>Loading filters...</div>}>
                  <PlatformFilter genres={genres} showBoardGames={config.features.boardGames} />
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
              <div className="mt-4">
                <Suspense fallback={<div>Loading filters...</div>}>
                  <PlatformFilter genres={genres} showBoardGames={config.features.boardGames} />
                </Suspense>
              </div>
            </div>
            <RecentlyViewedSection />
          </aside>
        </div>
      </main>
    </div>
  );
}
