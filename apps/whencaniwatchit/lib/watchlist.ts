export const WATCHLIST_COOKIE_NAME = 'watchlist';
export const WATCHLIST_MAX_ITEMS = 20;

export function parseWatchlistCookie(value?: string | null) {
  if (!value) return [];

  try {
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => Number(item))
      .filter((id) => Number.isFinite(id));
  } catch (error) {
    return [];
  }
}

export function serializeWatchlist(ids: number[]) {
  return JSON.stringify(ids);
}

export function addToWatchlist(ids: number[], movieId: number) {
  const normalized = ids.filter((id) => id !== movieId);
  const updated = [...normalized, movieId];

  if (updated.length <= WATCHLIST_MAX_ITEMS) {
    return updated;
  }

  return updated.slice(updated.length - WATCHLIST_MAX_ITEMS);
}

export function removeFromWatchlist(ids: number[], movieId: number) {
  return ids.filter((id) => id !== movieId);
}
