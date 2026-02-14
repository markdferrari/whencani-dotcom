import { GET } from '@/app/api/search/route';
import * as igdb from '@/lib/igdb';
import * as bgg from '@/lib/bgg';

jest.mock('@/lib/igdb');
jest.mock('@/lib/bgg');

describe('GET /api/search (with BGG integration)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...originalEnv, NEXT_PUBLIC_FEATURE_BOARD_GAMES: 'true' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns IGDB + BGG results when feature flag enabled', async () => {
    (igdb.searchGames as jest.Mock).mockResolvedValueOnce([
      { id: 1, name: 'Game One', cover: { url: '//images.igdb.com/igdb/image/upload/t_thumb/cover.jpg' }, first_release_date: 1770163200 },
    ]);

    (bgg.searchBoardGames as jest.Mock).mockResolvedValueOnce([
      { id: 101, name: 'Catan', yearPublished: 1995 },
    ]);

    (bgg.getBoardGamesByIds as jest.Mock).mockResolvedValueOnce([
      { id: 101, name: 'Catan', thumbnail: 'https://example.com/catan.jpg', yearPublished: 1995 },
    ]);

    const res = await GET({ url: 'http://localhost/api/search?q=catan' } as unknown as Request);

    expect(res.status).toBe(200);
    const payload = await res.json();
    expect(Array.isArray(payload.results)).toBe(true);
    expect(payload.results.length).toBeGreaterThanOrEqual(2);

    const igdbResult = payload.results.find((r: any) => r.href === '/game/1');
    const bggResult = payload.results.find((r: any) => r.href === '/board-game/101');

    expect(igdbResult).toBeDefined();
    expect(bggResult).toBeDefined();
    expect(bggResult.imageUrl).toBe('https://example.com/catan.jpg');
  });

  it('returns only IGDB results when BGG feature is disabled', async () => {
    process.env.NEXT_PUBLIC_FEATURE_BOARD_GAMES = 'false';

    (igdb.searchGames as jest.Mock).mockResolvedValueOnce([
      { id: 2, name: 'Another Game', cover: { url: null }, first_release_date: null },
    ]);

    const res = await GET({ url: 'http://localhost/api/search?q=another' } as unknown as Request);

    expect(res.status).toBe(200);
    const payload = await res.json();
    expect(payload.results.every((r: any) => r.href.startsWith('/game/'))).toBe(true);
  });
});