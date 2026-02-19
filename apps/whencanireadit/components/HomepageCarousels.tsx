"use client";

import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { MediaCard, MediaCarousel, ReleaseBadge, isReleasedRecently } from "@whencani/ui";
import { config } from "@/lib/config";
import { useBookshelfIds } from "@/hooks/use-bookshelf";
import { BookshelfToggle } from "@/components/BookshelfToggle";
import type { NYTBestsellerList, Book } from "@/lib/types";

const ACCENT = {
  navBorderHover: "hover:border-sky-500",
  navTextHover: "hover:text-sky-500",
};

interface NYTCarouselProps {
  list: NYTBestsellerList;
}

function NYTBookCard({ book }: { book: NYTBestsellerList["books"][number] }) {
  const href = book.isbn13 ?? book.isbn10 ?? null;

  const card = (
    <article className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-100/80 bg-white p-4 text-center shadow-sm transition hover:border-sky-500/40 hover:shadow-lg dark:border-zinc-800/80 dark:bg-zinc-950/70">
      <div className="relative flex-shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900" style={{ width: 160, height: 240 }}>
        {book.coverUrl ? (
          <Image
            src={book.coverUrl}
            alt={`${book.title} book cover`}
            width={160}
            height={240}
            className="h-full w-full object-cover"
            priority={false}
            unoptimized={book.coverUrl.startsWith('/api/image')}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.4em] text-zinc-400">
            No image
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">#{book.rank}</p>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 group-hover:text-sky-500">
          {book.title}
        </h3>
        {book.author && (
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
            by {book.author}
          </p>
        )}
      </div>
    </article>
  );

  if (href) {
    return <Link href={`/book/${href}`} className="group block">{card}</Link>;
  }

  return <div className="group block">{card}</div>;
}

function CarouselWrapper({ label, subtitle, children }: { label: string; subtitle?: string; children: React.ReactNode }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollButtons = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    updateScrollButtons();
    emblaApi.on("select", updateScrollButtons);
    emblaApi.on("reInit", updateScrollButtons);
    return () => {
      emblaApi.off("select", updateScrollButtons);
      emblaApi.off("reInit", updateScrollButtons);
    };
  }, [emblaApi, updateScrollButtons]);

  return (
    <div className="rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">
            {label}
          </p>
          {subtitle && (
            <p className="text-sm text-zinc-500">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="relative mt-5 group">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">
            {children}
          </div>
        </div>

        {/* Desktop hover controls (mobile swipe stays unchanged) */}
        <button
          type="button"
          aria-label="Scroll left"
          disabled={!canScrollPrev}
          onClick={() => {
            if (!emblaApi) return;
            const idx = emblaApi.selectedScrollSnap();
            emblaApi.scrollTo(Math.max(0, idx - 1));
          }}
          className="hidden lg:flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full border border-zinc-200/70 bg-white/90 text-zinc-700 shadow-sm opacity-0 transition group-hover:opacity-100 disabled:opacity-0 disabled:cursor-not-allowed hover:border-sky-500 hover:text-sky-500 dark:border-zinc-800/70 dark:bg-zinc-950/70 dark:text-zinc-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          type="button"
          aria-label="Scroll right"
          disabled={!canScrollNext}
          onClick={() => {
            if (!emblaApi) return;
            const idx = emblaApi.selectedScrollSnap();
            emblaApi.scrollTo(idx + 1);
          }}
          className="hidden lg:flex items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full border border-zinc-200/70 bg-white/90 text-zinc-700 shadow-sm opacity-0 transition group-hover:opacity-100 disabled:opacity-0 disabled:cursor-not-allowed hover:border-sky-500 hover:text-sky-500 dark:border-zinc-800/70 dark:bg-zinc-950/70 dark:text-zinc-100"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function NYTCarouselStandard({ list, displayName }: { list: NYTBestsellerList; displayName: string }) {
  return (
    <MediaCarousel
      label={displayName}
      subtitle={`Updated ${list.publishedDate}`}
      slideBasis="flex-[0_0_50%] sm:flex-[0_0_33%] lg:flex-[0_0_22%]"
      showNavigation
      accentClasses={ACCENT}
    >
      {list.books.map((book) => (
        <NYTBookCard key={book.isbn13 || book.title} book={book} />
      ))}
    </MediaCarousel>
  );
}

export function NYTCarousel({ list }: NYTCarouselProps) {
  const displayName =
    list.displayName === 'Combined Print & E-Book Fiction' ? 'Trending Fiction' :
    list.displayName === 'Combined Print & E-Book Nonfiction' ? 'Trending Nonfiction' :
    list.displayName;

  if (config.features.standardCarousels) {
    return <NYTCarouselStandard list={list} displayName={displayName} />;
  }

  return (
    <CarouselWrapper label={displayName} subtitle={`Updated ${list.publishedDate}`}>
      {list.books.map((book) => (
        <div key={book.isbn13 || book.title} className="min-w-0 flex-[0_0_50%] sm:flex-[0_0_33%] lg:flex-[0_0_22%]">
          <NYTBookCard book={book} />
        </div>
      ))}
    </CarouselWrapper>
  );
}

export function BookCard({ book, showBookshelfToggle }: { book: Book; showBookshelfToggle?: boolean }) {
  const bookshelfIds = useBookshelfIds();
  const isInBookshelf = bookshelfIds.includes(book.id);
  const isReleased = isReleasedRecently(book.publishedDate, 0);
  const featureEnabled = config.features.bookshelfImprovements;
  const showBadge = featureEnabled && isInBookshelf && isReleased;
  return (
    <MediaCard
      id={book.id}
      href={`/book/${book.id}`}
      title={book.title}
      imageUrl={book.coverUrl || undefined}
      imageAlt={`${book.title} book cover`}
      releaseDate={book.publishedDate ? formatPublishedDate(book.publishedDate) : undefined}
      summary={book.description || undefined}
      authors={book.authors}
      genres={book.categories}
      badge={showBadge ? <ReleaseBadge /> : undefined}
      watchlistToggle={showBookshelfToggle ? <BookshelfToggle bookId={book.id} /> : undefined}
    />
  );
}

function formatPublishedDate(dateStr: string): string {
  // Google Books dates can be "2026", "2026-03", or "2026-03-15"
  const parts = dateStr.split("-");
  if (parts.length === 1) return parts[0]; // Just year
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    if (parts.length === 2) {
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export function NYTSidebar({ fictionList, nonfictionList }: { fictionList: NYTBestsellerList | null; nonfictionList: NYTBestsellerList | null }) {
  const useStandard = config.features.standardCarousels;

  return (
    <div className="space-y-6">
      {fictionList && fictionList.books.length > 0 && (
        useStandard ? (
          <MediaCarousel
            label="Trending Fiction"
            subtitle={`Updated ${fictionList.publishedDate}`}
            slideBasis="flex-[0_0_50%] sm:flex-[0_0_33%] lg:flex-[0_0_22%]"
            showNavigation
            accentClasses={ACCENT}
          >
            {fictionList.books.slice(0, 8).map((book) => (
              <NYTBookCard key={book.isbn13 || book.title} book={book} />
            ))}
          </MediaCarousel>
        ) : (
          <CarouselWrapper label="Trending Fiction" subtitle={`Updated ${fictionList.publishedDate}`}>
            {fictionList.books.slice(0, 8).map((book) => (
              <div key={book.isbn13 || book.title} className="min-w-0 flex-[0_0_50%] sm:flex-[0_0_33%] lg:flex-[0_0_22%]">
                <NYTBookCard book={book} />
              </div>
            ))}
          </CarouselWrapper>
        )
      )}
      {nonfictionList && nonfictionList.books.length > 0 && (
        useStandard ? (
          <MediaCarousel
            label="Trending Nonfiction"
            subtitle={`Updated ${nonfictionList.publishedDate}`}
            slideBasis="flex-[0_0_50%] sm:flex-[0_0_33%] lg:flex-[0_0_22%]"
            showNavigation
            accentClasses={ACCENT}
          >
            {nonfictionList.books.slice(0, 8).map((book) => (
              <NYTBookCard key={book.isbn13 || book.title} book={book} />
            ))}
          </MediaCarousel>
        ) : (
          <CarouselWrapper label="Trending Nonfiction" subtitle={`Updated ${nonfictionList.publishedDate}`}>
            {nonfictionList.books.slice(0, 8).map((book) => (
              <div key={book.isbn13 || book.title} className="min-w-0 flex-[0_0_50%] sm:flex-[0_0_33%] lg:flex-[0_0_22%]">
                <NYTBookCard book={book} />
              </div>
            ))}
          </CarouselWrapper>
        )
      )}
    </div>
  );
}

export function BooksCarousel({ label, books, showBookshelfToggle }: { label: string; books: Book[]; showBookshelfToggle?: boolean }) {
  if (books.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200/70 bg-zinc-50/70 p-8 text-center text-sm text-zinc-600 dark:border-zinc-800/70 dark:bg-zinc-900/60 dark:text-zinc-300">
        No books found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">
          {label}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {books.map((book) => (
          <BookCard key={book.id} book={book} showBookshelfToggle={showBookshelfToggle} />
        ))}
      </div>
    </div>
  );
}
