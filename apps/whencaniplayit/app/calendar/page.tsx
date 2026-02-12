"use client";

import { useState, useEffect } from 'react';
import { WeeklyReleases, DayDetail, CalendarItem } from '@whencani/ui';
import { useSearchParams, useRouter } from 'next/navigation';
import { getGameGenres } from '../../lib/igdb';

const PLATFORMS = [
  { id: '', name: 'All Platforms' },
  { id: '1', name: 'PlayStation' },
  { id: '2', name: 'Xbox' },
  { id: '5', name: 'Nintendo' },
  { id: '6', name: 'PC' },
];

export default function CalendarPage() {
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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [watchlistIds, setWatchlistIds] = useState<number[]>([]);
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [myReleasesOnly, setMyReleasesOnly] = useState(false);

  useEffect(() => {
    getGameGenres().then(setGenres);
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
      const platform = searchParams.get('platform');
      if (platform) params.set('platform', platform);
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

  const handleDayClick = (date: string) => {
    setSelectedDate(date);
  };

  const handleCloseDetail = () => {
    setSelectedDate(null);
  };

  const selectedItems = selectedDate ? releases.get(selectedDate) || [] : [];

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/calendar?${params.toString()}`);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Release Calendar</h1>
      <div className="mb-4 flex gap-4">
        <label className="text-xs uppercase tracking-[0.3em] text-zinc-500">
          Platform
          <select
            value={searchParams.get('platform') || ''}
            onChange={(e) => handleFilterChange('platform', e.target.value)}
            className="mt-2 w-full rounded-2xl border border-zinc-200/70 bg-white px-3 py-2 text-sm text-zinc-800 dark:border-zinc-800/70 dark:bg-zinc-950/70 dark:text-zinc-100"
          >
            {PLATFORMS.map((platform) => (
              <option key={platform.id} value={platform.id}>
                {platform.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs uppercase tracking-[0.3em] text-zinc-500">
          Genre
          <select
            value={searchParams.get('genre') || ''}
            onChange={(e) => handleFilterChange('genre', e.target.value)}
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
          My releases
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
        <h2 className="text-lg font-semibold">
          {currentWeekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
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
        onDayClick={handleDayClick}
        startDate={currentWeekStart}
      />
      {selectedDate && (
        <DayDetail
          date={selectedDate}
          items={selectedItems}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
}