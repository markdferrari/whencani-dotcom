'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { REGION_COOKIE_NAME, parseRegionCookie, type Region } from '@/lib/region';

function readRegionFromCookie(): Region | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${REGION_COOKIE_NAME}=`));
  const value = match?.split('=').slice(1).join('=') ?? null;
  return parseRegionCookie(value);
}

interface RegionSwitcherProps {
  detectedRegion: Region;
}

const REGIONS: Region[] = ['GB', 'US'];

export function RegionSwitcher({ detectedRegion }: RegionSwitcherProps) {
  const router = useRouter();
  const [region, setRegion] = useState<Region>(detectedRegion);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const cookieRegion = readRegionFromCookie();
    if (cookieRegion) setRegion(cookieRegion);
  }, []);

  const handleSwitch = useCallback(
    async (next: Region) => {
      if (next === region || isPending) return;
      setIsPending(true);
      setRegion(next);

      await fetch('/api/region', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region: next }),
      });

      setIsPending(false);
      router.refresh();
    },
    [region, isPending, router],
  );

  return (
    <div
      role="group"
      aria-label="Region preference"
      className="inline-flex rounded-full border border-zinc-200/70 bg-white/80 p-0.5 dark:border-zinc-800/70 dark:bg-zinc-900/80"
    >
      {REGIONS.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => handleSwitch(r)}
          aria-pressed={region === r}
          disabled={isPending}
          className={[
            'rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide transition',
            region === r
              ? 'bg-sky-500 text-white shadow-sm'
              : 'text-zinc-600 hover:text-sky-600 dark:text-zinc-300',
          ].join(' ')}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
