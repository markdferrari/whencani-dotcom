/**
 * @jest-environment node
 */
import { GET } from '../app/api/image/route';

describe('image proxy route', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns 400 for missing url', async () => {
    const request = new Request('http://localhost/api/image');
    const response = await GET(request);
    expect(response.status).toBe(400);
  });

  it('returns 400 for invalid host', async () => {
    const request = new Request('http://localhost/api/image?url=https://example.com/image.jpg');
    const response = await GET(request);
    expect(response.status).toBe(400);
    const text = await response.text();
    expect(text).toContain('Invalid host');
  });

  it('returns cached response for IGDB host', async () => {
    const mockResponse = new Response('img', {
      status: 200,
      headers: {
        'content-type': 'image/jpeg',
      },
    });

    const fetchMock = jest.fn<Promise<Response>, [RequestInfo | URL]>();
    fetchMock.mockResolvedValue(mockResponse);
    globalThis.fetch = fetchMock;

    const request = new Request(
      'http://localhost/api/image?url=https://images.igdb.com/igdb/image/upload/t_cover_big/co9xhr.jpg',
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('s-maxage=86400');
    expect(response.headers.get('content-type')).toBe('image/jpeg');
  });

  it('returns cached response for OpenCritic host', async () => {
    const mockResponse = new Response('img', {
      status: 200,
      headers: {
        'content-type': 'image/jpeg',
      },
    });

    const fetchMock = jest.fn<Promise<Response>, [RequestInfo | URL]>();
    fetchMock.mockResolvedValue(mockResponse);
    globalThis.fetch = fetchMock;

    const request = new Request(
      'http://localhost/api/image?url=https://img.opencritic.com/game/12345/game.jpg',
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('s-maxage=86400');
    expect(response.headers.get('content-type')).toBe('image/jpeg');
  });
});
