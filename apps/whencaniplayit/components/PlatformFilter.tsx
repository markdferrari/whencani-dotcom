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
}

export function PlatformFilter({ genres }: PlatformFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPlatform = searchParams.get('platform') || 'all';
  const currentGenre = searchParams.get('genre') || '';
  const currentStudio = searchParams.get('studio') || '';

  const [studios, setStudios] = useState<Array<{ id: number; name: string }>>([]);
  const [studioLoading, setStudioLoading] = useState(true);
  const [studioError, setStudioError] = useState(false);

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
    let isActive = true;
    const fetchStudios = async () => {
      setStudioLoading(true);
      setStudioError(false);

      try {
        const response = await fetch('/api/studios');
        if (!response.ok) {
          throw new Error('Failed to load studios');
        }
        const data: Array<{ id: number; name: string }> = await response.json();
        if (!isActive) return;
        setStudios(data);
      } catch (error) {
        if (!isActive) return;
        setStudioError(true);
        setStudios([]);
      } finally {
        if (!isActive) return;
        setStudioLoading(false);
      }
    };

    void fetchStudios();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="grid gap-4">
      <label className="text-xs uppercase tracking-[0.3em] text-zinc-500">
        Platform
        <select
          value={currentPlatform}
          onChange={(event) => handleSelectChange('platform', event.target.value)}
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
          value={currentGenre}
          onChange={(event) => handleSelectChange('genre', event.target.value)}
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

      <label className="text-xs uppercase tracking-[0.3em] text-zinc-500">
        Studio
        <select
          value={currentStudio}
          onChange={(event) => handleSelectChange('studio', event.target.value)}
          className="mt-2 w-full rounded-2xl border border-zinc-200/70 bg-white px-3 py-2 text-sm text-zinc-800 dark:border-zinc-800/70 dark:bg-zinc-950/70 dark:text-zinc-100"
        >
          <option value="">All studios</option>
          {studios.map((studio) => (
            <option key={studio.id} value={studio.id.toString()}>
              {studio.name}
            </option>
          ))}
        </select>
        {studioLoading && (
          <span className="mt-2 block text-[10px] uppercase tracking-[0.3em] text-zinc-500">
            Loading studios…
          </span>
        )}
        {studioError && (
          <span className="mt-2 block text-[10px] uppercase tracking-[0.3em] text-red-500">
            Failed to load studios
          </span>
        )}
      </label>
    </div>
  );
}
