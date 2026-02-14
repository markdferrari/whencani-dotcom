export const WATCHLIST_COOKIE_NAME = 'watchlist';
export const BOARD_GAME_WATCHLIST_COOKIE_NAME = 'watchlist_bg';
export const WATCHLIST_MAX_ITEMS = 100;

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

export function addToWatchlist(ids: number[], gameId: number) {
  const normalized = ids.filter((id) => id !== gameId);
  const updated = [...normalized, gameId];

  if (updated.length <= WATCHLIST_MAX_ITEMS) {
    return updated;
  }

  return updated.slice(updated.length - WATCHLIST_MAX_ITEMS);
}

export function removeFromWatchlist(ids: number[], gameId: number) {
  return ids.filter((id) => id !== gameId);
}
