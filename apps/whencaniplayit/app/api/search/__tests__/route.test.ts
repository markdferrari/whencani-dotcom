import { GET } from '@/app/api/search/route';
import { mapBGGDetailsToSearchResults } from '@/lib/search-utils';
import * as igdb from '@/lib/igdb';
import * as bgg from '@/lib/bgg';

jest.mock('@/lib/igdb');
jest.mock('@/lib/bgg');

describe('mapBGGDetailsToSearchResults', () => {
  it('maps BGG details into SearchResult shape', () => {
    const details = [
      { id: 101, name: 'Catan', thumbnail: 'https://example.com/catan.jpg', yearPublished: 1995 },
    ];

    const results = mapBGGDetailsToSearchResults(details as Parameters<typeof mapBGGDetailsToSearchResults>[0]);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe(101);
    expect(results[0].title).toBe('Catan');
    expect(results[0].imageUrl).toBe('https://example.com/catan.jpg');
    expect(results[0].releaseDate).toBe('1995');
    expect(results[0].href).toBe('/board-game/101');
  });
});