import { searchGameByName } from '../igdb';

describe('searchGameByName', () => {
  const originalFetch = globalThis.fetch;
  const originalClientId = process.env.IGDB_CLIENT_ID;
  const originalClientSecret = process.env.IGDB_CLIENT_SECRET;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env.IGDB_CLIENT_ID = originalClientId;
    process.env.IGDB_CLIENT_SECRET = originalClientSecret;
    jest.restoreAllMocks();
  });

  it('should search for a game by name and return cover URL', async () => {
    process.env.IGDB_CLIENT_ID = 'test-client-id';
    process.env.IGDB_CLIENT_SECRET = 'test-client-secret';

    const mockTokenResponse = {
      access_token: 'mock-access-token',
      expires_in: 5000000,
    };

    const mockGameResponse = [
      {
        id: 1234,
        name: 'Test Game',
        cover: {
          url: '//images.igdb.com/igdb/image/upload/t_thumb/test_cover.jpg',
        },
      },
    ];

    const fetchMock = jest.fn<
      Promise<Response>,
      [RequestInfo | URL, RequestInit | undefined]
    >()
      .mockResolvedValueOnce({
        ok: true,
        statusText: 'OK',
        json: async () => mockTokenResponse,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        statusText: 'OK',
        json: async () => mockGameResponse,
      } as Response);

    globalThis.fetch = fetchMock;

    const result = await searchGameByName('Test Game');

    expect(result).toEqual({
      id: 1234,
      name: 'Test Game',
      cover: {
        url: '//images.igdb.com/igdb/image/upload/t_thumb/test_cover.jpg',
      },
    });
  });
});
