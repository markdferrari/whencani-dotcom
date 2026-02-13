"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getRecentlyViewed, clearRecentlyViewed, type RecentlyViewedItem } from "@/lib/recently-viewed";

export function RecentlyViewedSection() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);
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
    setItems(getRecentlyViewed());
  }, []);

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

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-zinc-200/70 bg-white/90 p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950/70">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">
            Recently viewed
          </p>
        </div>
        <button
          onClick={() => {
            clearRecentlyViewed();
            setItems([]);
          }}
          className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          Clear
        </button>
      </div>
      <div className="relative mt-5 group">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="group block min-w-0 flex-[0_0_100%]"
              >
                <article className="relative rounded-2xl border border-zinc-100/80 bg-white p-3 shadow-sm transition hover:border-blue-400 hover:shadow-lg dark:border-zinc-800/80 dark:bg-zinc-900/80">
                  <div className="relative mb-3 aspect-[2/3] overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={`${item.title} poster`}
                        fill
                        className="object-cover"
                        sizes="100vw"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[0.6rem] uppercase tracking-[0.4em] text-zinc-400">
                        No poster
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-zinc-900 group-hover:text-blue-500 dark:text-zinc-50">
                    {item.title}
                  </p>
                  {item.releaseDate && (
                    <p className="text-xs text-zinc-500 mt-1">
                      {item.releaseDate}
                    </p>
                  )}
                </article>
              </Link>
            ))}
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
          className="hidden lg:flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full border border-zinc-200/70 bg-white/90 text-zinc-700 shadow-sm opacity-0 transition group-hover:opacity-100 disabled:opacity-0 disabled:cursor-not-allowed hover:border-blue-500 hover:text-blue-500 dark:border-zinc-800/70 dark:bg-zinc-950/70 dark:text-zinc-100"
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
          className="hidden lg:flex items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full border border-zinc-200/70 bg-white/90 text-zinc-700 shadow-sm opacity-0 transition group-hover:opacity-100 disabled:opacity-0 disabled:cursor-not-allowed hover:border-blue-500 hover:text-blue-500 dark:border-zinc-800/70 dark:bg-zinc-950/70 dark:text-zinc-100"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}