jest.mock('../igdb', () => {
  const actual = jest.requireActual('../igdb');
  return {
    __esModule: true,
    ...actual,
    searchGameByName: jest.fn(),
  };
});

import { searchGameByName } from '../igdb';
import {
  getReviewedThisWeek,
  getRecentlyReleased,
  resetOpenCriticCacheForTests,
  resetOpenCriticRateLimiterForTests,
} from '../opencritic';

const searchGameByNameMock = searchGameByName as jest.MockedFunction<typeof searchGameByName>;
const originalIgdbClientId = process.env.IGDB_CLIENT_ID;
const originalIgdbClientSecret = process.env.IGDB_CLIENT_SECRET;

beforeEach(() => {
  process.env.IGDB_CLIENT_ID = 'test-client-id';
  process.env.IGDB_CLIENT_SECRET = 'test-client-secret';
  searchGameByNameMock.mockReset();
  searchGameByNameMock.mockResolvedValue(null);
});

afterEach(() => {
  process.env.IGDB_CLIENT_ID = originalIgdbClientId;
  process.env.IGDB_CLIENT_SECRET = originalIgdbClientSecret;
});

describe('getReviewedThisWeek', () => {
  const originalFetch = globalThis.fetch;
  const originalRapidApiKey = process.env.RAPID_API_KEY;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env.RAPID_API_KEY = originalRapidApiKey;
    resetOpenCriticCacheForTests();
    resetOpenCriticRateLimiterForTests();
    jest.restoreAllMocks();
  });

  it('should fetch and return reviewed games with correct structure', async () => {
    process.env.RAPID_API_KEY = 'test-rapid-api-key';

    const mockResponse = [
      {
        id: 1,
        name: 'Test Game 1',
        images: {
          box: { og: 'https://example.com/image1.jpg' },
        },
        tier: 'Mighty',
        topCriticScore: 85,
        numReviews: 42,
        percentRecommended: 90,
        releaseDate: '2026-01-15',
      },
      {
        id: 2,
        name: 'Test Game 2',
        images: {
          banner: { og: 'https://example.com/image2.jpg' },
        },
        tier: 'Strong',
        topCriticScore: 75,
        numReviews: 28,
        percentRecommended: 80,
        releaseDate: '2026-02-01',
      },
    ];

    const fetchMock = jest.fn<
      Promise<Response>,
      [RequestInfo | URL, RequestInit | undefined]
    >().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    globalThis.fetch = fetchMock;
    searchGameByNameMock.mockImplementation(async (name) => ({
      id: name === 'Test Game 1' ? 101 : 102,
      name,
      cover: { url: `https://covers/${encodeURIComponent(name)}.jpg` },
    }));

    const result = await getReviewedThisWeek();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://opencritic-api.p.rapidapi.com/game/reviewed-this-week',
      {
        headers: {
          'X-RapidAPI-Key': 'test-rapid-api-key',
          'X-RapidAPI-Host': 'opencritic-api.p.rapidapi.com',
        },
        next: { revalidate: 60 * 60 * 24 * 7 },
      }
    );

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Test Game 1');
    expect(result[0].topCriticScore).toBe(85);
    expect(searchGameByNameMock).toHaveBeenCalledWith('Test Game 1');
    expect(searchGameByNameMock).toHaveBeenCalledWith('Test Game 2');
    expect(result[0].igdbCoverUrl).toBe('https://covers/Test%20Game%201.jpg');
    expect(result[0].igdbId).toBe(101);
  });

  it('should handle games with missing optional fields', async () => {
    process.env.RAPID_API_KEY = 'test-rapid-api-key';

    const mockResponse = [
      {
        id: 3,
        name: 'Minimal Game',
        images: {},
        numReviews: 5,
      },
    ];

    const fetchMock = jest.fn<
      Promise<Response>,
      [RequestInfo | URL, RequestInit | undefined]
    >().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    globalThis.fetch = fetchMock;

    const result = await getReviewedThisWeek();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Minimal Game');
    expect(result[0].tier).toBeUndefined();
    expect(result[0].topCriticScore).toBeUndefined();
  });

  it('should throw an error if RAPID_API_KEY is not set', async () => {
    delete process.env.RAPID_API_KEY;

    await expect(getReviewedThisWeek()).rejects.toThrow(
      'RAPID_API_KEY environment variable is required'
    );
  });

  it('should throw an error if API request fails', async () => {
    process.env.RAPID_API_KEY = 'test-rapid-api-key';

    const fetchMock = jest.fn<
      Promise<Response>,
      [RequestInfo | URL, RequestInit | undefined]
    >().mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    globalThis.fetch = fetchMock;

    await expect(getReviewedThisWeek()).rejects.toThrow(
      'OpenCritic API request failed: 500 Internal Server Error'
    );
  });

  it('retries with backoff when API returns 429', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(0));

    try {
      process.env.RAPID_API_KEY = 'test-rapid-api-key';

      const fetchMock = jest
        .fn<Promise<Response>, [RequestInfo | URL, RequestInit | undefined]>()
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: {
            get: (name: string) => (name.toLowerCase() === 'retry-after' ? '1' : null),
          },
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => [],
        } as Response);

      globalThis.fetch = fetchMock;

      const promise = getReviewedThisWeek();

      // Let the first request happen.
      await jest.advanceTimersByTimeAsync(0);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Advance time for Retry-After (1s).
      await jest.advanceTimersByTimeAsync(1000);

      const result = await promise;
      expect(result).toEqual([]);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });

  it('retries when API returns 503', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(0));

    try {
      process.env.RAPID_API_KEY = 'test-rapid-api-key';

      const fetchMock = jest
        .fn<Promise<Response>, [RequestInfo | URL, RequestInit | undefined]>()
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          headers: {
            get: () => null,
          },
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => [],
        } as Response);

      globalThis.fetch = fetchMock;

      const promise = getReviewedThisWeek();

      await jest.advanceTimersByTimeAsync(0);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(1000);
      await jest.runOnlyPendingTimersAsync();

      const result = await promise;
      expect(result).toEqual([]);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });

  it('should throw an error if network request fails', async () => {
    process.env.RAPID_API_KEY = 'test-rapid-api-key';

    const fetchMock = jest.fn<
      Promise<Response>,
      [RequestInfo | URL, RequestInit | undefined]
    >().mockRejectedValueOnce(new Error('Network error'));

    globalThis.fetch = fetchMock;

    await expect(getReviewedThisWeek()).rejects.toThrow('Network error');
  });

  it('should accept optional limit parameter', async () => {
    process.env.RAPID_API_KEY = 'test-rapid-api-key';

    const mockResponse = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `Game ${i + 1}`,
      images: {},
      numReviews: 10,
    }));

    const fetchMock = jest.fn<
      Promise<Response>,
      [RequestInfo | URL, RequestInit | undefined]
    >().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    globalThis.fetch = fetchMock;

    const result = await getReviewedThisWeek(10);

    expect(result).toHaveLength(10);
    expect(result[0].name).toBe('Game 1');
    expect(result[9].name).toBe('Game 10');
  });

  it('caches the reviewed-this-week response to reduce 429s', async () => {
    process.env.RAPID_API_KEY = 'test-rapid-api-key';

    const mockResponse = [
      {
        id: 1,
        name: 'Cached Game',
        images: {},
        numReviews: 1,
      },
    ];

    const fetchMock = jest.fn<
      Promise<Response>,
      [RequestInfo | URL, RequestInit | undefined]
    >().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    globalThis.fetch = fetchMock;

    const first = await getReviewedThisWeek();
    const second = await getReviewedThisWeek();

    expect(first).toEqual(second);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('getRecentlyReleased', () => {
  const originalFetch = globalThis.fetch;
  const originalRapidApiKey = process.env.RAPID_API_KEY;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env.RAPID_API_KEY = originalRapidApiKey;
    resetOpenCriticCacheForTests();
    resetOpenCriticRateLimiterForTests();
    jest.restoreAllMocks();
  });

  it('should fetch and return recently released games with correct structure', async () => {
    process.env.RAPID_API_KEY = 'test-rapid-api-key';

    const mockResponse = [
      {
        id: 1,
        name: 'Test Game 1',
        images: {
          box: { og: 'https://example.com/image1.jpg' },
        },
        platforms: [{ id: 167, name: 'PlayStation 5' }],
        releaseDate: '2026-02-06',
        topCriticScore: 82,
        numReviews: 35,
        percentRecommended: 85,
      },
      {
        id: 2,
        name: 'Test Game 2',
        images: {
          banner: { og: 'https://example.com/image2.jpg' },
        },
        platforms: [{ id: 6, name: 'PC' }],
        releaseDate: '2026-02-05',
        topCriticScore: 78,
        numReviews: 22,
        percentRecommended: 75,
      },
    ];

    const fetchMock = jest.fn<
      Promise<Response>,
      [RequestInfo | URL, RequestInit | undefined]
    >().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    globalThis.fetch = fetchMock;
    searchGameByNameMock.mockImplementation(async (name) => ({
      id: name === 'Test Game 1' ? 201 : 202,
      name,
      cover: { url: `https://covers/${encodeURIComponent(name)}.jpg` },
    }));

    const result = await getRecentlyReleased();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://opencritic-api.p.rapidapi.com/game/recently-released',
      {
        headers: {
          'X-RapidAPI-Key': 'test-rapid-api-key',
          'X-RapidAPI-Host': 'opencritic-api.p.rapidapi.com',
        },
        next: { revalidate: 60 * 60 * 24 * 7 },
      }
    );

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Test Game 1');
    expect(result[0].platforms).toEqual([{ id: 167, name: 'PlayStation 5' }]);
    expect(result[0].releaseDate).toBe('2026-02-06');
    expect(searchGameByNameMock).toHaveBeenCalledWith('Test Game 1');
    expect(searchGameByNameMock).toHaveBeenCalledWith('Test Game 2');
    expect(result[0].igdbCoverUrl).toBe('https://covers/Test%20Game%201.jpg');
    expect(result[0].igdbId).toBe(201);
  });

  it('should handle games with missing optional fields', async () => {
    process.env.RAPID_API_KEY = 'test-rapid-api-key';

    const mockResponse = [
      {
        id: 3,
        name: 'Minimal Game',
        images: {},
        numReviews: 5,
      },
    ];

    const fetchMock = jest.fn<
      Promise<Response>,
      [RequestInfo | URL, RequestInit | undefined]
    >().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    globalThis.fetch = fetchMock;

    const result = await getRecentlyReleased();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Minimal Game');
  });

  it('should throw an error if RAPID_API_KEY is not set', async () => {
    delete process.env.RAPID_API_KEY;

    await expect(getRecentlyReleased()).rejects.toThrow(
      'RAPID_API_KEY environment variable is required'
    );
  });

  it('should throw an error if API request fails', async () => {
    process.env.RAPID_API_KEY = 'test-rapid-api-key';

    const fetchMock = jest.fn<
      Promise<Response>,
      [RequestInfo | URL, RequestInit | undefined]
    >().mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    } as Response);

    globalThis.fetch = fetchMock;

    await expect(getRecentlyReleased()).rejects.toThrow(
      'OpenCritic API request failed: 401 Unauthorized'
    );
  });

  it('should cap the limit parameter at 6', async () => {
    process.env.RAPID_API_KEY = 'test-rapid-api-key';

    const mockResponse = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `Game ${i + 1}`,
      images: {},
      numReviews: 10,
    }));

    const fetchMock = jest.fn<
      Promise<Response>,
      [RequestInfo | URL, RequestInit | undefined]
    >().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    globalThis.fetch = fetchMock;

    const result = await getRecentlyReleased(10);

    expect(result).toHaveLength(6);
    expect(result[0].name).toBe('Game 1');
    expect(result[5].name).toBe('Game 6');
  });
});
