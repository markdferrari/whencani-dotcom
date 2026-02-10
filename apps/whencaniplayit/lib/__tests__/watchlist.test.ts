import {
  WATCHLIST_MAX_ITEMS,
  addToWatchlist,
  parseWatchlistCookie,
  removeFromWatchlist,
  serializeWatchlist,
} from '../watchlist';

describe('watchlist helpers', () => {
  it('parses a serialized cookie value and ignores invalid entries', () => {
    const serialized = serializeWatchlist([1, 'two', 3]);
    expect(parseWatchlistCookie(serialized)).toEqual([1, 3]);
  });

  it('returns an empty array for malformed values', () => {
    expect(parseWatchlistCookie('%7Bbad%7D')).toEqual([]);
    expect(parseWatchlistCookie('')).toEqual([]);
    expect(parseWatchlistCookie(null)).toEqual([]);
  });

  it('adds a game while enforcing a unique order capped at the max', () => {
    const initial = Array.from({ length: WATCHLIST_MAX_ITEMS }, (_, index) => index + 1);
    const updated = addToWatchlist(initial, WATCHLIST_MAX_ITEMS + 1);

    expect(updated).toHaveLength(WATCHLIST_MAX_ITEMS);
    expect(updated[0]).toBe(2);
    expect(updated[updated.length - 1]).toBe(WATCHLIST_MAX_ITEMS + 1);
  });

  it('moves an existing entry to the end when re-added', () => {
    const ids = [1, 2, 3];
    const updated = addToWatchlist(ids, 2);

    expect(updated).toEqual([1, 3, 2]);
  });

  it('removes a game id if it exists', () => {
    const ids = [4, 5, 6];
    expect(removeFromWatchlist(ids, 5)).toEqual([4, 6]);
  });
});
