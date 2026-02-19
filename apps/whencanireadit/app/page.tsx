import type { Metadata } from "next";
import { config } from "@/lib/config";
import { getNewBooks as getNewBooksGoogle, getComingSoonBooks as getComingSoonBooksGoogle } from "@/lib/google-books";
import { getNewBooks as getNewBooksOL, getComingSoonBooks as getComingSoonBooksOL } from "@/lib/open-library";
import { detectRegion } from "@/lib/region";
import { getFictionBestsellers, getNonfictionBestsellers } from "@/lib/nyt-books";
import { BooksCarousel, NYTSidebar } from "@/components/HomepageCarousels";
import { RecentlyViewedSection } from "@/components/RecentlyViewedSection";
import type { NYTBestsellerList, Book } from "@/lib/types";

export const dynamic = "force-dynamic";

const SITE_URL = "https://whencanireadit.com";

// Cache homepage carousel data for 24h + up to 1h jitter
const CAROUSEL_CACHE_TTL = 24 * 60 * 60 * 1000;
const CAROUSEL_CACHE_JITTER = 60 * 60 * 1000;

interface CarouselCacheEntry {
  expires: number;
  fictionList: NYTBestsellerList | null;
  nonfictionList: NYTBestsellerList | null;
  newBooks: Book[];
  comingSoonBooks: Book[];
}

const carouselCache = new Map<string, CarouselCacheEntry>();

export const metadata: Metadata = {
  title: "Upcoming Book Releases & Bestsellers | WhenCanIReadIt.com",
  description:
    "Track upcoming book releases, NYT bestsellers, and new titles. Save books to your bookshelf and never miss a release.",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "Upcoming Book Releases & Bestsellers",
    description:
      "Track upcoming book releases, NYT bestsellers, and new titles. Save books to your bookshelf and never miss a release.",
    url: SITE_URL,
    type: "website",
  },
};

async function fetchCarouselData(country: string | undefined): Promise<CarouselCacheEntry> {
  const nytEnabled = config.features.nytBestsellers;
  const genreCarouselsEnabled = config.features.homepageGenreCarousels;
  const useOL = config.features.openLibraryPrimary;

  const getNewBooks = useOL ? getNewBooksOL : getNewBooksGoogle;
  const getComingSoonBooks = useOL ? getComingSoonBooksOL : getComingSoonBooksGoogle;

  let fictionList: NYTBestsellerList | null = null;
  let nonfictionList: NYTBestsellerList | null = null;
  let newBooks: Book[] = [];
  let comingSoonBooks: Book[] = [];

  try {
    const results = await Promise.allSettled([
      nytEnabled ? getFictionBestsellers() : Promise.resolve(null),
      nytEnabled ? getNonfictionBestsellers() : Promise.resolve(null),
      getNewBooks(12, country),
      genreCarouselsEnabled ? getComingSoonBooks(12, country) : Promise.resolve([]),
    ]);

    if (results[0].status === "fulfilled" && results[0].value) {
      fictionList = results[0].value;
    }
    if (results[1].status === "fulfilled" && results[1].value) {
      nonfictionList = results[1].value;
    }
    if (results[2].status === "fulfilled") {
      newBooks = results[2].value;
    } else {
      console.error("[Home] getNewBooks failed:", results[2].reason);
    }
    if (results[3].status === "fulfilled") {
      comingSoonBooks = results[3].value;
    }
  } catch (err) {
    console.error("[Home] Unexpected error fetching homepage data:", err);
  }

  const jitter = Math.floor(Math.random() * CAROUSEL_CACHE_JITTER);
  return { expires: Date.now() + CAROUSEL_CACHE_TTL + jitter, fictionList, nonfictionList, newBooks, comingSoonBooks };
}

async function getCarouselData(country: string | undefined): Promise<CarouselCacheEntry> {
  const cacheKey = country ?? "__default__";
  const cached = carouselCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached;
  }
  const fresh = await fetchCarouselData(country);
  carouselCache.set(cacheKey, fresh);
  return fresh;
}

export default async function Home() {
  const country = config.features.regionSwitcher ? await detectRegion() : undefined;
  const { fictionList, nonfictionList, newBooks, comingSoonBooks } = await getCarouselData(country);
  const genreCarouselsEnabled = config.features.homepageGenreCarousels;

  return (
    <div className="min-h-screen">
      <main className="mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 max-w-7xl flex flex-col gap-8">
        <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_260px] gap-6 lg:gap-8 items-start">
          <section className="rounded-3xl border border-zinc-200/70 bg-white/90 px-5 py-4 sm:p-10 shadow-xl shadow-slate-900/5 dark:border-zinc-800/80 dark:bg-zinc-950/75">
            <h1 className="text-2xl font-bold leading-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
              Track every book release that matters to you.
            </h1>
            <p className="mt-2 sm:mt-4 text-sm sm:text-lg text-zinc-600 dark:text-zinc-300">
              New releases, bestsellers, and upcoming titles&mdash;all in one place.
            </p>
          </section>
          <aside className="hidden lg:block min-w-0 w-full">
            <RecentlyViewedSection />
          </aside>
        </div>

        {(fictionList || nonfictionList) && (
          <NYTSidebar fictionList={fictionList} nonfictionList={nonfictionList} />
        )}

        <div className="rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70">
          <BooksCarousel label="New This Month" books={newBooks} />
        </div>

        {genreCarouselsEnabled && comingSoonBooks.length > 0 && (
          <div className="rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70">
            <BooksCarousel label="Coming Soon" books={comingSoonBooks} />
          </div>
        )}
      </main>
    </div>
  );
}
