"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { CalendarItem } from "../types/calendar";

interface WeeklyReleasesProps {
  releases: Map<string, CalendarItem[]>;
  watchlistIds: Array<number | string>;
  startDate: Date;
  onToggleWatchlist?: (itemId: number | string) => void;
}

export function WeeklyReleases({ releases, watchlistIds, startDate, onToggleWatchlist }: WeeklyReleasesProps) {
  const [showAll, setShowAll] = useState(false);

  const allReleases = useMemo(() => {
    const items: Array<{ item: CalendarItem; date: string; dateObj: Date }> = [];

    // Get all dates in the week
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayReleases = releases.get(dateStr) || [];

      dayReleases.forEach(item => {
        items.push({ item, date: dateStr, dateObj: date });
      });
    }

    // Sort by date
    return items.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [releases, startDate]);

  const displayedReleases = showAll ? allReleases : allReleases.slice(0, 6);
  const hasMore = allReleases.length > 6;

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  if (allReleases.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-8xl mb-6">🎬</div>
        <h3 className="text-xl font-medium mb-2 text-zinc-700 dark:text-zinc-300">No releases this week</h3>
        <p className="text-zinc-500">Check back later for upcoming releases</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {displayedReleases.map(({ item, date, dateObj }, index) => (
          <div key={`${date}-${item.id}-${index}`} className="group relative">
            <Link href={item.href} className="block">
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 mb-3 shadow-sm group-hover:shadow-lg transition-shadow duration-200">
                <img
                  src={item.imageUrl || '/placeholder.png'}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
              <div className="space-y-1">
                <h3 className="font-medium text-sm leading-tight overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.title}</h3>
                <p className="text-xs text-zinc-500">
                  {formatDate(dateObj)}
                </p>
              </div>
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleWatchlist?.(item.id);
              }}
              className={`absolute top-2 right-2 p-1 rounded-full shadow-sm transition-colors z-10 ${
                watchlistIds.includes(item.id)
                  ? 'bg-yellow-500 text-black hover:bg-yellow-600'
                  : 'bg-zinc-700/80 text-zinc-300 hover:bg-zinc-600 hover:text-white'
              }`}
            >
              <Star className={`h-3.5 w-3.5 ${watchlistIds.includes(item.id) ? 'fill-current' : ''}`} />
            </button>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="text-center pt-4">
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-8 py-3 text-sm font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {showAll ? 'Show Less' : `Show ${allReleases.length - 6} More`}
          </button>
        </div>
      )}
    </div>
  );
}