'use client';

import { useCallback, useEffect, useState } from 'react';
import type { IGDBGame } from '@/lib/igdb';
import { WATCHLIST_COOKIE_NAME, parseWatchlistCookie } from '@/lib/watchlist';
import { useToast } from '@/components/ui/ToastProvider';

const WATCHLIST_EVENT_NAME = 'watchlist:update';

function readCookieValue(name: string) {
  if (typeof document === 'undefined') {
    return null;
  }

  return document.cookie
    .split(';')
    .map((fragment) => fragment.trim())
    .find((fragment) => fragment.startsWith(`${name}=`))
    ?.split('=')
    .slice(1)
    .join('=') ?? null;
}

function readLocalWatchlist() {
  const cookieValue = readCookieValue(WATCHLIST_COOKIE_NAME);
  return parseWatchlistCookie(cookieValue);
}

export function broadcastWatchlistUpdate(ids: number[]) {
  if (typeof window === 'undefined') return;
  const event = new CustomEvent<number[]>(WATCHLIST_EVENT_NAME, { detail: ids });
  window.dispatchEvent(event);
}

export function useWatchlistIds() {
  const [ids, setIds] = useState<number[]>([]);

  useEffect(() => {
    setIds(readLocalWatchlist());

    const handler = (event: Event) => {
      if (event instanceof CustomEvent) {
        setIds(event.detail ?? []);
      }
    };

    window.addEventListener(WATCHLIST_EVENT_NAME, handler as EventListener);
    return () => window.removeEventListener(WATCHLIST_EVENT_NAME, handler as EventListener);
  }, []);

  return ids;
}

export type WatchlistAction = 'add' | 'remove';

interface WatchlistMutationPayload {
  ids: number[];
  message?: string;
  variant?: 'success' | 'destructive' | 'default';
}

const TOAST_VARIANT_DEFAULT = 'success';

export function useWatchlistActions() {
  const { toast } = useToast();

  return useCallback(async (gameId: number, action: WatchlistAction) => {
    const response = await fetch('/api/watchlist', {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, gameId }),
    });

    const payload: WatchlistMutationPayload = await response.json().catch(() => ({ ids: [] }));

    if (!response.ok) {
      const message = payload?.message ?? 'Unable to update watchlist';
      toast({ title: message, variant: 'destructive' });
      throw new Error(message);
    }

    broadcastWatchlistUpdate(payload.ids);

    if (payload.message) {
      toast({ title: payload.message, variant: payload.variant ?? TOAST_VARIANT_DEFAULT });
    }

    return payload.ids;
  }, [toast]);
}

export function useWatchlistGames() {
  const [games, setGames] = useState<IGDBGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGames = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/watchlist', { cache: 'no-store' });
      if (!response.ok) {
        setGames([]);
        return;
      }

      const data = (await response.json()) as { games?: IGDBGame[] };
      setGames(data.games ?? []);
    } catch (error) {
      console.error('Failed to load watchlist games', error);
      setGames([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  useEffect(() => {
    const handler = () => fetchGames();
    window.addEventListener(WATCHLIST_EVENT_NAME, handler);
    return () => window.removeEventListener(WATCHLIST_EVENT_NAME, handler);
  }, [fetchGames]);

  return { games, isLoading, refresh: fetchGames };
}