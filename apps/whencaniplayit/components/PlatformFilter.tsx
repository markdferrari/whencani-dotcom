"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const PLATFORMS = [
  { id: 'all', name: 'All Platforms' },
  { id: '1', name: 'PlayStation' },
  { id: '2', name: 'Xbox' },
  { id: '5', name: 'Nintendo' },
  { id: '6', name: 'PC' },
];

interface PlatformFilterProps {
  genres: Array<{ id: number; name: string }>;
  showBoardGames?: boolean;
  layout?: 'stacked' | 'inline';
}

export function PlatformFilter({ genres, showBoardGames = false, layout = 'stacked' }: PlatformFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPlatform = searchParams.get('platform') || 'all';
  const currentGenre = searchParams.get('genre') || '';
  const currentType = searchParams.get('type') || 'video';

  const [bggCategories, setBggCategories] = useState<string[]>([]);
  const [bggLoading, setBggLoading] = useState(false);

  const handleSelectChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const query = params.toString();
    router.push(query ? `/?${query}` : '/');
  };

  useEffect(() => {
    if (!showBoardGames || currentType !== 'board') return;
    let active = true;
    setBggLoading(true);
    void (async () => {
      try {
        const res = await fetch('/api/board-games');
        if (!res.ok) throw new Error('Failed to load BGG categories');
        const json = await res.json();
        if (!active) return;
        setBggCategories(json.categories || []);
      } catch (err) {
        console.error(err);
        if (!active) return;
        setBggCategories([]);
      } finally {
        if (!active) return;
        setBggLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [currentType, showBoardGames]);

  const isInline = layout === 'inline';
  const containerClass = isInline ? 'flex flex-wrap items-end gap-3' : 'grid gap-4';
  const selectClass = isInline
    ? 'mt-1 w-auto min-w-[140px] rounded-xl border border-zinc-200/70 bg-white px-3 py-1.5 text-sm text-zinc-800 dark:border-zinc-800/70 dark:bg-zinc-950/70 dark:text-zinc-100'
    : 'mt-2 w-full rounded-2xl border border-zinc-200/70 bg-white px-3 py-2 text-sm text-zinc-800 dark:border-zinc-800/70 dark:bg-zinc-950/70 dark:text-zinc-100';

  return (
    <div className={containerClass}>
      {showBoardGames && (
        <label className="text-xs uppercase tracking-[0.3em] text-zinc-500">
          Game Type
          <select
            value={currentType}
            onChange={(e) => handleSelectChange('type', e.target.value)}
            className={selectClass}
          >
            <option value="video">Video Games</option>
            <option value="board">Board Games</option>
          </select>
        </label>
      )}

      {currentType !== 'board' && (
        <label className="text-xs uppercase tracking-[0.3em] text-zinc-500">
          Platform
          <select
            value={currentPlatform}
            onChange={(event) => handleSelectChange('platform', event.target.value)}
            className={selectClass}
          >
            {PLATFORMS.map((platform) => (
              <option key={platform.id} value={platform.id}>
                {platform.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="text-xs uppercase tracking-[0.3em] text-zinc-500">
        Genre
        <select
          value={currentGenre}
          onChange={(event) => handleSelectChange('genre', event.target.value)}
          className={selectClass}
        >
          <option value="">All genres</option>
          {currentType === 'board' ? (
            bggCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))
          ) : (
            genres.map((genre) => (
              <option key={genre.id} value={genre.id.toString()}>
                {genre.name}
              </option>
            ))
          )}
        </select>
        {currentType === 'board' && bggLoading && (
          <span className="mt-1 block text-[10px] uppercase tracking-[0.3em] text-zinc-500">Loading categories…</span>
        )}
      </label>
    </div>
  );
}
