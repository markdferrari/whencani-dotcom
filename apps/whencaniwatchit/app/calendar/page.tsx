"use client";

import { Suspense } from 'react';
import { WeeklyReleases, CalendarItem } from '@whencani/ui';
import { useSearchParams, useRouter } from 'next/navigation';
import { getMovieGenres } from '../../lib/tmdb';
import { useState, useEffect } from 'react';

function CalendarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    return startOfWeek;
  });
  const [releases, setReleases] = useState<Map<string, CalendarItem[]>>(new Map());
  const [watchlistIds, setWatchlistIds] = useState<number[]>([]);
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [myReleasesOnly, setMyReleasesOnly] = useState(false);

  useEffect(() => {
    getMovieGenres().then(setGenres);
  }, []);

  useEffect(() => {
    // Read watchlist from cookie
    const cookie = document.cookie.split('; ').find(c => c.startsWith('watchlist='));
    if (cookie) {
      const ids = cookie.split('=')[1].split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      setWatchlistIds(ids);
    }
  }, []);

  useEffect(() => {
    const weekParam = searchParams.get('week');
    if (weekParam) {
      const weekStart = new Date(weekParam);
      setCurrentWeekStart(weekStart);
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchReleases() {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(currentWeekStart.getDate() + 6);

      const params = new URLSearchParams({
        startDate: currentWeekStart.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0],
      });
      const genre = searchParams.get('genre');
      if (genre) params.set('genre', genre);

      const res = await fetch(`/api/calendar?${params}`);
      const data = await res.json();
      let map = new Map<string, CalendarItem[]>();
      for (const release of data.releases) {
        map.set(release.date, release.items);
      }
      if (myReleasesOnly) {
        const filtered = new Map<string, CalendarItem[]>();
        for (const [date, items] of map) {
          const filteredItems = items.filter(item => watchlistIds.includes(item.id));
          if (filteredItems.length > 0) {
            filtered.set(date, filteredItems);
          }
        }
        map = filtered;
      }
      setReleases(map);
    }
    fetchReleases();
  }, [currentWeekStart, searchParams, myReleasesOnly, watchlistIds]);

  const handleToggleWatchlist = async (itemId: number) => {
    const isInWatchlist = watchlistIds.includes(itemId);
    const action = isInWatchlist ? 'remove' : 'add';

    try {
      const response = await fetch('/api/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          movieId: itemId,
        }),
      });

      if (response.ok) {
        const updatedIds = isInWatchlist
          ? watchlistIds.filter(id => id !== itemId)
          : [...watchlistIds, itemId];
        setWatchlistIds(updatedIds);
      }
    } catch (error) {
      console.error('Failed to update watchlist:', error);
    }
  };

  const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const genreValue = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (genreValue) {
      params.set('genre', genreValue);
    } else {
      params.delete('genre');
    }
    router.push(`/calendar?${params.toString()}`);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Release Calendar</h1>
      <div className="mb-4 flex gap-4">
        <label className="text-xs uppercase tracking-[0.3em] text-zinc-500">
          Genre
          <select
            value={searchParams.get('genre') || ''}
            onChange={handleGenreChange}
            className="mt-2 w-full rounded-2xl border border-zinc-200/70 bg-white px-3 py-2 text-sm text-zinc-800 dark:border-zinc-800/70 dark:bg-zinc-950/70 dark:text-zinc-100"
          >
            <option value="">All genres</option>
            {genres.map((genre) => (
              <option key={genre.id} value={genre.id.toString()}>
                {genre.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={myReleasesOnly}
            onChange={(e) => setMyReleasesOnly(e.target.checked)}
          />
          My Watchlist
        </label>
      </div>
      <div className="flex justify-between mb-4">
        <button
          onClick={() => {
            const prevWeek = new Date(currentWeekStart);
            prevWeek.setDate(currentWeekStart.getDate() - 7);
            router.push(`/calendar?week=${prevWeek.toISOString().split('T')[0]}&${searchParams.toString().replace(/week=[^&]*/, '').replace(/^&/, '')}`);
          }}
          className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
        >
          Previous Week
        </button>
        <div className="text-center">
          <h2 className="text-lg font-semibold">
            {currentWeekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <p className="text-sm text-zinc-500">
            {currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {(new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: currentWeekStart.getFullYear() !== (new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000)).getFullYear() ? 'numeric' : undefined })}
          </p>
        </div>
        <button
          onClick={() => {
            const nextWeek = new Date(currentWeekStart);
            nextWeek.setDate(currentWeekStart.getDate() + 7);
            router.push(`/calendar?week=${nextWeek.toISOString().split('T')[0]}&${searchParams.toString().replace(/week=[^&]*/, '').replace(/^&/, '')}`);
          }}
          className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
        >
          Next Week
        </button>
      </div>
      <WeeklyReleases
        releases={releases}
        watchlistIds={watchlistIds}
        startDate={currentWeekStart}
        onToggleWatchlist={handleToggleWatchlist}
      />
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-4"><div className="text-center py-20">Loading calendar...</div></div>}>
      <CalendarContent />
    </Suspense>
  );
}