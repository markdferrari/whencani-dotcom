"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MediaCarousel } from "@whencani/ui/media-carousel";
import { getRecentlyViewed, clearRecentlyViewed, type RecentlyViewedItem } from "@/lib/recently-viewed";

export function RecentlyViewedSection() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    setItems(getRecentlyViewed());
  }, []);

  if (items.length === 0) {
    return null;
  }

  return (
    <MediaCarousel
      label="Recently viewed"
      slideBasis="flex-[0_0_70%] sm:flex-[0_0_45%] lg:flex-[0_0_22%]"
      className="mt-8"
    >
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className="block rounded-2xl border border-zinc-100/80 bg-white p-3 shadow-sm transition hover:border-blue-400 dark:border-zinc-800/80 dark:bg-zinc-900/80"
        >
          <div className="relative mb-3 aspect-[3/4] overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={`${item.title} cover`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 70vw, (max-width: 1024px) 45vw, 220px"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[0.6rem] uppercase tracking-[0.4em] text-zinc-400">
                No cover
              </div>
            )}
          </div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {item.title}
          </p>
          {item.releaseDate && (
            <p className="text-xs text-zinc-500 mt-1">
              {item.releaseDate}
            </p>
          )}
        </Link>
      ))}
      <div className="flex items-center justify-center rounded-2xl border border-zinc-100/80 bg-white p-3 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-900/80">
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
    </MediaCarousel>
  );
}